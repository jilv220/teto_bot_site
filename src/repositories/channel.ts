import { eq } from 'drizzle-orm'
import { Context, Effect, Layer } from 'effect'
import { channels } from '../db'
import { Database, DatabaseError } from '../services/database'
import type { SerializeBigInt } from '../utils/bigint'

export type Channel = typeof channels.$inferSelect
export type NewChannel = typeof channels.$inferInsert
export type SerializedChannel = SerializeBigInt<Channel>
export class ChannelRepositoryError extends DatabaseError {}

export class ChannelRepository extends Context.Tag('ChannelRepository')<
  ChannelRepository,
  {
    findById: (
      channelId: bigint
    ) => Effect.Effect<Channel | null, ChannelRepositoryError>
    findByGuildId: (
      guildId: bigint
    ) => Effect.Effect<Channel[], ChannelRepositoryError>
    findAll: () => Effect.Effect<Channel[], ChannelRepositoryError>
    create: (
      channelData: NewChannel
    ) => Effect.Effect<Channel, ChannelRepositoryError>
    update: (
      channelId: bigint,
      updates: Partial<Channel>
    ) => Effect.Effect<Channel, ChannelRepositoryError>
    delete: (channelId: bigint) => Effect.Effect<void, ChannelRepositoryError>
  }
>() {}

const make = Effect.gen(function* () {
  const db = yield* Database

  return ChannelRepository.of({
    findById: (channelId: bigint) =>
      Effect.tryPromise({
        try: () =>
          db
            .select()
            .from(channels)
            .where(eq(channels.channelId, channelId))
            .limit(1)
            .then((rows) => rows[0] || null),
        catch: (error) =>
          new ChannelRepositoryError({
            message: `Failed to find channel ${channelId}: ${error}`,
          }),
      }),

    findByGuildId: (guildId: bigint) =>
      Effect.tryPromise({
        try: () =>
          db.select().from(channels).where(eq(channels.guildId, guildId)),
        catch: (error) =>
          new ChannelRepositoryError({
            message: `Failed to find channels for guild ${guildId}: ${error}`,
          }),
      }),

    findAll: () =>
      Effect.tryPromise({
        try: () => db.select().from(channels),
        catch: (error) =>
          new ChannelRepositoryError({
            message: `Failed to find all channels: ${error}`,
          }),
      }),

    create: (channelData: NewChannel) =>
      Effect.tryPromise({
        try: () =>
          db
            .insert(channels)
            .values(channelData)
            .returning()
            .then((rows) => rows[0]),
        catch: (error) =>
          new ChannelRepositoryError({
            message: `Failed to create channel: ${error}`,
          }),
      }),

    update: (channelId: bigint, updates: Partial<Channel>) =>
      Effect.tryPromise({
        try: () =>
          db
            .update(channels)
            .set({ ...updates, updatedAt: new Date().toISOString() })
            .where(eq(channels.channelId, channelId))
            .returning()
            .then((rows) => rows[0]),
        catch: (error) =>
          new ChannelRepositoryError({
            message: `Failed to update channel ${channelId}: ${error}`,
          }),
      }),

    delete: (channelId: bigint) =>
      Effect.tryPromise({
        try: () => db.delete(channels).where(eq(channels.channelId, channelId)),
        catch: (error) =>
          new ChannelRepositoryError({
            message: `Failed to delete channel ${channelId}: ${error}`,
          }),
      }),
  })
})

export const ChannelRepositoryLive = Layer.effect(ChannelRepository, make)
