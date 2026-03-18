-- Enable RLS on 5 tables flagged by Supabase Security Advisor
-- Pattern: enable RLS + service_role_all policy (app uses Drizzle server-side with service role)

-- 1. newsletter_subscribers (no user_id - public signups)
ALTER TABLE "newsletter_subscribers" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_all" ON "newsletter_subscribers"
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- 2. email_sequences (has user_id)
ALTER TABLE "email_sequences" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_all" ON "email_sequences"
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- 3. sequence_steps (child of email_sequences via sequence_id)
ALTER TABLE "sequence_steps" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_all" ON "sequence_steps"
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- 4. pre_meeting_briefings (has user_id)
ALTER TABLE "pre_meeting_briefings" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_all" ON "pre_meeting_briefings"
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- 5. next_steps (has user_id)
ALTER TABLE "next_steps" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_all" ON "next_steps"
  FOR ALL TO service_role USING (true) WITH CHECK (true);
