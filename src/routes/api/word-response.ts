import { json } from '@tanstack/react-start'
import { createServerFileRoute } from '@tanstack/react-start/server'
import { Effect } from 'effect'
import { z } from 'zod/v4'
import {
  UpdateWordResponseSchema,
  deleteWordResponseEffect,
  getWordResponseEffect,
  updateWordResponseEffect,
} from '../../actions/wordResponse'
import { authorizationMiddleware } from '../../middlewares/authorization'
import { WordResponseServiceLive } from '../../services/wordResponse'
import {
  buildInvalidBodyErrorResponse,
  buildValidationErrorResponse,
} from '../../utils'

export const ServerRoute = createServerFileRoute('/api/word-response')
  .middleware([authorizationMiddleware])
  .methods({
    GET: async () => {
      const res = await Effect.runPromise(
        Effect.scoped(
          getWordResponseEffect.pipe(Effect.provide(WordResponseServiceLive))
        )
      )

      if ('error' in res && res.error) {
        return json(res, { status: res.error.code })
      }

      return json(res)
    },

    POST: async ({ request }) => {
      const body = await request.text()

      try {
        const parsedBody = JSON.parse(body)
        const updateData = UpdateWordResponseSchema.parse(parsedBody)

        const res = await Effect.runPromise(
          Effect.scoped(
            updateWordResponseEffect(updateData).pipe(
              Effect.provide(WordResponseServiceLive)
            )
          )
        )

        if ('error' in res && res.error) {
          return json(res, { status: res.error.code })
        }

        return json(res)
      } catch (error) {
        if (error instanceof z.ZodError)
          return buildValidationErrorResponse(error)

        return buildInvalidBodyErrorResponse()
      }
    },

    DELETE: async () => {
      const res = await Effect.runPromise(
        Effect.scoped(
          deleteWordResponseEffect.pipe(Effect.provide(WordResponseServiceLive))
        )
      )

      if ('error' in res && res.error) {
        return json(res, { status: res.error.code })
      }

      return json(res)
    },
  })
