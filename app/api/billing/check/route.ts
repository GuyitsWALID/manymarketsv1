import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// POST - Check if user has access to a feature based on subscription tier
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { featureId } = await request.json();

    if (!featureId) {
      return NextResponse.json({ error: 'Feature ID required' }, { status: 400 });
    }

    // Get user's subscription tier from database
    const { data: profile } = await supabase
      .from('profiles')
      .select('subscription_tier')
      .eq('id', user.id)
      .single();

    const tier = profile?.subscription_tier || 'free';
    const isPro = tier === 'pro' || tier === 'enterprise';

    // Define feature access based on tier
    const proFeatures = ['builder_studio', 'unlimited_sessions', 'analytics', 'priority_support'];
    const freeFeatures = ['basic_research', 'ai_sessions']; // Limited access

    let allowed = false;
    let unlimited = false;

    if (isPro) {
      // Pro users have access to all features
      allowed = true;
      unlimited = proFeatures.includes(featureId);
    } else {
      // Free users have limited access
      allowed = freeFeatures.includes(featureId);
    }

    return NextResponse.json({
      allowed,
      unlimited,
      tier,
    });
  } catch (error) {
    console.error('Feature check error:', error);
    return NextResponse.json(
      { error: 'Failed to check feature access' },
      { status: 500 }
    );
  }
}

