import { eq } from 'drizzle-orm'
import { Context, Effect, Layer } from 'effect'
import { dailyWords } from '../db'
import { Database, DatabaseError, DatabaseLive } from '../services/database'

export class WordRepositoryError extends DatabaseError {}

export interface DailyWord {
  id: string
  word: string
  selectedDate: string
  insertedAt: string
}

export interface NewDailyWord {
  word: string
  selectedDate: string
  insertedAt: string
}

export class WordRepository extends Context.Tag('WordRepository')<
  WordRepository,
  {
    findByDate: (
      date: string
    ) => Effect.Effect<DailyWord | null, WordRepositoryError>
    create: (
      wordData: NewDailyWord
    ) => Effect.Effect<DailyWord, WordRepositoryError>
    findAll: () => Effect.Effect<DailyWord[], WordRepositoryError>
  }
>() {}

const make = Effect.gen(function* () {
  const db = yield* Database

  return WordRepository.of({
    findByDate: (date: string) =>
      Effect.gen(function* () {
        const result = yield* Effect.tryPromise({
          try: () =>
            db
              .select()
              .from(dailyWords)
              .where(eq(dailyWords.selectedDate, date))
              .limit(1),
          catch: (error) =>
            new WordRepositoryError({
              message: `Failed to find word by date ${date}: ${error}`,
            }),
        })

        return result[0] || null
      }),

    create: (wordData: NewDailyWord) =>
      Effect.gen(function* () {
        const result = yield* Effect.tryPromise({
          try: () => db.insert(dailyWords).values(wordData).returning(),
          catch: (error) =>
            new WordRepositoryError({
              message: `Failed to create daily word: ${error}`,
            }),
        })

        return result[0]
      }),

    findAll: () =>
      Effect.gen(function* () {
        const result = yield* Effect.tryPromise({
          try: () => db.select().from(dailyWords),
          catch: (error) =>
            new WordRepositoryError({
              message: `Failed to find all daily words: ${error}`,
            }),
        })

        return result
      }),
  })
})

export const WordRepositoryLive = Layer.effect(WordRepository, make).pipe(
  Layer.provide(DatabaseLive())
)
