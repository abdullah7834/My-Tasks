-- ============================================================================
-- Migration 002: Add total task time and task logs
-- ============================================================================
-- Run this in your Supabase project:
--   Supabase Dashboard → SQL Editor → New query → paste → Run
-- It is idempotent (safe to run twice when the database already has these objects).
-- ============================================================================

ALTER TYPE public.task_status ADD VALUE IF NOT EXISTS 'stopped_temporarily';

ALTER TABLE public.tasks
  ADD COLUMN IF NOT EXISTS total_time_minutes INTEGER NOT NULL DEFAULT 0;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type WHERE typname = 'task_log_event'
  ) THEN
    CREATE TYPE public.task_log_event AS ENUM (
      'start',
      'resumed',
      'stopped_temporarily',
      'done',
      'cancelled'
    );
  END IF;
END$$;

CREATE TABLE IF NOT EXISTS public.task_logs (
  id uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  task_id uuid NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  event_type public.task_log_event NOT NULL,
  event_at timestamptz NOT NULL DEFAULT now(),
  duration_minutes integer,
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS task_logs_task_id_created_at_idx ON public.task_logs(task_id, created_at);
