ALTER TABLE "chat_messages" ADD COLUMN "image_url" text;--> statement-breakpoint
ALTER TABLE "chats" DROP COLUMN IF EXISTS "last_message_type";