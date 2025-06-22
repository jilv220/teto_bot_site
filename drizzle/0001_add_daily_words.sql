CREATE TABLE IF NOT EXISTS "daily_words" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"word" text NOT NULL,
	"selected_date" date NOT NULL,
	"inserted_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "daily_words_unique_date_index" ON "daily_words" USING btree ("selected_date");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "daily_words_selected_date_index" ON "daily_words" USING btree ("selected_date"); 