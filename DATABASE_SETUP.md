# Database Setup - ManyMarkets UVZ Research Platform

This document contains all the SQL code needed to set up the database for the ManyMarkets platform in Supabase.

## Prerequisites

1. Create a Supabase project at [supabase.com](https://supabase.com)
2. Go to the SQL Editor in your Supabase dashboard
3. Run each section below in order

---

## 1. Enable Required Extensions

```sql
-- Enable UUID extension (usually enabled by default)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable pg_trgm for text search
CREATE EXTENSION IF NOT EXISTS pg_trgm;
```

---

## 2. User Profiles Table

This extends Supabase Auth with additional user data.

```sql
-- User profiles (extends Supabase auth.users)
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'pro', 'enterprise')),
  subscription_status TEXT DEFAULT 'active' CHECK (subscription_status IN ('active', 'canceled', 'past_due', 'trialing')),
  stripe_customer_id TEXT UNIQUE,
  stripe_subscription_id TEXT,
  paddle_customer_id TEXT,
  paddle_subscription_id TEXT,
  research_credits INTEGER DEFAULT 10,
  total_sessions INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Policies for profiles
CREATE POLICY "Users can view own profile" 
  ON public.profiles FOR SELECT 
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" 
  ON public.profiles FOR UPDATE 
  USING (auth.uid() = id);

-- Function to create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-create profile
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Optional: If you previously had lemon_squeezy_* fields, migrate them to paddle_* columns
-- (this keeps your billing data and preserves user mapping)
-- Run this migration only if you used Lemon Squeezy previously.
-- Also consider backing up your DB before running migrations.
-- Example migration script:
--
-- ALTER TABLE public.profiles
--   ADD COLUMN IF NOT EXISTS paddle_customer_id TEXT;
--
-- ALTER TABLE public.profiles
--   ADD COLUMN IF NOT EXISTS paddle_subscription_id TEXT;
--
-- -- If you have old lemon fields and want to migrate values
-- UPDATE public.profiles
-- SET
--   paddle_customer_id = COALESCE(paddle_customer_id, lemon_squeezy_customer_id),
--   paddle_subscription_id = COALESCE(paddle_subscription_id, lemon_squeezy_subscription_id)
-- WHERE lemon_squeezy_customer_id IS NOT NULL OR lemon_squeezy_subscription_id IS NOT NULL;
--
-- -- Optional: Drop old lemon fields after verifying migration
-- ALTER TABLE public.profiles
--   DROP COLUMN IF EXISTS lemon_squeezy_customer_id,
--   DROP COLUMN IF EXISTS lemon_squeezy_subscription_id;
```

---

## 3. Research Sessions Table

Stores chat sessions and research progress.

```sql
-- Research sessions (chat conversations)
CREATE TABLE public.research_sessions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT DEFAULT 'New Research Session',
  
  -- Research phase tracking
  phase TEXT DEFAULT 'discovery' CHECK (phase IN ('discovery', 'niche_drilling', 'uvz_identification', 'validation', 'product_ideation', 'completed')),
  phase_progress INTEGER DEFAULT 0, -- 0-100 progress within phase
  
  -- Industry context
  industry TEXT,
  selected_niche TEXT,
  selected_uvz TEXT,
  
  -- Metadata
  message_count INTEGER DEFAULT 0,
  tool_calls_count INTEGER DEFAULT 0,
  is_archived BOOLEAN DEFAULT FALSE,
  is_starred BOOLEAN DEFAULT FALSE,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_message_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_sessions_user_id ON public.research_sessions(user_id);
CREATE INDEX idx_sessions_phase ON public.research_sessions(phase);
CREATE INDEX idx_sessions_created_at ON public.research_sessions(created_at DESC);
CREATE INDEX idx_sessions_last_message ON public.research_sessions(last_message_at DESC);

-- Enable RLS
ALTER TABLE public.research_sessions ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view own sessions" 
  ON public.research_sessions FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own sessions" 
  ON public.research_sessions FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sessions" 
  ON public.research_sessions FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own sessions" 
  ON public.research_sessions FOR DELETE 
  USING (auth.uid() = user_id);

-- Updated_at trigger
CREATE TRIGGER sessions_updated_at
  BEFORE UPDATE ON public.research_sessions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
```

---

## 4. Messages Table

Stores all chat messages.

```sql
-- Chat messages
CREATE TABLE public.messages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  session_id UUID REFERENCES public.research_sessions(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  
  -- Message content
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system', 'tool')),
  content TEXT NOT NULL,
  
  -- Tool call metadata (for assistant messages that called tools)
  tool_calls JSONB, -- Array of tool calls made
  tool_results JSONB, -- Results from tool executions
  
  -- Metadata
  tokens_used INTEGER,
  model_used TEXT DEFAULT 'gemini-2.0-flash-exp',
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_messages_session_id ON public.messages(session_id);
CREATE INDEX idx_messages_created_at ON public.messages(session_id, created_at);
CREATE INDEX idx_messages_role ON public.messages(role);

-- Enable RLS
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view own messages" 
  ON public.messages FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own messages" 
  ON public.messages FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Function to update session on new message
CREATE OR REPLACE FUNCTION public.update_session_on_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.research_sessions
  SET 
    message_count = message_count + 1,
    last_message_at = NOW(),
    updated_at = NOW()
  WHERE id = NEW.session_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_message_created
  AFTER INSERT ON public.messages
  FOR EACH ROW EXECUTE FUNCTION public.update_session_on_message();
```

---

## 5. Discovered Niches Table

Stores niches identified during research.

```sql
-- Discovered niches from research
CREATE TABLE public.niches (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  session_id UUID REFERENCES public.research_sessions(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  
  -- Niche details
  name TEXT NOT NULL,
  description TEXT,
  industry TEXT NOT NULL,
  
  -- Analysis data
  target_audience TEXT,
  market_size TEXT,
  competition_level TEXT CHECK (competition_level IN ('low', 'medium', 'high')),
  opportunity_score DECIMAL(3,1) CHECK (opportunity_score >= 0 AND opportunity_score <= 10),
  
  -- Pain points and opportunities
  pain_points JSONB DEFAULT '[]'::jsonb, -- Array of pain points
  monetization_ideas JSONB DEFAULT '[]'::jsonb, -- Array of ideas
  
  -- Status
  is_selected BOOLEAN DEFAULT FALSE, -- User selected this niche to drill down
  is_validated BOOLEAN DEFAULT FALSE,
  
  -- Raw AI analysis
  raw_analysis JSONB,
  sources JSONB DEFAULT '[]'::jsonb, -- Sources used for analysis
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_niches_session_id ON public.niches(session_id);
CREATE INDEX idx_niches_user_id ON public.niches(user_id);
CREATE INDEX idx_niches_industry ON public.niches(industry);
CREATE INDEX idx_niches_selected ON public.niches(is_selected) WHERE is_selected = TRUE;

-- Enable RLS
ALTER TABLE public.niches ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view own niches" 
  ON public.niches FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own niches" 
  ON public.niches FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own niches" 
  ON public.niches FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own niches" 
  ON public.niches FOR DELETE 
  USING (auth.uid() = user_id);
```

---

## 6. UVZ (Unique Value Zones) Table

Stores the deep, specific opportunities discovered.

```sql
-- Unique Value Zones discovered
CREATE TABLE public.uvz_discoveries (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  session_id UUID REFERENCES public.research_sessions(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  niche_id UUID REFERENCES public.niches(id) ON DELETE SET NULL,
  
  -- UVZ details
  name TEXT NOT NULL,
  one_liner TEXT, -- Single sentence value prop
  description TEXT,
  
  -- Target specifics
  micro_audience TEXT, -- Very specific audience
  core_problem TEXT,
  why_underserved TEXT,
  differentiation TEXT,
  
  -- Validation
  validation_signals JSONB DEFAULT '[]'::jsonb,
  demand_score DECIMAL(3,1) CHECK (demand_score >= 0 AND demand_score <= 10),
  confidence_score DECIMAL(3,2) CHECK (confidence_score >= 0 AND confidence_score <= 1),
  verdict TEXT CHECK (verdict IN ('go', 'caution', 'no-go')),
  
  -- Competition
  saturation_level TEXT CHECK (saturation_level IN ('low', 'medium', 'high')),
  top_competitors JSONB DEFAULT '[]'::jsonb,
  market_gaps JSONB DEFAULT '[]'::jsonb,
  
  -- Status
  is_selected BOOLEAN DEFAULT FALSE,
  is_validated BOOLEAN DEFAULT FALSE,
  
  -- Raw data
  raw_drill_analysis JSONB,
  raw_validation_analysis JSONB,
  sources JSONB DEFAULT '[]'::jsonb,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_uvz_session_id ON public.uvz_discoveries(session_id);
CREATE INDEX idx_uvz_user_id ON public.uvz_discoveries(user_id);
CREATE INDEX idx_uvz_niche_id ON public.uvz_discoveries(niche_id);
CREATE INDEX idx_uvz_verdict ON public.uvz_discoveries(verdict);
CREATE INDEX idx_uvz_selected ON public.uvz_discoveries(is_selected) WHERE is_selected = TRUE;

-- Enable RLS
ALTER TABLE public.uvz_discoveries ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view own UVZ" 
  ON public.uvz_discoveries FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own UVZ" 
  ON public.uvz_discoveries FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own UVZ" 
  ON public.uvz_discoveries FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own UVZ" 
  ON public.uvz_discoveries FOR DELETE 
  USING (auth.uid() = user_id);

-- Updated_at trigger
CREATE TRIGGER uvz_updated_at
  BEFORE UPDATE ON public.uvz_discoveries
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
```

---

## 7. Product Ideas Table

Stores digital product/software ideas generated.

```sql
-- Product ideas generated from UVZ
CREATE TABLE public.product_ideas (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  session_id UUID REFERENCES public.research_sessions(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  uvz_id UUID REFERENCES public.uvz_discoveries(id) ON DELETE SET NULL,
  
  -- Product details
  name TEXT NOT NULL,
  tagline TEXT,
  description TEXT,
  product_type TEXT CHECK (product_type IN ('saas', 'course', 'ebook', 'template', 'community', 'marketplace', 'tool', 'mobile_app', 'other')),
  
  -- Features and specs
  core_features JSONB DEFAULT '[]'::jsonb,
  tech_stack JSONB, -- Recommended tech stack
  
  -- Business model
  pricing_model TEXT CHECK (pricing_model IN ('one_time', 'subscription', 'freemium', 'usage_based', 'other')),
  price_point TEXT,
  revenue_potential TEXT,
  
  -- Build estimates
  build_time TEXT,
  build_difficulty TEXT CHECK (build_difficulty IN ('easy', 'medium', 'hard')),
  mvp_scope TEXT,
  
  -- Go to market
  go_to_market_strategy TEXT,
  target_launch_date DATE,
  
  -- Status tracking
  status TEXT DEFAULT 'idea' CHECK (status IN ('idea', 'researching', 'planning', 'building', 'launched', 'archived')),
  is_favorite BOOLEAN DEFAULT FALSE,
  
  -- Notes and raw data
  notes TEXT,
  raw_analysis JSONB,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_products_session_id ON public.product_ideas(session_id);
CREATE INDEX idx_products_user_id ON public.product_ideas(user_id);
CREATE INDEX idx_products_uvz_id ON public.product_ideas(uvz_id);
CREATE INDEX idx_products_status ON public.product_ideas(status);
CREATE INDEX idx_products_type ON public.product_ideas(product_type);
CREATE INDEX idx_products_favorite ON public.product_ideas(is_favorite) WHERE is_favorite = TRUE;

-- Enable RLS
ALTER TABLE public.product_ideas ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view own products" 
  ON public.product_ideas FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own products" 
  ON public.product_ideas FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own products" 
  ON public.product_ideas FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own products" 
  ON public.product_ideas FOR DELETE 
  USING (auth.uid() = user_id);

-- Updated_at trigger
CREATE TRIGGER products_updated_at
  BEFORE UPDATE ON public.product_ideas
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
```

---

## 8. Saved Research Table

For saving and organizing research findings.

```sql
-- Saved research snippets and findings
CREATE TABLE public.saved_research (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  session_id UUID REFERENCES public.research_sessions(id) ON DELETE SET NULL,
  
  -- Content
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  research_type TEXT CHECK (research_type IN ('insight', 'competitor', 'trend', 'opportunity', 'quote', 'statistic', 'other')),
  
  -- Organization
  tags JSONB DEFAULT '[]'::jsonb,
  folder TEXT,
  
  -- Source
  source_url TEXT,
  source_title TEXT,
  
  -- Metadata
  is_pinned BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_saved_user_id ON public.saved_research(user_id);
CREATE INDEX idx_saved_session_id ON public.saved_research(session_id);
CREATE INDEX idx_saved_type ON public.saved_research(research_type);
CREATE INDEX idx_saved_tags ON public.saved_research USING GIN (tags);

-- Enable RLS
ALTER TABLE public.saved_research ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can manage own saved research" 
  ON public.saved_research FOR ALL 
  USING (auth.uid() = user_id);
```

---

## 9. Analytics Events Table

For tracking user activity and tool usage.

```sql
-- Analytics events
CREATE TABLE public.analytics_events (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  session_id UUID REFERENCES public.research_sessions(id) ON DELETE SET NULL,
  
  -- Event details
  event_type TEXT NOT NULL,
  event_name TEXT NOT NULL,
  event_data JSONB DEFAULT '{}'::jsonb,
  
  -- Context
  page_path TEXT,
  referrer TEXT,
  user_agent TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_analytics_user_id ON public.analytics_events(user_id);
CREATE INDEX idx_analytics_event_type ON public.analytics_events(event_type);
CREATE INDEX idx_analytics_created_at ON public.analytics_events(created_at DESC);

-- Enable RLS
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

-- Policy (users can insert their own events)
CREATE POLICY "Users can create own analytics" 
  ON public.analytics_events FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Admins can view all (requires admin role setup)
CREATE POLICY "Admins can view all analytics" 
  ON public.analytics_events FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND subscription_tier = 'enterprise'
    )
  );
```

---

## 10. Stripe Webhook Events (for payment tracking)

```sql
-- Stripe webhook events log
CREATE TABLE public.stripe_events (
  id TEXT PRIMARY KEY, -- Stripe event ID
  type TEXT NOT NULL,
  data JSONB NOT NULL,
  processed BOOLEAN DEFAULT FALSE,
  processed_at TIMESTAMPTZ,
  error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index
CREATE INDEX idx_stripe_events_type ON public.stripe_events(type);
CREATE INDEX idx_stripe_events_processed ON public.stripe_events(processed) WHERE processed = FALSE;
```

---

## 11. Useful Views

```sql
-- View: User dashboard stats
CREATE VIEW public.user_stats AS
SELECT 
  p.id as user_id,
  p.subscription_tier,
  p.research_credits,
  COUNT(DISTINCT rs.id) as total_sessions,
  COUNT(DISTINCT n.id) as total_niches_discovered,
  COUNT(DISTINCT u.id) as total_uvz_discovered,
  COUNT(DISTINCT pi.id) as total_product_ideas,
  COUNT(DISTINCT u.id) FILTER (WHERE u.verdict = 'go') as validated_uvz_count
FROM public.profiles p
LEFT JOIN public.research_sessions rs ON rs.user_id = p.id
LEFT JOIN public.niches n ON n.user_id = p.id
LEFT JOIN public.uvz_discoveries u ON u.user_id = p.id
LEFT JOIN public.product_ideas pi ON pi.user_id = p.id
GROUP BY p.id, p.subscription_tier, p.research_credits;

-- View: Recent activity
CREATE VIEW public.recent_activity AS
SELECT 
  'session' as activity_type,
  rs.id as item_id,
  rs.title as item_name,
  rs.user_id,
  rs.updated_at as activity_time
FROM public.research_sessions rs
WHERE rs.updated_at > NOW() - INTERVAL '7 days'
UNION ALL
SELECT 
  'product' as activity_type,
  pi.id as item_id,
  pi.name as item_name,
  pi.user_id,
  pi.created_at as activity_time
FROM public.product_ideas pi
WHERE pi.created_at > NOW() - INTERVAL '7 days'
ORDER BY activity_time DESC;
```

---

## 12. Helper Functions

```sql
-- Function: Get session with all related data
CREATE OR REPLACE FUNCTION public.get_session_details(session_uuid UUID)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'session', row_to_json(rs),
    'messages', (
      SELECT json_agg(row_to_json(m) ORDER BY m.created_at)
      FROM public.messages m WHERE m.session_id = session_uuid
    ),
    'niches', (
      SELECT json_agg(row_to_json(n))
      FROM public.niches n WHERE n.session_id = session_uuid
    ),
    'uvz_discoveries', (
      SELECT json_agg(row_to_json(u))
      FROM public.uvz_discoveries u WHERE u.session_id = session_uuid
    ),
    'product_ideas', (
      SELECT json_agg(row_to_json(p))
      FROM public.product_ideas p WHERE p.session_id = session_uuid
    )
  ) INTO result
  FROM public.research_sessions rs
  WHERE rs.id = session_uuid
  AND rs.user_id = auth.uid();
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Decrement research credits
CREATE OR REPLACE FUNCTION public.use_research_credit(user_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
  current_credits INTEGER;
BEGIN
  SELECT research_credits INTO current_credits
  FROM public.profiles
  WHERE id = user_uuid;
  
  IF current_credits > 0 THEN
    UPDATE public.profiles
    SET research_credits = research_credits - 1
    WHERE id = user_uuid;
    RETURN TRUE;
  ELSE
    RETURN FALSE;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## 13. Sample Data (Optional - for testing)

```sql
-- Insert sample data for testing (run with a test user)
-- Note: Replace 'YOUR_USER_ID' with an actual user UUID

/*
-- Create a test session
INSERT INTO public.research_sessions (user_id, title, industry, phase)
VALUES ('YOUR_USER_ID', 'AI Tools Research', 'Artificial Intelligence', 'niche_drilling');

-- The rest would cascade from actual usage
*/
```

---

## 14. Marketplace Orders & Purchases

Tables for handling marketplace purchases, orders, and platform fees.

```sql
-- Marketplace Orders (tracks purchases)
CREATE TABLE public.marketplace_orders (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  buyer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  
  -- Financial details
  total_amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
  platform_fee DECIMAL(10, 2) NOT NULL DEFAULT 0,
  processing_fee DECIMAL(10, 2) NOT NULL DEFAULT 0,
  
  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  payment_method TEXT DEFAULT 'stripe' CHECK (payment_method IN ('stripe', 'paypal', 'free')),
  
  -- Stripe references
  stripe_session_id TEXT,
  stripe_payment_intent_id TEXT,
  stripe_subscription_id TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  payment_confirmed_at TIMESTAMPTZ
);

-- Order Items (individual products in an order)
CREATE TABLE public.marketplace_order_items (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  order_id UUID REFERENCES public.marketplace_orders(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES public.marketplace_products(id) ON DELETE SET NULL,
  seller_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  
  -- Pricing at time of purchase
  quantity INTEGER DEFAULT 1,
  unit_price DECIMAL(10, 2) NOT NULL,
  total_price DECIMAL(10, 2) NOT NULL,
  platform_fee DECIMAL(10, 2) NOT NULL DEFAULT 0,
  
  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'refunded')),
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Marketplace Purchases (grants product access to buyers)
CREATE TABLE public.marketplace_purchases (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES public.marketplace_products(id) ON DELETE CASCADE NOT NULL,
  order_id UUID REFERENCES public.marketplace_orders(id) ON DELETE SET NULL,
  
  -- Access info
  access_type TEXT DEFAULT 'purchased' CHECK (access_type IN ('purchased', 'gifted', 'promo')),
  access_revoked BOOLEAN DEFAULT FALSE,
  revoked_at TIMESTAMPTZ,
  
  -- For subscriptions
  subscription_renewed_at TIMESTAMPTZ,
  subscription_expires_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, product_id)
);

