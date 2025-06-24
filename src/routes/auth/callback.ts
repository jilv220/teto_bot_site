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
import { Effect } from 'effect'

export const ServerRoute = createServerFileRoute('/auth/callback').methods({
  GET: async ({ request }) => {
    const url = new URL(request.url)
    const code = url.searchParams.get('code')
    const state = url.searchParams.get('state') // This is our returnTo URL
    const error = url.searchParams.get('error')

    if (error) {
      return new Response(null, {
        status: 302,
        headers: {
          Location: `/auth/error?error=${encodeURIComponent(error)}`,
        },
      })
    }

    if (!code) {
      return new Response(null, {
        status: 302,
        headers: {
          Location: '/auth/error?error=no_code',
        },
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
        return new Response(null, {
          status: 302,
          headers: {
            Location: '/auth/error?error=not_admin',
          },
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
      console.error('OAuth callback error:', error)
      return new Response(null, {
        status: 302,
        headers: {
          Location: '/auth/error?error=callback_failed',
        },
      })
    }
  },
})
