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
        // Present total_score to users (fallback to opportunity_score if not available)
        total_score: idea.total_score ?? idea.opportunity_score,
        opportunity_score: idea.opportunity_score,
        problem_score: idea.problem_score || null,
        feasibility_score: idea.feasibility_score || null,
        scores_explanation: idea.scores_explanation ? {
          opportunity: idea.scores_explanation?.opportunity || null,
          problem: idea.scores_explanation?.problem || null,
        } : null,
        demand_level: idea.demand_level,
        competition_level: idea.competition_level,
        trending_score: idea.trending_score,
        featured_date: idea.featured_date,
        
        // Gated sections - show teaser only
        pain_points: (idea.pain_points as any[] || []).slice(0, 2), // Show first 2 only
        monetization_ideas: null, // Hidden
        product_ideas: idea.product_ideas, // Shown to all users
        validation_signals: idea.validation_signals, // Shown to all users
        full_research_report: null, // Hidden
        sources: null, // Hidden
        market_size: idea.market_size, // Shown blurred for free users
        growth_rate: idea.growth_rate, // Shown blurred for free users
      }, 
      isPro: false,
      gated: true,
      gatedSections: ['monetization_ideas', 'full_research_report', 'market_size', 'growth_rate', 'sources', 'full_pain_points'],
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
