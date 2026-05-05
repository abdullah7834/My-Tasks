-- ============================================================================
-- Migration 001: Add start_time / end_time to tasks
-- ============================================================================
-- Run this in your Supabase project:
--   Supabase Dashboard → SQL Editor → New query → paste → Run
-- It is idempotent (safe to run twice).
-- ============================================================================

ALTER TABLE public.tasks
  ADD COLUMN IF NOT EXISTS start_time TIME,
  ADD COLUMN IF NOT EXISTS end_time   TIME;

-- Optional helper: a generated column with the duration in minutes.
-- Handy if you ever want to filter/sort by duration server-side.
-- Safe to skip; the app calculates duration client-side from start/end.

ALTER TABLE public.tasks
  ADD COLUMN IF NOT EXISTS duration_minutes INTEGER GENERATED ALWAYS AS (
    CASE
      WHEN start_time IS NULL OR end_time IS NULL THEN NULL
      WHEN end_time >= start_time THEN
        EXTRACT(EPOCH FROM (end_time - start_time))::INTEGER / 60
      ELSE
        -- Wraps past midnight: end + 24h - start
        EXTRACT(EPOCH FROM (end_time + INTERVAL '24 hours' - start_time))::INTEGER / 60
    END
  ) STORED;
