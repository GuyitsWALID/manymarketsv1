import { NextRequest, NextResponse } from 'next/server';
import { processBatchEmails } from '@/lib/email';

// Verify cron secret to prevent unauthorized access
const CRON_SECRET = process.env.CRON_SECRET;

// Vercel free tier only allows 2 crons, so we process ALL emails in one invocation
// by looping through batches until done (max 10 minutes execution time on Vercel)
const BATCH_SIZE = 100;
const MAX_BATCHES = 50; // Safety limit: 50 batches x 100 = 5000 emails max

export async function POST(request: NextRequest) {
  // Verify cron secret - Vercel sends x-vercel-cron header for cron jobs
  const authHeader = request.headers.get('authorization');
  const vercelCronHeader = request.headers.get('x-vercel-cron');
  
  // Allow if: Vercel cron header present, OR valid CRON_SECRET auth header, OR no CRON_SECRET set
  const isVercelCron = vercelCronHeader === '1';
  const isValidAuth = CRON_SECRET && authHeader === `Bearer ${CRON_SECRET}`;
  const noSecretConfigured = !CRON_SECRET;
  
  if (!isVercelCron && !isValidAuth && !noSecretConfigured) {
    console.log('Unauthorized email cron attempt');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    // Respect feature flag at the cron level for quick early feedback
    const enabled = (process.env.ENABLE_DAILY_IDEA_EMAILS || 'true').toLowerCase() !== 'false';
    if (!enabled) {
      console.log('Email sending is currently disabled via ENABLE_DAILY_IDEA_EMAILS=false');
      return NextResponse.json({ success: true, message: 'Email sending disabled' });
    }

    let totalSucceeded = 0;
    let totalFailed = 0;
    let batchCount = 0;
    let remaining = 1; // Start with 1 to enter the loop
    
    // Keep processing batches until no emails remain or we hit the limit
    while (remaining > 0 && batchCount < MAX_BATCHES) {
      const result = await processBatchEmails(BATCH_SIZE);
      totalSucceeded += result.succeeded;
      totalFailed += result.failed;
      remaining = result.remaining;
      batchCount++;
      
      console.log(`Batch ${batchCount}: ${result.succeeded} sent, ${result.failed} failed, ${remaining} remaining`);
      
      // If no emails were processed in this batch, we're done
      if (result.succeeded === 0 && result.failed === 0) {
        break;
      }
    }
    
    console.log(`Email processing complete: ${totalSucceeded} sent, ${totalFailed} failed in ${batchCount} batches`);
    
    return NextResponse.json({
      success: true,
      totalSucceeded,
      totalFailed,
      batchesProcessed: batchCount,
      remaining,
    });
    
  } catch (error) {
    console.error('Error processing emails:', error);
    return NextResponse.json({ 
      error: 'Failed to process emails',
      details: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}

// Also support GET for Vercel Cron
export async function GET(request: NextRequest) {
  return POST(request);
}
