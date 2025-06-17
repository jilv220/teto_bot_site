import { createServerFn, json } from '@tanstack/react-start'
import { createServerFileRoute } from '@tanstack/react-start/server'
import { Effect, Schema } from 'effect'
import { authorizationMiddleware } from '../../middlewares/authorization'
import {
  GuildRepository,
  type NewGuild,
  type SerializedGuild,
} from '../../repositories/guild'
import { AllRepositoriesLive } from '../../services/repositories'
import { serializeBigInt } from '../../utils/bigint'

const CreateGuildSchema = Schema.Struct({
  guildId: Schema.String,
})

export const getGuilds = createServerFn().handler(async () => {
  const program = Effect.gen(function* () {
    const guildRepo = yield* GuildRepository
    const guilds = yield* guildRepo.findAll()
    const serializedGuilds: SerializedGuild[] = serializeBigInt(guilds)

    return {
      data: {
        guilds: serializedGuilds,
      },
    }
  }).pipe(
    Effect.catchAll(() =>
      Effect.succeed({
        error: { code: 400, message: 'Failed to fetch guilds' },
      })
    ),
    Effect.provide(AllRepositoriesLive)
  )

  return await Effect.runPromise(program)
})

export const createGuild = createServerFn({ method: 'POST' })
  .validator((data: unknown) => {
    return Schema.decodeUnknownSync(CreateGuildSchema)(data)
  })
  .handler(async ({ data: guildData }) => {
    const program = Effect.gen(function* () {
      const guildRepo = yield* GuildRepository

      const newGuild: NewGuild = {
        guildId: BigInt(guildData.guildId),
        insertedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      const guild = yield* guildRepo.create(newGuild)
      const serializedGuild: SerializedGuild = serializeBigInt(guild)
      return {
        data: {
          guild: serializedGuild,
        },
      }
    }).pipe(
      Effect.catchAll(() => {
        return Effect.succeed({
          error: {
            code: 500,
            message: 'Failed to create guild',
          },
        })
      }),
      Effect.provide(AllRepositoriesLive)
    )

    return await Effect.runPromise(program)
  })

export const ServerRoute = createServerFileRoute('/api/guilds')
  .middleware([authorizationMiddleware])
  .methods({
    GET: async () => {
      const res = await getGuilds()
      if ('error' in res) {
        return json(res, { status: res.error.code })
      }

      return json(res)
    },
    POST: async ({ request }) => {
      const body = await request.text()

      try {
        const parsedBody = JSON.parse(body)
        const res = await createGuild({ data: parsedBody })

        if ('error' in res) {
          return json({ error: res.error }, { status: res.error.code })
        }

        return json({ guild: res.data.guild }, { status: 201 })
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
