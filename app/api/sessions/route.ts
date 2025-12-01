import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: sessions, error } = await supabase
      .from('research_sessions')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_archived', false)
      .order('last_message_at', { ascending: false });

    if (error) {
      console.error('Error fetching sessions:', error);
      return NextResponse.json({ error: 'Failed to fetch sessions' }, { status: 500 });
    }

    return NextResponse.json({ sessions });
  } catch (error) {
    console.error('Sessions GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError) {
      console.error('Auth error:', authError);
      return NextResponse.json({ error: 'Authentication failed', details: authError.message }, { status: 401 });
    }

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized - no user found' }, { status: 401 });
    }

    console.log('Creating session for user:', user.id);

    const body = await req.json();
    const { title, industry, goal } = body;
    console.log('Session data:', { title, industry, goal });

    // Ensure profile exists for user (required by foreign key)
    const { data: existingProfile, error: profileCheckError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .single();

    console.log('Profile check:', { existingProfile, profileCheckError });

    if (!existingProfile) {
      // Create profile if it doesn't exist
      console.log('Creating new profile for user:', user.id);
      const { data: newProfile, error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: user.id,
          email: user.email || '',
          full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
        })
        .select()
        .single();

      if (profileError) {
        console.error('Error creating profile:', profileError);
        return NextResponse.json({ 
          error: 'Failed to create user profile', 
          details: profileError.message,
          code: profileError.code 
        }, { status: 500 });
      }
      console.log('Profile created:', newProfile);
    }

    // Now create the session
    console.log('Creating research session...');
    const { data: session, error } = await supabase
      .from('research_sessions')
      .insert({
        user_id: user.id,
        title: title || 'New Research Session',
        industry: industry || null,
        phase: 'discovery',
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating session:', error);
      return NextResponse.json({ 
        error: 'Failed to create session', 
        details: error.message,
        code: error.code 
      }, { status: 500 });
    }

    console.log('Session created successfully:', session);

    // Return session with goal for initial message
    return NextResponse.json({ session, goal });
  } catch (error) {
    console.error('Sessions POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
