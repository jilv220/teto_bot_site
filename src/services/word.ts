import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { eq } from 'drizzle-orm'
import { Context, Data, Effect, Layer } from 'effect'
import { dailyWords } from '../db'
import { Database, DatabaseError, DatabaseLive } from './database'

export class WordServiceError extends DatabaseError {}

export interface DailyWord {
  id: string
  word: string
  selectedDate: string
  insertedAt: string
}

export class WordService extends Context.Tag('WordService')<
  WordService,
  {
    getTodaysWord: () => Effect.Effect<DailyWord | null, WordServiceError>
    selectTodaysWord: () => Effect.Effect<DailyWord, WordServiceError>
  }
>() {}

const loadWordsFromFile = Effect.gen(function* () {
  const wordsPath = join(process.cwd(), 'src/data/words.json')
  const wordsFile = yield* Effect.tryPromise({
    try: () => readFile(wordsPath, 'utf-8'),
    catch: (error) =>
      new WordServiceError({
        message: `Failed to load words file: ${error}`,
      }),
  })

  const words = yield* Effect.try({
    try: () => JSON.parse(wordsFile) as string[],
    catch: (error) =>
      new WordServiceError({
        message: `Failed to parse words file: ${error}`,
      }),
  })

  return words
})

const make = Effect.gen(function* () {
  const db = yield* Database

  const getTodaysWord = Effect.gen(function* () {
    const today = new Date().toISOString().split('T')[0]

    const result = yield* Effect.tryPromise({
      try: () =>
        db
          .select()
          .from(dailyWords)
          .where(eq(dailyWords.selectedDate, today))
          .limit(1),
      catch: (error) =>
        new WordServiceError({
          message: `Failed to get today's word: ${error}`,
        }),
    })

    return result[0] || null
  })

  const selectTodaysWord = Effect.gen(function* () {
    // Check if today's word is already selected
    const existingWord = yield* getTodaysWord
    if (existingWord) {
      yield* Effect.logInfo(
        `Today's word already selected: ${existingWord.word}`
      )
      return existingWord
    }

    // Load word pool and select a random word
    const wordPool = yield* loadWordsFromFile
    const randomIndex = Math.floor(Math.random() * wordPool.length)
    const selectedWord = wordPool[randomIndex]

    yield* Effect.logInfo(`Selecting new daily word: ${selectedWord}`)

    // Save to database
    const today = new Date().toISOString().split('T')[0]
    const now = new Date().toISOString()

    const insertResult = yield* Effect.tryPromise({
      try: () =>
        db
          .insert(dailyWords)
          .values({
            word: selectedWord,
            selectedDate: today,
            insertedAt: now,
          })
          .returning(),
      catch: (error) =>
        new WordServiceError({
          message: `Failed to save daily word: ${error}`,
        }),
    })

    const newDailyWord = insertResult[0]
    yield* Effect.logInfo(
      `Successfully selected daily word: ${newDailyWord.word}`
    )

    return newDailyWord
  })

  return WordService.of({
    getTodaysWord: () => getTodaysWord,
    selectTodaysWord: () => selectTodaysWord,
  })
})

export const WordServiceLive = Layer.effect(WordService, make).pipe(
  Layer.provide(DatabaseLive)
)
