import { json } from '@tanstack/react-start'
import { createServerFileRoute } from '@tanstack/react-start/server'
import { Effect } from 'effect'
import { getLyricsByTitleEffect } from '../../../actions/lyrics'
import { LyricsServiceLive } from '../../../services/lyrics'

export const ServerRoute = createServerFileRoute('/api/lyrics/$title').methods({
  GET: async ({ params }) => {
    const { title } = params

    const res = await Effect.runPromise(
      Effect.scoped(
        getLyricsByTitleEffect(decodeURIComponent(title)).pipe(
          Effect.provide(LyricsServiceLive())
        )
      )
    )

    if ('error' in res) {
      return json(res, { status: res.error.code })
    }

    return json(res)
  },
})
