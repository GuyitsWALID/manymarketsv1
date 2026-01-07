import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Helper to trigger idea generation
async function triggerIdeaGeneration(baseUrl: string): Promise<boolean> {
  try {
    const cronSecret = process.env.CRON_SECRET;
    const response = await fetch(`${baseUrl}/api/cron/generate-daily-idea`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(cronSecret ? { 'Authorization': `Bearer ${cronSecret}` } : {}),
      },
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log('Auto-generated daily idea:', result);
      return true;
    } else {
      console.error('Failed to auto-generate idea:', await response.text());
      return false;
    }
  } catch (error) {
    console.error('Error triggering idea generation:', error);
    return false;
  }
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const date = searchParams.get('date'); // Optional: specific date YYYY-MM-DD
  const industry = searchParams.get('industry'); // Optional: filter by industry
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '10');
  const offset = (page - 1) * limit;
  
  const supabase = await createClient();
  
  // Check if we need to generate today's idea
  const today = new Date().toISOString().split('T')[0];
  const { data: todaysIdea } = await supabase
    .from('daily_niche_ideas')
    .select('id')
    .eq('featured_date', today)
    .eq('is_published', true)
    .single();
  
  // If no idea for today, trigger generation automatically
  if (!todaysIdea) {
    console.log('No idea for today, triggering generation...');
    const baseUrl = request.nextUrl.origin;
    await triggerIdeaGeneration(baseUrl);
    // Wait a bit for the idea to be generated (it takes time)
    // The frontend will show a loading state and refresh
  }
  
  let query = supabase
    .from('daily_niche_ideas')
    .select('*', { count: 'exact' })
    .eq('is_published', true)
    .order('featured_date', { ascending: false })
    .order('display_order', { ascending: true });
  
  // Filter by specific date or default to today and past
  if (date) {
    query = query.eq('featured_date', date);
  }
  
  // Filter by industry
  if (industry) {
    query = query.eq('industry', industry);
  }
  
  // Pagination
  query = query.range(offset, offset + limit - 1);
  
  const { data, error, count } = await query;
  
  if (error) {
    console.error('Error fetching daily ideas:', error);
    return NextResponse.json({ error: 'Failed to fetch ideas' }, { status: 500 });
  }
  
  // Get unique industries for filter dropdown
  const { data: industries } = await supabase
    .from('daily_niche_ideas')
    .select('industry')
    .eq('is_published', true);
  
  const uniqueIndustries = [...new Set(industries?.map(i => i.industry) || [])];
  
  // Check if we're still generating (no ideas but generation was triggered)
  const isGenerating = !todaysIdea && (!data || data.length === 0);
  
  return NextResponse.json({
    ideas: data || [],
    isGenerating, // Tell frontend to show loading and retry
    pagination: {
      page,
      limit,
      total: count || 0,
      totalPages: Math.ceil((count || 0) / limit),
    },
    filters: {
      industries: uniqueIndustries,
    },
  });
}
