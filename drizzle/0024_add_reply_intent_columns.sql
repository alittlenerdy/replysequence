-- Add reply intent classification columns to drafts table
ALTER TABLE "drafts" ADD COLUMN "reply_intent" varchar(30);
ALTER TABLE "drafts" ADD COLUMN "reply_intent_confidence" numeric(5, 4);
ALTER TABLE "drafts" ADD COLUMN "reply_intent_summary" text;
