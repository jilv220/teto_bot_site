import { Data, Effect } from 'effect'

export class JsonParseError extends Data.TaggedError('JsonParseError')<{
  message: unknown
}> {}

export const jsonParseSafe = (input: string) =>
  Effect.try({
    try: () => JSON.parse(input),
    catch: (error) =>
      new JsonParseError({
        message: `Failed to parse Json ${error}`,
      }),
  })
