import { Context, Effect, Layer } from 'effect'
import {
  type NewUserGuild,
  type UserGuild,
  UserGuildRepository,
  type UserGuildRepositoryError,
  UserGuildRepositoryLive,
} from '../repositories/userGuild'
import { DatabaseError, DatabaseLive } from './database'

export class UserGuildServiceError extends DatabaseError {}

/**
 * Business logic layer for user-guild relationships
 * Handles intimacy management, daily resets, and relationship lifecycle
 */
export class UserGuildService extends Context.Tag('UserGuildService')<
  UserGuildService,
  {
    /**
     * Gets or creates a user-guild relationship with default values
     */
    getOrCreateUserGuild: (
      userId: bigint,
      guildId: bigint
    ) => Effect.Effect<
      UserGuild,
      UserGuildServiceError | UserGuildRepositoryError
    >

    /**
     * Updates user activity and potentially intimacy based on message
     */
    recordUserMessage: (
      userId: bigint,
      guildId: bigint,
      messageTime?: Date
    ) => Effect.Effect<
      UserGuild,
      UserGuildServiceError | UserGuildRepositoryError
    >

    /**
     * Updates intimacy score with business rules
     */
    updateIntimacy: (
      userId: bigint,
      guildId: bigint,
      intimacyChange: number
    ) => Effect.Effect<
      UserGuild,
      UserGuildServiceError | UserGuildRepositoryError
    >

    /**
     * Resets daily metrics for a specific user-guild relationship
     */
    resetDailyMetrics: (
      userId: bigint,
      guildId: bigint
    ) => Effect.Effect<
      UserGuild,
      UserGuildServiceError | UserGuildRepositoryError
    >

    /**
     * Simple delegations to repository
     */
    getUserGuild: (
      userId: bigint,
      guildId: bigint
    ) => Effect.Effect<UserGuild | null, UserGuildRepositoryError>
    getAllUserGuilds: () => Effect.Effect<UserGuild[], UserGuildRepositoryError>
    createUserGuild: (
      userGuildData: NewUserGuild
    ) => Effect.Effect<UserGuild, UserGuildRepositoryError>
    updateUserGuild: (
      userId: bigint,
      guildId: bigint,
      updates: Partial<UserGuild>
    ) => Effect.Effect<UserGuild, UserGuildRepositoryError>
    getAllUserGuildsNeedingReset: () => Effect.Effect<
      UserGuild[],
      UserGuildRepositoryError
    >
  }
>() {}

const make = Effect.gen(function* () {
  const userGuildRepo = yield* UserGuildRepository

  return UserGuildService.of({
    getOrCreateUserGuild: (userId: bigint, guildId: bigint) =>
      Effect.gen(function* () {
        const existing = yield* userGuildRepo.findByUserAndGuild(
          userId,
          guildId
        )
        if (existing) return existing

        // Create with business logic defaults
        const newUserGuild: NewUserGuild = {
          userId,
          guildId,
          intimacy: 0, // Start with neutral intimacy
          dailyMessageCount: BigInt(0),
          lastMessageAt: null,
          lastFeed: null,
          insertedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }

        return yield* userGuildRepo.create(newUserGuild)
      }),

    recordUserMessage: (
      userId: bigint,
      guildId: bigint,
      messageTime = new Date()
    ) =>
      Effect.gen(function* () {
        const userGuild = yield* userGuildRepo.findByUserAndGuild(
          userId,
          guildId
        )

        if (!userGuild) {
          return yield* Effect.fail(
            new UserGuildServiceError({
              message: `User-guild relationship ${userId}:${guildId} not found`,
            })
          )
        }

        // Business logic: increment daily message count and update last message time
        const updates: Partial<UserGuild> = {
          dailyMessageCount: userGuild.dailyMessageCount + BigInt(1),
          lastMessageAt: messageTime.toISOString(),
        }

        return yield* userGuildRepo.update(userId, guildId, updates)
      }),

    updateIntimacy: (userId: bigint, guildId: bigint, intimacyChange: number) =>
      Effect.gen(function* () {
        const userGuild = yield* userGuildRepo.findByUserAndGuild(
          userId,
          guildId
        )

        if (!userGuild) {
          return yield* Effect.fail(
            new UserGuildServiceError({
              message: `User-guild relationship ${userId}:${guildId} not found`,
            })
          )
        }

        // Business logic: apply intimacy bounds (0 to infinity)
        const currentIntimacy = userGuild.intimacy || 0
        const newIntimacy = Math.max(0, currentIntimacy + intimacyChange)

        return yield* userGuildRepo.update(userId, guildId, {
          intimacy: newIntimacy,
        })
      }),

    resetDailyMetrics: (userId: bigint, guildId: bigint) =>
      userGuildRepo.resetDailyMetrics(userId, guildId),

    // Simple delegations
    getUserGuild: (userId: bigint, guildId: bigint) =>
      userGuildRepo.findByUserAndGuild(userId, guildId),
    getAllUserGuilds: () => userGuildRepo.findAll(),
    createUserGuild: (userGuildData: NewUserGuild) =>
      userGuildRepo.create(userGuildData),
    updateUserGuild: (
      userId: bigint,
      guildId: bigint,
      updates: Partial<UserGuild>
    ) => userGuildRepo.update(userId, guildId, updates),
    getAllUserGuildsNeedingReset: () => userGuildRepo.findAllWithResetNeeded(),
  })
})

export const UserGuildServiceLive = Layer.effect(UserGuildService, make).pipe(
  Layer.provide(UserGuildRepositoryLive),
  Layer.provide(DatabaseLive)
)
