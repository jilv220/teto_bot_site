import { Effect } from 'effect'
import {
  type NewUser,
  type SerializedUser,
  UserRepository,
} from '../repositories/user'
import { serializeBigInt } from '../utils/bigint'

export const getUsersTask = Effect.gen(function* () {
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
    Effect.succeed({ error: { code: 500, message: 'Failed to fetch users' } })
  )
)

export const createUserTask = (newUser: NewUser) =>
  Effect.gen(function* () {
    const userRepo = yield* UserRepository
    const user = yield* userRepo.create(newUser)
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
