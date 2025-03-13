ALTER TABLE "undelivered_events" ALTER COLUMN "user_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "undelivered_events" ADD COLUMN "other_user_id" uuid NOT NULL;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "undelivered_events" ADD CONSTRAINT "undelivered_events_other_user_id_users_user_id_fk" FOREIGN KEY ("other_user_id") REFERENCES "users"("user_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
