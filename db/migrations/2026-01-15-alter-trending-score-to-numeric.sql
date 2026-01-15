-- 2026-01-15: Alter trending_score to numeric(3,1)
-- Convert integer trending_score to NUMERIC(3,1) to allow fractional scores like 7.5

ALTER TABLE public.daily_niche_ideas
  ALTER COLUMN trending_score TYPE NUMERIC(3,1) USING (trending_score::NUMERIC(3,1));

-- Note: This is safe when values fit within 3 digits and 1 decimal (0.0 - 99.9), and our scores are 0-10 range.
