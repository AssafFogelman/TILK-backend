CREATE TABLE IF NOT EXISTS "chat_read_status" (
	"chat_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"last_read_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "chat_read_status_chat_id_user_id_pk" PRIMARY KEY("chat_id","user_id")
);
--> statement-breakpoint
ALTER TABLE "blocks" ALTER COLUMN "block_date" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "chat_messages" ALTER COLUMN "sent_date" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "chat_messages" ALTER COLUMN "received_date" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "chats" ALTER COLUMN "last_message_date" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "connection_requests" ALTER COLUMN "request_date" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "connections" ALTER COLUMN "connection_date" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "error_log" ALTER COLUMN "date" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "events" ALTER COLUMN "event_date" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "created" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "location_date" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "chats" ADD COLUMN "read_by_participant1" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "chats" ADD COLUMN "read_by_participant2" boolean DEFAULT false NOT NULL;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "chat_read_status" ADD CONSTRAINT "chat_read_status_chat_id_chats_chat_id_fk" FOREIGN KEY ("chat_id") REFERENCES "chats"("chat_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "chat_read_status" ADD CONSTRAINT "chat_read_status_user_id_users_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
