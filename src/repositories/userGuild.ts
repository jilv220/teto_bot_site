import { and, eq, gt, isNotNull, or } from 'drizzle-orm'
import { Context, Effect, Layer } from 'effect'
import { userGuilds } from '../db'
import { Database, DatabaseError } from '../services/database'

export type UserGuild = typeof userGuilds.$inferSelect
export type NewUserGuild = typeof userGuilds.$inferInsert
export class UserGuildRepositoryError extends DatabaseError {}

export class UserGuildRepository extends Context.Tag('UserGuildRepository')<
  UserGuildRepository,
  {
    findByUserAndGuild: (
      userId: bigint,
      guildId: bigint
    ) => Effect.Effect<UserGuild | null, UserGuildRepositoryError>
    findAllWithResetNeeded: () => Effect.Effect<
      UserGuild[],
      UserGuildRepositoryError
    >
    create: (
      userGuildData: NewUserGuild
    ) => Effect.Effect<UserGuild, UserGuildRepositoryError>
    update: (
      userId: bigint,
      guildId: bigint,
      updates: Partial<UserGuild>
    ) => Effect.Effect<UserGuild, UserGuildRepositoryError>
    resetDailyMetrics: (
      userId: bigint,
      guildId: bigint
    ) => Effect.Effect<UserGuild, UserGuildRepositoryError>
  }
>() {}

const make = Effect.gen(function* () {
  const db = yield* Database

  return UserGuildRepository.of({
    findByUserAndGuild: (userId: bigint, guildId: bigint) =>
      Effect.tryPromise({
        try: () =>
          db
            .select()
            .from(userGuilds)
            .where(
              and(
                eq(userGuilds.userId, userId),
                eq(userGuilds.guildId, guildId)
              )
            )
            .limit(1)
            .then((rows) => rows[0] || null),
        catch: (error) =>
          new UserGuildRepositoryError({
            message: `Failed to find user guild ${userId}:${guildId}: ${error}`,
          }),
      }),

    findAllWithResetNeeded: () =>
      Effect.tryPromise({
        try: () =>
          db
            .select()
            .from(userGuilds)
            .where(
              or(
                gt(userGuilds.dailyMessageCount, BigInt(0)),
                isNotNull(userGuilds.lastFeed)
              )
            ),
        catch: (error) =>
          new UserGuildRepositoryError({
            message: `Failed to find user guilds needing reset: ${error}`,
          }),
      }),

    create: (userGuildData: NewUserGuild) =>
      Effect.tryPromise({
        try: () =>
          db
            .insert(userGuilds)
            .values(userGuildData)
            .returning()
            .then((rows) => rows[0]),
        catch: (error) =>
          new UserGuildRepositoryError({
            message: `Failed to create user guild: ${error}`,
          }),
      }),

    update: (userId: bigint, guildId: bigint, updates: Partial<UserGuild>) =>
      Effect.tryPromise({
        try: () =>
          db
            .update(userGuilds)
            .set({ ...updates, updatedAt: new Date().toISOString() })
            .where(
              and(
                eq(userGuilds.userId, userId),
                eq(userGuilds.guildId, guildId)
              )
            )
            .returning()
            .then((rows) => rows[0]),
        catch: (error) =>
          new UserGuildRepositoryError({
            message: `Failed to update user guild ${userId}:${guildId}: ${error}`,
          }),
      }),

    resetDailyMetrics: (userId: bigint, guildId: bigint) =>
      Effect.tryPromise({
        try: () =>
          db
            .update(userGuilds)
            .set({
              dailyMessageCount: BigInt(0),
              lastFeed: null,
              updatedAt: new Date().toISOString(),
            })
            .where(
              and(
                eq(userGuilds.userId, userId),
                eq(userGuilds.guildId, guildId)
              )
            )
            .returning()
            .then((rows) => rows[0]),
        catch: (error) =>
          new UserGuildRepositoryError({
            message: `Failed to reset daily metrics for user guild ${userId}:${guildId}: ${error}`,
          }),
      }),
  })
})

export const UserGuildRepositoryLive = Layer.effect(UserGuildRepository, make)
