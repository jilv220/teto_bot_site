import { Context, Effect, Layer } from 'effect'
import {
  type NewUser,
  type User,
  UserRepository,
  type UserRepositoryError,
  UserRepositoryLive,
} from '../repositories/user'
import { DatabaseError, DatabaseLive } from './database'

export class UserServiceError extends DatabaseError {}

/**
 * Business logic layer - uses repository for data access
 * Similar to Elixir contexts
 */
export class UserService extends Context.Tag('UserService')<
  UserService,
  {
    /**
     * Gets a user by user_id, creating one if it doesn't exist.
     * This is the TypeScript equivalent of the Elixir get_or_create_user function.
     */
    getOrCreateUser: (
      userId: bigint
    ) => Effect.Effect<User, UserServiceError | UserRepositoryError>

    /**
     * Business logic: Award vote bonus credits to user
     */
    awardVoteBonus: (
      userId: bigint,
      bonusAmount: number
    ) => Effect.Effect<User, UserServiceError | UserRepositoryError>

    /**
     * Simple delegations to repository (you could expose these directly)
     */
    getUser: (userId: bigint) => Effect.Effect<User | null, UserRepositoryError>
    createUser: (userId: bigint) => Effect.Effect<User, UserRepositoryError>
  }
>() {}

const make = Effect.gen(function* () {
  const userRepo = yield* UserRepository

  return UserService.of({
    getOrCreateUser: (userId: bigint) =>
      Effect.gen(function* () {
        const existingUser = yield* userRepo.findById(userId)
        if (existingUser) return existingUser

        // Create new user with business logic defaults
        const now = new Date().toISOString()
        const newUserData: NewUser = {
          userId,
          insertedAt: now,
          updatedAt: now,
          role: 'user' as const,
          lastVotedAt: null,
        }

        const createdUser = yield* userRepo.create(newUserData)
        return createdUser
      }),

    awardVoteBonus: (userId: bigint, bonusAmount: number) =>
      Effect.gen(function* () {
        const user = yield* userRepo.findById(userId)

        if (!user) {
          return yield* Effect.fail(
            new UserServiceError({ message: `User ${userId} not found` })
          )
        }

        const updatedUser = yield* userRepo.update(userId, {
          messageCredits: user.messageCredits + BigInt(bonusAmount),
          lastVotedAt: new Date().toISOString(),
        })

        return updatedUser
      }),

    getUser: (userId: bigint) => userRepo.findById(userId),

    createUser: (userId: bigint) =>
      Effect.gen(function* () {
        const now = new Date().toISOString()
        const userData: NewUser = {
          userId,
          insertedAt: now,
          updatedAt: now,
          role: 'user' as const,
          lastVotedAt: null,
        }
        return yield* userRepo.create(userData)
      }),
  })
})

export const UserServiceLive = Layer.effect(UserService, make).pipe(
  Layer.provide(UserRepositoryLive),
  Layer.provide(DatabaseLive)
)
