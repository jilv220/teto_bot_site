import { createServerFn } from '@tanstack/react-start'
import { Effect, Schema } from 'effect'
import { z } from 'zod/v4'
import type { NewChannel, SerializedChannel } from '../repositories/channel'
import { ChannelService, ChannelServiceLive } from '../services'
import { serializeBigInt } from '../utils/bigint'

export const channelIdSchema = z.coerce.bigint()
export const guildIdSchema = z.coerce.bigint()

export const CreateChannelSchema = z.object({
  channelId: channelIdSchema,
  guildId: guildIdSchema,
})

export const GetChannelParamsSchema = channelIdSchema

export const DeleteChannelParamsSchema = GetChannelParamsSchema

export const UpdateChannelSchema = z.object({
  channelId: channelIdSchema,
  // Channels typically don't have many updatable fields in Discord bots
  // Add any custom fields you might want to update
})

export const getChannelsEffect = Effect.gen(function* () {
  const channelService = yield* ChannelService
  const channels = yield* channelService.getChannels()
  const serializedChannels: SerializedChannel[] = serializeBigInt(channels)

  return {
    data: {
      channels: serializedChannels,
    },
  }
}).pipe(
  Effect.catchAll(() =>
    Effect.succeed({
      error: { code: 500, message: 'Failed to fetch channels' },
    })
  )
)

export const getChannelEffect = (channelId: bigint) =>
  Effect.gen(function* () {
    const channelService = yield* ChannelService
    const channel = yield* channelService.getChannel(channelId)

    if (!channel) {
      return {
        error: {
          code: 404,
          message: 'Channel does not exist',
        },
      }
    }

    const serializedChannel: SerializedChannel = serializeBigInt(channel)
    return {
      data: {
        channel: serializedChannel,
      },
    }
  }).pipe(
    Effect.catchAll(() =>
      Effect.succeed({
        error: { code: 500, message: 'Failed to fetch channel' },
      })
    ),
    Effect.provide(ChannelServiceLive)
  )

export const createChannelEffect = (channelId: bigint, guildId: bigint) =>
  Effect.gen(function* () {
    const channelService = yield* ChannelService

    const newChannel: NewChannel = {
      channelId,
      guildId,
      insertedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    const channel = yield* channelService.createChannel(newChannel)
    const serializedChannel: SerializedChannel = serializeBigInt(channel)

    return {
      data: {
        channel: serializedChannel,
      },
    }
  }).pipe(
    Effect.catchAll((error) => {
      if (error.type === 'UniqueConstraint') {
        return Effect.succeed({
          error: {
            code: 409,
            message: 'Channel already exists',
          },
        })
      }

      return Effect.succeed({
        error: {
          code: 500,
          message: 'Failed to create channel',
        },
      })
    })
  )

export const updateChannelEffect = (
  updateData: z.infer<typeof UpdateChannelSchema>
) =>
  Effect.gen(function* () {
    const channelService = yield* ChannelService
    const existingChannel = yield* channelService.getChannel(
      updateData.channelId
    )

    if (!existingChannel) {
      return {
        error: {
          code: 404,
          message: 'Channel not found',
        },
      }
    }

    const { channelId, ...rest } = updateData
    const updatedChannel = yield* channelService.updateChannel(channelId, rest)
    const serializedChannel: SerializedChannel = serializeBigInt(updatedChannel)

    return {
      data: {
        channel: serializedChannel,
      },
    }
  }).pipe(
    Effect.catchAll(() =>
      Effect.succeed({
        error: { code: 500, message: 'Failed to update channel' },
      })
    )
  )

export const deleteChannelEffect = (channelId: bigint) =>
  Effect.gen(function* () {
    const channelService = yield* ChannelService
    yield* channelService.deleteChannel(channelId)

    return {
      data: {
        message: 'Channel deleted successfully',
      },
    }
  }).pipe(
    Effect.catchAll(() =>
      Effect.succeed({
        error: {
          code: 500,
          message: 'Failed to delete channel',
        },
      })
    ),
    Effect.provide(ChannelServiceLive)
  )

/**
 * Server Functions
 */

export const getChannel = createServerFn()
  .validator((data: unknown) => GetChannelParamsSchema.parse(data))
  .handler(async ({ data: channelId }) => {
    return await Effect.runPromise(
      getChannelEffect(channelId).pipe(Effect.provide(ChannelServiceLive))
    )
  })

export const getChannels = createServerFn().handler(async () => {
  return await Effect.runPromise(
    getChannelsEffect.pipe(Effect.provide(ChannelServiceLive))
  )
})

export const createChannel = createServerFn({ method: 'POST' })
  .validator((data: unknown) => {
    return CreateChannelSchema.parse(data)
  })
  .handler(async ({ data: channelData }) => {
    return await Effect.runPromise(
      createChannelEffect(channelData.channelId, channelData.guildId).pipe(
        Effect.provide(ChannelServiceLive)
      )
    )
  })

export const updateChannel = createServerFn({ method: 'POST' })
  .validator((data: unknown) => {
    return UpdateChannelSchema.parse(data)
  })
  .handler(async ({ data: updateData }) => {
    return await Effect.runPromise(
      updateChannelEffect(updateData).pipe(Effect.provide(ChannelServiceLive))
    )
  })

export const deleteChannel = createServerFn({ method: 'POST' })
  .validator((data: unknown) => DeleteChannelParamsSchema.parse(data))
  .handler(async ({ data: channelId }) => {
    return await Effect.runPromise(
      deleteChannelEffect(channelId).pipe(Effect.provide(ChannelServiceLive))
    )
  })
