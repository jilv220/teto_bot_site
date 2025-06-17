import { json } from '@tanstack/react-start'
import { createServerFileRoute } from '@tanstack/react-start/server'
import { Effect, Schema } from 'effect'
import { type Guild, GuildRepository } from '../../../repositories/guild'
import { AllRepositoriesLive } from '../../../services/repositories'
import { jsonParseSafe } from '../../../utils'
import { serializeBigInt } from '../../../utils/bigint'

const UpdateGuildSchema = Schema.Struct({
  // Guilds typically don't have many updatable fields in Discord bots
  // but we can add any custom fields you might want to update
})

export const ServerRoute = createServerFileRoute(
  '/api/guilds/$guildId'
).methods({
  // Get guild by ID
  GET: async ({ params }) => {
    const program = Effect.gen(function* () {
      const guildRepo = yield* GuildRepository
      const guildId = BigInt(params.guildId)
      const guild = yield* guildRepo.findById(guildId)

      if (!guild) {
        return json({ error: 'Guild not found' }, { status: 404 })
      }

      const serializedGuild = serializeBigInt(guild)
      return json({ guild: serializedGuild })
    }).pipe(
      Effect.catchAll(() =>
        Effect.succeed(
          json({ error: 'Failed to fetch guild' }, { status: 500 })
        )
      ),
      Effect.provide(AllRepositoriesLive)
    )

    return await Effect.runPromise(program)
  },

  // Update guild
  PUT: async ({ request, params }) => {
    const body = await request.text()

    const program = Effect.gen(function* () {
      const guildRepo = yield* GuildRepository
      const parsed = yield* jsonParseSafe(body)
      const updateData = yield* Schema.decodeUnknown(UpdateGuildSchema)(parsed)

      const guildId = BigInt(params.guildId)

      const updates: Partial<Guild> = {
        // Add any update fields here based on your schema
        updatedAt: new Date().toISOString(),
      }

      const guild = yield* guildRepo.update(guildId, updates)
      const serializedGuild = serializeBigInt(guild)
      return json({ guild: serializedGuild })
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
          json({ error: 'Failed to update guild' }, { status: 500 })
        )
      }),
      Effect.provide(AllRepositoriesLive)
    )

    return await Effect.runPromise(program)
  },

  // Delete guild
  DELETE: async ({ params }) => {
    const program = Effect.gen(function* () {
      const guildRepo = yield* GuildRepository
      const guildId = BigInt(params.guildId)
      yield* guildRepo.delete(guildId)

      return json({ message: 'Guild deleted successfully' })
    }).pipe(
      Effect.catchAll(() =>
        Effect.succeed(
          json({ error: 'Failed to delete guild' }, { status: 500 })
        )
      ),
      Effect.provide(AllRepositoriesLive)
    )

    return await Effect.runPromise(program)
  },
})
