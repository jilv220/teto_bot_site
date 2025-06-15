import { eq } from 'drizzle-orm'
import { Effect } from 'effect'
import { users } from '../db'
import { Database, DatabaseError } from '../services/database'

export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert
export class UserRepositoryError extends DatabaseError {}

/**
 * Pure data access layer - only CRUD operations
 * Similar to Elixir's Repo module
 */
export const UserRepository = {
  findById: (userId: bigint) =>
    Effect.gen(function* () {
      const db = yield* Database

      const user = yield* Effect.tryPromise({
        try: () =>
          db
            .select()
            .from(users)
            .where(eq(users.userId, userId))
            .limit(1)
            .then((rows) => rows[0] || null),
        catch: (error) =>
          new UserRepositoryError({
            message: `Failed to find user ${userId}: ${error}`,
          }),
      })

      return user
    }),

  create: (userData: NewUser) =>
    Effect.gen(function* () {
      const db = yield* Database

      const createdUser = yield* Effect.tryPromise({
        try: () =>
          db
            .insert(users)
            .values(userData)
            .returning()
            .then((rows) => rows[0]),
        catch: (error) =>
          new UserRepositoryError({
            message: `Failed to create user: ${error}`,
          }),
      })

      return createdUser
    }),

  update: (userId: bigint, updates: Partial<User>) =>
    Effect.gen(function* () {
      const db = yield* Database

      const updatedUser = yield* Effect.tryPromise({
        try: () =>
          db
            .update(users)
            .set({ ...updates, updatedAt: new Date().toISOString() })
            .where(eq(users.userId, userId))
            .returning()
            .then((rows) => rows[0]),
        catch: (error) =>
          new UserRepositoryError({
            message: `Failed to update user ${userId}: ${error}`,
          }),
      })

      return updatedUser
    }),

  delete: (userId: bigint) =>
    Effect.gen(function* () {
      const db = yield* Database

      yield* Effect.tryPromise({
        try: () => db.delete(users).where(eq(users.userId, userId)),
        catch: (error) =>
          new UserRepositoryError({
            message: `Failed to delete user ${userId}: ${error}`,
          }),
      })
    }),
}
