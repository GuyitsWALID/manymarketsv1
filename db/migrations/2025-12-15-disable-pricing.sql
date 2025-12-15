-- 2025-12-15: Disable pricing by setting all profiles to free and clearing payment identifiers
BEGIN;

-- Set every profile to 'free' plan and clear payment subscription/customer ids
UPDATE public.profiles
SET
  subscription_tier = 'free',
  subscription_status = 'active',
  paddle_customer_id = NULL,
  paddle_subscription_id = NULL,
  stripe_customer_id = NULL,
  stripe_subscription_id = NULL
WHERE subscription_tier IS DISTINCT FROM 'free' OR paddle_subscription_id IS NOT NULL OR stripe_subscription_id IS NOT NULL;

COMMIT;

-- NOTE: This is reversible only by restoring from backup or re-running appropriate subscription creation flows.
