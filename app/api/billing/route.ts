import { NextRequest, NextResponse } from 'next/server';
import { getAutumn, PRODUCTS } from '@/lib/autumn';
import { createClient } from '@/lib/supabase/server';

// GET - Get customer billing state
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get customer state from Autumn
    const { data, error } = await getAutumn().customers.get(user.id);
    
    if (error) {
      // If customer doesn't exist, return free tier info
      if (error.message?.includes('not found')) {
        return NextResponse.json({
          customer: null,
          products: [],
          currentPlan: 'free',
        });
      }
      throw error;
    }

    const currentPlan = data?.products?.[0]?.id || 'free';
    
    // Sync subscription tier to database if it differs
    // This ensures the DB stays in sync with Autumn
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('subscription_tier')
        .eq('id', user.id)
        .single();
      
      if (profile && profile.subscription_tier !== currentPlan) {
        console.log(`Syncing subscription tier for user ${user.id}: ${profile.subscription_tier} -> ${currentPlan}`);
        await supabase
          .from('profiles')
          .update({ subscription_tier: currentPlan })
          .eq('id', user.id);
      }
    } catch (syncError) {
      console.error('Error syncing subscription tier:', syncError);
      // Don't fail the request, just log the error
    }

    return NextResponse.json({
      customer: data,
      products: data?.products || [],
      currentPlan,
    });
  } catch (error) {
    console.error('Error fetching billing state:', error);
    return NextResponse.json(
      { error: 'Failed to fetch billing state' },
      { status: 500 }
    );
  }
}

// POST - Create customer or handle billing actions
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action, productId } = body;

    switch (action) {
      case 'create_customer': {
        // Create or update customer in Autumn
        const { data, error } = await getAutumn().customers.create({
          id: user.id,
          name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
          email: user.email!,
        });

        if (error) {
          throw error;
        }

        return NextResponse.json({ success: true, customer: data });
      }

      case 'checkout': {
        // Get checkout URL for upgrading
        if (!productId) {
          return NextResponse.json({ error: 'Product ID required' }, { status: 400 });
        }

        const { data, error } = await getAutumn().checkout({
          customer_id: user.id,
          product_id: productId,
        });

        if (error) {
          throw error;
        }

        return NextResponse.json({
          url: data?.url,
          preview: data?.url ? null : data,
        });
      }

      case 'attach': {
        // Attach product (for upgrades when payment is on file)
        if (!productId) {
          return NextResponse.json({ error: 'Product ID required' }, { status: 400 });
        }

        const { data, error } = await getAutumn().attach({
          customer_id: user.id,
          product_id: productId,
        });

        if (error) {
          throw error;
        }

        return NextResponse.json({ success: true, data });
      }

      case 'cancel': {
        // Cancel subscription
        const { data, error } = await getAutumn().cancel({
          customer_id: user.id,
          product_id: productId || PRODUCTS.PRO,
        });

        if (error) {
          throw error;
        }

        return NextResponse.json({ success: true, data });
      }

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Billing action error:', error);
    return NextResponse.json(
      { error: 'Billing action failed' },
      { status: 500 }
    );
  }
}
