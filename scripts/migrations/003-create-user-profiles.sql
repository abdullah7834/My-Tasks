-- ============================================================================
-- Migration 003: Create public.user_profiles
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.user_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  avatar_url text,
  phone text,
  timezone text,
  created_at timestamptz NOT NULL DEFAULT now()
);
