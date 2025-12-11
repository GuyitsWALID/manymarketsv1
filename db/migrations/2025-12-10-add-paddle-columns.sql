-- Migration: Add Paddle fields to profiles and migrate old Lemon Squeezy columns
-- Run this SQL in your Supabase SQL editor or using your migration tooling.

BEGIN;

-- Add columns for Paddle if they don't exist
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS paddle_customer_id TEXT;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS paddle_subscription_id TEXT;

-- Optional: If you have old lemon_squeezy_* fields, move their values into new columns
-- Run this only if you used Lemon Squeezy previously and have those columns.
--
-- UPDATE public.profiles
-- SET
--   paddle_customer_id = COALESCE(paddle_customer_id, lemon_squeezy_customer_id),
--   paddle_subscription_id = COALESCE(paddle_subscription_id, lemon_squeezy_subscription_id)
-- WHERE lemon_squeezy_customer_id IS NOT NULL OR lemon_squeezy_subscription_id IS NOT NULL;
--
-- Optional: After verifying, drop the old Lemon Squeezy fields
-- ALTER TABLE public.profiles
--   DROP COLUMN IF EXISTS lemon_squeezy_customer_id,
--   DROP COLUMN IF EXISTS lemon_squeezy_subscription_id;

COMMIT;
