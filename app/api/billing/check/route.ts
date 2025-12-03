import { NextRequest, NextResponse } from 'next/server';
import { autumn } from '@/lib/autumn';
import { createClient } from '@/lib/supabase/server';

// POST - Check if user has access to a feature
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { featureId, requiredBalance = 1 } = await request.json();

    if (!featureId) {
      return NextResponse.json({ error: 'Feature ID required' }, { status: 400 });
    }

    const { data, error } = await autumn.check({
      customer_id: user.id,
      feature_id: featureId,
      required_balance: requiredBalance,
    });

    if (error) {
      // If customer not found, they're on free tier - check based on that
      console.error('Check error:', error);
      return NextResponse.json({
        allowed: false,
        reason: 'Customer not found or feature not available',
      });
    }

    return NextResponse.json({
      allowed: data?.allowed ?? false,
      balance: data?.balance,
      unlimited: data?.unlimited,
    });
  } catch (error) {
    console.error('Feature check error:', error);
    return NextResponse.json(
      { error: 'Failed to check feature access' },
      { status: 500 }
    );
  }
}
