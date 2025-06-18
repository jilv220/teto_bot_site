import { json } from '@tanstack/react-start'
import { createServerFileRoute } from '@tanstack/react-start/server'
import { Effect } from 'effect'
import { z } from 'zod/v4'
import {
  EnsureUserGuildExistsSchema,
  ensureUserGuildExistsEffect,
} from '../../actions/discord'
import { authorizationMiddleware } from '../../middlewares/authorization'
import {
  GuildServiceLive,
  UserGuildServiceLive,
  UserServiceLive,
} from '../../services'
import {
  buildInvalidBodyErrorResponse,
  buildValidationErrorResponse,
} from '../../utils'

export const ServerRoute = createServerFileRoute(
  '/api/ensure-user-guild-exists'
)
  .middleware([authorizationMiddleware])
  .methods({
    POST: async ({ request }) => {
      const body = await request.text()

      try {
        const parsedBody = JSON.parse(body)
        const params = EnsureUserGuildExistsSchema.parse(parsedBody)

        const res = await Effect.runPromise(
          ensureUserGuildExistsEffect(params).pipe(
            Effect.provide(UserServiceLive),
            Effect.provide(UserGuildServiceLive),
            Effect.provide(GuildServiceLive)
          )
        )

        if ('error' in res) {
          return json({ error: res.error }, { status: res.error.code })
        }

        return json(res, { status: 200 })
      } catch (error) {
        if (error instanceof z.ZodError) {
          return buildValidationErrorResponse(error)
        }

        return buildInvalidBodyErrorResponse()
      }
    },
  })
