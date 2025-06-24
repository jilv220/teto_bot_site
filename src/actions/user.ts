import { createServerFn } from '@tanstack/react-start'
import { Effect } from 'effect'
import type { SerializedUser, User } from '../repositories/user'
import { UserService, UserServiceLive } from '../services'
import { serializeBigInt } from '../utils/bigint'

import z from 'zod/v4'

export const userRoleSchema = z.literal(['user', 'admin'])
export const userIdSchema = z.coerce.bigint()

export const CreateUserSchema = z.object({
  userId: userIdSchema,
  role: userRoleSchema.optional(),
})

export const UpdateUserSchema = z.object({
  userId: userIdSchema,
  role: userRoleSchema.optional(),
  messageCredits: z.coerce.bigint().optional(),
  lastVotedAt: z.iso.datetime().optional(),
})

export const GetUserParamsSchema = userIdSchema

export const DeleteUserParamsSchema = GetUserParamsSchema

export const getUsersEffect = Effect.gen(function* () {
  const userServices = yield* UserService
  const users = yield* userServices.getUsers()
  const serializedUsers: SerializedUser[] = serializeBigInt(users)

  return {
    data: {
      users: serializedUsers,
    },
  }
}).pipe(
  Effect.catchAll(() =>
    Effect.succeed({ error: { code: 500, message: 'Failed to fetch users' } })
  )
)

export const getUserEffect = (userId: bigint) =>
  Effect.gen(function* () {
    const userService = yield* UserService
    const user = yield* userService.getUser(userId)

    if (!user) {
      return {
        error: {
          code: 404,
          message: 'User does not exist',
        },
      }
    }

    const serializedUser = serializeBigInt(user)
    return {
      data: {
        user: serializedUser,
      },
    }
  }).pipe(
    Effect.catchAll(() => {
      return Effect.succeed({
        error: { code: 500, message: 'Failed to fetch user' },
      })
    }),
    Effect.provide(UserServiceLive())
  )

export const createUserEffect = (newUserId: bigint, role?: 'user' | 'admin') =>
  Effect.gen(function* () {
    const userServices = yield* UserService
    const user = yield* userServices.createUser(newUserId, role)
    const serializedUser: SerializedUser = serializeBigInt(user)

    return {
      data: {
        user: serializedUser,
      },
    }
  }).pipe(
    Effect.catchAll((error) => {
      if (error.type === 'UniqueConstraint') {
        return Effect.succeed({
          error: {
            code: 409,
            message: 'User already exists',
          },
        })
      }

      return Effect.succeed({
        error: {
          code: 500,
          message: 'Failed to create user',
        },
      })
    })
  )

export const deleteUserEffect = (userId: bigint) =>
  Effect.gen(function* () {
    const userService = yield* UserService
    yield* userService.deleteUser(userId)

    return {
      data: {
        message: 'User deleted successfully',
      },
    }
  }).pipe(
    Effect.catchAll(() =>
      Effect.succeed({
        error: {
          code: 500,
          message: 'Failed to delete user',
        },
      })
    ),
    Effect.provide(UserServiceLive())
  )

export const updateUserEffect = (
  updateData: z.infer<typeof UpdateUserSchema>
) =>
  Effect.gen(function* () {
    const userService = yield* UserService
    const existingUser = yield* userService.getUser(updateData.userId)

    if (!existingUser) {
      return {
        error: {
          code: 404,
          message: 'User not found',
        },
      }
    }

    const { userId, ...rest } = updateData
    const updatedUser = yield* userService.updateUser(userId, rest)
    const serializedUser: SerializedUser = serializeBigInt(updatedUser)

    return {
      data: {
        user: serializedUser,
      },
    }
  }).pipe(
    Effect.catchAll(() =>
      Effect.succeed({
        error: { code: 500, message: 'Failed to update user' },
      })
    )
  )

/**
 * Server Functions
 */

export const getUser = createServerFn()
  .validator((data: unknown) => GetUserParamsSchema.parse(data))
  .handler(async ({ data: userId }) => {
    return await Effect.runPromise(
      getUserEffect(userId).pipe(Effect.provide(UserServiceLive()))
    )
  })

export const getUsers = createServerFn().handler(async () => {
  return await Effect.runPromise(
    getUsersEffect.pipe(Effect.provide(UserServiceLive()))
  )
})

export const createUser = createServerFn({ method: 'POST' })
  .validator((data: unknown) => {
    return CreateUserSchema.parse(data)
  })
  .handler(async ({ data: userData }) => {
    return await Effect.runPromise(
      createUserEffect(userData.userId, userData.role).pipe(
        Effect.provide(UserServiceLive())
      )
    )
  })

export const updateUser = createServerFn({ method: 'POST' })
  .validator((data: unknown) => {
    return UpdateUserSchema.parse(data)
  })
  .handler(async ({ data: updateData }) => {
    return await Effect.runPromise(
      updateUserEffect(updateData).pipe(Effect.provide(UserServiceLive()))
    )
  })

export const deleteUser = createServerFn({ method: 'POST' })
  .validator((data: unknown) => DeleteUserParamsSchema.parse(data))
  .handler(async ({ data: userId }) => {
    return await Effect.runPromise(
      deleteUserEffect(userId).pipe(Effect.provide(UserServiceLive()))
    )
  })
