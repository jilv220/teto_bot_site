import { eq } from 'drizzle-orm'
import { Context, Effect, Layer } from 'effect'
import { users } from '../db'
import { Database, DatabaseError } from '../services/database'

export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert
export class UserRepositoryError extends DatabaseError {}

export class UserRepository extends Context.Tag('UserRepository')<
  UserRepository,
  {
    findById: (
      userId: bigint
    ) => Effect.Effect<User | null, UserRepositoryError>
    create: (userData: NewUser) => Effect.Effect<User, UserRepositoryError>
    update: (
      userId: bigint,
      updates: Partial<User>
    ) => Effect.Effect<User, UserRepositoryError>
    delete: (userId: bigint) => Effect.Effect<void, UserRepositoryError>
  }
>() {}

const make = Effect.gen(function* () {
  const db = yield* Database

  return UserRepository.of({
    findById: (userId: bigint) =>
      Effect.tryPromise({
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
      }),

    create: (userData: NewUser) =>
      Effect.tryPromise({
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
      }),

    update: (userId: bigint, updates: Partial<User>) =>
      Effect.tryPromise({
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
      }),

    delete: (userId: bigint) =>
      Effect.tryPromise({
        try: () => db.delete(users).where(eq(users.userId, userId)),
        catch: (error) =>
          new UserRepositoryError({
            message: `Failed to delete user ${userId}: ${error}`,
          }),
      }),
  })
})

export const UserRepositoryLive = Layer.effect(UserRepository, make)
