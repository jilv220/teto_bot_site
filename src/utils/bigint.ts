import { Data, Effect } from 'effect'

export class BigIntParseError extends Data.TaggedError('BigIntParseError')<{
  input: string
  message: string
}> {}

/**
 * Safely converts a string to BigInt with validation
 * @param input - The string to convert to BigInt
 * @returns Effect that succeeds with BigInt or fails with BigIntParseError
 */
export const bigIntParseSafe = (input: string) =>
  Effect.try({
    try: () => {
      const result = BigInt(input)
      if (result <= 0n) {
        throw new Error('BigInt must be positive')
      }
      return result
    },
    catch: (error) =>
      new BigIntParseError({
        input,
        message: `Failed to parse BigInt from "${input}": ${error}`,
      }),
  })

/**
 * Safely converts a string to BigInt without validation (allows zero and negative)
 * @param input - The string to convert to BigInt
 * @returns Effect that succeeds with BigInt or fails with BigIntParseError
 */
export const bigIntParseUnsafe = (input: string) =>
  Effect.try({
    try: () => BigInt(input),
    catch: (error) =>
      new BigIntParseError({
        input,
        message: `Failed to parse BigInt from "${input}": ${error}`,
      }),
  })
