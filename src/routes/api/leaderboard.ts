import { json } from '@tanstack/react-start'
import { createServerFileRoute } from '@tanstack/react-start/server'
import { Effect } from 'effect'
import { z } from 'zod/v4'
import {
  getIntimacyLeaderboardEffect,
  guildIdSchema,
} from '../../actions/guild'
import { authorizationMiddleware } from '../../middlewares/authorization'
import { GuildServiceLive } from '../../services'
import { buildValidationErrorResponse } from '../../utils'

const LeaderboardQuerySchema = z.object({
  guildId: z.string().transform((val) => guildIdSchema.parse(val)),
  limit: z
    .string()
    .optional()
    .transform((val) => {
      if (!val) return 10
      const parsed = Number.parseInt(val, 10)
      if (Number.isNaN(parsed) || parsed < 1 || parsed > 100) {
        throw new Error('Invalid limit parameter. Must be between 1 and 100.')
      }
      return parsed
    }),
})

export const ServerRoute = createServerFileRoute('/api/leaderboard')
  .middleware([authorizationMiddleware])
  .methods({
    GET: async ({ request }) => {
      try {
        const url = new URL(request.url)
        const guildId = url.searchParams.get('guildId')
        const limit = url.searchParams.get('limit')

        if (!guildId) {
          return json(
            { error: 'guildId query parameter is required' },
            { status: 400 }
          )
        }

        const { guildId: parsedGuildId, limit: parsedLimit } =
          LeaderboardQuerySchema.parse({
            guildId,
            limit,
          })

        const res = await Effect.runPromise(
          getIntimacyLeaderboardEffect(parsedGuildId, parsedLimit).pipe(
            Effect.provide(GuildServiceLive())
          )
        )

        if ('error' in res && res.error) {
          return json(res, { status: res.error.code })
        }

        return json(res)
      } catch (error) {
        if (error instanceof z.ZodError) {
          return buildValidationErrorResponse(error)
        }
        if (error instanceof Error) {
          return json({ error: error.message }, { status: 400 })
        }
        return json({ error: 'Invalid request' }, { status: 400 })
      }
    },
  })
