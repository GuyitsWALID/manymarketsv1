import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// OAuth callback for Gumroad
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  if (error) {
    return NextResponse.redirect(new URL('/builder?connection=error&platform=gumroad', request.url));
  }

  if (!code) {
    return NextResponse.redirect(new URL('/builder?connection=error&platform=gumroad&reason=no_code', request.url));
  }

  try {
    // Exchange code for access token
    const tokenResponse = await fetch('https://api.gumroad.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: process.env.GUMROAD_CLIENT_ID || '',
        client_secret: process.env.GUMROAD_CLIENT_SECRET || '',
        code,
        grant_type: 'authorization_code',
        redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/gumroad/callback`,
      }),
    });

    if (!tokenResponse.ok) {
      console.error('Gumroad token exchange failed:', await tokenResponse.text());
      return NextResponse.redirect(new URL('/builder?connection=error&platform=gumroad&reason=token_exchange', request.url));
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    // Get user info from Gumroad
    const userResponse = await fetch('https://api.gumroad.com/v2/user', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const userData = await userResponse.json();
    
    // Get current user from Supabase
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.redirect(new URL('/login?redirect=/builder', request.url));
    }

    // Store the connection in Supabase (you'd need to create this table)
    // For now, we'll pass it as a URL parameter to store client-side
    const connectionData = {
      platform: 'gumroad',
      accessToken,
      accountEmail: userData.user?.email,
      accountId: userData.user?.id,
      connectedAt: new Date().toISOString(),
    };

    // Encode connection data for URL (in production, store in database)
    const encodedData = encodeURIComponent(JSON.stringify(connectionData));

    return NextResponse.redirect(
      new URL(`/builder?connection=success&platform=gumroad&data=${encodedData}`, request.url)
    );
  } catch (error) {
    console.error('Gumroad OAuth error:', error);
    return NextResponse.redirect(new URL('/builder?connection=error&platform=gumroad&reason=unknown', request.url));
  }
}
