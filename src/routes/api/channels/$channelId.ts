import { json } from '@tanstack/react-start'
import { createServerFileRoute } from '@tanstack/react-start/server'
import { Effect } from 'effect'
import { z } from 'zod/v4'
import {
  UpdateChannelSchema,
  channelIdSchema,
  deleteChannelEffect,
  getChannelEffect,
  updateChannelEffect,
} from '../../../actions/channel'
import { ChannelServiceLive } from '../../../services'
import { buildValidationErrorResponse } from '../../../utils'

export const ServerRoute = createServerFileRoute(
  '/api/channels/$channelId'
).methods({
  GET: async ({ params }) => {
    try {
      const channelId = channelIdSchema.parse(params.channelId)
      const res = await Effect.runPromise(
        getChannelEffect(channelId).pipe(Effect.provide(ChannelServiceLive))
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
      const channelId = channelIdSchema.parse(params.channelId)
      const parsed = JSON.parse(body)
      const updateData = UpdateChannelSchema.parse({
        channelId,
        ...parsed,
      })

      const res = await Effect.runPromise(
        updateChannelEffect(updateData).pipe(Effect.provide(ChannelServiceLive))
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
      const channelId = channelIdSchema.parse(params.channelId)
      const res = await Effect.runPromise(
        deleteChannelEffect(channelId).pipe(Effect.provide(ChannelServiceLive))
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
