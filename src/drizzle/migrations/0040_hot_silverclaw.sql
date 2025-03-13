CREATE TABLE IF NOT EXISTS "unread_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"events_enum" "events_enum" NOT NULL,
	"chat_id" uuid,
	"message_id" uuid,
	"received_date" timestamp with time zone NOT NULL,
	CONSTRAINT "unread_events_id_unique" UNIQUE("id")
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "unread_events_index" ON "unread_events" ("user_id","events_enum","chat_id","message_id");--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "unread_events" ADD CONSTRAINT "unread_events_user_id_users_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "unread_events" ADD CONSTRAINT "unread_events_chat_id_chats_chat_id_fk" FOREIGN KEY ("chat_id") REFERENCES "chats"("chat_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "unread_events" ADD CONSTRAINT "unread_events_message_id_chat_messages_message_id_fk" FOREIGN KEY ("message_id") REFERENCES "chat_messages"("message_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
