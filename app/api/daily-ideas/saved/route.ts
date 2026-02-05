import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { FREE_SAVED_IDEAS_LIMIT, PRO_SAVED_IDEAS_LIMIT } from '@/lib/config';

// Helper to check if user is Pro
async function checkProStatus(supabase: Awaited<ReturnType<typeof createClient>>, userId: string): Promise<boolean> {
  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('status')
    .eq('user_id', userId)
    .in('status', ['active', 'trialing'])
    .maybeSingle();

  return !!subscription;
}

// GET - Retrieve user's saved idea IDs
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: savedIdeas, error } = await supabase
      .from('saved_ideas')
      .select('idea_id')
      .eq('user_id', user.id);

    if (error) {
      console.error('Error fetching saved ideas:', error);
      return NextResponse.json({ error: 'Failed to fetch saved ideas' }, { status: 500 });
    }

    const ideaIds = savedIdeas?.map(s => s.idea_id) || [];

    return NextResponse.json({ savedIdeaIds: ideaIds });
  } catch (error) {
    console.error('Saved ideas GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Save an idea
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { ideaId } = await request.json();

    if (!ideaId) {
      return NextResponse.json({ error: 'Idea ID is required' }, { status: 400 });
    }

    // Check current count
    const { count, error: countError } = await supabase
      .from('saved_ideas')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    if (countError) {
      console.error('Error counting saved ideas:', countError);
      return NextResponse.json({ error: 'Failed to check saved ideas count' }, { status: 500 });
    }

    // Check Pro status and apply limits
    const isPro = await checkProStatus(supabase, user.id);
    const limit = isPro ? PRO_SAVED_IDEAS_LIMIT : FREE_SAVED_IDEAS_LIMIT;

    if ((count || 0) >= limit) {
      return NextResponse.json({ 
        error: `You've reached the limit of ${limit} saved ideas. ${!isPro ? 'Upgrade to Pro for unlimited saves!' : ''}`,
        limitReached: true
      }, { status: 403 });
    }

    // Save the idea
    const { error: insertError } = await supabase
      .from('saved_ideas')
      .insert({
        user_id: user.id,
        idea_id: ideaId
      });

    if (insertError) {
      // Handle duplicate
      if (insertError.code === '23505') {
        return NextResponse.json({ error: 'Idea already saved' }, { status: 409 });
      }
      console.error('Error saving idea:', insertError);
      return NextResponse.json({ error: 'Failed to save idea' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Idea saved!' });
  } catch (error) {
    console.error('Saved ideas POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Unsave an idea
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const ideaId = searchParams.get('ideaId');

    if (!ideaId) {
      return NextResponse.json({ error: 'Idea ID is required' }, { status: 400 });
    }

    const { error } = await supabase
      .from('saved_ideas')
      .delete()
      .eq('user_id', user.id)
      .eq('idea_id', ideaId);

    if (error) {
      console.error('Error removing saved idea:', error);
      return NextResponse.json({ error: 'Failed to remove saved idea' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Idea removed from saved' });
  } catch (error) {
    console.error('Saved ideas DELETE error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
