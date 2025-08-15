import { serverOnly } from '@tanstack/react-start'
import { Context, Effect, Layer } from 'effect'
import {
  type CreateUserInput,
  type User,
  UserRepository,
  type UserRepositoryError,
  UserRepositoryLive,
} from '../repositories/user'
import { UserRepositoryMock } from '../repositories/user.mock'
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

    awardPurchaseCredits: (
      userId: bigint,
      bonusAmount: number
    ) => Effect.Effect<User, UserServiceError | UserRepositoryError>

    /**
     * Business logic: Deduct message credits from user if they have enough
     */
    deductMessageCredits: (
      userId: bigint,
      creditCost: number
    ) => Effect.Effect<User, UserServiceError | UserRepositoryError>

    /**
     * Simple delegations to repository (you could expose these directly)
     */
    getUser: (userId: bigint) => Effect.Effect<User | null, UserRepositoryError>
    getUsers: () => Effect.Effect<User[], UserRepositoryError>
    createUser: (
      userId: bigint,
      role?: 'user' | 'admin'
    ) => Effect.Effect<User, UserRepositoryError>
    updateUser: (
      userId: bigint,
      updates: Partial<User>
    ) => Effect.Effect<User, UserRepositoryError>
    deleteUser: (userId: bigint) => Effect.Effect<void, UserRepositoryError>
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
        const newUserData: CreateUserInput = {
          userId,
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
    awardPurchaseCredits: (userId: bigint, creditAmount: number) =>
      Effect.gen(function* () {
        const user = yield* userRepo.findById(userId)

        if (!user) {
          return yield* Effect.fail(
            new UserServiceError({ message: `User ${userId} not found` })
          )
        }

        const updatedUser = yield* userRepo.update(userId, {
          messageCredits: user.messageCredits + BigInt(creditAmount),
        })

        return updatedUser
      }),

    deductMessageCredits: (userId: bigint, creditCost: number) =>
      Effect.gen(function* () {
        const user = yield* userRepo.findById(userId)

        if (!user) {
          return yield* Effect.fail(
            new UserServiceError({ message: `User ${userId} not found` })
          )
        }

        const creditCostBigInt = BigInt(creditCost)
        if (user.messageCredits < creditCostBigInt) {
          return yield* Effect.fail(
            new UserServiceError({
              message: `Insufficient credits. User ${userId} has ${user.messageCredits} credits but needs ${creditCost}`,
            })
          )
        }

        const updatedUser = yield* userRepo.update(userId, {
          messageCredits: user.messageCredits - creditCostBigInt,
        })

        return updatedUser
      }),

    getUser: (userId: bigint) => userRepo.findById(userId),
    getUsers: () => userRepo.findAll(),
    createUser: (userId: bigint, role?: 'user' | 'admin') =>
      Effect.gen(function* () {
        const userData: CreateUserInput = {
          userId,
          role,
          lastVotedAt: null,
        }
        return yield* userRepo.create(userData)
      }),
    updateUser: (userId: bigint, updates: Partial<User>) =>
      Effect.gen(function* () {
        const user = yield* userRepo.findById(userId)
        if (!user) {
          return yield* Effect.fail(
            new UserServiceError({ message: `User ${userId} not found` })
          )
        }
        const updatedUser = yield* userRepo.update(userId, updates)
        return updatedUser
      }),
    deleteUser: (userId) => userRepo.delete(userId),
  })
})

export const UserServiceLive = serverOnly(() =>
  Layer.effect(UserService, make).pipe(
    Layer.provide(UserRepositoryLive),
    Layer.provide(DatabaseLive())
  )
)

export const UserServiceMock = serverOnly(() =>
  Layer.effect(UserService, make).pipe(
    Layer.provide(UserRepositoryMock),
    Layer.provide(DatabaseLive())
  )
)
