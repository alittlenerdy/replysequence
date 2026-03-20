-- Add detected language to meetings (ISO 639-1 code from transcript)
ALTER TABLE "meetings" ADD COLUMN "detected_language" varchar(10);

-- Add response language preference to users (ISO 639-1 code, null = auto-detect)
ALTER TABLE "users" ADD COLUMN "response_language" varchar(10);
