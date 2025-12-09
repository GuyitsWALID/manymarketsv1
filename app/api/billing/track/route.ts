import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// POST - Track feature usage (simplified - just logs to database)
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { featureId, value = 1 } = await request.json();

    if (!featureId) {
      return NextResponse.json({ error: 'Feature ID required' }, { status: 400 });
    }

    // For now, we just acknowledge the tracking
    // You can implement your own usage tracking in Supabase if needed
    console.log(`Usage tracked: user=${user.id}, feature=${featureId}, value=${value}`);

    return NextResponse.json({
      success: true,
      tracked: { featureId, value },
    });
  } catch (error) {
    console.error('Usage tracking error:', error);
    return NextResponse.json(
      { error: 'Failed to track usage' },
      { status: 500 }
    );
  }
}
