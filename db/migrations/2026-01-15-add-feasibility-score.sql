-- 2026-01-15: Add feasibility_score to daily_niche_ideas
-- This migration ensures the cron job can insert the computed feasibility_score without failing.
-- Use a precision that supports 0-10 with one decimal place.

ALTER TABLE public.daily_niche_ideas
  ADD COLUMN IF NOT EXISTS feasibility_score NUMERIC(3,1);

-- Optional: if you'd like an index to speed up queries by score, uncomment below
-- CREATE INDEX IF NOT EXISTS idx_daily_niche_ideas_feasibility_score ON public.daily_niche_ideas (feasibility_score);
