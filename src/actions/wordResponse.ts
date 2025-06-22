import { Effect } from 'effect'
import { z } from 'zod/v4'
import { WordResponseService } from '../services/wordResponse'

// Schemas
export const UpdateWordResponseSchema = z.object({
  response: z.string().min(1, 'Response cannot be empty'),
})

export type UpdateWordResponseInput = z.infer<typeof UpdateWordResponseSchema>

// Effects
export const getWordResponseEffect = Effect.gen(function* () {
  const wordResponseService = yield* WordResponseService
  const wordResponse = yield* wordResponseService.getWordResponse()

  if (!wordResponse) {
    return {
      error: {
        code: 404,
        message: 'No word response found',
      },
    }
  }

  return {
    data: wordResponse,
  }
}).pipe(
  Effect.catchAll((error) => {
    console.error('Get word response error:', error)
    return Effect.succeed({
      error: {
        code: 500,
        message: 'Failed to get word response',
      },
    })
  })
)

export const updateWordResponseEffect = (input: UpdateWordResponseInput) =>
  Effect.gen(function* () {
    const wordResponseService = yield* WordResponseService
    const updatedResponse = yield* wordResponseService.updateWordResponse(
      input.response
    )

    return {
      data: updatedResponse,
    }
  }).pipe(
    Effect.catchAll((error) => {
      console.error('Update word response error:', error)
      return Effect.succeed({
        error: {
          code: 500,
          message: 'Failed to update word response',
        },
      })
    })
  )

export const deleteWordResponseEffect = Effect.gen(function* () {
  const wordResponseService = yield* WordResponseService
  yield* wordResponseService.deleteWordResponse()

  return {
    data: {
      message: 'Word response deleted successfully',
    },
  }
}).pipe(
  Effect.catchAll((error) => {
    console.error('Delete word response error:', error)
    return Effect.succeed({
      error: {
        code: 500,
        message: 'Failed to delete word response',
      },
    })
  })
)
