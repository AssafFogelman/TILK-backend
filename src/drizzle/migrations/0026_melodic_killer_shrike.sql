DROP INDEX IF EXISTS "undelivered_events_index";--> statement-breakpoint
ALTER TABLE "undelivered_events" ADD COLUMN "offset" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "undelivered_events_index" ON "undelivered_events" ("user_id","offset");