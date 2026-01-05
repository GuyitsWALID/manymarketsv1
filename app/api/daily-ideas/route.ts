import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const date = searchParams.get('date'); // Optional: specific date YYYY-MM-DD
  const industry = searchParams.get('industry'); // Optional: filter by industry
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '10');
  const offset = (page - 1) * limit;
  
  const supabase = await createClient();
  
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
  
  return NextResponse.json({
    ideas: data || [],
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
