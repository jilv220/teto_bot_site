import { json } from '@tanstack/react-start'
import { createServerFileRoute } from '@tanstack/react-start/server'
import { Effect } from 'effect'
import { z } from 'zod/v4'
import {
  UpdateGuildSchema,
  deleteGuildEffect,
  getGuildEffect,
  guildIdSchema,
  updateGuildEffect,
} from '../../../actions/guild'
import { GuildServiceLive } from '../../../services'
import { buildValidationErrorResponse } from '../../../utils'

export const ServerRoute = createServerFileRoute(
  '/api/guilds/$guildId'
).methods({
  GET: async ({ params }) => {
    try {
      const guildId = guildIdSchema.parse(params.guildId)
      const res = await Effect.runPromise(
        getGuildEffect(guildId).pipe(Effect.provide(GuildServiceLive()))
      )

      if ('error' in res && res.error) {
        return json(res, { status: res.error.code })
      }

      return json(res)
    } catch (error) {
      if (error instanceof z.ZodError)
        return buildValidationErrorResponse(error)
      return json({ error: 'Invalid request' }, { status: 400 })
    }
  },

  PUT: async ({ request, params }) => {
    const body = await request.text()

    try {
      const guildId = guildIdSchema.parse(params.guildId)
      const parsed = JSON.parse(body)
      const updateData = UpdateGuildSchema.parse(parsed)

      const res = await Effect.runPromise(
        updateGuildEffect(guildId, updateData).pipe(
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
      return json({ error: 'Invalid request' }, { status: 400 })
    }
  },

  DELETE: async ({ params }) => {
    try {
      const guildId = guildIdSchema.parse(params.guildId)
      const res = await Effect.runPromise(
        deleteGuildEffect(guildId).pipe(Effect.provide(GuildServiceLive()))
      )

      if ('error' in res && res.error) {
        return json(res, { status: res.error.code })
      }

      return json(res)
    } catch (error) {
      if (error instanceof z.ZodError)
        return buildValidationErrorResponse(error)
      return json({ error: 'Invalid request' }, { status: 400 })
    }
  },
})
