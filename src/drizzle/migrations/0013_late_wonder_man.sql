ALTER TABLE "chat_messages" DROP COLUMN IF EXISTS "message_type";--> statement-breakpoint
ALTER TABLE "chat_messages" DROP COLUMN IF EXISTS "image_url";--> statement-breakpoint
ALTER TABLE "chats" DROP COLUMN IF EXISTS "last_message_image_url";