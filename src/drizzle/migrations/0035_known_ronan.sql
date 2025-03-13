ALTER TABLE "chats" RENAME COLUMN "read_by_participant1" TO "read_by_p1";--> statement-breakpoint
ALTER TABLE "chats" RENAME COLUMN "read_by_participant2" TO "read_by_p2";--> statement-breakpoint
ALTER TABLE "chats" RENAME COLUMN "unread_count" TO "unread_count_p1";--> statement-breakpoint
ALTER TABLE "chats" RENAME COLUMN "last_read_message_id" TO "last_read_message_p1";--> statement-breakpoint
ALTER TABLE "chats" ADD COLUMN "unread_count_p2" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "chats" ADD COLUMN "last_read_message_p2" uuid;