import {
  createServerFileRoute,
  getEvent,
  setCookie,
} from '@tanstack/react-start/server'

export const ServerRoute = createServerFileRoute('/auth/logout').methods({
  GET: async ({ request }) => {
    const event = getEvent()

    // Clear the auth cookie
    setCookie(event, 'auth_token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0, // Expire immediately
      path: '/',
    })

    const url = new URL(request.url)
    const returnTo = url.searchParams.get('returnTo') || '/'

    return new Response(null, {
      status: 302,
      headers: {
        Location: returnTo,
      },
    })
  },
})
