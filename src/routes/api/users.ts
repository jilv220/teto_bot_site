import { json } from '@tanstack/react-start'
import { createServerFileRoute } from '@tanstack/react-start/server'
import { Effect } from 'effect'
import { z } from 'zod/v4'
import {
  CreateUserSchema,
  createUser,
  createUserEffect,
  getUsers,
  getUsersEffect,
} from '../../actions/user'
import { authorizationMiddleware } from '../../middlewares/authorization'
import { UserServiceLive } from '../../services'
import {
  buildInvalidBodyErrorResponse,
  buildValidationErrorResponse,
} from '../../utils'

export const ServerRoute = createServerFileRoute('/api/users')
  .middleware([authorizationMiddleware])
  .methods({
    GET: async () => {
      const res = await Effect.runPromise(
        getUsersEffect.pipe(Effect.provide(UserServiceLive))
      )

      if ('error' in res) {
        return json(res, { status: res.error.code })
      }

      return json(res)
    },
    POST: async ({ request }) => {
      const body = await request.text()

      try {
        const parsedBody = JSON.parse(body)
        const { userId, role } = CreateUserSchema.parse(parsedBody)

        const res = await Effect.runPromise(
          createUserEffect(userId, role).pipe(Effect.provide(UserServiceLive))
        )

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
