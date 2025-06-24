import { json } from '@tanstack/react-start'
import { createServerFileRoute } from '@tanstack/react-start/server'
import { Effect } from 'effect'
import { z } from 'zod/v4'
import {
  CreateUserGuildSchema,
  GetUserGuildSchema,
  UpdateUserGuildParamsSchema,
  createUserGuildEffect,
  getUserGuildEffect,
  getUserGuildsEffect,
  updateUserGuildEffect,
} from '../../actions/userGuild'
import { authorizationMiddleware } from '../../middlewares/authorization'
import { UserGuildServiceLive } from '../../services'
import {
  buildInvalidBodyErrorResponse,
  buildValidationErrorResponse,
} from '../../utils'

export const ServerRoute = createServerFileRoute('/api/user-guilds')
  .middleware([authorizationMiddleware])
  .methods({
    GET: async ({ request }) => {
      const url = new URL(request.url)
      const userId = url.searchParams.get('userId')
      const guildId = url.searchParams.get('guildId')

      // If both userId and guildId provided, get specific relationship
      if (userId && guildId) {
        try {
          const parsedParams = GetUserGuildSchema.parse({
            userId,
            guildId,
          })

          const res = await Effect.runPromise(
            getUserGuildEffect(parsedParams.userId, parsedParams.guildId).pipe(
              Effect.provide(UserGuildServiceLive())
            )
          )

          if ('error' in res && res.error) {
            return json(res, { status: res.error.code })
          }

          return json(res)
        } catch (error) {
          if (error instanceof z.ZodError)
            return buildValidationErrorResponse(error)
        }
      }

      // Otherwise, get all user-guild relationships
      const res = await Effect.runPromise(
        getUserGuildsEffect.pipe(Effect.provide(UserGuildServiceLive()))
      )

      if ('error' in res && res.error) {
        return json(res, { status: res.error.code })
      }

      return json(res)
    },
    POST: async ({ request }) => {
      const body = await request.text()

      try {
        const parsedBody = JSON.parse(body)
        const userGuildData = CreateUserGuildSchema.parse(parsedBody)

        const res = await Effect.runPromise(
          createUserGuildEffect(userGuildData).pipe(
            Effect.provide(UserGuildServiceLive())
          )
        )

        if ('error' in res) {
          return json({ error: res.error }, { status: res.error?.code || 500 })
        }

        return json(res, { status: 201 })
      } catch (error) {
        if (error instanceof z.ZodError)
          return buildValidationErrorResponse(error)

        return buildInvalidBodyErrorResponse()
      }
    },
    PUT: async ({ request }) => {
      const body = await request.text()
      const url = new URL(request.url)
      const userId = url.searchParams.get('userId')
      const guildId = url.searchParams.get('guildId')

      try {
        const parsedBody = JSON.parse(body)
        const params = UpdateUserGuildParamsSchema.parse({
          userId,
          guildId,
          updateData: parsedBody,
        })

        const res = await Effect.runPromise(
          updateUserGuildEffect(params).pipe(
            Effect.provide(UserGuildServiceLive())
          )
        )

        if ('error' in res) {
          return json({ error: res.error }, { status: res.error.code })
        }

        return json(res)
      } catch (error) {
        if (error instanceof z.ZodError)
          return buildValidationErrorResponse(error)

        return buildInvalidBodyErrorResponse()
      }
    },
  })
