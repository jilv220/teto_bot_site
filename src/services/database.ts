import { type NodePgDatabase, drizzle } from 'drizzle-orm/node-postgres'
import { Context, Data, Effect, Layer } from 'effect'
import { Pool } from 'pg'
import { appConfig } from './config'

import { serverOnly } from '@tanstack/react-start'
import * as schema from '../db/schema'

export class DatabaseError extends Data.TaggedError('DatabaseError')<{
  message: unknown
  type?: 'UniqueConstraint'
}> {}

export class Database extends Context.Tag('Database')<
  Database,
  NodePgDatabase<typeof schema> & {
    $client: Pool
  }
>() {}

const make = () =>
  Effect.gen(function* () {
    const config = yield* appConfig

    const pool = new Pool({
      connectionString: config.databaseUrl,
    })

    return drizzle({ client: pool, schema })
  })

export const DatabaseLive = serverOnly(() => Layer.effect(Database, make()))
