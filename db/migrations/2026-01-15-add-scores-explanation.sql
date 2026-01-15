-- 2026-01-15: Add scores_explanation JSONB column to daily_niche_ideas

ALTER TABLE public.daily_niche_ideas
  ADD COLUMN IF NOT EXISTS scores_explanation JSONB;

-- Optionally set example default to null (explicit), leaving values unset when not provided
-- ALTER TABLE public.daily_niche_ideas ALTER COLUMN scores_explanation SET DEFAULT NULL;