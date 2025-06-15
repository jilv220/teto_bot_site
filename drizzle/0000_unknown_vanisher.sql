-- Current sql file was generated after introspecting the database
-- If you want to run this migration please uncomment this code before executing migrations
/*
CREATE TYPE "public"."oban_job_state" AS ENUM('available', 'scheduled', 'executing', 'retryable', 'completed', 'discarded', 'cancelled');--> statement-breakpoint
CREATE TABLE "schema_migrations" (
	"version" bigint PRIMARY KEY NOT NULL,
	"inserted_at" timestamp(0)
);
--> statement-breakpoint
CREATE TABLE "oban_peers" (
	"name" text PRIMARY KEY NOT NULL,
	"node" text NOT NULL,
	"started_at" timestamp NOT NULL,
	"expires_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "oban_jobs" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"state" "oban_job_state" DEFAULT 'available' NOT NULL,
	"queue" text DEFAULT 'default' NOT NULL,
	"worker" text NOT NULL,
	"args" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"errors" jsonb[] NOT NULL,
	"attempt" integer DEFAULT 0 NOT NULL,
	"max_attempts" integer DEFAULT 20 NOT NULL,
	"inserted_at" timestamp DEFAULT timezone('UTC'::text, now()) NOT NULL,
	"scheduled_at" timestamp DEFAULT timezone('UTC'::text, now()) NOT NULL,
	"attempted_at" timestamp,
	"completed_at" timestamp,
	"attempted_by" text[],
	"discarded_at" timestamp,
	"priority" integer DEFAULT 0 NOT NULL,
	"tags" text[],
	"meta" jsonb DEFAULT '{}'::jsonb,
	"cancelled_at" timestamp,
	CONSTRAINT "worker_length" CHECK ((char_length(worker) > 0) AND (char_length(worker) < 128)),
	CONSTRAINT "queue_length" CHECK ((char_length(queue) > 0) AND (char_length(queue) < 128)),
	CONSTRAINT "positive_max_attempts" CHECK (max_attempts > 0),
	CONSTRAINT "attempt_range" CHECK ((attempt >= 0) AND (attempt <= max_attempts)),
	CONSTRAINT "non_negative_priority" CHECK (priority >= 0)) NOT VALID)
);
--> statement-breakpoint
CREATE TABLE "channels" (
	"channel_id" bigint NOT NULL,
	"inserted_at" timestamp(0) NOT NULL,
	"updated_at" timestamp(0) NOT NULL,
	"guild_id" bigint NOT NULL,
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"user_id" bigint PRIMARY KEY NOT NULL,
	"inserted_at" timestamp(0) NOT NULL,
	"updated_at" timestamp(0) NOT NULL,
	"role" text DEFAULT 'user',
	"last_voted_at" timestamp(0),
	"message_credits" bigint DEFAULT 30 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "guilds" (
	"guild_id" bigint NOT NULL,
	"inserted_at" timestamp(0) NOT NULL,
	"updated_at" timestamp(0) NOT NULL,
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_guilds" (
	"user_id" bigint NOT NULL,
	"guild_id" bigint NOT NULL,
	"inserted_at" timestamp(0) NOT NULL,
	"updated_at" timestamp(0) NOT NULL,
	"intimacy" integer DEFAULT 0 NOT NULL,
	"last_message_at" timestamp(0),
	"last_feed" timestamp(0),
	"daily_message_count" bigint DEFAULT 0 NOT NULL,
	CONSTRAINT "user_guilds_pkey" PRIMARY KEY("user_id","guild_id")
);
--> statement-breakpoint
ALTER TABLE "channels" ADD CONSTRAINT "channels_guild_id_fkey" FOREIGN KEY ("guild_id") REFERENCES "public"."guilds"("guild_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_guilds" ADD CONSTRAINT "user_guilds_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_guilds" ADD CONSTRAINT "user_guilds_guild_id_fkey" FOREIGN KEY ("guild_id") REFERENCES "public"."guilds"("guild_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "oban_jobs_args_index" ON "oban_jobs" USING gin ("args" jsonb_ops);--> statement-breakpoint
CREATE INDEX "oban_jobs_meta_index" ON "oban_jobs" USING gin ("meta" jsonb_ops);--> statement-breakpoint
CREATE INDEX "oban_jobs_state_queue_priority_scheduled_at_id_index" ON "oban_jobs" USING btree ("state" int4_ops,"queue" text_ops,"priority" int4_ops,"scheduled_at" text_ops,"id" text_ops);--> statement-breakpoint
CREATE INDEX "channels_guild_id_index" ON "channels" USING btree ("guild_id" int8_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "channels_unique_channel_id_index" ON "channels" USING btree ("channel_id" int8_ops);--> statement-breakpoint
CREATE INDEX "users_last_voted_at_index" ON "users" USING btree ("last_voted_at" timestamp_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "users_unique_user_id_index" ON "users" USING btree ("user_id" int8_ops);--> statement-breakpoint
CREATE INDEX "user_guilds_guild_id_index" ON "user_guilds" USING btree ("guild_id" int8_ops);--> statement-breakpoint
CREATE INDEX "user_guilds_guild_id_intimacy_index" ON "user_guilds" USING btree ("guild_id" int8_ops,"intimacy" int8_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "user_guilds_unique_user_guild_index" ON "user_guilds" USING btree ("user_id" int8_ops,"guild_id" int8_ops);--> statement-breakpoint
CREATE INDEX "user_guilds_user_id_index" ON "user_guilds" USING btree ("user_id" int8_ops);
*/