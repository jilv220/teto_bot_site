import { json } from '@tanstack/react-start'
import { createServerFileRoute } from '@tanstack/react-start/server'
import { Effect, Schema } from 'effect'
import { authorizationMiddleware } from '../../middlewares/authorization'
import { ChannelRepository, type NewChannel } from '../../repositories/channel'
import { AllRepositoriesLive } from '../../services/repositories'
import { jsonParseSafe } from '../../utils'
import { serializeBigInt } from '../../utils/bigint'

const CreateChannelSchema = Schema.Struct({
  channelId: Schema.String,
  guildId: Schema.String,
})

export const ServerRoute = createServerFileRoute('/api/channels')
  .middleware([authorizationMiddleware])
  .methods({
    // Get all channels
    GET: async () => {
      const program = Effect.gen(function* () {
        const channelRepo = yield* ChannelRepository
        const channels = yield* channelRepo.findAll()
        const serializedChannels = serializeBigInt(channels)
        return json({ channels: serializedChannels })
      }).pipe(
        Effect.catchAll(() =>
          Effect.succeed(
            json({ error: 'Failed to fetch channels' }, { status: 500 })
          )
        ),
        Effect.provide(AllRepositoriesLive)
      )

      return await Effect.runPromise(program)
    },

    // Create a new channel
    POST: async ({ request }) => {
      const body = await request.text()

      const program = Effect.gen(function* () {
        const channelRepo = yield* ChannelRepository
        const parsed = yield* jsonParseSafe(body)
        const channelData =
          yield* Schema.decodeUnknown(CreateChannelSchema)(parsed)

        const newChannel: NewChannel = {
          channelId: BigInt(channelData.channelId),
          guildId: BigInt(channelData.guildId),
          insertedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }

        const channel = yield* channelRepo.create(newChannel)
        const serializedChannel = serializeBigInt(channel)
        return json({ channel: serializedChannel }, { status: 201 })
      }).pipe(
        Effect.catchAll((error) => {
          if (error._tag === 'JsonParseError') {
            return Effect.succeed(
              json({ error: 'Invalid JSON in request body' }, { status: 400 })
            )
          }

          if (error._tag === 'ParseError') {
            return Effect.succeed(
              json({ error: 'Invalid channel data format' }, { status: 400 })
            )
          }

          return Effect.succeed(
            json({ error: 'Failed to create channel' }, { status: 500 })
          )
        }),
        Effect.provide(AllRepositoriesLive)
      )

      return await Effect.runPromise(program)
    },
  })
