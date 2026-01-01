-- 2026-01-01: Add Whop membership column to profiles table
-- This column stores the Whop membership ID for subscription tracking

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS whop_membership_id TEXT;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_whop_membership_id 
ON public.profiles(whop_membership_id) 
WHERE whop_membership_id IS NOT NULL;

-- Optional: Add email column if not exists (needed for webhook lookups)
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS email TEXT;

-- Update email from auth.users if not set
-- This is a one-time migration to populate email for existing users
UPDATE public.profiles p
SET email = u.email
FROM auth.users u
WHERE p.id = u.id AND p.email IS NULL;
