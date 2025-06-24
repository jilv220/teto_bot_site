import { serverOnly } from '@tanstack/react-start'
import { Context, Effect, Layer } from 'effect'
import { RedisService } from '../services/redis'

export interface Lyrics {
  artist: string
  title: string
  lyrics: string
  createdAt: string
  updatedAt: string
}

export type CreateLyricsInput = Omit<Lyrics, 'createdAt' | 'updatedAt'>
export type UpdateLyricsInput = Pick<Lyrics, 'lyrics'>

export class LyricsRepositoryError extends Error {
  readonly _tag = 'LyricsRepositoryError'
  constructor(readonly message: string) {
    super(message)
  }
}

export class LyricsRepository extends Context.Tag('LyricsRepository')<
  LyricsRepository,
  {
    findByArtistAndTitle: (
      artist: string,
      title: string
    ) => Effect.Effect<Lyrics | null, LyricsRepositoryError>
    findByTitle: (
      title: string
    ) => Effect.Effect<Lyrics[], LyricsRepositoryError>
    findAll: () => Effect.Effect<Lyrics[], LyricsRepositoryError>
    create: (
      lyricsData: CreateLyricsInput
    ) => Effect.Effect<Lyrics, LyricsRepositoryError>
    update: (
      artist: string,
      title: string,
      updates: UpdateLyricsInput
    ) => Effect.Effect<Lyrics, LyricsRepositoryError>
    delete: (
      artist: string,
      title: string
    ) => Effect.Effect<void, LyricsRepositoryError>
  }
>() {}

