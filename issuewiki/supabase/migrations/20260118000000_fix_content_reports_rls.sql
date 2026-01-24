-- Security Fix: RLS Policy Hardening
-- 1. Remove dangerous USING(true) policy from content_reports
-- 2. Enable RLS on issue_articles with proper read-only public access

-- ============================================================
-- Fix 1: Remove overly permissive policy on content_reports
-- ============================================================
-- This policy was incorrectly documented as "only for service role"
-- but in reality USING(true) allows ALL users including anonymous users
-- Service role automatically bypasses RLS, so this policy is unnecessary and dangerous

DROP POLICY IF EXISTS "Service role can manage all reports" ON content_reports;

-- Note: With this policy removed, only these policies remain:
-- 1. "Users can view their own reports" - USING (auth.uid() = reporter_id)
-- 2. "Authenticated users can create reports" - WITH CHECK (auth.uid() = reporter_id)
-- Admin operations use supabaseAdmin with service role key which bypasses RLS entirely

-- ============================================================
-- Fix 2: Enable RLS on issue_articles
-- ============================================================
-- issue_articles contains public article timeline data
-- - Public read access (anyone can view articles)
-- - Write operations (INSERT/UPDATE/DELETE) only via service role

ALTER TABLE issue_articles ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read articles (public data)
CREATE POLICY "Anyone can view issue articles"
  ON issue_articles FOR SELECT
  USING (true);

-- No INSERT/UPDATE/DELETE policies for regular users
-- Admin operations use supabaseAdmin (service role) which bypasses RLS
