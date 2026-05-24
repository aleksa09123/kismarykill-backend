-- Country-only rollout for DRZAVE & LIVE MODE sprint.
-- Run this on Supabase Postgres after taking a backup.

BEGIN;

-- Drop legacy city index if it exists.
DROP INDEX IF EXISTS public.ix_users_city;

-- Remove city column from user profile storage.
ALTER TABLE public.users
DROP COLUMN IF EXISTS city;

COMMIT;
