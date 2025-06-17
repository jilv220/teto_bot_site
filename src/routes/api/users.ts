import { createServerFn, json } from '@tanstack/react-start'
import { createServerFileRoute } from '@tanstack/react-start/server'
import { Effect } from 'effect'
import { z } from 'zod/v4'
import { authorizationMiddleware } from '../../middlewares/authorization'
import type { NewUser } from '../../repositories/user'
import { AllRepositoriesLive } from '../../services/repositories'
import { createUserTask, getUsersTask } from '../../tasks'
import {
  buildInvalidBodyErrorResponse,
  buildValidationErrorResponse,
} from '../../utils'

const CreateUserSchema = z.object({
  userId: z.coerce.bigint(),
  role: z.string().optional(),
  messageCredits: z.coerce.bigint().optional(),
})

export const getUsers = createServerFn().handler(async () => {
  return await Effect.runPromise(
    getUsersTask.pipe(Effect.provide(AllRepositoriesLive))
  )
})

export const createUser = createServerFn({ method: 'POST' })
  .validator((data: unknown) => {
    return CreateUserSchema.parse(data)
  })
  .handler(async ({ data: userData }) => {
    const newUser: NewUser = {
      userId: userData.userId,
      role: userData.role || 'user',
      messageCredits: userData.messageCredits || BigInt(30),
      insertedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    return await Effect.runPromise(
      createUserTask(newUser).pipe(Effect.provide(AllRepositoriesLive))
    )
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

        return json(res, { status: 201 })
      } catch (error) {
        if (error instanceof z.ZodError)
          return buildValidationErrorResponse(error)

        return buildInvalidBodyErrorResponse()
      }
    },
  })
