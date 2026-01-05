import { NextRequest, NextResponse } from 'next/server';
import { processBatchEmails } from '@/lib/email';

// Verify cron secret to prevent unauthorized access
const CRON_SECRET = process.env.CRON_SECRET;

export async function POST(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    // Process a batch of 100 emails
    const result = await processBatchEmails(100);
    
    console.log(`Email batch processed: ${result.succeeded} sent, ${result.failed} failed, ${result.remaining} remaining`);
    
    return NextResponse.json({
      success: true,
      ...result,
    });
    
  } catch (error) {
    console.error('Error processing email batch:', error);
    return NextResponse.json({ 
      error: 'Failed to process email batch',
      details: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}

// Also support GET for Vercel Cron
export async function GET(request: NextRequest) {
  return POST(request);
}
