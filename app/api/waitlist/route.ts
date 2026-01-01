import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Create a public Supabase client for waitlist (no auth required)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, name, country, referralSource } = body;

    // Validate required fields
    if (!email || !name || !country) {
      return NextResponse.json(
        { error: 'Email, name, and country are required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Please enter a valid email address' },
        { status: 400 }
      );
    }

    // Check if email already exists
    const { data: existing } = await supabase
      .from('waitlist')
      .select('id, position')
      .eq('email', email.toLowerCase())
      .single();

    if (existing) {
      return NextResponse.json({
        success: true,
        message: 'You\'re already on the waitlist!',
        position: existing.position,
        alreadyExists: true,
      });
    }

    // Insert new waitlist entry
    const { data, error } = await supabase
      .from('waitlist')
      .insert({
        email: email.toLowerCase(),
        name: name.trim(),
        country: country.trim(),
        referral_source: referralSource || null,
      })
      .select('id, position')
      .single();

    if (error) {
      console.error('Waitlist insert error:', error);
      
      // Handle unique constraint violation
      if (error.code === '23505') {
        return NextResponse.json({
          success: true,
          message: 'You\'re already on the waitlist!',
          alreadyExists: true,
        });
      }
      
      return NextResponse.json(
        { error: 'Failed to join waitlist. Please try again.' },
        { status: 500 }
      );
    }

    // Send a webhook to n8n (optional) so your automated CRM can send a personalized message
    try {
      const webhookUrl = process.env.N8N_WAITLIST_WEBHOOK_URL;
      if (webhookUrl) {
        const firstName = name ? name.trim().split(' ')[0] : '';
        const personalizedMessage = `Hi ${firstName || ''}! Thank you for joining the ManyMarkets waitlist — you\'re #${data.position} on the list. We\'ll email you when it\'s your turn. Enjoy the early-bird benefits! \n\n— ManyMarkets Team`;

        await fetch(webhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(process.env.N8N_WAITLIST_WEBHOOK_SECRET ? { 'x-waitlist-secret': process.env.N8N_WAITLIST_WEBHOOK_SECRET } : {}),
          },
          body: JSON.stringify({
            email: email.toLowerCase(),
            name: name.trim(),
            country: country.trim(),
            referralSource: referralSource || null,
            position: data.position,
            message: personalizedMessage,
            joinedAt: new Date().toISOString(),
          }),
        });
      }
    } catch (err) {
      console.error('Waitlist webhook error:', err);
      // Don't fail the signup if webhook fails
    }

    return NextResponse.json({
      success: true,
      message: 'Welcome to the ManyMarkets waitlist!',
      position: data.position,
      benefit: 'lifetime_half_price',
    });
  } catch (error) {
    console.error('Waitlist API error:', error);
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    );
  }
}

// GET - Check waitlist stats (optional)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    if (email) {
      // Check specific user's position
      const { data } = await supabase
        .from('waitlist')
        .select('position, created_at')
        .eq('email', email.toLowerCase())
        .single();

      if (data) {
        return NextResponse.json({
          onWaitlist: true,
          position: data.position,
          joinedAt: data.created_at,
        });
      }

      return NextResponse.json({ onWaitlist: false });
    }

    // Get total count
    const { count } = await supabase
      .from('waitlist')
      .select('*', { count: 'exact', head: true });

    return NextResponse.json({
      totalSignups: count || 0,
    });
  } catch (error) {
    console.error('Waitlist GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch waitlist info' },
      { status: 500 }
    );
  }
}
