-- Add resume_at column to email_sequences for OOO auto-resume scheduling
ALTER TABLE "email_sequences" ADD COLUMN IF NOT EXISTS "resume_at" timestamp with time zone;
