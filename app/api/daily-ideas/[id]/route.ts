import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  
  // Get current user to check subscription tier
  const { data: { user } } = await supabase.auth.getUser();
  
  let subscriptionTier = 'free';
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('subscription_tier')
      .eq('id', user.id)
      .single();
    
    subscriptionTier = profile?.subscription_tier || 'free';
  }
  
  // Fetch the idea
  const { data: idea, error } = await supabase
    .from('daily_niche_ideas')
    .select('*')
    .eq('id', id)
    .eq('is_published', true)
    .single();
  
  if (error || !idea) {
    return NextResponse.json({ error: 'Idea not found' }, { status: 404 });
  }
  
  const isPro = subscriptionTier === 'pro';
  
  // For free users, gate certain sections
  if (!isPro) {
    // Free users can see basic info but not full research
    return NextResponse.json({
      idea: {
        id: idea.id,
        name: idea.name,
        industry: idea.industry,
        one_liner: idea.one_liner,
        description: idea.description,
        target_audience: idea.target_audience,
        core_problem: idea.core_problem,
        opportunity_score: idea.opportunity_score,
        demand_level: idea.demand_level,
        competition_level: idea.competition_level,
        trending_score: idea.trending_score,
        featured_date: idea.featured_date,
        // Gated sections - show teaser only
        pain_points: (idea.pain_points as any[] || []).slice(0, 2), // Show first 2 only
        monetization_ideas: null, // Hidden
        product_ideas: null, // Hidden
        validation_signals: null, // Hidden
        full_research_report: null, // Hidden
        market_size: null, // Hidden
        growth_rate: null, // Hidden
        sources: null, // Hidden
      },
      isPro: false,
      gated: true,
      gatedSections: ['monetization_ideas', 'product_ideas', 'validation_signals', 'full_research_report', 'market_size', 'growth_rate', 'sources', 'full_pain_points'],
    });
  }
  
  // Pro users get full access
  return NextResponse.json({
    idea,
    isPro: true,
    gated: false,
    gatedSections: [],
  });
}
