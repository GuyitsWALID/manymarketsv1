-- Create saved_ideas table for users to bookmark ideas
CREATE TABLE IF NOT EXISTS saved_ideas (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    idea_id UUID NOT NULL REFERENCES daily_niche_ideas(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure a user can only save an idea once
    UNIQUE(user_id, idea_id)
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_saved_ideas_user_id ON saved_ideas(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_ideas_idea_id ON saved_ideas(idea_id);
CREATE INDEX IF NOT EXISTS idx_saved_ideas_created_at ON saved_ideas(created_at DESC);

-- Enable RLS
ALTER TABLE saved_ideas ENABLE ROW LEVEL SECURITY;

-- Users can only see their own saved ideas
CREATE POLICY "Users can view own saved ideas"
    ON saved_ideas FOR SELECT
    USING (auth.uid() = user_id);

-- Users can save ideas
CREATE POLICY "Users can save ideas"
    ON saved_ideas FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can unsave their own ideas
CREATE POLICY "Users can unsave own ideas"
    ON saved_ideas FOR DELETE
    USING (auth.uid() = user_id);
