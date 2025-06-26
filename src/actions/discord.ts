import { createServerFn } from '@tanstack/react-start'
import { Effect } from 'effect'
import { z } from 'zod/v4'
import type { SerializedUser } from '../repositories/user'
import type { SerializedUserGuild } from '../repositories/userGuild'
import {
  GuildService,
  GuildServiceLive,
  UserGuildService,
  UserGuildServiceLive,
  UserService,
  UserServiceLive,
} from '../services'
import { appConfig } from '../services/config'
import { serializeBigInt } from '../utils/bigint'

// Schemas
export const RecordUserMessageSchema = z.object({
  userId: z.coerce.bigint(),
  // if guild id is missing, it means the message is a DM
  guildId: z.coerce.bigint().optional(),
  intimacyIncrement: z.number().default(1),
})

export const EnsureUserGuildExistsSchema = z.object({
  userId: z.string(),
  guildId: z.string(),
  role: z.enum(['user', 'admin']).default('user'),
})

export const recordUserMessageEffect = (
  params: z.infer<typeof RecordUserMessageSchema>
) =>
  Effect.gen(function* () {
    const userService = yield* UserService
    const userGuildService = yield* UserGuildService
    const guildService = yield* GuildService
    const config = yield* appConfig

    const { userId, guildId, intimacyIncrement } = params

    // Ensure user exists (getOrCreateUser handles creation automatically)
    yield* userService.getOrCreateUser(userId)

    // Ensure guild exists if guildId is provided
    if (guildId) yield* guildService.getOrCreateGuild(guildId)

    // ATOMICALLY: Deduct credits first, then update metrics
    // This ensures we don't update metrics if the user doesn't have enough credits
    const updatedUser = yield* userService.deductMessageCredits(
      userId,
      config.messageCreditCost
    )

    // Handle guild-specific updates if guildId exists
    if (guildId) {
      // Ensure user-guild relationship exists
      const userGuild = yield* userGuildService.getOrCreateUserGuild(
        userId,
        guildId
      )

      // Record the message activity (only if credit deduction succeeded)
      const updatedUserGuild = yield* userGuildService.updateUserGuild(
        userId,
        guildId,
        {
          dailyMessageCount: userGuild.dailyMessageCount + BigInt(1),
          intimacy: userGuild.intimacy + intimacyIncrement,
          lastMessageAt: new Date().toISOString(),
        }
      )

      return {
        data: {
          user: serializeBigInt(updatedUser),
          userGuild: serializeBigInt(updatedUserGuild),
        },
      }
    }

    // DM case - only return user data
    return {
      data: {
        user: serializeBigInt(updatedUser),
      },
    }
  }).pipe(
    Effect.catchAll((error) => {
      console.error('recordUserMessage error:', error)

      // Handle insufficient credits specifically
      if (error.message?.includes('Insufficient credits')) {
        return Effect.succeed({
          error: {
            code: 402, // Payment Required
            message: error.message,
          },
        })
      }

      return Effect.succeed({
        error: {
          code: 500,
          message: 'Failed to record user message',
        },
      })
    })
  )

export const ensureUserGuildExistsEffect = (
  params: z.infer<typeof EnsureUserGuildExistsSchema>
) =>
  Effect.gen(function* () {
    const userService = yield* UserService
    const userGuildService = yield* UserGuildService
    const guildService = yield* GuildService

    const userId = BigInt(params.userId)
    const guildId = BigInt(params.guildId)

    // Ensure user exists (getOrCreateUser handles creation automatically)
    const user = yield* userService.getOrCreateUser(userId)

    // Ensure guild exists
    const guild = yield* guildService.getOrCreateGuild(guildId)

    // Ensure user-guild relationship exists (getOrCreateUserGuild handles creation)
    const userGuild = yield* userGuildService.getOrCreateUserGuild(
      userId,
      guildId
    )

    const serializedUser: SerializedUser = serializeBigInt(user)
    const serializedUserGuild: SerializedUserGuild = serializeBigInt(userGuild)

    return {
      data: {
        user: serializedUser,
        userGuild: serializedUserGuild,
      },
    }
  }).pipe(
    Effect.catchAll((error) => {
      console.error('ensureUserGuildExists error:', error)
      return Effect.succeed({
        error: {
          code: 500,
          message: 'Failed to ensure user-guild relationship exists',
        },
      })
    })
  )

// Server Functions
export const recordUserMessage = createServerFn({ method: 'POST' })
  .validator((data: unknown) => {
    return RecordUserMessageSchema.parse(data)
  })
  .handler(async ({ data: params }) => {
    return await Effect.runPromise(
      recordUserMessageEffect(params).pipe(
        Effect.provide(UserServiceLive()),
        Effect.provide(UserGuildServiceLive()),
        Effect.provide(GuildServiceLive())
      )
    )
  })

export const ensureUserGuildExists = createServerFn({ method: 'POST' })
  .validator((data: unknown) => {
    return EnsureUserGuildExistsSchema.parse(data)
  })
  .handler(async ({ data: params }) => {
    return await Effect.runPromise(
      ensureUserGuildExistsEffect(params).pipe(
        Effect.provide(UserServiceLive()),
        Effect.provide(UserGuildServiceLive()),
        Effect.provide(GuildServiceLive())
      )
    )
  })
