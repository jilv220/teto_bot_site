import { json } from '@tanstack/react-start'
import { createServerFileRoute } from '@tanstack/react-start/server'
import { Effect, Schema } from 'effect'
import { type Channel, ChannelRepository } from '../../../repositories/channel'
import { AllRepositoriesLive } from '../../../services/repositories'
import { jsonParseSafe } from '../../../utils'
import { serializeBigInt } from '../../../utils/bigint'

const UpdateChannelSchema = Schema.Struct({
  // Channels typically don't have many updatable fields in Discord bots
  // Add any custom fields you might want to update
})

export const ServerRoute = createServerFileRoute(
  '/api/channels/$channelId'
).methods({
  // Get channel by ID
  GET: async ({ params }) => {
    const program = Effect.gen(function* () {
      const channelRepo = yield* ChannelRepository
      const channelId = BigInt(params.channelId)
      const channel = yield* channelRepo.findById(channelId)

      if (!channel) {
        return json({ error: 'Channel not found' }, { status: 404 })
      }

      const serializedChannel = serializeBigInt(channel)
      return json({ channel: serializedChannel })
    }).pipe(
      Effect.catchAll(() =>
        Effect.succeed(
          json({ error: 'Failed to fetch channel' }, { status: 500 })
        )
      ),
      Effect.provide(AllRepositoriesLive)
    )

    return await Effect.runPromise(program)
  },

  // Update channel
  PUT: async ({ request, params }) => {
    const body = await request.text()

    const program = Effect.gen(function* () {
      const channelRepo = yield* ChannelRepository
      const parsed = yield* jsonParseSafe(body)
      const updateData =
        yield* Schema.decodeUnknown(UpdateChannelSchema)(parsed)

      const channelId = BigInt(params.channelId)

      const updates: Partial<Channel> = {
        updatedAt: new Date().toISOString(),
      }

      const channel = yield* channelRepo.update(channelId, updates)
      const serializedChannel = serializeBigInt(channel)
      return json({ channel: serializedChannel })
    }).pipe(
      Effect.catchAll((error) => {
        if (error._tag === 'JsonParseError') {
          return Effect.succeed(
            json({ error: 'Invalid JSON in request body' }, { status: 400 })
          )
        }

        if (error._tag === 'ParseError') {
          return Effect.succeed(
            json({ error: 'Invalid update data format' }, { status: 400 })
          )
        }

        return Effect.succeed(
          json({ error: 'Failed to update channel' }, { status: 500 })
        )
      }),
      Effect.provide(AllRepositoriesLive)
    )

    return await Effect.runPromise(program)
  },

  // Delete channel
  DELETE: async ({ params }) => {
    const program = Effect.gen(function* () {
      const channelRepo = yield* ChannelRepository
      const channelId = BigInt(params.channelId)
      yield* channelRepo.delete(channelId)

      return json({ message: 'Channel deleted successfully' })
    }).pipe(
      Effect.catchAll(() =>
        Effect.succeed(
          json({ error: 'Failed to delete channel' }, { status: 500 })
        )
      ),
      Effect.provide(AllRepositoriesLive)
    )

    return await Effect.runPromise(program)
  },
})
