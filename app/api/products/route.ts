import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAutumn } from '@/lib/autumn';

// Helper function to check if user is Pro via Autumn
async function checkProStatus(userId: string): Promise<boolean> {
  try {
    const { data, error } = await getAutumn().customers.get(userId);
    if (error) return false;
    const plan = data?.products?.[0]?.id || 'free';
    return plan === 'pro' || plan === 'enterprise';
  } catch {
    return false;
  }
}

// GET - List user's products
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50');

    let query = supabase
      .from('product_ideas')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })
      .limit(limit);

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching products:', error);
      return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
    }

    return NextResponse.json({ products: data || [] });
  } catch (error) {
    console.error('Products API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Create a new product
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is Pro - first check database, then Autumn as fallback
    const { data: profile } = await supabase
      .from('profiles')
      .select('subscription_tier')
      .eq('id', user.id)
      .single();
    
    const isProInDb = profile?.subscription_tier === 'pro' || profile?.subscription_tier === 'enterprise';
    
    // If not Pro in DB, check Autumn
    let isPro = isProInDb;
    if (!isPro) {
      isPro = await checkProStatus(user.id);
    }
    
    if (!isPro) {
      return NextResponse.json({ error: 'Pro subscription required' }, { status: 403 });
    }

    const body = await request.json();
    const {
      sessionId,
      name,
      description,
      productType,
      tagline,
      mvpScope,
      revenueModel,
      timeToLaunch,
      difficulty,
      estimatedEarnings,
      skillsMatch,
      matchScore,
    } = body;

    if (!name) {
      return NextResponse.json({ error: 'Product name is required' }, { status: 400 });
    }
    
    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
    }

    // Map pricing model to valid enum values
    const mapPricingModel = (model: string | undefined): string | null => {
      if (!model) return null;
      const lower = model.toLowerCase();
      if (lower.includes('subscription') || lower.includes('/mo') || lower.includes('monthly')) return 'subscription';
      if (lower.includes('one-time') || lower.includes('one time') || lower.includes('one_time')) return 'one_time';
      if (lower.includes('freemium') || lower.includes('free')) return 'freemium';
      if (lower.includes('usage') || lower.includes('pay per')) return 'usage_based';
      return 'other';
    };

    // Map product type to valid enum values
    const mapProductType = (type: string | undefined): string | null => {
      if (!type) return null;
      const lower = type.toLowerCase();
      if (lower === 'saas' || lower === 'software') return 'saas';
      if (lower === 'course' || lower === 'online course') return 'course';
      if (lower === 'ebook' || lower === 'e-book' || lower === 'book' || lower === 'guide') return 'ebook';
      if (lower === 'template' || lower === 'templates') return 'template';
      if (lower === 'community' || lower === 'membership') return 'community';
      if (lower === 'marketplace') return 'marketplace';
      if (lower === 'tool') return 'tool';
      if (lower === 'mobile_app' || lower === 'app') return 'mobile_app';
      return 'other';
    };

    // Build insert object carefully to match database constraints
    const insertData: Record<string, unknown> = {
      user_id: user.id,
      session_id: sessionId,
      name,
      status: 'idea',
    };

    // Only add optional fields if they have valid values
    if (description) insertData.description = description;
    if (productType) insertData.product_type = mapProductType(productType);
    if (tagline) insertData.tagline = tagline;
    if (mvpScope && Array.isArray(mvpScope)) insertData.core_features = mvpScope;
    if (revenueModel) insertData.pricing_model = mapPricingModel(revenueModel);
    if (timeToLaunch) insertData.build_time = timeToLaunch;
    if (difficulty) {
      const diff = difficulty.toLowerCase();
      if (['easy', 'medium', 'hard'].includes(diff)) {
        insertData.build_difficulty = diff;
      }
    }
    if (estimatedEarnings) insertData.revenue_potential = estimatedEarnings;
    if (skillsMatch || matchScore) {
      insertData.raw_analysis = { skillsMatch, matchScore };
    }

    console.log('Inserting product:', insertData);

    const { data, error } = await supabase
      .from('product_ideas')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error('Error creating product:', error);
      return NextResponse.json({ error: `Failed to create product: ${error.message}` }, { status: 500 });
    }

    return NextResponse.json({ product: data }, { status: 201 });
  } catch (error) {
    console.error('Products API error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: `Internal server error: ${message}` }, { status: 500 });
  }
}