-- Marketplace Saves (wishlist/saved products)
CREATE TABLE public.marketplace_saves (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES public.marketplace_products(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, product_id)
);

-- Seller Payouts (tracks money owed to sellers)
CREATE TABLE public.seller_payouts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  seller_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL NOT NULL,
  order_id UUID REFERENCES public.marketplace_orders(id) ON DELETE SET NULL,
  
  amount DECIMAL(10, 2) NOT NULL,
  platform_fee_deducted DECIMAL(10, 2) DEFAULT 0,
  
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  payout_method TEXT,
  payout_reference TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ
);

-- Platform Earnings (tracks platform revenue)
CREATE TABLE public.platform_earnings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  order_id UUID REFERENCES public.marketplace_orders(id) ON DELETE SET NULL,
  
  amount DECIMAL(10, 2) NOT NULL,
  type TEXT DEFAULT 'transaction_fee' CHECK (type IN ('transaction_fee', 'subscription', 'listing_fee', 'other')),
  description TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_orders_buyer_id ON public.marketplace_orders(buyer_id);
CREATE INDEX idx_orders_status ON public.marketplace_orders(status);
CREATE INDEX idx_order_items_order_id ON public.marketplace_order_items(order_id);
CREATE INDEX idx_order_items_seller_id ON public.marketplace_order_items(seller_id);
CREATE INDEX idx_purchases_user_id ON public.marketplace_purchases(user_id);
CREATE INDEX idx_purchases_product_id ON public.marketplace_purchases(product_id);
CREATE INDEX idx_saves_user_id ON public.marketplace_saves(user_id);
CREATE INDEX idx_payouts_seller_id ON public.seller_payouts(seller_id);
CREATE INDEX idx_payouts_status ON public.seller_payouts(status);

