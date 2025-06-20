import { json } from '@tanstack/react-start'
import { createServerFileRoute } from '@tanstack/react-start/server'
import { Effect } from 'effect'
import { getLyricsByArtistEffect } from '../../../actions/lyrics'
import { LyricsServiceLive } from '../../../services/lyrics'

export const ServerRoute = createServerFileRoute('/api/lyrics/$artist').methods(
  {
    GET: async ({ params }) => {
      const { artist } = params

      const res = await Effect.runPromise(
        Effect.scoped(
          getLyricsByArtistEffect(decodeURIComponent(artist)).pipe(
            Effect.provide(LyricsServiceLive)
          )
        )
      )

      if ('error' in res) {
        return json(res, { status: res.error.code })
      }

      return json(res)
    },
  }
)
