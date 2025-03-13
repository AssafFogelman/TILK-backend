ALTER TABLE "unread_events" ADD COLUMN "id" uuid DEFAULT gen_random_uuid() NOT NULL;--> statement-breakpoint
ALTER TABLE "unread_events" ADD CONSTRAINT "unread_events_id_unique" UNIQUE("id");