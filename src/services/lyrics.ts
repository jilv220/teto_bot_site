import { serverOnly } from '@tanstack/react-start'
import { Context, Effect, Layer } from 'effect'
import {
  type CreateLyricsInput,
  type Lyrics,
  LyricsRepository,
  type LyricsRepositoryError,
  LyricsRepositoryLive,
  type UpdateLyricsInput,
} from '../repositories/lyrics'
import { RedisServiceLive } from './redis'

export class LyricsServiceError extends Error {
  readonly _tag = 'LyricsServiceError'
  constructor(readonly message: string) {
    super(message)
  }
}

/**
 * Business logic layer for lyrics - uses repository for data access
 */
export class LyricsService extends Context.Tag('LyricsService')<
  LyricsService,
  {
    /**
     * Get lyrics by artist and title
     */
    getLyrics: (
      artist: string,
      title: string
    ) => Effect.Effect<
      Lyrics | null,
      LyricsServiceError | LyricsRepositoryError
    >

    /**
     * Get all lyrics by a specific title
     */
    getLyricsByTitle: (
      title: string
    ) => Effect.Effect<Lyrics[], LyricsServiceError | LyricsRepositoryError>

    /**
     * Get all lyrics
     */
    getAllLyrics: () => Effect.Effect<
      Lyrics[],
      LyricsServiceError | LyricsRepositoryError
    >

    /**
     * Create new lyrics
     */
    createLyrics: (
      lyricsData: CreateLyricsInput
    ) => Effect.Effect<Lyrics, LyricsServiceError | LyricsRepositoryError>

    /**
     * Update existing lyrics
     */
    updateLyrics: (
      artist: string,
      title: string,
      updates: UpdateLyricsInput
    ) => Effect.Effect<Lyrics, LyricsServiceError | LyricsRepositoryError>

    /**
     * Delete lyrics
     */
    deleteLyrics: (
      artist: string,
      title: string
    ) => Effect.Effect<void, LyricsServiceError | LyricsRepositoryError>
  }
>() {}

const make = Effect.gen(function* () {
  const lyricsRepo = yield* LyricsRepository

  return LyricsService.of({
    getLyrics: (artist: string, title: string) =>
      Effect.gen(function* () {
        if (!artist.trim() || !title.trim()) {
          return yield* Effect.fail(
            new LyricsServiceError('Artist and title cannot be empty')
          )
        }

        return yield* lyricsRepo.findByArtistAndTitle(
          artist.trim(),
          title.trim()
        )
      }),

    getLyricsByTitle: (title: string) =>
      Effect.gen(function* () {
        if (!title.trim()) {
          return yield* Effect.fail(
            new LyricsServiceError('Title cannot be empty')
          )
        }

        return yield* lyricsRepo.findByTitle(title.trim())
      }),

    getAllLyrics: () => lyricsRepo.findAll(),

    createLyrics: (lyricsData: CreateLyricsInput) =>
      Effect.gen(function* () {
        // Business logic validation
        if (!lyricsData.artist.trim() || !lyricsData.title.trim()) {
          return yield* Effect.fail(
            new LyricsServiceError('Artist and title cannot be empty')
          )
        }

        if (!lyricsData.lyrics.trim()) {
          return yield* Effect.fail(
            new LyricsServiceError('Lyrics content cannot be empty')
          )
        }

        // Normalize data
        const normalizedData: CreateLyricsInput = {
          artist: lyricsData.artist.trim(),
          title: lyricsData.title.trim(),
          lyrics: lyricsData.lyrics.trim(),
        }

        return yield* lyricsRepo.create(normalizedData)
      }),

    updateLyrics: (artist: string, title: string, updates: UpdateLyricsInput) =>
      Effect.gen(function* () {
        // Business logic validation
        if (!artist.trim() || !title.trim()) {
          return yield* Effect.fail(
            new LyricsServiceError('Artist and title cannot be empty')
          )
        }

        if (!updates.lyrics.trim()) {
          return yield* Effect.fail(
            new LyricsServiceError('Lyrics content cannot be empty')
          )
        }

        // Normalize data
        const normalizedUpdates: UpdateLyricsInput = {
          lyrics: updates.lyrics.trim(),
        }

        return yield* lyricsRepo.update(
          artist.trim(),
          title.trim(),
          normalizedUpdates
        )
      }),

    deleteLyrics: (artist: string, title: string) =>
      Effect.gen(function* () {
        if (!artist.trim() || !title.trim()) {
          return yield* Effect.fail(
            new LyricsServiceError('Artist and title cannot be empty')
          )
        }

        return yield* lyricsRepo.delete(artist.trim(), title.trim())
      }),
  })
})

export const LyricsServiceLive = serverOnly(() =>
  Layer.effect(LyricsService, make).pipe(
    Layer.provide(LyricsRepositoryLive()),
    Layer.provide(RedisServiceLive())
  )
)
