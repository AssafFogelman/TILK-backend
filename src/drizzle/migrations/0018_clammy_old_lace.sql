ALTER TABLE "chat_read_status" RENAME TO "chat_read_date";--> statement-breakpoint
ALTER TABLE "chat_read_date" DROP CONSTRAINT "chat_read_status_chat_id_chats_chat_id_fk";
--> statement-breakpoint
ALTER TABLE "chat_read_date" DROP CONSTRAINT "chat_read_status_user_id_users_user_id_fk";
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "chat_read_date" ADD CONSTRAINT "chat_read_date_chat_id_chats_chat_id_fk" FOREIGN KEY ("chat_id") REFERENCES "chats"("chat_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "chat_read_date" ADD CONSTRAINT "chat_read_date_user_id_users_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
