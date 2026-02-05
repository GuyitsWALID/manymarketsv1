import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { REFERRAL_BONUS_SESSIONS, MAX_REFERRAL_BONUSES } from '@/lib/config';

// POST /api/referrals/apply - Apply a referral code
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { referralCode } = body;

    if (!referralCode || typeof referralCode !== 'string') {
      return NextResponse.json(
        { error: 'Referral code is required' },
        { status: 400 }
      );
    }

    const cleanCode = referralCode.trim().toUpperCase();

    // Check if user already has a referrer
    const { data: currentProfile, error: currentProfileError } = await supabase
      .from('profiles')
      .select('referred_by, referral_code')
      .eq('id', user.id)
      .single();

    if (currentProfileError) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      );
    }

    if (currentProfile.referred_by) {
      return NextResponse.json(
        { error: 'You have already used a referral code' },
        { status: 400 }
      );
    }

    // Can't use your own code
    if (currentProfile.referral_code === cleanCode) {
      return NextResponse.json(
        { error: 'You cannot use your own referral code' },
        { status: 400 }
      );
    }

    // Find the referrer by code
    const { data: referrer, error: referrerError } = await supabase
      .from('profiles')
      .select('id, referral_count, bonus_sessions')
      .eq('referral_code', cleanCode)
      .single();

    if (referrerError || !referrer) {
      return NextResponse.json(
        { error: 'Invalid referral code' },
        { status: 400 }
      );
    }

    // Check if referrer has reached max bonuses
    const currentBonuses = referrer.bonus_sessions || 0;
    const maxBonuses = MAX_REFERRAL_BONUSES * REFERRAL_BONUS_SESSIONS;
    const canAwardBonus = currentBonuses < maxBonuses;

    // Create referral record
    const { error: referralInsertError } = await supabase
      .from('referrals')
      .insert({
        referrer_id: referrer.id,
        referred_id: user.id,
        bonus_awarded: canAwardBonus,
      });

    if (referralInsertError) {
      console.error('Error creating referral record:', referralInsertError);
      return NextResponse.json(
        { error: 'Failed to apply referral code' },
        { status: 500 }
      );
    }

    // Update referred user's profile
    const { error: referredUpdateError } = await supabase
      .from('profiles')
      .update({ referred_by: referrer.id })
      .eq('id', user.id);

    if (referredUpdateError) {
      console.error('Error updating referred user:', referredUpdateError);
    }

    // Update referrer's stats and bonus (if eligible)
    const newReferralCount = (referrer.referral_count || 0) + 1;
    const newBonusSessions = canAwardBonus 
      ? currentBonuses + REFERRAL_BONUS_SESSIONS 
      : currentBonuses;

    const { error: referrerUpdateError } = await supabase
      .from('profiles')
      .update({
        referral_count: newReferralCount,
        bonus_sessions: newBonusSessions,
      })
      .eq('id', referrer.id);

    if (referrerUpdateError) {
      console.error('Error updating referrer:', referrerUpdateError);
    }

    return NextResponse.json({
      success: true,
      message: 'Referral code applied successfully!',
      bonusAwarded: canAwardBonus,
    });
  } catch (error) {
    console.error('Error applying referral code:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
