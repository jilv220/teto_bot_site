import { getUsers } from '@/actions/user'
import { Footer } from '@/components/Footer'
import { Button } from '@/components/ui/button'
import {
  UserService,
  UserServiceLive,
  getDiscordAuthUrl,
  verifyJWT,
} from '@/services'
import { Outlet, createFileRoute, redirect } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { getCookie } from '@tanstack/react-start/server'
import { getEvent } from '@tanstack/react-start/server'
import { Data, Effect } from 'effect'
import { AccessDeniedError } from './auth/callback'

export class AuthRequiredError extends Data.TaggedError('AuthRequiredError')<{
  message: string
}> {}

export class UserNotFoundError extends Data.TaggedError('UserNotFoundError')<{
  message: string
}> {}

export class InvalidAuthError extends Data.TaggedError('InvalidAuthError')<{
  message: string
  cause?: unknown
}> {}

const checkAdminAuth = createServerFn().handler(async () => {
  const event = getEvent()
  const token = getCookie(event, 'auth_token')

  // Not Authed, throw to login with Discord
  if (!token) {
    const authUrl = await getDiscordAuthUrl(Route.path)
    throw redirect({
      href: authUrl,
    })
  }

  try {
    // Verify JWT token
    const session = await verifyJWT(token)

    // Verify user exists and has admin role in database
    const user = await Effect.runPromise(
      Effect.gen(function* () {
        const userService = yield* UserService
        return yield* userService.getUser(BigInt(session.userId))
      }).pipe(Effect.provide(UserServiceLive()))
    )

    if (!user) {
      throw new UserNotFoundError({
        message: 'User account not found.',
      })
    }

    if (user.role !== 'admin') {
      throw new AccessDeniedError({
        message:
          'You need admin privileges to access the admin panel. Please contact an administrator.',
      })
    }

    return {
      adminUser: user,
      adminSession: session,
    }
  } catch (error: unknown) {
    console.error('Admin authentication error:', error)

    // Re-throw tagged errors as-is
    if (
      error instanceof UserNotFoundError ||
      error instanceof AccessDeniedError
    ) {
      throw error
    }

    // Convert other errors to tagged error
    throw new InvalidAuthError({
      message: 'Invalid authentication. Please log in again.',
      cause: error,
    })
  }
})

export const Route = createFileRoute('/admin')({
  beforeLoad: async () => {
    return await checkAdminAuth()
  },
  loader: async () => await getUsers(),
  component: AdminLayout,
  errorComponent: ({ error, reset }) => (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div>{error.message}</div>
      <Button onClick={() => reset()}>Reset</Button>
      <Footer />
    </div>
  ),
})

function AdminLayout() {
  return (
    <div className="container mx-auto py-8 px-4">
      <Outlet />
    </div>
  )
}
