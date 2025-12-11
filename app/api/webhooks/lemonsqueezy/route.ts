import { NextRequest, NextResponse } from 'next/server';

// Deprecated: Lemon Squeezy webhook removed in favor of Paddle.
// This route now responds with 410 Gone to indicate the endpoint is retired.

// This webhook has been retired; no supabase client is used here.

export async function POST(request: NextRequest) {
  // Return 410 Gone for any old Lemon Squeezy webhooks.
  console.warn('Received webhook to deprecated Lemon Squeezy endpoint; returning 410 Gone');
  return new NextResponse(JSON.stringify({ message: 'This webhook endpoint has been retired.' }), { status: 410 });
}

// Legacy webhook processing removed - use Paddle webhook handler instead.
