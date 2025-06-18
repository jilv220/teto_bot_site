import { createServerFn } from '@tanstack/react-start'
import { Effect } from 'effect'
import { z } from 'zod/v4'
import type { SerializedGuild } from '../repositories/guild'
import { GuildService, GuildServiceLive } from '../services'
import { serializeBigInt } from '../utils/bigint'

export const guildIdSchema = z.coerce.bigint()

export const CreateGuildSchema = z.object({
  guildId: guildIdSchema,
})

export const UpdateGuildSchema = z.object({
  // Guilds typically don't have many updatable fields in Discord bots
  // but we can add any custom fields you might want to update
})

export const getGuildsEffect = Effect.gen(function* () {
  const guildService = yield* GuildService
  const guilds = yield* guildService.getGuilds()
  const serializedGuilds: SerializedGuild[] = serializeBigInt(guilds)

  return {
    data: {
      guilds: serializedGuilds,
    },
  }
}).pipe(
  Effect.catchAll(() =>
    Effect.succeed({
      error: { code: 500, message: 'Failed to fetch guilds' },
    })
  )
)

export const getGuildEffect = (guildId: bigint) =>
  Effect.gen(function* () {
    const guildService = yield* GuildService
    const guild = yield* guildService.getGuild(guildId)

    if (!guild) {
      return {
        error: {
          code: 404,
          message: 'Guild not found',
        },
      }
    }

    const serializedGuild: SerializedGuild = serializeBigInt(guild)
    return {
      data: {
        guild: serializedGuild,
      },
    }
  }).pipe(
    Effect.catchAll(() =>
      Effect.succeed({
        error: { code: 500, message: 'Failed to fetch guild' },
      })
    )
  )

export const createGuildEffect = (guildId: bigint) =>
  Effect.gen(function* () {
    const guildService = yield* GuildService
    const guild = yield* guildService.createGuild(guildId)
    const serializedGuild: SerializedGuild = serializeBigInt(guild)
    return {
      data: {
        guild: serializedGuild,
      },
    }
  }).pipe(
    Effect.catchAll(() =>
      Effect.succeed({
        error: {
          code: 500,
          message: 'Failed to create guild',
        },
      })
    )
  )

export const updateGuildEffect = (
  guildId: bigint,
  updateData: z.infer<typeof UpdateGuildSchema>
) =>
  Effect.gen(function* () {
    const guildService = yield* GuildService
    const guild = yield* guildService.updateGuild(guildId, updateData)
    const serializedGuild: SerializedGuild = serializeBigInt(guild)
    return {
      data: {
        guild: serializedGuild,
      },
    }
  }).pipe(
    Effect.catchAll(() =>
      Effect.succeed({
        error: {
          code: 500,
          message: 'Failed to update guild',
        },
      })
    )
  )

export const deleteGuildEffect = (guildId: bigint) =>
  Effect.gen(function* () {
    const guildService = yield* GuildService
    yield* guildService.deleteGuild(guildId)

    return {
      data: {
        message: 'Guild deleted successfully',
      },
    }
  }).pipe(
    Effect.catchAll(() =>
      Effect.succeed({
        error: {
          code: 500,
          message: 'Failed to delete guild',
        },
      })
    )
  )

/**
 * Server Functions
 */

export const getGuilds = createServerFn().handler(async () => {
  return await Effect.runPromise(
    getGuildsEffect.pipe(Effect.provide(GuildServiceLive))
  )
})

export const getGuild = createServerFn()
  .validator((data: unknown) => guildIdSchema.parse(data))
  .handler(async ({ data: guildId }) => {
    return await Effect.runPromise(
      getGuildEffect(guildId).pipe(Effect.provide(GuildServiceLive))
    )
  })

export const createGuild = createServerFn({ method: 'POST' })
  .validator((data: unknown) => {
    return CreateGuildSchema.parse(data)
  })
  .handler(async ({ data: guildData }) => {
    return await Effect.runPromise(
      createGuildEffect(guildData.guildId).pipe(
        Effect.provide(GuildServiceLive)
      )
    )
  })

export const updateGuild = createServerFn({ method: 'POST' })
  .validator((data: unknown) => {
    return z
      .object({
        guildId: guildIdSchema,
        updateData: UpdateGuildSchema,
      })
      .parse(data)
  })
  .handler(async ({ data: { guildId, updateData } }) => {
    return await Effect.runPromise(
      updateGuildEffect(guildId, updateData).pipe(
        Effect.provide(GuildServiceLive)
      )
    )
  })

export const deleteGuild = createServerFn({ method: 'POST' })
  .validator((data: unknown) => guildIdSchema.parse(data))
  .handler(async ({ data: guildId }) => {
    return await Effect.runPromise(
      deleteGuildEffect(guildId).pipe(Effect.provide(GuildServiceLive))
    )
  })
