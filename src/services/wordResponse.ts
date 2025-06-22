import { Context, Effect, Layer } from 'effect'
import {
  type WordResponse,
  WordResponseRepository,
  type WordResponseRepositoryError,
  WordResponseRepositoryLive,
} from '../repositories/wordResponse'
import { DatabaseError, DatabaseLive } from './database'

export class WordResponseServiceError extends DatabaseError {}

export class WordResponseService extends Context.Tag('WordResponseService')<
  WordResponseService,
  {
    /**
     * Business logic: Get the current LLM word response
     */
    getWordResponse: () => Effect.Effect<
      WordResponse | null,
      WordResponseServiceError | WordResponseRepositoryError
    >

    /**
     * Business logic: Update the LLM word response
     */
    updateWordResponse: (
      response: string
    ) => Effect.Effect<
      WordResponse,
      WordResponseServiceError | WordResponseRepositoryError
    >

    /**
     * Simple delegations to repository
     */
    deleteWordResponse: () => Effect.Effect<void, WordResponseRepositoryError>
  }
>() {}

const make = Effect.gen(function* () {
  const wordResponseRepo = yield* WordResponseRepository

  return WordResponseService.of({
    getWordResponse: () => wordResponseRepo.get(),

    updateWordResponse: (response: string) =>
      Effect.gen(function* () {
        if (!response.trim()) {
          return yield* Effect.fail(
            new WordResponseServiceError({
              message: 'Response cannot be empty',
            })
          )
        }

        const updatedResponse = yield* wordResponseRepo.set(response.trim())
        yield* Effect.logInfo(
          `Updated LLM word response at ${updatedResponse.updatedAt}`
        )

        return updatedResponse
      }),

    deleteWordResponse: () => wordResponseRepo.delete(),
  })
})

export const WordResponseServiceLive = Layer.effect(
  WordResponseService,
  make
).pipe(Layer.provide(WordResponseRepositoryLive), Layer.provide(DatabaseLive))
