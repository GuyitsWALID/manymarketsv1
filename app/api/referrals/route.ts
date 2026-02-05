import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { REFERRAL_BONUS_SESSIONS, MAX_REFERRAL_BONUSES } from '@/lib/config';

// GET /api/referrals - Get user's referral info and stats
export async function GET() {
  try {
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user's profile with referral info
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('referral_code, referral_count, bonus_sessions, referred_by')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      );
    }

    // Get list of users who used this user's referral code
    const { data: referrals, error: referralsError } = await supabase
      .from('referrals')
      .select(`
        id,
        created_at,
        bonus_awarded,
        referred:referred_id (
          email
        )
      `)
      .eq('referrer_id', user.id)
      .order('created_at', { ascending: false });

    return NextResponse.json({
      referralCode: profile.referral_code,
      referralCount: profile.referral_count || 0,
      bonusSessions: profile.bonus_sessions || 0,
      maxBonusSessions: MAX_REFERRAL_BONUSES * REFERRAL_BONUS_SESSIONS,
      bonusPerReferral: REFERRAL_BONUS_SESSIONS,
      wasReferred: !!profile.referred_by,
      referrals: referrals?.map(r => ({
        id: r.id,
        email: (r.referred as any)?.email ? 
          (r.referred as any).email.replace(/(.{2}).*(@.*)/, '$1***$2') : // Mask email
          'Anonymous',
        date: r.created_at,
        bonusAwarded: r.bonus_awarded,
      })) || [],
    });
  } catch (error) {
    console.error('Error fetching referral info:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
