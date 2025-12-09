import { NextRequest, NextResponse } from 'next/server';
import { verifyWebhookSignature, LemonSqueezyWebhookEvent, isActiveSubscription } from '@/lib/lemonsqueezy';
import { createClient } from '@supabase/supabase-js';

// Create a Supabase admin client for webhook handling
function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseServiceKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is required for webhook handling');
  }
  
  return createClient(supabaseUrl, supabaseServiceKey);
}

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get('x-signature') || '';
    const webhookSecret = process.env.LEMON_SQUEEZY_WEBHOOK_SECRET;

    if (!webhookSecret) {
      console.error('LEMON_SQUEEZY_WEBHOOK_SECRET not configured');
      return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 });
    }

    // Verify webhook signature
    if (!verifyWebhookSignature(rawBody, signature, webhookSecret)) {
      console.error('Invalid webhook signature');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const event: LemonSqueezyWebhookEvent = JSON.parse(rawBody);
    const eventName = event.meta.event_name;
    const userId = event.meta.custom_data?.user_id;

    console.log(`Lemon Squeezy webhook received: ${eventName}`, { userId });

    if (!userId) {
      // Try to find user by email
      const userEmail = event.data.attributes.user_email;
      if (!userEmail) {
        console.error('No user ID or email in webhook');
        return NextResponse.json({ error: 'No user identifier' }, { status: 400 });
      }

      const supabase = getSupabaseAdmin();
      const { data: users } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', userEmail)
        .limit(1);

      if (!users || users.length === 0) {
        console.error('User not found for email:', userEmail);
        return NextResponse.json({ received: true, warning: 'User not found' });
      }

      // Process with found user ID
      await processWebhookEvent(event, users[0].id);
    } else {
      await processWebhookEvent(event, userId);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook processing error:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}

async function processWebhookEvent(event: LemonSqueezyWebhookEvent, userId: string) {
  const supabase = getSupabaseAdmin();
  const eventName = event.meta.event_name;
  const subscriptionId = event.data.id;
  const status = event.data.attributes.status;
  const customerId = String(event.data.attributes.customer_id);

  switch (eventName) {
    case 'subscription_created':
    case 'subscription_updated':
    case 'subscription_resumed': {
      const tier = isActiveSubscription(status) ? 'pro' : 'free';
      
      console.log(`Updating user ${userId} to tier: ${tier}`);
      
      await supabase
        .from('profiles')
        .update({
          subscription_tier: tier,
          lemon_squeezy_customer_id: customerId,
          lemon_squeezy_subscription_id: subscriptionId,
        })
        .eq('id', userId);
      break;
    }

    case 'subscription_cancelled':
    case 'subscription_expired': {
      console.log(`Downgrading user ${userId} to free`);
      
      await supabase
        .from('profiles')
        .update({
          subscription_tier: 'free',
          lemon_squeezy_subscription_id: null,
        })
        .eq('id', userId);
      break;
    }

    case 'subscription_payment_success': {
      // Payment succeeded - ensure user has pro status
      await supabase
        .from('profiles')
        .update({
          subscription_tier: 'pro',
          lemon_squeezy_customer_id: customerId,
          lemon_squeezy_subscription_id: subscriptionId,
        })
        .eq('id', userId);
      break;
    }

    case 'subscription_payment_failed': {
      // Payment failed - could send notification or grace period
      console.log(`Payment failed for user ${userId}`);
      // Don't immediately downgrade - Lemon Squeezy handles retry logic
      break;
    }

    default:
      console.log(`Unhandled event type: ${eventName}`);
  }
}
