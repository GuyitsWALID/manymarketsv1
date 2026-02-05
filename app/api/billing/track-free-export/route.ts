import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { FREE_WATERMARKED_EXPORTS } from '@/lib/config';

// POST - Track a free export usage
export async function POST() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get current export count
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('free_exports_used')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error('Error fetching profile:', profileError);
      return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
    }

    const currentExports = profile?.free_exports_used || 0;

    // Check if user has exceeded limit
    if (currentExports >= FREE_WATERMARKED_EXPORTS) {
      return NextResponse.json({ 
        error: 'Free export limit reached',
        limitReached: true,
        used: currentExports,
        limit: FREE_WATERMARKED_EXPORTS
      }, { status: 403 });
    }

    // Increment export count
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ free_exports_used: currentExports + 1 })
      .eq('id', user.id);

    if (updateError) {
      console.error('Error updating export count:', updateError);
      return NextResponse.json({ error: 'Failed to update export count' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true,
      used: currentExports + 1,
      limit: FREE_WATERMARKED_EXPORTS,
      remaining: FREE_WATERMARKED_EXPORTS - (currentExports + 1)
    });
  } catch (error) {
    console.error('Track free export error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
