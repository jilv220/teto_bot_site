import { DrizzleQueryError } from 'drizzle-orm/errors'
import type PG from 'pg'

export const isUniqueConstraintError = (error: unknown): boolean => {
  /** https://github.com/porsager/postgres/pull/901 */
  // eslint-disable-next-line import/no-named-as-default-member
  if (!(error instanceof DrizzleQueryError)) {
    return false
  }

  const cause = error.cause
  if (!cause || typeof cause !== 'object') {
    return false
  }

  return 'code' in cause && (cause as PG.DatabaseError).code === '23505'
}
