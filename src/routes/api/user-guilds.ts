import { createServerFn, json } from '@tanstack/react-start'
import { createServerFileRoute } from '@tanstack/react-start/server'
import { Effect } from 'effect'
import { z } from 'zod/v4'
import { authorizationMiddleware } from '../../middlewares/authorization'
import {
  type NewUserGuild,
  type SerializedUserGuild,
  type UserGuild,
  UserGuildRepository,
} from '../../repositories/userGuild'
import { AllRepositoriesLive } from '../../services/repositories'
import {
  buildInvalidBodyErrorResponse,
  buildValidationErrorResponse,
} from '../../utils'
import { serializeBigInt } from '../../utils/bigint'

const CreateUserGuildSchema = z.object({
  userId: z.coerce.bigint(),
  guildId: z.coerce.bigint(),
  intimacy: z.number().optional(),
})

const UpdateUserGuildSchema = z.object({
  intimacy: z.number().optional(),
  lastMessageAt: z.iso.datetime().optional(),
  lastFeed: z.iso.datetime().optional(),
  dailyMessageCount: z.coerce.bigint().optional(),
})

const GetUserGuildSchema = z.object({
  userId: z.coerce.bigint(),
  guildId: z.coerce.bigint(),
})

const UpdateUserGuildParamsSchema = z.object({
  userId: z.coerce.bigint(),
  guildId: z.coerce.bigint(),
  updateData: UpdateUserGuildSchema,
})

export const getUserGuilds = createServerFn().handler(async () => {
  const program = Effect.gen(function* () {
    const userGuildRepo = yield* UserGuildRepository
    const userGuilds = yield* userGuildRepo.findAll()
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
    ),
    Effect.provide(AllRepositoriesLive)
  )

  return await Effect.runPromise(program)
})

export const getUserGuild = createServerFn({ method: 'GET' })
  .validator((data: unknown) => {
    return GetUserGuildSchema.parse(data)
  })
  .handler(async ({ data: params }) => {
    const program = Effect.gen(function* () {
      const userGuildRepo = yield* UserGuildRepository
      const userGuild = yield* userGuildRepo.findByUserAndGuild(
        params.userId,
        params.guildId
      )

      if (!userGuild) {
        return {
          error: {
            code: 404,
            message: 'User-guild relationship not found',
          },
        }
      }

      const serializedUserGuild: SerializedUserGuild =
        serializeBigInt(userGuild)

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
      ),
      Effect.provide(AllRepositoriesLive)
    )

    return await Effect.runPromise(program)
  })

export const createUserGuild = createServerFn({ method: 'POST' })
  .validator((data: unknown) => {
    return CreateUserGuildSchema.parse(data)
  })
  .handler(async ({ data: userGuildData }) => {
    const program = Effect.gen(function* () {
      const userGuildRepo = yield* UserGuildRepository

      const newUserGuild: NewUserGuild = {
        userId: userGuildData.userId,
        guildId: userGuildData.guildId,
        intimacy: userGuildData.intimacy || 0,
        insertedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      const userGuild = yield* userGuildRepo.create(newUserGuild)
      const serializedUserGuild: SerializedUserGuild =
        serializeBigInt(userGuild)
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
      }),
      Effect.provide(AllRepositoriesLive)
    )

    return await Effect.runPromise(program)
  })

export const updateUserGuild = createServerFn({ method: 'POST' })
  .validator((data: unknown) => {
    return UpdateUserGuildParamsSchema.parse(data)
  })
  .handler(async ({ data: params }) => {
    const program = Effect.gen(function* () {
      const userGuildRepo = yield* UserGuildRepository

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

      const userGuild = yield* userGuildRepo.update(
        params.userId,
        params.guildId,
        updates
      )
      const serializedUserGuild: SerializedUserGuild =
        serializeBigInt(userGuild)

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
      }),
      Effect.provide(AllRepositoriesLive)
    )

    return await Effect.runPromise(program)
  })

export const ServerRoute = createServerFileRoute('/api/user-guilds')
  .middleware([authorizationMiddleware])
  .methods({
    GET: async ({ request }) => {
      const url = new URL(request.url)
      const userId = url.searchParams.get('userId')
      const guildId = url.searchParams.get('guildId')

      // If both userId and guildId provided, get specific relationship
      if (userId && guildId) {
        try {
          const res = await getUserGuild({
            data: {
              userId,
              guildId,
            },
          })

          if ('error' in res && res.error) {
            return json(res, { status: res.error.code })
          }

          return json(res)
        } catch (error) {
          if (error instanceof z.ZodError)
            return buildValidationErrorResponse(error)
        }
      }

      // Otherwise, get all user-guild relationships
      const res = await getUserGuilds()

      if ('error' in res && res.error) {
        return json(res, { status: res.error.code })
      }

      return json(res)
    },
    POST: async ({ request }) => {
      const body = await request.text()

      try {
        const parsedBody = JSON.parse(body)
        const res = await createUserGuild({ data: parsedBody })

        if ('error' in res) {
          return json({ error: res.error }, { status: res.error?.code || 500 })
        }

        return json(res, { status: 201 })
      } catch (error) {
        return buildInvalidBodyErrorResponse()
      }
    },
    PUT: async ({ request }) => {
      const body = await request.text()
      const url = new URL(request.url)
      const userId = url.searchParams.get('userId')
      const guildId = url.searchParams.get('guildId')

      try {
        const parsedBody = JSON.parse(body)
        const res = await updateUserGuild({
          data: {
            userId,
            guildId,
            updateData: parsedBody,
          },
        })

        if ('error' in res) {
          return json({ error: res.error }, { status: res.error.code })
        }

        return json(res)
      } catch (error) {
        if (error instanceof z.ZodError)
          return buildValidationErrorResponse(error)

        return buildInvalidBodyErrorResponse()
      }
    },
  })
