import { NextRequest, NextResponse } from 'next/server';

// Deprecated: Lemon Squeezy webhook removed in favor of Paddle.
// This route now responds with 410 Gone to indicate the endpoint is retired.

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
  // Return 410 Gone for any old Lemon Squeezy webhooks.
  console.warn('Received webhook to deprecated Lemon Squeezy endpoint; returning 410 Gone');
  return new NextResponse(JSON.stringify({ message: 'This webhook endpoint has been retired.' }), { status: 410 });
}

// Legacy webhook processing removed - use Paddle webhook handler instead.
