-- 2026-01-15: Ensure score columns exist on daily_niche_ideas
-- This migration adds numeric columns (3,1) for various scores if they are missing to prevent insert errors from the cron job.

ALTER TABLE public.daily_niche_ideas
  ADD COLUMN IF NOT EXISTS problem_score NUMERIC(3,1);

ALTER TABLE public.daily_niche_ideas
  ADD COLUMN IF NOT EXISTS total_score NUMERIC(3,1);

ALTER TABLE public.daily_niche_ideas
  ADD COLUMN IF NOT EXISTS trending_score NUMERIC(3,1);

-- opportunity_score and feasibility_score should already exist; add them just in case
ALTER TABLE public.daily_niche_ideas
  ADD COLUMN IF NOT EXISTS opportunity_score NUMERIC(3,1);

ALTER TABLE public.daily_niche_ideas
  ADD COLUMN IF NOT EXISTS feasibility_score NUMERIC(3,1);

-- Optional indices for quick filtering (uncomment if needed)
-- CREATE INDEX IF NOT EXISTS idx_daily_niche_ideas_total_score ON public.daily_niche_ideas (total_score);
-- CREATE INDEX IF NOT EXISTS idx_daily_niche_ideas_trending_score ON public.daily_niche_ideas (trending_score);
