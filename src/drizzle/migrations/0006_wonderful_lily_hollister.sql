DROP INDEX IF EXISTS "chat_message_index";--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "chat_message_index" ON "chat_messages" ("chat_id");