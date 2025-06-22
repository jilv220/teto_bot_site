import { json } from '@tanstack/react-start'
import { createServerFileRoute } from '@tanstack/react-start/server'
import { Effect } from 'effect'
import { authorizationMiddleware } from '../../middlewares/authorization'
import { WordService, WordServiceLive } from '../../services'

export const ServerRoute = createServerFileRoute('/api/word-of-the-day')
  .middleware([authorizationMiddleware])
  .methods({
    GET: async () => {
      const program = Effect.gen(function* () {
        const wordService = yield* WordService
        const todaysWord = yield* wordService.getTodaysWord()

        if (!todaysWord) {
          return {
            error: {
              code: 404,
              message: 'No word selected for today',
            },
          }
        }

        return {
          data: {
            word: todaysWord.word,
            date: todaysWord.selectedDate,
          },
        }
      }).pipe(
        Effect.catchAll((error) => {
          console.error('Get word-of-the-day error:', error)
          return Effect.succeed({
            error: {
              code: 500,
              message: "Failed to get today's word",
            },
          })
        })
      )

      const result = await Effect.runPromise(
        program.pipe(Effect.provide(WordServiceLive))
      )

      if ('error' in result && result.error) {
        return json(result, { status: result.error.code })
      }

      return json(result)
    },
  })
