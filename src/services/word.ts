import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { Context, Effect, Layer } from 'effect'
import {
  type DailyWord,
  type NewDailyWord,
  WordRepository,
  type WordRepositoryError,
  WordRepositoryLive,
} from '../repositories/word'
import { DatabaseError, DatabaseLive } from './database'

export class WordServiceError extends DatabaseError {}

export class WordService extends Context.Tag('WordService')<
  WordService,
  {
    /**
     * Business logic: Get today's word
     */
    getTodaysWord: () => Effect.Effect<
      DailyWord | null,
      WordServiceError | WordRepositoryError
    >

    /**
     * Business logic: Select today's word, creating one if it doesn't exist
     */
    selectTodaysWord: () => Effect.Effect<
      DailyWord,
      WordServiceError | WordRepositoryError
    >

    /**
     * Simple delegations to repository
     */
    getWordByDate: (
      date: string
    ) => Effect.Effect<DailyWord | null, WordRepositoryError>
    getAllWords: () => Effect.Effect<DailyWord[], WordRepositoryError>
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
  const wordRepo = yield* WordRepository

  const getTodaysWord = Effect.gen(function* () {
    const today = new Date().toISOString().split('T')[0]
    return yield* wordRepo.findByDate(today)
  })

  return WordService.of({
    getTodaysWord: () => getTodaysWord,
    selectTodaysWord: () =>
      Effect.gen(function* () {
        // Check if today's word is already selected
        const existingWord = yield* getTodaysWord
        if (existingWord) {
          yield* Effect.logWarning(
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

        const newWordData: NewDailyWord = {
          word: selectedWord,
          selectedDate: today,
          insertedAt: now,
        }

        const newDailyWord = yield* wordRepo.create(newWordData)
        yield* Effect.logInfo(
          `Successfully selected daily word: ${newDailyWord.word}`
        )

        return newDailyWord
      }),

    getWordByDate: (date: string) => wordRepo.findByDate(date),
    getAllWords: () => wordRepo.findAll(),
  })
})

export const WordServiceLive = Layer.effect(WordService, make).pipe(
  Layer.provide(WordRepositoryLive),
  Layer.provide(DatabaseLive)
)
