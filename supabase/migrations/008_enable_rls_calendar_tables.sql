-- Migration: Enable RLS on calendar tables flagged by Supabase Security Advisor
-- Date: 2026-02-15
-- Purpose: Fix 3 tables with missing RLS (calendar_connections, outlook_calendar_connections, calendar_events)
-- Access pattern: All queries go through Drizzle server-side with the service role, not PostgREST client

-- ============================================
-- STEP 1: Enable Row Level Security
-- ============================================

ALTER TABLE "calendar_connections" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "outlook_calendar_connections" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "calendar_events" ENABLE ROW LEVEL SECURITY;

-- ============================================
-- STEP 2: Add service_role full-access policies
-- ============================================
-- Since all queries use Drizzle ORM server-side with the service role,
-- we grant full access to service_role only. No client-side access needed.

CREATE POLICY "service_role_all" ON "calendar_connections"
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "service_role_all" ON "outlook_calendar_connections"
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "service_role_all" ON "calendar_events"
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ============================================
-- VERIFICATION QUERIES (run manually to verify)
-- ============================================
-- Check RLS status:
--   SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public'
--   WHERE tablename IN ('calendar_connections', 'outlook_calendar_connections', 'calendar_events');
