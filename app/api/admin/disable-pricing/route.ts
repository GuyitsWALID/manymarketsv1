import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Protect this endpoint with an admin token (set ADMIN_API_KEY in your environment)
export async function POST(request: NextRequest) {
  const adminKey = process.env.ADMIN_API_KEY;
  if (!adminKey) {
    return NextResponse.json({ error: 'Admin API key not configured' }, { status: 500 });
  }

  const provided = request.headers.get('x-admin-token') || '';
  if (provided !== adminKey) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseServiceKey) {
    return NextResponse.json({ error: 'SUPABASE_SERVICE_ROLE_KEY not configured' }, { status: 500 });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    // Perform update to set everyone to free and clear payment identifiers
    await supabase
      .from('profiles')
      .update({
        subscription_tier: 'free',
        subscription_status: 'active',
        paddle_customer_id: null,
        paddle_subscription_id: null,
        stripe_customer_id: null,
        stripe_subscription_id: null,
      });

    return NextResponse.json({ success: true, message: 'Pricing disabled for all profiles' });
  } catch (err) {
    console.error('Failed to disable pricing via admin endpoint', err);
    return NextResponse.json({ error: 'Failed to apply changes' }, { status: 500 });
  }
}
