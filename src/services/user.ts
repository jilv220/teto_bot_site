import { Effect } from 'effect'
import { type NewUser, UserRepository } from '../repositories/user'
import { DatabaseError } from './database'

export class UserServiceError extends DatabaseError {}

/**
 * Business logic layer - uses repository for data access
 * Similar to Elixir contexts
 */
export const UserService = {
  /**
   * Gets a user by user_id, creating one if it doesn't exist.
   * This is the TypeScript equivalent of the Elixir get_or_create_user function.
   */
  getOrCreateUser: (userId: bigint) =>
    Effect.gen(function* () {
      const existingUser = yield* UserRepository.findById(userId)
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

      const createdUser = yield* UserRepository.create(newUserData)
      return createdUser
    }),

  /**
   * Business logic: Award vote bonus credits to user
   */
  awardVoteBonus: (userId: bigint, bonusAmount: number) =>
    Effect.gen(function* () {
      const user = yield* UserRepository.findById(userId)

      if (!user) {
        return yield* Effect.fail(
          new UserServiceError({ message: `User ${userId} not found` })
        )
      }

      const updatedUser = yield* UserRepository.update(userId, {
        messageCredits: user.messageCredits + BigInt(bonusAmount),
        lastVotedAt: new Date().toISOString(),
      })

      return updatedUser
    }),

  /**
   * Simple delegations to repository (you could expose these directly)
   */
  getUser: UserRepository.findById,
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
      return yield* UserRepository.create(userData)
    }),
}
