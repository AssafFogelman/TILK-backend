DROP INDEX IF EXISTS "chat_message_index";--> statement-breakpoint
ALTER TABLE "chats" ADD COLUMN "last_message_date" timestamp;--> statement-breakpoint
ALTER TABLE "chats" ADD COLUMN "last_message_sender" uuid;--> statement-breakpoint
ALTER TABLE "chats" ADD COLUMN "last_message_type" "message_type_enum";--> statement-breakpoint
ALTER TABLE "chats" ADD COLUMN "last_message_image_url" text;--> statement-breakpoint
ALTER TABLE "chats" ADD COLUMN "last_message_text" text;--> statement-breakpoint
ALTER TABLE "chats" ADD COLUMN "unread" boolean DEFAULT true NOT NULL;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "chat_message_index" ON "chat_messages" ("chat_id","sent_date","received_date");--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "chats" ADD CONSTRAINT "chats_last_message_sender_users_user_id_fk" FOREIGN KEY ("last_message_sender") REFERENCES "users"("user_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
