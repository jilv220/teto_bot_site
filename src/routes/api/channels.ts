import { createServerFn, json } from '@tanstack/react-start'
import { createServerFileRoute } from '@tanstack/react-start/server'
import { Effect, Schema } from 'effect'
import { authorizationMiddleware } from '../../middlewares/authorization'
import {
  ChannelRepository,
  type NewChannel,
  type SerializedChannel,
} from '../../repositories/channel'
import { AllRepositoriesLive } from '../../services/repositories'
import { serializeBigInt } from '../../utils/bigint'

const CreateChannelSchema = Schema.Struct({
  channelId: Schema.String,
  guildId: Schema.String,
})

export const getChannels = createServerFn().handler(async () => {
  const program = Effect.gen(function* () {
    const channelRepo = yield* ChannelRepository
    const channels = yield* channelRepo.findAll()
    const serializedChannels: SerializedChannel[] = serializeBigInt(channels)

    return {
      data: {
        channels: serializedChannels,
      },
    }
  }).pipe(
    Effect.catchAll(() =>
      Effect.succeed({
        error: { code: 400, message: 'Failed to fetch channels' },
      })
    ),
    Effect.provide(AllRepositoriesLive)
  )

  return await Effect.runPromise(program)
})

export const createChannel = createServerFn({ method: 'POST' })
  .validator((data: unknown) => {
    return Schema.decodeUnknownSync(CreateChannelSchema)(data)
  })
  .handler(async ({ data: channelData }) => {
    const program = Effect.gen(function* () {
      const channelRepo = yield* ChannelRepository

      const newChannel: NewChannel = {
        channelId: BigInt(channelData.channelId),
        guildId: BigInt(channelData.guildId),
        insertedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      const channel = yield* channelRepo.create(newChannel)
      const serializedChannel: SerializedChannel = serializeBigInt(channel)
      return {
        data: {
          channel: serializedChannel,
        },
      }
    }).pipe(
      Effect.catchAll(() => {
        return Effect.succeed({
          error: {
            code: 500,
            message: 'Failed to create channel',
          },
        })
      }),
      Effect.provide(AllRepositoriesLive)
    )

    return await Effect.runPromise(program)
  })

export const ServerRoute = createServerFileRoute('/api/channels')
  .middleware([authorizationMiddleware])
  .methods({
    GET: async () => {
      const res = await getChannels()
      if ('error' in res) {
        return json(res, { status: res.error.code })
      }

      return json(res)
    },
    POST: async ({ request }) => {
      const body = await request.text()

      try {
        const parsedBody = JSON.parse(body)
        const res = await createChannel({ data: parsedBody })

        if ('error' in res) {
          return json({ error: res.error }, { status: res.error.code })
        }

        return json({ channel: res.data.channel }, { status: 201 })
      } catch (error) {
        return json(
          {
            error: {
              code: 400,
              message: 'Invalid JSON in request body',
            },
          },
          { status: 400 }
        )
      }
    },
  })
