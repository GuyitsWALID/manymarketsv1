-- Add component score columns and JSONB breakdown for daily niche ideas
ALTER TABLE public.daily_niche_ideas
  ADD COLUMN IF NOT EXISTS problem_score DECIMAL(3,1),
  ADD COLUMN IF NOT EXISTS feasibility_score DECIMAL(3,1),
  ADD COLUMN IF NOT EXISTS total_score DECIMAL(3,1),
  ADD COLUMN IF NOT EXISTS scores_explanation JSONB;

-- Add check constraints to ensure scores are within 0-10 when set
ALTER TABLE public.daily_niche_ideas
  ADD CONSTRAINT check_problem_score_range CHECK (problem_score IS NULL OR (problem_score >= 0 AND problem_score <= 10)),
  ADD CONSTRAINT check_feasibility_score_range CHECK (feasibility_score IS NULL OR (feasibility_score >= 0 AND feasibility_score <= 10)),
  ADD CONSTRAINT check_total_score_range CHECK (total_score IS NULL OR (total_score >= 0 AND total_score <= 10));

-- Optional: create index to support ordering by total_score
CREATE INDEX IF NOT EXISTS idx_daily_niche_ideas_total_score ON public.daily_niche_ideas (total_score DESC NULLS LAST);