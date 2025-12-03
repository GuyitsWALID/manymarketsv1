import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { autumn } from '@/lib/autumn';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  // Default destination after completing auth is /chat
  const next = searchParams.get('next') ?? '/chat';

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // Get the user and create Autumn customer
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        try {
          // Create customer in Autumn (auto-enables free plan)
          await autumn.customers.create({
            id: user.id,
            name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
            email: user.email!,
          });
        } catch (err) {
          // Customer might already exist, that's fine
          console.log('Autumn customer creation:', err);
        }
      }
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login`);
}
