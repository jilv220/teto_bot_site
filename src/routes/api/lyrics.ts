import { json } from '@tanstack/react-start'
import { createServerFileRoute } from '@tanstack/react-start/server'
import { Effect } from 'effect'
import { z } from 'zod/v4'
import {
  CreateLyricsSchema,
  createLyricsEffect,
  getAllLyricsEffect,
} from '../../actions/lyrics'
import { LyricsServiceLive } from '../../services/lyrics'
import {
  buildInvalidBodyErrorResponse,
  buildValidationErrorResponse,
} from '../../utils/http'

export const ServerRoute = createServerFileRoute('/api/lyrics').methods({
  GET: async () => {
    // Get all lyrics
    const res = await Effect.runPromise(
      Effect.scoped(
        getAllLyricsEffect.pipe(Effect.provide(LyricsServiceLive()))
      )
    )

    if ('error' in res) {
      return json(res, { status: res.error.code })
    }

    return json(res)
  },
  POST: async ({ request }) => {
    const body = await request.text()

    try {
      const parsedBody = JSON.parse(body)
      const lyricsData = CreateLyricsSchema.parse(parsedBody)

      const res = await Effect.runPromise(
        Effect.scoped(
          createLyricsEffect(lyricsData).pipe(
            Effect.provide(LyricsServiceLive())
          )
        )
      )

      if ('error' in res) {
        return json({ error: res.error }, { status: res.error.code })
      }

      return json(res, { status: 201 })
    } catch (error) {
      if (error instanceof z.ZodError)
        return buildValidationErrorResponse(error)

      return buildInvalidBodyErrorResponse()
    }
  },
})
