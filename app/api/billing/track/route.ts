import { NextRequest, NextResponse } from 'next/server';
import { autumn } from '@/lib/autumn';
import { createClient } from '@/lib/supabase/server';

// POST - Track feature usage
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

    const { data, error } = await autumn.track({
      customer_id: user.id,
      feature_id: featureId,
      value: value,
    });

    if (error) {
      console.error('Track error:', error);
      throw error;
    }

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('Usage tracking error:', error);
    return NextResponse.json(
      { error: 'Failed to track usage' },
      { status: 500 }
    );
  }
}
