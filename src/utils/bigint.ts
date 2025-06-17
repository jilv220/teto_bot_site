import { Data, Effect } from 'effect'

export class BigIntParseError extends Data.TaggedError('BigIntParseError')<{
  input: string
  message: string
}> {}

/**
 * Type utility that recursively converts BigInt fields to strings
 *
 * Example:
 * ```typescript
 * type User = {
 *   userId: bigint
 *   messageCredits: bigint
 *   role: string
 *   insertedAt: string
 * }
 *
 * type SerializedUser = SerializeBigInt<User>
 * // Results in:
 * // {
 * //   userId: string
 * //   messageCredits: string
 * //   role: string
 * //   insertedAt: string
 * // }
 * ```
 */
export type SerializeBigInt<T> = T extends bigint
  ? string
  : T extends (infer U)[]
    ? SerializeBigInt<U>[]
    : T extends object
      ? { [K in keyof T]: SerializeBigInt<T[K]> }
      : T

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

/**
 * Recursively converts BigInt values to strings in an object for JSON serialization
 * @param obj - The object to process
 * @returns The object with BigInt values converted to strings
 */
export const serializeBigInt = <T>(obj: T): SerializeBigInt<T> => {
  if (typeof obj === 'bigint') {
    return obj.toString() as SerializeBigInt<T>
  }

  if (Array.isArray(obj)) {
    return obj.map(serializeBigInt) as SerializeBigInt<T>
  }

  if (obj !== null && typeof obj === 'object') {
    const serialized = {} as Record<string, unknown>
    for (const [key, value] of Object.entries(obj)) {
      serialized[key] = serializeBigInt(value)
    }
    return serialized as SerializeBigInt<T>
  }

  return obj as SerializeBigInt<T>
}
