import { createServerFn } from '@tanstack/react-start'
import { Effect } from 'effect'
import { z } from 'zod/v4'
import type {
  NewUserGuild,
  SerializedUserGuild,
  UserGuild,
} from '../repositories/userGuild'
import { UserGuildService, UserGuildServiceLive } from '../services'
import { serializeBigInt } from '../utils/bigint'

export const CreateUserGuildSchema = z.object({
  userId: z.coerce.bigint(),
  guildId: z.coerce.bigint(),
  intimacy: z.number().optional(),
})

export const UpdateUserGuildSchema = z.object({
  intimacy: z.number().optional(),
  lastMessageAt: z.iso.datetime().optional(),
  lastFeed: z.iso.datetime().optional(),
  dailyMessageCount: z.coerce.bigint().optional(),
})

export const GetUserGuildSchema = z.object({
  userId: z.coerce.bigint(),
  guildId: z.coerce.bigint(),
})

export const UpdateUserGuildParamsSchema = z.object({
  userId: z.coerce.bigint(),
  guildId: z.coerce.bigint(),
  updateData: UpdateUserGuildSchema,
})

export const getUserGuildsEffect = Effect.gen(function* () {
  const userGuildService = yield* UserGuildService
  const userGuilds = yield* userGuildService.getAllUserGuilds()
  const serializedUserGuilds: SerializedUserGuild[] =
    serializeBigInt(userGuilds)

  return {
    data: {
      userGuilds: serializedUserGuilds,
    },
  }
}).pipe(
  Effect.catchAll(() =>
    Effect.succeed({
      error: {
        code: 500,
        message: 'Failed to fetch user-guild relationships',
      },
    })
  )
)

export const getUserGuildEffect = (userId: bigint, guildId: bigint) =>
  Effect.gen(function* () {
    const userGuildService = yield* UserGuildService
    const userGuild = yield* userGuildService.getUserGuild(userId, guildId)

    if (!userGuild) {
      return {
        error: {
          code: 404,
          message: 'User-guild relationship not found',
        },
      }
    }

    const serializedUserGuild: SerializedUserGuild = serializeBigInt(userGuild)

    return {
      data: {
        userGuild: serializedUserGuild,
      },
    }
  }).pipe(
    Effect.catchAll(() =>
      Effect.succeed({
        error: {
          code: 500,
          message: 'Failed to fetch user-guild relationship',
        },
      })
    )
  )

export const createUserGuildEffect = (
  userGuildData: z.infer<typeof CreateUserGuildSchema>
) =>
  Effect.gen(function* () {
    const userGuildService = yield* UserGuildService

    const newUserGuild: NewUserGuild = {
      userId: userGuildData.userId,
      guildId: userGuildData.guildId,
      intimacy: userGuildData.intimacy || 0,
      insertedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    const userGuild = yield* userGuildService.createUserGuild(newUserGuild)
    const serializedUserGuild: SerializedUserGuild = serializeBigInt(userGuild)
    return {
      data: {
        userGuild: serializedUserGuild,
      },
    }
  }).pipe(
    Effect.catchAll(() => {
      return Effect.succeed({
        error: {
          code: 500,
          message: 'Failed to create user-guild relationship',
        },
      })
    })
  )

export const updateUserGuildEffect = (
  params: z.infer<typeof UpdateUserGuildParamsSchema>
) =>
  Effect.gen(function* () {
    const userGuildService = yield* UserGuildService

    const updates: Partial<UserGuild> = {}
    if (params.updateData.intimacy !== undefined) {
      updates.intimacy = params.updateData.intimacy
    }
    if (params.updateData.lastMessageAt !== undefined) {
      updates.lastMessageAt = params.updateData.lastMessageAt
    }
    if (params.updateData.lastFeed !== undefined) {
      updates.lastFeed = params.updateData.lastFeed
    }
    if (params.updateData.dailyMessageCount !== undefined) {
      updates.dailyMessageCount = params.updateData.dailyMessageCount
    }

    const userGuild = yield* userGuildService.updateUserGuild(
      params.userId,
      params.guildId,
      updates
    )
    const serializedUserGuild: SerializedUserGuild = serializeBigInt(userGuild)

    return {
      data: {
        userGuild: serializedUserGuild,
      },
    }
  }).pipe(
    Effect.catchAll(() => {
      return Effect.succeed({
        error: {
          code: 500,
          message: 'Failed to update user-guild relationship',
        },
      })
    })
  )

/**
 * Server Functions
 */

export const getUserGuilds = createServerFn().handler(async () => {
  return await Effect.runPromise(
    getUserGuildsEffect.pipe(Effect.provide(UserGuildServiceLive))
  )
})

export const getUserGuild = createServerFn({ method: 'GET' })
  .validator((data: unknown) => {
    return GetUserGuildSchema.parse(data)
  })
  .handler(async ({ data: params }) => {
    return await Effect.runPromise(
      getUserGuildEffect(params.userId, params.guildId).pipe(
        Effect.provide(UserGuildServiceLive)
      )
    )
  })

export const createUserGuild = createServerFn({ method: 'POST' })
  .validator((data: unknown) => {
    return CreateUserGuildSchema.parse(data)
  })
  .handler(async ({ data: userGuildData }) => {
    return await Effect.runPromise(
      createUserGuildEffect(userGuildData).pipe(
        Effect.provide(UserGuildServiceLive)
      )
    )
  })

export const updateUserGuild = createServerFn({ method: 'POST' })
  .validator((data: unknown) => {
    return UpdateUserGuildParamsSchema.parse(data)
  })
  .handler(async ({ data: params }) => {
    return await Effect.runPromise(
      updateUserGuildEffect(params).pipe(Effect.provide(UserGuildServiceLive))
    )
  })
