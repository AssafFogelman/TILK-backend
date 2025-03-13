DROP TABLE "undelivered_events";--> statement-breakpoint
ALTER TABLE "chat_messages" ALTER COLUMN "got_to_server" SET DEFAULT 0;--> statement-breakpoint
ALTER TABLE "chat_messages" ALTER COLUMN "got_to_server" SET NOT NULL;