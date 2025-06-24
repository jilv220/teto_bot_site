import { getUsers } from '@/actions/user'
import { UserService, UserServiceLive, verifyJWT } from '@/services'
import { Link, Outlet, createFileRoute, redirect } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { getCookie } from '@tanstack/react-start/server'
import { getEvent } from '@tanstack/react-start/server'
import { Effect } from 'effect'
import { BarChart3, Music, Settings, Users } from 'lucide-react'
import { Button } from '../components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../components/ui/card'

// Server function to check admin authentication
const checkAdminAuth = createServerFn().handler(async () => {
  const event = getEvent()
  const token = getCookie(event, 'auth_token')

  if (!token) {
    return { isAuthenticated: false as const, error: 'auth_required' as const }
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
      return {
        isAuthenticated: false as const,
        error: 'user_not_found' as const,
      }
    }

    if (user.role !== 'admin') {
      return {
        isAuthenticated: false as const,
        error: 'access_denied' as const,
      }
    }

    return {
      isAuthenticated: true as const,
      adminUser: user,
      adminSession: session,
    }
  } catch (error: unknown) {
    console.error('Admin authentication error:', error)
    return { isAuthenticated: false as const, error: 'auth_failed' as const }
  }
})

export const Route = createFileRoute('/admin')({
  component: AdminLayout,
  loader: async () => await getUsers(),
  beforeLoad: async ({ location }) => {
    // Call the server function to check authentication
    const authResult = await checkAdminAuth()

    if (!authResult.isAuthenticated) {
      throw redirect({
        to: '/',
        search: {
          error: authResult.error || 'auth_failed',
          redirect: location.href,
          details: null,
        },
      })
    }

    // Return admin context (this gets merged into the route context)
    return {
      adminUser: authResult.adminUser,
      adminSession: authResult.adminSession,
    }
  },
})

function AdminLayout() {
  return (
    <div className="container mx-auto py-8 px-4">
      {/* Outlet for child routes - this is where child route content will render */}
      <Outlet />
    </div>
  )
}
