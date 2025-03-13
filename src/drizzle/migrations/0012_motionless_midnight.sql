ALTER TABLE "chats" ALTER COLUMN "unread" SET DEFAULT false;--> statement-breakpoint
ALTER TABLE "chats" ADD COLUMN "unread_count" integer DEFAULT 0 NOT NULL;