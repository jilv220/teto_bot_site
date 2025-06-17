import { json } from '@tanstack/react-start'
import { createServerFileRoute } from '@tanstack/react-start/server'
import { Effect, Schema } from 'effect'
import { type User, UserRepository } from '../../../repositories/user'
import { AllRepositoriesLive } from '../../../services/repositories'
import { jsonParseSafe } from '../../../utils'
import { bigIntParseSafe, serializeBigInt } from '../../../utils/bigint'

const UpdateUserSchema = Schema.Struct({
  role: Schema.optional(Schema.String),
  messageCredits: Schema.optional(Schema.String),
  lastVotedAt: Schema.optional(Schema.String),
})

export const ServerRoute = createServerFileRoute('/api/users/$userId').methods({
  // Get user by ID
  GET: async ({ params }) => {
    const program = Effect.gen(function* () {
      const userRepo = yield* UserRepository
      const userId = yield* bigIntParseSafe(params.userId)

      const user = yield* userRepo.findById(userId)

      if (!user) {
        return json({ error: 'User not found' }, { status: 404 })
      }

      const serializedUser = serializeBigInt(user)
      return json({ user: serializedUser })
    }).pipe(
      Effect.catchAll((error) => {
        if (error._tag === 'BigIntParseError') {
          return Effect.succeed(
            json(
              {
                error: 'Invalid path params',
              },
              { status: 500 }
            )
          )
        }

        return Effect.succeed(
          json({ error: 'Failed to fetch user' }, { status: 500 })
        )
      }),
      Effect.provide(AllRepositoriesLive)
    )

    return await Effect.runPromise(program)
  },

  // Update user
  PUT: async ({ request, params }) => {
    const body = await request.text()

    const program = Effect.gen(function* () {
      const userRepo = yield* UserRepository
      const parsed = yield* jsonParseSafe(body)
      const updateData = yield* Schema.decodeUnknown(UpdateUserSchema)(parsed)

      const userId = BigInt(params.userId)

      const updates: Partial<User> = {}
      if (updateData.role !== undefined) {
        updates.role = updateData.role
      }
      if (updateData.messageCredits !== undefined) {
        updates.messageCredits = BigInt(updateData.messageCredits)
      }
      if (updateData.lastVotedAt !== undefined) {
        updates.lastVotedAt = updateData.lastVotedAt
      }

      const user = yield* userRepo.update(userId, updates)
      const serializedUser = serializeBigInt(user)
      return json({ user: serializedUser })
    }).pipe(
      Effect.catchAll((error) => {
        if (error._tag === 'JsonParseError') {
          return Effect.succeed(
            json({ error: 'Invalid JSON in request body' }, { status: 400 })
          )
        }

        if (error._tag === 'ParseError') {
          return Effect.succeed(
            json({ error: 'Invalid update data format' }, { status: 400 })
          )
        }

        return Effect.succeed(
          json({ error: 'Failed to update user' }, { status: 500 })
        )
      }),
      Effect.provide(AllRepositoriesLive)
    )

    return await Effect.runPromise(program)
  },

  // Delete user
  DELETE: async ({ params }) => {
    const program = Effect.gen(function* () {
      const userRepo = yield* UserRepository
      const userId = BigInt(params.userId)
      yield* userRepo.delete(userId)

      return json({ message: 'User deleted successfully' })
    }).pipe(
      Effect.catchAll(() =>
        Effect.succeed(
          json({ error: 'Failed to delete user' }, { status: 500 })
        )
      ),
      Effect.provide(AllRepositoriesLive)
    )

    return await Effect.runPromise(program)
  },
})
