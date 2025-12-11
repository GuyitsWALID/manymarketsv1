import { NextRequest, NextResponse } from 'next/server';
import { createCheckout, getCustomerSubscriptions, cancelSubscription, PRODUCTS, isActiveSubscription } from '@/lib/paddle';
import { createClient } from '@/lib/supabase/server';

// GET - Get customer billing state
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // First check the database for subscription status
    const { data: profile } = await supabase
      .from('profiles')
      .select('subscription_tier, paddle_customer_id, paddle_subscription_id')
      .eq('id', user.id)
      .single();

    let currentPlan = profile?.subscription_tier || 'free';
    let subscriptions: Array<{
      id: string;
      status: string;
      variantId: string;
      productId: string;
      renewsAt: string | null;
      endsAt: string | null;
    }> = [];

    // If user has a Paddle subscription ID, verify it's still active
    if (profile?.paddle_subscription_id) {
      const result = await getCustomerSubscriptions(user.email!);
      
      if ('subscriptions' in result) {
        subscriptions = result.subscriptions;
        
        // Find active subscription
        const activeSub = subscriptions.find(sub => isActiveSubscription(sub.status));
        
        if (activeSub) {
          currentPlan = 'pro';
        } else if (currentPlan === 'pro') {
          // Subscription expired, downgrade in DB
          currentPlan = 'free';
          await supabase
            .from('profiles')
            .update({ subscription_tier: 'free' })
            .eq('id', user.id);
        }
      }
    }

    return NextResponse.json({
      currentPlan,
      subscriptions,
      customer: profile,
    });
  } catch (error) {
    console.error('Error fetching billing state:', error);
    return NextResponse.json(
      { error: 'Failed to fetch billing state' },
      { status: 500 }
    );
  }
}

// POST - Handle billing actions
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
      case 'checkout': {
        // Get checkout URL for upgrading to Pro
        const variantId = productId === 'pro' ? PRODUCTS.PRO : productId;
        
        if (!variantId || variantId === 'free') {
          return NextResponse.json({ error: 'Invalid product ID' }, { status: 400 });
        }

        console.log('Starting Paddle checkout for user:', user.id, 'product:', variantId);

        const result = await createCheckout({
          productId: variantId,
          userId: user.id,
          userEmail: user.email!,
          userName: user.user_metadata?.full_name || user.email?.split('@')[0],
        });

        if ('error' in result) {
          console.error('Checkout error:', result.error);
          return NextResponse.json({ error: result.error }, { status: 500 });
        }

        return NextResponse.json({ url: result.url });
      }

      case 'cancel': {
        // Get user's subscription from database
        const { data: profile } = await supabase
          .from('profiles')
          .select('paddle_subscription_id')
          .eq('id', user.id)
          .single();

        if (!profile?.paddle_subscription_id) {
          return NextResponse.json({ error: 'No active subscription found' }, { status: 400 });
        }

        const result = await cancelSubscription(profile.paddle_subscription_id);

        if ('error' in result) {
          return NextResponse.json({ error: result.error }, { status: 500 });
        }

        // Update database
        await supabase
          .from('profiles')
          .update({ 
            subscription_tier: 'free',
            paddle_subscription_id: null 
          })
          .eq('id', user.id);

        return NextResponse.json({ success: true });
      }

      case 'create_customer': {
        // No-op for Paddle - customers are created at checkout
        return NextResponse.json({ success: true });
      }

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Billing action error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Billing action failed';
    return NextResponse.json(
      { error: errorMessage, details: String(error) },
      { status: 500 }
    );
  }
}

