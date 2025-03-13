ALTER TABLE "undelivered_events" RENAME COLUMN "user_id" TO "recipient_id";--> statement-breakpoint
ALTER TABLE "undelivered_events" RENAME COLUMN "other_user_id" TO "sender_id";--> statement-breakpoint
ALTER TABLE "undelivered_events" DROP CONSTRAINT "undelivered_events_user_id_users_user_id_fk";
--> statement-breakpoint
ALTER TABLE "undelivered_events" DROP CONSTRAINT "undelivered_events_other_user_id_users_user_id_fk";
--> statement-breakpoint
DROP INDEX IF EXISTS "undelivered_events_index";--> statement-breakpoint
ALTER TABLE "undelivered_events" ALTER COLUMN "offset" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "undelivered_events" ALTER COLUMN "sender_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "chat_messages" ADD COLUMN "recipient_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "chat_messages" ADD COLUMN "event_id" text NOT NULL;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "undelivered_events_index" ON "undelivered_events" ("recipient_id","offset");--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_recipient_id_users_user_id_fk" FOREIGN KEY ("recipient_id") REFERENCES "users"("user_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "undelivered_events" ADD CONSTRAINT "undelivered_events_recipient_id_users_user_id_fk" FOREIGN KEY ("recipient_id") REFERENCES "users"("user_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "undelivered_events" ADD CONSTRAINT "undelivered_events_sender_id_users_user_id_fk" FOREIGN KEY ("sender_id") REFERENCES "users"("user_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TABLE "chat_messages" DROP COLUMN IF EXISTS "got_to_server";