import { json } from '@tanstack/react-start'
import { createServerFileRoute } from '@tanstack/react-start/server'
import { Effect } from 'effect'
import { z } from 'zod/v4'
import {
  CreateChannelSchema,
  createChannelEffect,
  getChannelsEffect,
} from '../../actions/channel'
import { authorizationMiddleware } from '../../middlewares/authorization'
import { ChannelServiceLive } from '../../services'
import {
  buildInvalidBodyErrorResponse,
  buildValidationErrorResponse,
} from '../../utils'

export const ServerRoute = createServerFileRoute('/api/channels')
  .middleware([authorizationMiddleware])
  .methods({
    GET: async () => {
      const res = await Effect.runPromise(
        getChannelsEffect.pipe(Effect.provide(ChannelServiceLive()))
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
        const { channelId, guildId } = CreateChannelSchema.parse(parsedBody)

        const res = await Effect.runPromise(
          createChannelEffect(channelId, guildId).pipe(
            Effect.provide(ChannelServiceLive())
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
