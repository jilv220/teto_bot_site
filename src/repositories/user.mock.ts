import { Effect, Layer } from 'effect'
import { UserRepository, UserRepositoryError } from './user'
import type { NewUser, User } from './user'

const makeMock = Effect.gen(function* () {
  const users = new Map<bigint, User>()
  let nextId = 1n

  return UserRepository.of({
    findById: (userId: bigint) => Effect.succeed(users.get(userId) || null),

    findAll: () => Effect.succeed(Array.from(users.values())),

    create: (userData: NewUser) =>
      Effect.gen(function* () {
        // Check for unique constraint if userId is provided
        if (userData.userId && users.has(userData.userId)) {
          yield* Effect.fail(
            new UserRepositoryError({
              message: `User with ID ${userData.userId} already exists`,
              type: 'UniqueConstraint',
            })
          )
        }

        const userId = userData.userId || nextId++
        const now = new Date().toISOString()
        const newUser: User = {
          userId,
          insertedAt: userData.insertedAt || now,
          updatedAt: userData.updatedAt || now,
          role: userData.role || 'user',
          lastVotedAt: userData.lastVotedAt || null,
          messageCredits: userData.messageCredits || BigInt(30),
        }

        users.set(userId, newUser)
        return newUser
      }),

    update: (userId: bigint, updates: Partial<User>) =>
      Effect.gen(function* () {
        const existingUser = users.get(userId)
        if (!existingUser) {
          yield* Effect.fail(
            new UserRepositoryError({
              message: `User with ID ${userId} not found`,
            })
          )
        }

        // TypeScript assertion since we've already checked for null above
        const user = existingUser as User

        const updatedUser: User = {
          userId,
          insertedAt: user.insertedAt,
          updatedAt: new Date().toISOString(),
          role: updates.role !== undefined ? updates.role : user.role,
          lastVotedAt:
            updates.lastVotedAt !== undefined
              ? updates.lastVotedAt
              : user.lastVotedAt,
          messageCredits:
            updates.messageCredits !== undefined
              ? updates.messageCredits
              : user.messageCredits,
        }

        users.set(userId, updatedUser)
        return updatedUser
      }),

    delete: (userId: bigint) =>
      Effect.gen(function* () {
        const deleted = users.delete(userId)
        if (!deleted) {
          yield* Effect.fail(
            new UserRepositoryError({
              message: `User with ID ${userId} not found`,
            })
          )
        }
      }),
  })
})

export const UserRepositoryMock = Layer.effect(UserRepository, makeMock)