-- Enable RLS
ALTER TABLE public.marketplace_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplace_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplace_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplace_saves ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seller_payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_earnings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for orders
CREATE POLICY "Users can view own orders" 
  ON public.marketplace_orders FOR SELECT 
  USING (auth.uid() = buyer_id);

CREATE POLICY "Users can create orders" 
  ON public.marketplace_orders FOR INSERT 
  WITH CHECK (auth.uid() = buyer_id);

-- RLS Policies for order items
CREATE POLICY "Users can view own order items" 
  ON public.marketplace_order_items FOR SELECT 
  USING (
    order_id IN (SELECT id FROM public.marketplace_orders WHERE buyer_id = auth.uid())
    OR seller_id = auth.uid()
  );

-- RLS Policies for purchases
CREATE POLICY "Users can view own purchases" 
  ON public.marketplace_purchases FOR SELECT 
  USING (auth.uid() = user_id);

-- RLS Policies for saves
CREATE POLICY "Users can manage own saves" 
  ON public.marketplace_saves FOR ALL 
  USING (auth.uid() = user_id);

-- RLS Policies for seller payouts
CREATE POLICY "Sellers can view own payouts" 
  ON public.seller_payouts FOR SELECT 
  USING (auth.uid() = seller_id);

-- Function to increment product views
CREATE OR REPLACE FUNCTION public.increment_product_views(product_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.marketplace_products
  SET view_count = COALESCE(view_count, 0) + 1
  WHERE id = product_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## Environment Variables Required

Add these to your `.env.local`:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Google AI
GOOGLE_GENERATIVE_AI_API_KEY=your-gemini-api-key

# Stripe (for payments)
STRIPE_SECRET_KEY=your-stripe-secret
STRIPE_WEBHOOK_SECRET=your-webhook-secret
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your-publishable-key
```

---

## Quick Setup Checklist

- [ ] Create Supabase project
- [ ] Run SQL sections 1-12 in order
- [ ] Set up environment variables
- [ ] Enable Google OAuth in Supabase Auth settings
- [ ] Configure Stripe webhooks to point to `/api/webhooks/stripe`
- [ ] Test with a new user signup

---

## Schema Diagram

```
┌──────────────┐     ┌───────────────────┐     ┌─────────────┐
│   profiles   │────<│ research_sessions │>────│  messages   │
└──────────────┘     └───────────────────┘     └─────────────┘
                              │
                              │
              ┌───────────────┼───────────────┐
              │               │               │
              ▼               ▼               ▼
        ┌─────────┐   ┌───────────────┐  ┌──────────────┐
        │ niches  │──>│uvz_discoveries│─>│product_ideas │
        └─────────┘   └───────────────┘  └──────────────┘
```

Each user can have multiple research sessions. Each session can discover multiple niches, which can lead to UVZ discoveries, which can generate product ideas.
