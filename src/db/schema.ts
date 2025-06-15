import { sql } from 'drizzle-orm'
import {
  bigint,
  bigserial,
  check,
  foreignKey,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core'

export const obanJobState = pgEnum('oban_job_state', [
  'available',
  'scheduled',
  'executing',
  'retryable',
  'completed',
  'discarded',
  'cancelled',
])

export const schemaMigrations = pgTable('schema_migrations', {
  // You can use { mode: "bigint" } if numbers are exceeding js number limitations
  version: bigint({ mode: 'number' }).primaryKey().notNull(),
  insertedAt: timestamp('inserted_at', { mode: 'string' }),
})

export const obanPeers = pgTable('oban_peers', {
  name: text().primaryKey().notNull(),
  node: text().notNull(),
  startedAt: timestamp('started_at', { mode: 'string' }).notNull(),
  expiresAt: timestamp('expires_at', { mode: 'string' }).notNull(),
})

export const obanJobs = pgTable(
  'oban_jobs',
  {
    id: bigserial({ mode: 'bigint' }).primaryKey().notNull(),
    state: obanJobState().default('available').notNull(),
    queue: text().default('default').notNull(),
    worker: text().notNull(),
    args: jsonb().default({}).notNull(),
    errors: jsonb().array().default(sql`ARRAY[]::jsonb[]`).notNull(),
    attempt: integer().default(0).notNull(),
    maxAttempts: integer('max_attempts').default(20).notNull(),
    insertedAt: timestamp('inserted_at', { mode: 'string' })
      .default(sql`timezone('UTC'::text, now())`)
      .notNull(),
    scheduledAt: timestamp('scheduled_at', { mode: 'string' })
      .default(sql`timezone('UTC'::text, now())`)
      .notNull(),
    attemptedAt: timestamp('attempted_at', { mode: 'string' }),
    completedAt: timestamp('completed_at', { mode: 'string' }),
    attemptedBy: text('attempted_by').array(),
    discardedAt: timestamp('discarded_at', { mode: 'string' }),
    priority: integer().default(0).notNull(),
    tags: text().array().default(sql`ARRAY[]::text[]`),
    meta: jsonb().default({}),
    cancelledAt: timestamp('cancelled_at', { mode: 'string' }),
  },
  (table) => [
    index().using('gin', table.args.asc().nullsLast().op('jsonb_ops')),
    index().using('gin', table.meta.asc().nullsLast().op('jsonb_ops')),
    index().using(
      'btree',
      table.state.asc().nullsLast().op('int4_ops'),
      table.queue.asc().nullsLast().op('text_ops'),
      table.priority.asc().nullsLast().op('int4_ops'),
      table.scheduledAt.asc().nullsLast().op('text_ops'),
      table.id.asc().nullsLast().op('text_ops')
    ),
    check(
      'worker_length',
      sql`(char_length(worker) > 0) AND (char_length(worker) < 128)`
    ),
    check(
      'queue_length',
      sql`(char_length(queue) > 0) AND (char_length(queue) < 128)`
    ),
    check('positive_max_attempts', sql`max_attempts > 0`),
    check('attempt_range', sql`(attempt >= 0) AND (attempt <= max_attempts)`),
    check('non_negative_priority', sql`priority >= 0)) NOT VALID`),
  ]
)

export const channels = pgTable(
  'channels',
  {
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    channelId: bigint('channel_id', { mode: 'number' }).notNull(),
    insertedAt: timestamp('inserted_at', { mode: 'string' }).notNull(),
    updatedAt: timestamp('updated_at', { mode: 'string' }).notNull(),
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    guildId: bigint('guild_id', { mode: 'number' }).notNull(),
    id: uuid().defaultRandom().primaryKey().notNull(),
  },
  (table) => [
    index().using('btree', table.guildId.asc().nullsLast().op('int8_ops')),
    uniqueIndex('channels_unique_channel_id_index').using(
      'btree',
      table.channelId.asc().nullsLast().op('int8_ops')
    ),
    foreignKey({
      columns: [table.guildId],
      foreignColumns: [guilds.guildId],
      name: 'channels_guild_id_fkey',
    }).onDelete('cascade'),
  ]
)

export const users = pgTable(
  'users',
  {
    // Using { mode: "bigint" } because Discord user IDs can exceed JS number limitations
    userId: bigint('user_id', { mode: 'bigint' }).primaryKey().notNull(),
    insertedAt: timestamp('inserted_at', { mode: 'string' }).notNull(),
    updatedAt: timestamp('updated_at', { mode: 'string' }).notNull(),
    role: text().default('user'),
    lastVotedAt: timestamp('last_voted_at', { mode: 'string' }),
    // Using { mode: "bigint" } because credits can be large numbers
    messageCredits: bigint('message_credits', { mode: 'bigint' })
      .default(BigInt(30))
      .notNull(),
  },
  (table) => [
    index().using(
      'btree',
      table.lastVotedAt.asc().nullsLast().op('timestamp_ops')
    ),
    uniqueIndex('users_unique_user_id_index').using(
      'btree',
      table.userId.asc().nullsLast().op('int8_ops')
    ),
  ]
)

export const guilds = pgTable('guilds', {
  // Using { mode: "bigint" } because Discord guild IDs can exceed JS number limitations
  guildId: bigint('guild_id', { mode: 'bigint' }).notNull(),
  insertedAt: timestamp('inserted_at', { mode: 'string' }).notNull(),
  updatedAt: timestamp('updated_at', { mode: 'string' }).notNull(),
  id: uuid().defaultRandom().primaryKey().notNull(),
})

export const userGuilds = pgTable(
  'user_guilds',
  {
    // Using { mode: "bigint" } because Discord user IDs can exceed JS number limitations
    userId: bigint('user_id', { mode: 'bigint' }).notNull(),
    // Using { mode: "bigint" } because Discord guild IDs can exceed JS number limitations
    guildId: bigint('guild_id', { mode: 'bigint' }).notNull(),
    insertedAt: timestamp('inserted_at', { mode: 'string' }).notNull(),
    updatedAt: timestamp('updated_at', { mode: 'string' }).notNull(),
    intimacy: integer().default(0).notNull(),
    lastMessageAt: timestamp('last_message_at', { mode: 'string' }),
    lastFeed: timestamp('last_feed', { mode: 'string' }),
    // Using { mode: "bigint" } because message counts can be large numbers
    dailyMessageCount: bigint('daily_message_count', { mode: 'bigint' })
      .default(BigInt(0))
      .notNull(),
  },
  (table) => [
    index().using('btree', table.guildId.asc().nullsLast().op('int8_ops')),
    index().using(
      'btree',
      table.guildId.asc().nullsLast().op('int8_ops'),
      table.intimacy.asc().nullsLast().op('int8_ops')
    ),
    uniqueIndex('user_guilds_unique_user_guild_index').using(
      'btree',
      table.userId.asc().nullsLast().op('int8_ops'),
      table.guildId.asc().nullsLast().op('int8_ops')
    ),
    index().using('btree', table.userId.asc().nullsLast().op('int8_ops')),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [users.userId],
      name: 'user_guilds_user_id_fkey',
    }).onDelete('cascade'),
    foreignKey({
      columns: [table.guildId],
      foreignColumns: [guilds.guildId],
      name: 'user_guilds_guild_id_fkey',
    }).onDelete('cascade'),
    primaryKey({
      columns: [table.userId, table.guildId],
      name: 'user_guilds_pkey',
    }),
  ]
)
