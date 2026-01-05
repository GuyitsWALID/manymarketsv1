import { NextRequest, NextResponse } from 'next/server';
import { verifyUnsubscribeToken, unsubscribeUser } from '@/lib/email';

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token');
  
  if (!token) {
    return NextResponse.json({ error: 'Missing token' }, { status: 400 });
  }
  
  const { valid, userId } = verifyUnsubscribeToken(token);
  
  if (!valid || !userId) {
    return NextResponse.json({ error: 'Invalid or expired token' }, { status: 400 });
  }
  
  const { success } = await unsubscribeUser(userId);
  
  if (!success) {
    return NextResponse.json({ error: 'Failed to unsubscribe' }, { status: 500 });
  }
  
  // Redirect to unsubscribe confirmation page
  return NextResponse.redirect(new URL('/unsubscribe?success=true', request.url));
}

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json();
    
    if (!token) {
      return NextResponse.json({ error: 'Missing token' }, { status: 400 });
    }
    
    const { valid, userId } = verifyUnsubscribeToken(token);
    
    if (!valid || !userId) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 400 });
    }
    
    const { success } = await unsubscribeUser(userId);
    
    if (!success) {
      return NextResponse.json({ error: 'Failed to unsubscribe' }, { status: 500 });
    }
    
    return NextResponse.json({ success: true });
    
  } catch (error) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}
