import { getDiscordAuthUrl } from '@/services'
import { createServerFileRoute } from '@tanstack/react-start/server'

export const ServerRoute = createServerFileRoute('/auth/login').methods({
  GET: async ({ request }) => {
    const url = new URL(request.url)
    const returnTo = url.searchParams.get('returnTo') || '/admin'

    const authUrl = await getDiscordAuthUrl(returnTo)

    return new Response(null, {
      status: 302,
      headers: {
        Location: authUrl,
      },
    })
  },
})
