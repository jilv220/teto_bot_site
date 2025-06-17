import { eq } from 'drizzle-orm'
import { Context, Effect, Layer } from 'effect'
import { guilds } from '../db'
import { Database, DatabaseError } from '../services/database'
import type { SerializeBigInt } from '../utils/bigint'

export type Guild = typeof guilds.$inferSelect
export type NewGuild = typeof guilds.$inferInsert
export type SerializedGuild = SerializeBigInt<Guild>
export class GuildRepositoryError extends DatabaseError {}

export class GuildRepository extends Context.Tag('GuildRepository')<
  GuildRepository,
  {
    findById: (
      guildId: bigint
    ) => Effect.Effect<Guild | null, GuildRepositoryError>
    findByUuid: (
      id: string
    ) => Effect.Effect<Guild | null, GuildRepositoryError>
    findAll: () => Effect.Effect<Guild[], GuildRepositoryError>
    create: (guildData: NewGuild) => Effect.Effect<Guild, GuildRepositoryError>
    update: (
      guildId: bigint,
      updates: Partial<Guild>
    ) => Effect.Effect<Guild, GuildRepositoryError>
    delete: (guildId: bigint) => Effect.Effect<void, GuildRepositoryError>
  }
>() {}

const make = Effect.gen(function* () {
  const db = yield* Database

  return GuildRepository.of({
    findById: (guildId: bigint) =>
      Effect.tryPromise({
        try: () =>
          db
            .select()
            .from(guilds)
            .where(eq(guilds.guildId, guildId))
            .limit(1)
            .then((rows) => rows[0] || null),
        catch: (error) =>
          new GuildRepositoryError({
            message: `Failed to find guild ${guildId}: ${error}`,
          }),
      }),

    findByUuid: (id: string) =>
      Effect.tryPromise({
        try: () =>
          db
            .select()
            .from(guilds)
            .where(eq(guilds.id, id))
            .limit(1)
            .then((rows) => rows[0] || null),
        catch: (error) =>
          new GuildRepositoryError({
            message: `Failed to find guild with UUID ${id}: ${error}`,
          }),
      }),

    findAll: () =>
      Effect.tryPromise({
        try: () => db.select().from(guilds),
        catch: (error) =>
          new GuildRepositoryError({
            message: `Failed to find all guilds: ${error}`,
          }),
      }),

    create: (guildData: NewGuild) =>
      Effect.tryPromise({
        try: () =>
          db
            .insert(guilds)
            .values(guildData)
            .returning()
            .then((rows) => rows[0]),
        catch: (error) =>
          new GuildRepositoryError({
            message: `Failed to create guild: ${error}`,
          }),
      }),

    update: (guildId: bigint, updates: Partial<Guild>) =>
      Effect.tryPromise({
        try: () =>
          db
            .update(guilds)
            .set({ ...updates, updatedAt: new Date().toISOString() })
            .where(eq(guilds.guildId, guildId))
            .returning()
            .then((rows) => rows[0]),
        catch: (error) =>
          new GuildRepositoryError({
            message: `Failed to update guild ${guildId}: ${error}`,
          }),
      }),

    delete: (guildId: bigint) =>
      Effect.tryPromise({
        try: () => db.delete(guilds).where(eq(guilds.guildId, guildId)),
        catch: (error) =>
          new GuildRepositoryError({
            message: `Failed to delete guild ${guildId}: ${error}`,
          }),
      }),
  })
})

export const GuildRepositoryLive = Layer.effect(GuildRepository, make)
