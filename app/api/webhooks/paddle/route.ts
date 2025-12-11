import { NextRequest, NextResponse } from 'next/server';
import { verifyWebhookSignature, isActiveSubscription } from '@/lib/paddle';
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

// Paddle sends webhook payload as form-urlencoded with 'p_signature' param.
export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    // parse form-encoded body
    const form = new URLSearchParams(rawBody);
    const signature = form.get('p_signature') || '';
    const publicKey = process.env.PADDLE_PUBLIC_KEY;

    if (!publicKey) {
      console.warn('PADDLE_PUBLIC_KEY not configured - webhook verification will be skipped (insecure)');
    }

    // Verify webhook signature
    // Build a normalized object to pass to the verifier so that nested fields are parsed cleanly.
    const parsedFormObj: Record<string, any> = {};
    for (const [k, v] of form.entries()) {
      parsedFormObj[k] = v;
    }
    if (publicKey && !verifyWebhookSignature(parsedFormObj, signature, publicKey)) {
      console.error('Invalid Paddle webhook signature');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const alertName = form.get('alert_name') || '';
    const passthrough = form.get('passthrough') || '';
    const user_email = form.get('email') || '';
    const subscriptionId = form.get('subscription_id') || '';
    const status = form.get('status') || '';
    const customerId = form.get('user_id') || form.get('paddle_user_id') || '';

    console.log('Paddle webhook received', { alertName, subscriptionId, status, customerId, passthrough, user_email });

    const supabase = getSupabaseAdmin();

    // Resolve user ID: prefer passthrough (we pass internal user id when creating links), else lookup by email
    let userId = passthrough || null;
    if (!userId && user_email) {
      const { data: users } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', user_email)
        .limit(1);

      if (users && users.length > 0) {
        userId = users[0].id;
      }
    }

    if (!userId) {
      console.warn('Paddle webhook: No user ID found, skipping');
      return NextResponse.json({ received: true, warning: 'No user ID found' });
    }

    // Normalize alert types
    switch(alertName) {
      case 'subscription_created':
      case 'subscription_updated':
      case 'subscription_payment_succeeded': {
        const tier = isActiveSubscription(status) ? 'pro' : 'free';
        await supabase
          .from('profiles')
          .update({
            subscription_tier: tier,
            paddle_customer_id: customerId || user_email,
            paddle_subscription_id: subscriptionId || null,
          })
          .eq('id', userId);
        break;
      }
      case 'subscription_cancelled':
      case 'subscription_deleted':
      case 'subscription_payment_failed': {
        // Downgrade to free on cancel or delete
        await supabase
          .from('profiles')
          .update({
            subscription_tier: 'free',
            paddle_subscription_id: null,
          })
          .eq('id', userId);
        break;
      }
      default:
        console.log(`Unhandled Paddle webhook: ${alertName}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Paddle webhook processing error:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
