import { json } from '@tanstack/react-start'
import { createServerFileRoute } from '@tanstack/react-start/server'
import { Schema } from 'effect'
import { Effect } from 'effect'
import { z } from 'zod/v4'
import {
  UpdateUserSchema,
  deleteUserEffect,
  getUserEffect,
  updateUserEffect,
  userIdSchema,
} from '../../../actions/user'
import { UserServiceLive } from '../../../services'
import { buildValidationErrorResponse } from '../../../utils'

export const ServerRoute = createServerFileRoute('/api/users/$userId').methods({
  GET: async ({ params }) => {
    try {
      const userId = userIdSchema.parse(params.userId)
      const res = await Effect.runPromise(
        getUserEffect(userId).pipe(Effect.provide(UserServiceLive()))
      )

      if ('error' in res && res.error) {
        return json(res, { status: res.error.code })
      }

      return json(res)
    } catch (error) {
      if (error instanceof z.ZodError)
        return buildValidationErrorResponse(error)
      return json({ error: 'Invalid request' }, { status: 400 })
    }
  },

  PUT: async ({ request, params }) => {
    const body = await request.text()

    try {
      const userId = userIdSchema.parse(params.userId)
      const parsed = JSON.parse(body)
      const updateData = UpdateUserSchema.parse({
        userId,
        ...parsed,
      })

      const res = await Effect.runPromise(
        updateUserEffect(updateData).pipe(Effect.provide(UserServiceLive()))
      )

      if ('error' in res && res.error) {
        return json(res, { status: res.error.code })
      }

      return json(res)
    } catch (error) {
      if (error instanceof z.ZodError) {
        return buildValidationErrorResponse(error)
      }
      return json({ error: 'Invalid request' }, { status: 400 })
    }
  },

  DELETE: async ({ params }) => {
    try {
      const userId = userIdSchema.parse(params.userId)
      const res = await Effect.runPromise(
        deleteUserEffect(userId).pipe(Effect.provide(UserServiceLive()))
      )

      if ('error' in res && res.error) {
        return json(res, { status: res.error.code })
      }

      return json(res)
    } catch (error) {
      if (error instanceof z.ZodError)
        return buildValidationErrorResponse(error)
      return json({ error: 'Invalid request' }, { status: 400 })
    }
  },
})
