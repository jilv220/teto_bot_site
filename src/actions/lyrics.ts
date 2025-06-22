import { createServerFn } from '@tanstack/react-start'
import { Effect } from 'effect'
import z from 'zod/v4'
import type { Lyrics } from '../repositories/lyrics'
import { LyricsService, LyricsServiceLive } from '../services/lyrics'

// Zod schemas for validation
export const CreateLyricsSchema = z.object({
  artist: z.string().min(1, 'Artist is required'),
  title: z.string().min(1, 'Title is required'),
  lyrics: z.string().min(1, 'Lyrics content is required'),
})

export const UpdateLyricsSchema = z.object({
  lyrics: z.string().min(1, 'Lyrics content is required'),
})

export const GetLyricsParamsSchema = z.object({
  artist: z.string().min(1, 'Artist is required'),
  title: z.string().min(1, 'Title is required'),
})

export const GetLyricsByTitleParamsSchema = z.object({
  title: z.string().min(1, 'Title is required'),
})

export const DeleteLyricsParamsSchema = GetLyricsParamsSchema

/**
 * Effect-based actions
 */

export const getAllLyricsEffect = Effect.gen(function* () {
  const lyricsService = yield* LyricsService
  const allLyrics = yield* lyricsService.getAllLyrics()

  return {
    data: {
      lyrics: allLyrics,
    },
  }
}).pipe(
  Effect.catchAll(() =>
    Effect.succeed({ error: { code: 500, message: 'Failed to fetch lyrics' } })
  )
)

export const getLyricsEffect = (artist: string, title: string) =>
  Effect.gen(function* () {
    const lyricsService = yield* LyricsService
    const lyrics = yield* lyricsService.getLyrics(artist, title)

    if (!lyrics) {
      return {
        error: {
          code: 404,
          message: 'Lyrics not found',
        },
      }
    }

    return {
      data: {
        lyrics,
      },
    }
  }).pipe(
    Effect.catchAll(() =>
      Effect.succeed({
        error: { code: 500, message: 'Failed to fetch lyrics' },
      })
    )
  )

export const getLyricsByTitleEffect = (title: string) =>
  Effect.gen(function* () {
    const lyricsService = yield* LyricsService
    const lyrics = yield* lyricsService.getLyricsByTitle(title)

    return {
      data: {
        lyrics,
      },
    }
  }).pipe(
    Effect.catchAll(() =>
      Effect.succeed({
        error: { code: 500, message: 'Failed to fetch lyrics by title' },
      })
    )
  )

export const createLyricsEffect = (
  lyricsData: z.infer<typeof CreateLyricsSchema>
) =>
  Effect.gen(function* () {
    const lyricsService = yield* LyricsService
    const lyrics = yield* lyricsService.createLyrics(lyricsData)

    return {
      data: {
        lyrics,
      },
    }
  }).pipe(
    Effect.catchAll((error) => {
      if (error.message.includes('already exist')) {
        return Effect.succeed({
          error: {
            code: 409,
            message: 'Lyrics already exist for this artist and title',
          },
        })
      }

      return Effect.succeed({
        error: {
          code: 500,
          message: 'Failed to create lyrics',
        },
      })
    })
  )

export const updateLyricsEffect = (
  artist: string,
  title: string,
  updates: z.infer<typeof UpdateLyricsSchema>
) =>
  Effect.gen(function* () {
    const lyricsService = yield* LyricsService
    const updatedLyrics = yield* lyricsService.updateLyrics(
      artist,
      title,
      updates
    )

    return {
      data: {
        lyrics: updatedLyrics,
      },
    }
  }).pipe(
    Effect.catchAll((error) => {
      if (error.message.includes('not found')) {
        return Effect.succeed({
          error: {
            code: 404,
            message: 'Lyrics not found',
          },
        })
      }

      return Effect.succeed({
        error: { code: 500, message: 'Failed to update lyrics' },
      })
    })
  )

export const deleteLyricsEffect = (artist: string, title: string) =>
  Effect.gen(function* () {
    const lyricsService = yield* LyricsService
    yield* lyricsService.deleteLyrics(artist, title)

    return {
      data: {
        message: 'Lyrics deleted successfully',
      },
    }
  }).pipe(
    Effect.catchAll((error) => {
      if (error.message.includes('not found')) {
        return Effect.succeed({
          error: {
            code: 404,
            message: 'Lyrics not found',
          },
        })
      }

      return Effect.succeed({
        error: {
          code: 500,
          message: 'Failed to delete lyrics',
        },
      })
    })
  )

/**
 * Server Functions
 */

export const getAllLyrics = createServerFn().handler(async () => {
  return await Effect.runPromise(
    Effect.scoped(getAllLyricsEffect.pipe(Effect.provide(LyricsServiceLive())))
  )
})

export const getLyrics = createServerFn()
  .validator((data: unknown) => GetLyricsParamsSchema.parse(data))
  .handler(async ({ data: { artist, title } }) => {
    return await Effect.runPromise(
      Effect.scoped(
        getLyricsEffect(artist, title).pipe(Effect.provide(LyricsServiceLive()))
      )
    )
  })

export const getLyricsByTitle = createServerFn()
  .validator((data: unknown) => GetLyricsByTitleParamsSchema.parse(data))
  .handler(async ({ data: { title } }) => {
    return await Effect.runPromise(
      Effect.scoped(
        getLyricsByTitleEffect(title).pipe(Effect.provide(LyricsServiceLive()))
      )
    )
  })

export const createLyrics = createServerFn({ method: 'POST' })
  .validator((data: unknown) => CreateLyricsSchema.parse(data))
  .handler(async ({ data: lyricsData }) => {
    return await Effect.runPromise(
      Effect.scoped(
        createLyricsEffect(lyricsData).pipe(Effect.provide(LyricsServiceLive()))
      )
    )
  })

export const updateLyrics = createServerFn({ method: 'POST' })
  .validator((data: unknown) => {
    const parsed = z
      .object({
        artist: z.string().min(1, 'Artist is required'),
        title: z.string().min(1, 'Title is required'),
        ...UpdateLyricsSchema.shape,
      })
      .parse(data)
    return parsed
  })
  .handler(async ({ data: { artist, title, lyrics } }) => {
    return await Effect.runPromise(
      Effect.scoped(
        updateLyricsEffect(artist, title, { lyrics }).pipe(
          Effect.provide(LyricsServiceLive())
        )
      )
    )
  })

export const deleteLyrics = createServerFn({ method: 'POST' })
  .validator((data: unknown) => DeleteLyricsParamsSchema.parse(data))
  .handler(async ({ data: { artist, title } }) => {
    return await Effect.runPromise(
      Effect.scoped(
        deleteLyricsEffect(artist, title).pipe(
          Effect.provide(LyricsServiceLive())
        )
      )
    )
  })
