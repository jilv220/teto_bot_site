import { Context, Effect, Layer } from 'effect'
import {
  type Guild,
  GuildRepository,
  type GuildRepositoryError,
  GuildRepositoryLive,
  type NewGuild,
} from '../repositories/guild'
import {
  type UserGuild,
  UserGuildRepository,
  type UserGuildRepositoryError,
  UserGuildRepositoryLive,
} from '../repositories/userGuild'
import { DatabaseError, DatabaseLive } from './database'

export class GuildServiceError extends DatabaseError {}

/**
 * Business logic layer - uses repository for data access
 * Similar to Elixir contexts
 */
export class GuildService extends Context.Tag('GuildService')<
  GuildService,
  {
    /**
     * Gets a guild by guild_id, creating one if it doesn't exist.
     * This is useful for Discord guilds that may not be in our DB yet.
     */
    getOrCreateGuild: (
      guildId: bigint
    ) => Effect.Effect<Guild, GuildServiceError | GuildRepositoryError>

    /**
     * Gets the intimacy leaderboard for a guild
     */
    getIntimacyLeaderboard: (
      guildId: bigint,
      limit?: number
    ) => Effect.Effect<
      UserGuild[],
      GuildServiceError | UserGuildRepositoryError
    >

    /**
     * Simple delegations to repository
     */
    getGuild: (
      guildId: bigint
    ) => Effect.Effect<Guild | null, GuildRepositoryError>
    getGuildByUuid: (
      id: string
    ) => Effect.Effect<Guild | null, GuildRepositoryError>
    getGuilds: () => Effect.Effect<Guild[], GuildRepositoryError>
    createGuild: (guildId: bigint) => Effect.Effect<Guild, GuildRepositoryError>
    updateGuild: (
      guildId: bigint,
      updates: Partial<Guild>
    ) => Effect.Effect<Guild, GuildRepositoryError>
    deleteGuild: (guildId: bigint) => Effect.Effect<void, GuildRepositoryError>
  }
>() {}

const make = Effect.gen(function* () {
  const guildRepo = yield* GuildRepository
  const userGuildRepo = yield* UserGuildRepository

  return GuildService.of({
    getOrCreateGuild: (guildId: bigint) =>
      Effect.gen(function* () {
        const existingGuild = yield* guildRepo.findById(guildId)
        if (existingGuild) return existingGuild

        // Create new guild with business logic defaults
        const newGuildData: NewGuild = {
          guildId,
          insertedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }

        const createdGuild = yield* guildRepo.create(newGuildData)
        return createdGuild
      }),

    getIntimacyLeaderboard: (guildId: bigint, limit?: number) =>
      userGuildRepo.findIntimacyLeaderboard(guildId, limit),

    getGuild: (guildId: bigint) => guildRepo.findById(guildId),
    getGuildByUuid: (id: string) => guildRepo.findByUuid(id),
    getGuilds: () => guildRepo.findAll(),
    createGuild: (guildId: bigint) =>
      Effect.gen(function* () {
        const guildData: NewGuild = {
          guildId,
          insertedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
        return yield* guildRepo.create(guildData)
      }),
    updateGuild: (guildId: bigint, updates: Partial<Guild>) =>
      Effect.gen(function* () {
        const guild = yield* guildRepo.findById(guildId)
        if (!guild) {
          return yield* Effect.fail(
            new GuildServiceError({ message: `Guild ${guildId} not found` })
          )
        }
        const updatedGuild = yield* guildRepo.update(guildId, {
          ...updates,
          updatedAt: new Date().toISOString(),
        })
        return updatedGuild
      }),
    deleteGuild: (guildId: bigint) => guildRepo.delete(guildId),
  })
})

export const GuildServiceLive = Layer.effect(GuildService, make).pipe(
  Layer.provide(GuildRepositoryLive),
  Layer.provide(UserGuildRepositoryLive),
  Layer.provide(DatabaseLive)
)
