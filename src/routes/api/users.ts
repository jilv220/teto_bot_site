import { createServerFn, json } from '@tanstack/react-start'
import { createServerFileRoute } from '@tanstack/react-start/server'
import { Effect, Schema } from 'effect'
import { authorizationMiddleware } from '../../middlewares/authorization'
import {
  type NewUser,
  type SerializedUser,
  UserRepository,
} from '../../repositories/user'
import { AllRepositoriesLive } from '../../services/repositories'
import { serializeBigInt } from '../../utils/bigint'

const CreateUserSchema = Schema.Struct({
  userId: Schema.NumberFromString,
  role: Schema.optional(Schema.String),
  messageCredits: Schema.optional(Schema.NumberFromString),
})

export const getUsers = createServerFn().handler(async () => {
  const program = Effect.gen(function* () {
    const userRepo = yield* UserRepository
    const users = yield* userRepo.findAll()
    const serializedUsers: SerializedUser[] = serializeBigInt(users)

    return {
      data: {
        users: serializedUsers,
      },
    }
  }).pipe(
    Effect.catchAll(() =>
      Effect.succeed({ error: { code: 400, message: 'Failed to fetch users' } })
    ),
    Effect.provide(AllRepositoriesLive)
  )

  return await Effect.runPromise(program)
})

export const createUser = createServerFn({ method: 'POST' })
  .validator((data: unknown) => {
    return Schema.decodeUnknownSync(CreateUserSchema)(data)
  })
  .handler(async ({ data: userData }) => {
    const program = Effect.gen(function* () {
      const userRepo = yield* UserRepository

      const newUser: NewUser = {
        userId: BigInt(userData.userId),
        role: userData.role || 'user',
        messageCredits: userData.messageCredits
          ? BigInt(userData.messageCredits)
          : BigInt(30),
        insertedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      const user = yield* userRepo.create(newUser)
      const serializedUser: SerializedUser = serializeBigInt(user)
      return {
        data: {
          user: serializedUser,
        },
      }
    }).pipe(
      Effect.catchAll(() => {
        return Effect.succeed({
          error: {
            code: 500,
            message: 'Failed to create user',
          },
        })
      }),
      Effect.provide(AllRepositoriesLive)
    )

    return await Effect.runPromise(program)
  })

export const ServerRoute = createServerFileRoute('/api/users')
  .middleware([authorizationMiddleware])
  .methods({
    GET: async () => {
      const res = await getUsers()
      if ('error' in res) {
        return json(res, { status: res.error.code })
      }

      return json(res)
    },
    POST: async ({ request }) => {
      const body = await request.text()

      try {
        const parsedBody = JSON.parse(body)
        const res = await createUser({ data: parsedBody })

        if ('error' in res) {
          return json({ error: res.error }, { status: res.error.code })
        }

        return json({ user: res.data.user }, { status: 201 })
      } catch (error) {
        return json(
          {
            error: {
              code: 400,
              message: 'Invalid JSON in request body',
            },
          },
          { status: 400 }
        )
      }
    },
  })
