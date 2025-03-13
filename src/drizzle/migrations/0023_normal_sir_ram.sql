DO $$ BEGIN
 CREATE TYPE "events_enum" AS ENUM('unread_message', 'unread_connection_request', 'unread_connection_approval', 'unread_looking_to_do_same_thing');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "tables_enum" AS ENUM('users', 'location_records', 'connections', 'connection_requests', 'blocks', 'chats', 'chat_messages', 'tags', 'tag_categories', 'notificationTemplates');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "error_log" (
	"error_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"date" timestamp with time zone DEFAULT now() NOT NULL,
	"user_id" uuid,
	"error" text NOT NULL,
	"info" text NOT NULL,
	CONSTRAINT "error_log_error_id_unique" UNIQUE("error_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "notification_templates" (
	"notification_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"notification_name" text NOT NULL,
	"content" text NOT NULL,
	CONSTRAINT "notification_templates_notification_id_unique" UNIQUE("notification_id"),
	CONSTRAINT "notification_templates_notification_name_unique" UNIQUE("notification_name")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "past_event_types" (
	"past_event_type_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"past_event_type_name" text NOT NULL,
	"table_affected" "tables_enum" NOT NULL,
	CONSTRAINT "past_event_types_past_event_type_id_unique" UNIQUE("past_event_type_id"),
	CONSTRAINT "past_event_types_past_event_type_name_unique" UNIQUE("past_event_type_name")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "past_events" (
	"event_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"event_date" timestamp with time zone DEFAULT now() NOT NULL,
	"past_event_type" uuid NOT NULL,
	"relevant_table_primary_key" uuid NOT NULL,
	"latitude" double precision,
	"longitude" double precision,
	CONSTRAINT "past_events_event_id_unique" UNIQUE("event_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "undelivered_events" (
	"user_id" uuid,
	"events_enum" "events_enum" NOT NULL,
	"chat_id" uuid,
	"message_id" uuid
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "unread_events" (
	"user_id" uuid,
	"events_enum" "events_enum" NOT NULL,
	"chat_id" uuid,
	"message_id" uuid
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "undelivered_events_index" ON "undelivered_events" ("user_id","events_enum","chat_id","message_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "unread_events_index" ON "unread_events" ("user_id","events_enum","chat_id","message_id");--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "past_events" ADD CONSTRAINT "past_events_user_id_users_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "past_events" ADD CONSTRAINT "past_events_past_event_type_past_event_types_past_event_type_id_fk" FOREIGN KEY ("past_event_type") REFERENCES "past_event_types"("past_event_type_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "undelivered_events" ADD CONSTRAINT "undelivered_events_user_id_users_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "undelivered_events" ADD CONSTRAINT "undelivered_events_chat_id_chats_chat_id_fk" FOREIGN KEY ("chat_id") REFERENCES "chats"("chat_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "undelivered_events" ADD CONSTRAINT "undelivered_events_message_id_chat_messages_message_id_fk" FOREIGN KEY ("message_id") REFERENCES "chat_messages"("message_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
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
