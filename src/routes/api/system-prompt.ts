import { json } from '@tanstack/react-start'
import { createServerFileRoute } from '@tanstack/react-start/server'
import { Effect } from 'effect'
import { z } from 'zod/v4'
import { RedisService, RedisServiceLive } from '../../services'
import { jsonParseSafe } from '../../utils'

const SetPromptBodySchema = z.object({
  prompt: z.string(),
})

export const ServerRoute = createServerFileRoute('/api/system-prompt').methods({
  GET: async () => {
    const program = Effect.gen(function* () {
      const redisService = yield* RedisService
      const prompt = yield* redisService.getSystemPrompt()

      return json({
        prompt: prompt || null,
      })
    }).pipe(
      Effect.catchAll((error) => {
        console.error('Failed to get system prompt:', error)
        return Effect.succeed(
          json({ error: 'Failed to retrieve system prompt' }, { status: 500 })
        )
      })
    )

    return await Effect.runPromise(
      Effect.scoped(Effect.provide(program, RedisServiceLive()))
    )
  },

  POST: async ({ request }) => {
    const body = await request.text()

    const program = Effect.gen(function* () {
      const parsed = yield* jsonParseSafe(body)

      const parseResult = SetPromptBodySchema.safeParse(parsed)
      if (!parseResult.success) {
        return json(
          {
            error: 'Invalid request body: missing or invalid "prompt" field',
          },
          { status: 400 }
        )
      }

      const { prompt } = parseResult.data
      const redisService = yield* RedisService
      yield* redisService.setSystemPrompt(prompt)

      return json({
        success: true,
        message: 'System prompt updated successfully',
      })
    }).pipe(
      Effect.catchAll((error) => {
        if (error._tag === 'JsonParseError') {
          return Effect.succeed(
            json({ error: 'Invalid JSON in request body' }, { status: 400 })
          )
        }

        console.error('Failed to set system prompt:', error)
        return Effect.succeed(
          json({ error: 'Failed to update system prompt' }, { status: 500 })
        )
      })
    )

    return await Effect.runPromise(
      Effect.scoped(Effect.provide(program, RedisServiceLive()))
    )
  },
})
