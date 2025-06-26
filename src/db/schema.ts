import {
  bigint,
  date,
  foreignKey,
  index,
  integer,
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

export const channels = pgTable(
  'channels',
  {
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    channelId: bigint('channel_id', { mode: 'bigint' }).notNull(),
    insertedAt: timestamp('inserted_at', { mode: 'string' }).notNull(),
    updatedAt: timestamp('updated_at', { mode: 'string' }).notNull(),
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    guildId: bigint('guild_id', { mode: 'bigint' }).notNull(),
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
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    userId: bigint('user_id', { mode: 'bigint' }).primaryKey().notNull(),
    insertedAt: timestamp('inserted_at', { mode: 'string' }).notNull(),
    updatedAt: timestamp('updated_at', { mode: 'string' }).notNull(),
    role: text().default('user'),
    lastVotedAt: timestamp('last_voted_at', { mode: 'string' }),
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    messageCredits: bigint('message_credits', { mode: 'bigint' })
      .default(30 as unknown as bigint)
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
  // You can use { mode: "bigint" } if numbers are exceeding js number limitations
  guildId: bigint('guild_id', { mode: 'bigint' }).notNull(),
  insertedAt: timestamp('inserted_at', { mode: 'string' }).notNull(),
  updatedAt: timestamp('updated_at', { mode: 'string' }).notNull(),
  id: uuid().defaultRandom().primaryKey().notNull(),
})

export const userGuilds = pgTable(
  'user_guilds',
  {
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    userId: bigint('user_id', { mode: 'bigint' }).notNull(),
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    guildId: bigint('guild_id', { mode: 'bigint' }).notNull(),
    insertedAt: timestamp('inserted_at', { mode: 'string' }).notNull(),
    updatedAt: timestamp('updated_at', { mode: 'string' }).notNull(),
    intimacy: integer().default(0).notNull(),
    lastMessageAt: timestamp('last_message_at', { mode: 'string' }),
    lastFeed: timestamp('last_feed', { mode: 'string' }),
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    dailyMessageCount: bigint('daily_message_count', { mode: 'bigint' })
      // Avoid use BigInt, drizzle errors out if you do that
      .default(0 as unknown as bigint)
      .notNull(),
  },
  (table) => [
    index('user_guilds_guild_daily_count_index').using(
      'btree',
      table.guildId.asc().nullsLast().op('int8_ops'),
      table.dailyMessageCount.asc().nullsLast().op('int8_ops')
    ),
    index().using('btree', table.guildId.asc().nullsLast().op('int8_ops')),
    index().using(
      'btree',
      table.guildId.asc().nullsLast().op('int8_ops'),
      table.intimacy.asc().nullsLast().op('int4_ops')
    ),
    index('user_guilds_guild_intimacy_index').using(
      'btree',
      table.guildId.asc().nullsLast().op('int4_ops'),
      table.intimacy.asc().nullsLast().op('int4_ops')
    ),
    uniqueIndex('user_guilds_unique_user_guild_index').using(
      'btree',
      table.userId.asc().nullsLast().op('int8_ops'),
      table.guildId.asc().nullsLast().op('int8_ops')
    ),
    index('user_guilds_user_guild_last_feed_index').using(
      'btree',
      table.userId.asc().nullsLast().op('timestamp_ops'),
      table.guildId.asc().nullsLast().op('timestamp_ops'),
      table.lastFeed.asc().nullsLast().op('timestamp_ops')
    ),
    index('user_guilds_user_guild_last_message_index').using(
      'btree',
      table.userId.asc().nullsLast().op('timestamp_ops'),
      table.guildId.asc().nullsLast().op('int8_ops'),
      table.lastMessageAt.asc().nullsLast().op('timestamp_ops')
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

export const dailyWords = pgTable(
  'daily_words',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    word: text().notNull(),
    selectedDate: date('selected_date').notNull(),
    insertedAt: timestamp('inserted_at', { mode: 'string' }).notNull(),
  },
  (table) => [
    uniqueIndex('daily_words_unique_date_index').using(
      'btree',
      table.selectedDate.asc().nullsLast()
    ),
    index().using('btree', table.selectedDate.asc().nullsLast()),
  ]
)
