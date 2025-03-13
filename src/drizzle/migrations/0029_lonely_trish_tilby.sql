ALTER TYPE "events_enum" ADD VALUE 'message';--> statement-breakpoint
ALTER TYPE "events_enum" ADD VALUE 'connection_request';--> statement-breakpoint
ALTER TYPE "events_enum" ADD VALUE 'connection_approval';--> statement-breakpoint
ALTER TYPE "events_enum" ADD VALUE 'looking_to_do_same_things';--> statement-breakpoint
ALTER TABLE "unread_events" ADD COLUMN "received_date" timestamp with time zone NOT NULL;