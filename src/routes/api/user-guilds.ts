import { json } from '@tanstack/react-start'
import { createServerFileRoute } from '@tanstack/react-start/server'
import { Effect, Schema } from 'effect'
import { authorizationMiddleware } from '../../middlewares/authorization'
import {
  type NewUserGuild,
  type UserGuild,
  UserGuildRepository,
} from '../../repositories/userGuild'
import { AllRepositoriesLive } from '../../services/repositories'
import { jsonParseSafe } from '../../utils'
import { serializeBigInt } from '../../utils/bigint'

const CreateUserGuildSchema = Schema.Struct({
  userId: Schema.String,
  guildId: Schema.String,
  intimacy: Schema.optional(Schema.Number),
})

const UpdateUserGuildSchema = Schema.Struct({
  intimacy: Schema.optional(Schema.Number),
  lastMessageAt: Schema.optional(Schema.String),
  lastFeed: Schema.optional(Schema.String),
  dailyMessageCount: Schema.optional(Schema.String),
})

export const ServerRoute = createServerFileRoute('/api/user-guilds')
  .middleware([authorizationMiddleware])
  .methods({
    // Create a new user-guild relationship
    POST: async ({ request }) => {
      const body = await request.text()

      const program = Effect.gen(function* () {
        const userGuildRepo = yield* UserGuildRepository
        const parsed = yield* jsonParseSafe(body)
        const userGuildData = yield* Schema.decodeUnknown(
          CreateUserGuildSchema
        )(parsed)

        const newUserGuild: NewUserGuild = {
          userId: BigInt(userGuildData.userId),
          guildId: BigInt(userGuildData.guildId),
          intimacy: userGuildData.intimacy || 0,
          insertedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }

        const userGuild = yield* userGuildRepo.create(newUserGuild)
        const serializedUserGuild = serializeBigInt(userGuild)
        return json({ userGuild: serializedUserGuild }, { status: 201 })
      }).pipe(
        Effect.catchAll((error) => {
          if (error._tag === 'JsonParseError') {
            return Effect.succeed(
              json({ error: 'Invalid JSON in request body' }, { status: 400 })
            )
          }

          if (error._tag === 'ParseError') {
            return Effect.succeed(
              json({ error: 'Invalid user-guild data format' }, { status: 400 })
            )
          }

          return Effect.succeed(
            json(
              { error: 'Failed to create user-guild relationship' },
              { status: 500 }
            )
          )
        }),
        Effect.provide(AllRepositoriesLive)
      )

      return await Effect.runPromise(program)
    },

    // Get all user-guild relationships, or specific one with query params
    GET: async ({ request }) => {
      const url = new URL(request.url)
      const userId = url.searchParams.get('userId')
      const guildId = url.searchParams.get('guildId')

      const program = Effect.gen(function* () {
        const userGuildRepo = yield* UserGuildRepository

        // If both userId and guildId provided, get specific relationship
        if (userId && guildId) {
          const userGuild = yield* userGuildRepo.findByUserAndGuild(
            BigInt(userId),
            BigInt(guildId)
          )

          if (!userGuild) {
            return json(
              { error: 'User-guild relationship not found' },
              { status: 404 }
            )
          }

          const serializedUserGuild = serializeBigInt(userGuild)
          return json({ userGuild: serializedUserGuild })
        }

        // Otherwise, get all user-guild relationships
        const userGuilds = yield* userGuildRepo.findAll()
        const serializedUserGuilds = serializeBigInt(userGuilds)
        return json({ userGuilds: serializedUserGuilds })
      }).pipe(
        Effect.catchAll(() =>
          Effect.succeed(
            json(
              { error: 'Failed to fetch user-guild relationships' },
              { status: 500 }
            )
          )
        ),
        Effect.provide(AllRepositoriesLive)
      )

      return await Effect.runPromise(program)
    },

    // Update user-guild relationship
    PUT: async ({ request }) => {
      const body = await request.text()
      const url = new URL(request.url)
      const userId = url.searchParams.get('userId')
      const guildId = url.searchParams.get('guildId')

      if (!userId || !guildId) {
        return json(
          { error: 'Both userId and guildId query parameters are required' },
          { status: 400 }
        )
      }

      const program = Effect.gen(function* () {
        const userGuildRepo = yield* UserGuildRepository
        const parsed = yield* jsonParseSafe(body)
        const updateData = yield* Schema.decodeUnknown(UpdateUserGuildSchema)(
          parsed
        )

        const updates: Partial<UserGuild> = {}
        if (updateData.intimacy !== undefined) {
          updates.intimacy = updateData.intimacy
        }
        if (updateData.lastMessageAt !== undefined) {
          updates.lastMessageAt = updateData.lastMessageAt
        }
        if (updateData.lastFeed !== undefined) {
          updates.lastFeed = updateData.lastFeed
        }
        if (updateData.dailyMessageCount !== undefined) {
          updates.dailyMessageCount = BigInt(updateData.dailyMessageCount)
        }

        const userGuild = yield* userGuildRepo.update(
          BigInt(userId),
          BigInt(guildId),
          updates
        )
        const serializedUserGuild = serializeBigInt(userGuild)
        return json({ userGuild: serializedUserGuild })
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
            json(
              { error: 'Failed to update user-guild relationship' },
              { status: 500 }
            )
          )
        }),
        Effect.provide(AllRepositoriesLive)
      )

      return await Effect.runPromise(program)
    },
  })
