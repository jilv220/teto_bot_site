import { json } from '@tanstack/react-start'
import { Data, Effect } from 'effect'
import z from 'zod/v4'

export class JsonParseError extends Data.TaggedError('JsonParseError')<{
  message: unknown
}> {}

export type ServerErrorResponse = {
  error: {
    code: number
    message: unknown
    details: unknown
  }
}

export type ServerSuccessResponse = {
  data: {
    [key: string]: unknown
  }
}

export type ServerResponse = ServerSuccessResponse | ServerErrorResponse

export const jsonParseSafe = (input: string) =>
  Effect.try({
    try: () => JSON.parse(input),
    catch: (error) =>
      new JsonParseError({
        message: `Failed to parse Json ${error}`,
      }),
  })

export const buildValidationErrorResponse = (error: z.ZodError) => {
  const fieldErrors = z.flattenError(error).fieldErrors
  return json(
    {
      error: {
        code: 422,
        message: 'Validation failed',
        details: fieldErrors,
      },
    },
    { status: 422 }
  )
}

export const buildInvalidBodyErrorResponse = () => {
  return json(
    {
      error: {
        code: 400,
        message: 'Invalid JSON in request body',
      },
    },
    { status: 400 }
  )
}
