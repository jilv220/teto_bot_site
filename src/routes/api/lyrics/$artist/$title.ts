import { json } from '@tanstack/react-start'
import { createServerFileRoute } from '@tanstack/react-start/server'
import { Effect } from 'effect'
import { z } from 'zod/v4'
import {
  UpdateLyricsSchema,
  deleteLyricsEffect,
  getLyricsEffect,
  updateLyricsEffect,
} from '../../../../actions/lyrics'
import { LyricsServiceLive } from '../../../../services/lyrics'
import {
  buildInvalidBodyErrorResponse,
  buildValidationErrorResponse,
} from '../../../../utils/http'

export const ServerRoute = createServerFileRoute(
  '/api/lyrics/$artist/$title'
).methods({
  GET: async ({ params }) => {
    const { artist, title } = params

    const res = await Effect.runPromise(
      Effect.scoped(
        getLyricsEffect(
          decodeURIComponent(artist),
          decodeURIComponent(title)
        ).pipe(Effect.provide(LyricsServiceLive))
      )
    )

    if ('error' in res && res.error) {
      return json(res, { status: res.error.code })
    }

    return json(res)
  },
  PUT: async ({ params, request }) => {
    const { artist, title } = params
    const body = await request.text()

    try {
      const parsedBody = JSON.parse(body)
      const updates = UpdateLyricsSchema.parse(parsedBody)

      const res = await Effect.runPromise(
        Effect.scoped(
          updateLyricsEffect(
            decodeURIComponent(artist),
            decodeURIComponent(title),
            updates
          ).pipe(Effect.provide(LyricsServiceLive))
        )
      )

      if ('error' in res) {
        return json({ error: res.error }, { status: res.error.code })
      }

      return json(res)
    } catch (error) {
      if (error instanceof z.ZodError)
        return buildValidationErrorResponse(error)

      return buildInvalidBodyErrorResponse()
    }
  },
  DELETE: async ({ params }) => {
    const { artist, title } = params

    const res = await Effect.runPromise(
      Effect.scoped(
        deleteLyricsEffect(
          decodeURIComponent(artist),
          decodeURIComponent(title)
        ).pipe(Effect.provide(LyricsServiceLive))
      )
    )

    if ('error' in res) {
      return json(res, { status: res.error.code })
    }

    return json(res)
  },
})
