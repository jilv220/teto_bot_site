import { json } from '@tanstack/react-start'
import { createServerFileRoute } from '@tanstack/react-start/server'
import { Effect, Schema } from 'effect'
import { authorizationMiddleware } from '../../middlewares/authorization'
import { GuildRepository, type NewGuild } from '../../repositories/guild'
import { AllRepositoriesLive } from '../../services/repositories'
import { jsonParseSafe } from '../../utils'
import { serializeBigInt } from '../../utils/bigint'

const CreateGuildSchema = Schema.Struct({
  guildId: Schema.String,
})

export const ServerRoute = createServerFileRoute('/api/guilds')
  .middleware([authorizationMiddleware])
  .methods({
    // Get all guilds
    GET: async () => {
      const program = Effect.gen(function* () {
        const guildRepo = yield* GuildRepository
        const guilds = yield* guildRepo.findAll()
        const serializedGuilds = serializeBigInt(guilds)
        return json({ guilds: serializedGuilds })
      }).pipe(
        Effect.catchAll(() =>
          Effect.succeed(
            json({ error: 'Failed to fetch guilds' }, { status: 500 })
          )
        ),
        Effect.provide(AllRepositoriesLive)
      )

      return await Effect.runPromise(program)
    },

    // Create a new guild
    POST: async ({ request }) => {
      const body = await request.text()

      const program = Effect.gen(function* () {
        const guildRepo = yield* GuildRepository
        const parsed = yield* jsonParseSafe(body)
        const guildData = yield* Schema.decodeUnknown(CreateGuildSchema)(parsed)

        const newGuild: NewGuild = {
          guildId: BigInt(guildData.guildId),
          insertedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }

        const guild = yield* guildRepo.create(newGuild)
        const serializedGuild = serializeBigInt(guild)
        return json({ guild: serializedGuild }, { status: 201 })
      }).pipe(
        Effect.catchAll((error) => {
          if (error._tag === 'JsonParseError') {
            return Effect.succeed(
              json({ error: 'Invalid JSON in request body' }, { status: 400 })
            )
          }

          if (error._tag === 'ParseError') {
            return Effect.succeed(
              json({ error: 'Invalid guild data format' }, { status: 400 })
            )
          }

          return Effect.succeed(
            json({ error: 'Failed to create guild' }, { status: 500 })
          )
        }),
        Effect.provide(AllRepositoriesLive)
      )

      return await Effect.runPromise(program)
    },
  })
