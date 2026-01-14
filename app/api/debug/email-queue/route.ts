import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const CRON_SECRET = process.env.CRON_SECRET;

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const vercelCronHeader = request.headers.get('x-vercel-cron');
  const isValidAuth = CRON_SECRET && authHeader === `Bearer ${CRON_SECRET}`;
  const isVercelCron = vercelCronHeader === '1';
  const noSecretConfigured = !CRON_SECRET;

  if (!isValidAuth && !isVercelCron && !noSecretConfigured) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const supabase = getSupabaseAdmin();

    const [{ count: pending }, { count: sent }, { count: failed }] = await Promise.all([
      supabase.from('daily_idea_email_queue').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase.from('daily_idea_email_queue').select('id', { count: 'exact', head: true }).eq('status', 'sent'),
      supabase.from('daily_idea_email_queue').select('id', { count: 'exact', head: true }).eq('status', 'failed'),
    ]);

    const { data: pendingRows } = await supabase
      .from('daily_idea_email_queue')
      .select('id, user_id, idea_id, status, error, provider_message_id, provider_response, created_at, sent_at')
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(20);

    const { data: recentFailed } = await supabase
      .from('daily_idea_email_queue')
      .select('id, user_id, idea_id, status, error, provider_message_id, provider_response, created_at, sent_at')
      .eq('status', 'failed')
      .order('created_at', { ascending: false })
      .limit(20);

    const enabled = (process.env.ENABLE_DAILY_IDEA_EMAILS || 'true').toLowerCase() !== 'false';
    return NextResponse.json({ pending: pending || 0, sent: sent || 0, failed: failed || 0, pendingRows, recentFailed, enabled });
  } catch (err: any) {
    console.error('Debug endpoint error:', err?.message || err);
    return NextResponse.json({ error: 'Failed to query queue', details: err?.message || String(err) }, { status: 500 });
  }
}