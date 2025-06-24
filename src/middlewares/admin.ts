import { createMiddleware, json } from '@tanstack/react-start'
import { getEvent } from '@tanstack/react-start/server'
import { getCookie } from '@tanstack/react-start/server'
import { Effect } from 'effect'
import { UserService, UserServiceLive } from '../services'
import { verifyJWT } from '../services/auth'

export const adminMiddleware = createMiddleware({
  type: 'request',
}).server(async ({ request, next }) => {
  const event = getEvent()

  // Get JWT token from cookie
  const token = getCookie(event, 'auth_token')

  if (!token) {
    throw json(
      {
        error: 'Authentication required',
        code: 'AUTH_REQUIRED',
      },
      { status: 401 }
    )
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
      throw json(
        {
          error: 'User not found',
          code: 'USER_NOT_FOUND',
        },
        { status: 404 }
      )
    }

    if (user.role !== 'admin') {
      throw json(
        {
          error: 'Admin access required',
          code: 'ADMIN_REQUIRED',
        },
        { status: 403 }
      )
    }

    // Pass admin user info via context (correct TanStack way!)
    return next({
      context: {
        adminUser: user,
        adminSession: session,
      },
    })
  } catch (error: unknown) {
    console.error('Admin middleware error:', error)

    if (error && typeof error === 'object' && 'status' in error) {
      throw error // Re-throw json responses
    }

    throw json(
      {
        error: 'Invalid authentication',
        code: 'INVALID_AUTH',
      },
      { status: 401 }
    )
  }
})
