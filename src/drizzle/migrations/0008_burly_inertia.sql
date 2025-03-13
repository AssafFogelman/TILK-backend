ALTER TABLE "chat_messages" RENAME COLUMN "date" TO "sent_date";--> statement-breakpoint
ALTER TABLE "chat_messages" ALTER COLUMN "sent_date" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "chat_messages" ADD COLUMN "received_date" timestamp;