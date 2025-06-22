import { Context, Effect, Layer } from 'effect'
import { DatabaseError } from '../services/database'
import { RedisService, RedisServiceLive } from '../services/redis'

export class WordResponseRepositoryError extends DatabaseError {}

export interface WordResponse {
  response: string
  updatedAt: string
}

const WORD_RESPONSE_KEY = 'llm_word_response'

export class WordResponseRepository extends Context.Tag(
  'WordResponseRepository'
)<
  WordResponseRepository,
  {
    get: () => Effect.Effect<WordResponse | null, WordResponseRepositoryError>
    set: (
      response: string
    ) => Effect.Effect<WordResponse, WordResponseRepositoryError>
    delete: () => Effect.Effect<void, WordResponseRepositoryError>
  }
>() {}

const make = Effect.gen(function* () {
  const redis = yield* RedisService

  return WordResponseRepository.of({
    get: () =>
      Effect.gen(function* () {
        const result = yield* redis.get(WORD_RESPONSE_KEY).pipe(
          Effect.catchAll((error) =>
            Effect.fail(
              new WordResponseRepositoryError({
                message: `Failed to get word response: ${error}`,
              })
            )
          )
        )

        if (!result) return null

        const parsed = yield* Effect.try({
          try: () => JSON.parse(result) as WordResponse,
          catch: (error) =>
            new WordResponseRepositoryError({
              message: `Failed to parse word response: ${error}`,
            }),
        })

        return parsed
      }),

    set: (response: string) =>
      Effect.gen(function* () {
        const now = new Date().toISOString()
        const wordResponse: WordResponse = {
          response,
          updatedAt: now,
        }

        yield* redis.set(WORD_RESPONSE_KEY, JSON.stringify(wordResponse)).pipe(
          Effect.catchAll((error) =>
            Effect.fail(
              new WordResponseRepositoryError({
                message: `Failed to set word response: ${error}`,
              })
            )
          )
        )

        return wordResponse
      }),

    delete: () =>
      Effect.gen(function* () {
        yield* redis.del(WORD_RESPONSE_KEY).pipe(
          Effect.catchAll((error) =>
            Effect.fail(
              new WordResponseRepositoryError({
                message: `Failed to delete word response: ${error}`,
              })
            )
          )
        )
      }),
  })
})

export const WordResponseRepositoryLive = Layer.effect(
  WordResponseRepository,
  make
).pipe(Layer.provide(RedisServiceLive))
