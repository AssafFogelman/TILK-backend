CREATE INDEX IF NOT EXISTS "chat_message_index2" ON "chat_messages" ("recipient_id","event_id");--> statement-breakpoint
ALTER TABLE "chats" DROP COLUMN IF EXISTS "unread";