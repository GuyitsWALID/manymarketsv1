import { NextRequest, NextResponse } from 'next/server';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Whop webhook events
// Docs: https://docs.whop.com/webhooks
type WhopWebhookEvent = {
  action: string;
  data: {
    id: string;
    user?: {
      id: string;
      email: string;
      username?: string;
    };
    membership?: {
      id: string;
      user_id: string;
      product_id: string;
      plan_id: string;
      status: string;
      valid: boolean;
      email: string;
    };
    email?: string;
    status?: string;
    valid?: boolean;
    plan?: {
      id: string;
    };
  };
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as WhopWebhookEvent;
    
    console.log('Whop webhook received:', JSON.stringify(body, null, 2));

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseServiceKey) {
      console.error('SUPABASE_SERVICE_ROLE_KEY not configured');
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const { action, data } = body;
    
    // Get email from various possible locations in the webhook payload
    const email = data.user?.email || data.membership?.email || data.email;
    
    if (!email) {
      console.error('No email found in webhook payload');
      return NextResponse.json({ received: true, warning: 'No email in payload' });
    }

    // Find user by email
    const { data: users, error: userError } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', email);
    
    if (userError || !users || users.length === 0) {
      // Try to find user in auth.users table
      const { data: authData, error: authError } = await supabase.auth.admin.listUsers();
      
      if (authError) {
        console.error('Failed to find user:', authError);
        return NextResponse.json({ received: true, warning: 'User not found' });
      }
      
      const authUser = authData.users.find(u => u.email === email);
      
      if (!authUser) {
        console.log('User not found for email:', email);
        return NextResponse.json({ received: true, warning: 'User not found' });
      }
      
      // Process with auth user id
      await handleWebhookEvent(supabase, authUser.id, action, data);
    } else {
      // Process with profile user id
      await handleWebhookEvent(supabase, users[0].id, action, data);
    }

    return NextResponse.json({ received: true, success: true });
  } catch (error) {
    console.error('Whop webhook error:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}

async function handleWebhookEvent(
  supabase: SupabaseClient,
  userId: string,
  action: string,
  data: WhopWebhookEvent['data']
) {
  const membershipId = data.membership?.id || data.id;
  const isValid = data.membership?.valid ?? data.valid ?? false;
  const status = data.membership?.status || data.status || '';
  
  console.log('Processing webhook for user:', userId, 'action:', action, 'valid:', isValid);

  switch (action) {
    // Membership/subscription events
    case 'membership.went_valid':
    case 'membership.created':
    case 'payment.succeeded': {
      // User has an active subscription - upgrade to pro
      await supabase
        .from('profiles')
        .update({
          subscription_tier: 'pro',
          subscription_status: 'active',
          whop_membership_id: membershipId,
        })
        .eq('id', userId);
      
      console.log('User upgraded to pro:', userId);
      break;
    }

    case 'membership.went_invalid':
    case 'membership.cancelled':
    case 'membership.expired': {
      // Subscription ended - downgrade to free
      await supabase
        .from('profiles')
        .update({
          subscription_tier: 'free',
          subscription_status: 'cancelled',
          whop_membership_id: null,
        })
        .eq('id', userId);
      
      console.log('User downgraded to free:', userId);
      break;
    }

    case 'payment.failed': {
      // Payment failed - may want to notify user but don't downgrade immediately
      await supabase
        .from('profiles')
        .update({
          subscription_status: 'past_due',
        })
        .eq('id', userId);
      
      console.log('User payment failed:', userId);
      break;
    }

    default:
      console.log('Unhandled webhook action:', action);
  }
}
