import {
  type AuthSession,
  UserService,
  UserServiceLive,
  createJWT,
  exchangeCodeForToken,
  getDiscordUser,
} from '@/services'
import {
  createServerFileRoute,
  getEvent,
  setCookie,
} from '@tanstack/react-start/server'
import { Data, Effect } from 'effect'

// Tagged errors for better type safety
export class DiscordOAuthError extends Data.TaggedError('DiscordOAuthError')<{
  message: string
  details?: string
}> {}

export class NoCodeError extends Data.TaggedError('NoCodeError')<{
  message: string
}> {}

export class AccessDeniedError extends Data.TaggedError('AccessDeniedError')<{
  message: string
}> {}

export class TokenExchangeError extends Data.TaggedError('TokenExchangeError')<{
  message: string
  cause: unknown
}> {}

export class UserFetchError extends Data.TaggedError('UserFetchError')<{
  message: string
  cause: unknown
}> {}

export class CallbackError extends Data.TaggedError('CallbackError')<{
  message: string
  cause: unknown
}> {}

export const ServerRoute = createServerFileRoute('/auth/callback').methods({
  GET: async ({ request }) => {
    const url = new URL(request.url)
    const code = url.searchParams.get('code')
    const state = url.searchParams.get('state') // This is our returnTo URL
    const error = url.searchParams.get('error')

    if (error) {
      throw new DiscordOAuthError({
        message:
          'Discord rejected the login request. Please check your OAuth configuration.',
        details: error,
      })
    }

    if (!code) {
      throw new NoCodeError({
        message:
          'No authorization code received from Discord. Please try logging in again.',
      })
    }

    try {
      // Exchange code for access token
      const tokenData = await exchangeCodeForToken(code)

      // Get Discord user info
      const discordUser = await getDiscordUser(tokenData.access_token)

      // Get or create user in database and check role
      const user = await Effect.runPromise(
        Effect.gen(function* () {
          const userService = yield* UserService
          return yield* userService.getOrCreateUser(BigInt(discordUser.id))
        }).pipe(Effect.provide(UserServiceLive()))
      )

      // Check if user has admin role
      if (user.role !== 'admin') {
        throw new AccessDeniedError({
          message:
            'You need admin privileges to access the admin panel. Please contact an administrator.',
        })
      }

      // Create JWT session
      const session: AuthSession = {
        userId: discordUser.id,
        username: discordUser.username,
        avatar: discordUser.avatar,
        role: user.role,
        expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
      }

      const jwt = await createJWT(session)

      // Set secure HTTP-only cookie
      const event = getEvent()
      setCookie(event, 'auth_token', jwt, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
        path: '/',
      })

      // Redirect to admin or specified return URL
      const returnTo = state?.startsWith('/') ? state : '/admin'

      return new Response(null, {
        status: 302,
        headers: {
          Location: returnTo,
        },
      })
    } catch (error) {
      // If it's already a tagged error, just re-throw it
      if (
        error instanceof DiscordOAuthError ||
        error instanceof NoCodeError ||
        error instanceof AccessDeniedError
      ) {
        throw error
      }

      // Convert other errors to tagged errors
      if (error instanceof Error) {
        if (error.message.includes('Discord OAuth error')) {
          throw new TokenExchangeError({
            message:
              'Failed to exchange authorization code for access token. This is likely a configuration issue.',
            cause: error,
          })
        }
        if (error.message.includes('Discord API error')) {
          throw new UserFetchError({
            message: 'Failed to retrieve user information from Discord.',
            cause: error,
          })
        }
        if (error.message.includes('parsing failed')) {
          throw new CallbackError({
            message:
              'Discord returned an unexpected response format. This suggests a configuration problem.',
            cause: error,
          })
        }
      }

      // Generic fallback error
      throw new CallbackError({
        message: 'An unexpected error occurred during authentication.',
        cause: error,
      })
    }
  },
})
