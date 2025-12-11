-- Migration: Create indexes on paddle fields for faster lookup
-- Run this SQL in your Supabase SQL editor or using migration tooling.

BEGIN;

CREATE INDEX IF NOT EXISTS idx_profiles_paddle_customer_id ON public.profiles (paddle_customer_id);
CREATE INDEX IF NOT EXISTS idx_profiles_paddle_subscription_id ON public.profiles (paddle_subscription_id);

COMMIT;