const make = Effect.gen(function* () {
  const redisService = yield* RedisService

  const getLyricsKey = (artist: string, title: string): string => {
    const toSnakeCase = (str: string): string =>
      str
        .toLowerCase()
        .replace(/\s+/g, '_')
        .replace(/[^a-z0-9_]/g, '')

    return `lyrics:${toSnakeCase(title)}:${toSnakeCase(artist)}`
  }

  const getSearchPattern = (title?: string): string => {
    const toSnakeCase = (str: string): string =>
      str
        .toLowerCase()
        .replace(/\s+/g, '_')
        .replace(/[^a-z0-9_]/g, '')

    return title ? `lyrics:${toSnakeCase(title)}:*` : 'lyrics:*'
  }

  return LyricsRepository.of({
    findByArtistAndTitle: (artist: string, title: string) =>
      Effect.gen(function* () {
        const key = getLyricsKey(artist, title)

        const lyricsJson = yield* Effect.catchAll(
          redisService.get(key),
          (error) =>
            Effect.fail(
              new LyricsRepositoryError(
                `Failed to find lyrics for ${artist} - ${title}: ${error}`
              )
            )
        )

        if (!lyricsJson) return null

        try {
          const lyrics = JSON.parse(lyricsJson) as Lyrics
          return lyrics
        } catch (error) {
          return yield* Effect.fail(
            new LyricsRepositoryError(
              `Failed to parse lyrics JSON for ${artist} - ${title}: ${error}`
            )
          )
        }
      }),

    findByTitle: (title: string) =>
      Effect.gen(function* () {
        const pattern = getSearchPattern(title)

        const keys = yield* Effect.catchAll(
          redisService.keys(pattern),
          (error) =>
            Effect.fail(
              new LyricsRepositoryError(
                `Failed to find lyrics keys for title ${title}: ${error}`
              )
            )
        )

        if (!Array.isArray(keys) || keys.length === 0) return []

        const lyricsJsonArray = yield* Effect.catchAll(
          redisService.mget(...keys),
          (error) =>
            Effect.fail(
              new LyricsRepositoryError(
                `Failed to get lyrics for title ${title}: ${error}`
              )
            )
        )

        const lyricsArray: Lyrics[] = []
        if (Array.isArray(lyricsJsonArray)) {
          for (const lyricsJson of lyricsJsonArray) {
            if (lyricsJson) {
              try {
                const lyrics = JSON.parse(lyricsJson) as Lyrics
                lyricsArray.push(lyrics)
              } catch (error) {
                // Skip invalid JSON entries but don't fail the entire operation
                console.warn(`Failed to parse lyrics JSON: ${error}`)
              }
            }
          }
        }

        return lyricsArray
      }),

    findAll: () =>
      Effect.gen(function* () {
        const pattern = getSearchPattern()

        const keys = yield* Effect.catchAll(
          redisService.keys(pattern),
          (error) =>
            Effect.fail(
              new LyricsRepositoryError(
                `Failed to find all lyrics keys: ${error}`
              )
            )
        )

        if (!Array.isArray(keys) || keys.length === 0) return []

        const lyricsJsonArray = yield* Effect.catchAll(
          redisService.mget(...keys),
          (error) =>
            Effect.fail(
              new LyricsRepositoryError(`Failed to get all lyrics: ${error}`)
            )
        )

        const lyricsArray: Lyrics[] = []
        if (Array.isArray(lyricsJsonArray)) {
          for (const lyricsJson of lyricsJsonArray) {
            if (lyricsJson) {
              try {
                const lyrics = JSON.parse(lyricsJson) as Lyrics
                lyricsArray.push(lyrics)
              } catch (error) {
                // Skip invalid JSON entries but don't fail the entire operation
                console.warn(`Failed to parse lyrics JSON: ${error}`)
              }
            }
          }
        }

        return lyricsArray
      }),

    create: (lyricsData: CreateLyricsInput) =>
      Effect.gen(function* () {
        const key = getLyricsKey(lyricsData.artist, lyricsData.title)

        // Check if lyrics already exist
        const existing = yield* Effect.catchAll(
          redisService.exists(key),
          (error) =>
            Effect.fail(
              new LyricsRepositoryError(
                `Failed to check if lyrics exist for ${lyricsData.artist} - ${lyricsData.title}: ${error}`
              )
            )
        )

        if (existing > 0) {
          return yield* Effect.fail(
            new LyricsRepositoryError(
              `Lyrics for ${lyricsData.artist} - ${lyricsData.title} already exist`
            )
          )
        }

        const now = new Date().toISOString()
        const lyrics: Lyrics = {
          ...lyricsData,
          createdAt: now,
          updatedAt: now,
        }

        yield* Effect.catchAll(
          redisService.set(key, JSON.stringify(lyrics)),
          (error) =>
            Effect.fail(
              new LyricsRepositoryError(
                `Failed to create lyrics for ${lyricsData.artist} - ${lyricsData.title}: ${error}`
              )
            )
        )

        return lyrics
      }),

    update: (artist: string, title: string, updates: UpdateLyricsInput) =>
      Effect.gen(function* () {
        const key = getLyricsKey(artist, title)

        const existingJson = yield* Effect.catchAll(
          redisService.get(key),
          (error) =>
            Effect.fail(
              new LyricsRepositoryError(
                `Failed to find lyrics for ${artist} - ${title}: ${error}`
              )
            )
        )

        if (!existingJson) {
          return yield* Effect.fail(
            new LyricsRepositoryError(
              `Lyrics for ${artist} - ${title} not found`
            )
          )
        }

        let existingLyrics: Lyrics
        try {
          existingLyrics = JSON.parse(existingJson) as Lyrics
        } catch (error) {
          return yield* Effect.fail(
            new LyricsRepositoryError(
              `Failed to parse existing lyrics JSON for ${artist} - ${title}: ${error}`
            )
          )
        }

        const updatedLyrics: Lyrics = {
          ...existingLyrics,
          ...updates,
          updatedAt: new Date().toISOString(),
        }

        yield* Effect.catchAll(
          redisService.set(key, JSON.stringify(updatedLyrics)),
          (error) =>
            Effect.fail(
              new LyricsRepositoryError(
                `Failed to update lyrics for ${artist} - ${title}: ${error}`
              )
            )
        )

        return updatedLyrics
      }),

    delete: (artist: string, title: string) =>
      Effect.gen(function* () {
        const key = getLyricsKey(artist, title)

        const deleted = yield* Effect.catchAll(redisService.del(key), (error) =>
          Effect.fail(
            new LyricsRepositoryError(
              `Failed to delete lyrics for ${artist} - ${title}: ${error}`
            )
          )
        )

        if (deleted === 0) {
          return yield* Effect.fail(
            new LyricsRepositoryError(
              `Lyrics for ${artist} - ${title} not found`
            )
          )
        }
      }),
  })
})

export const LyricsRepositoryLive = serverOnly(() =>
  Layer.effect(LyricsRepository, make)
)
