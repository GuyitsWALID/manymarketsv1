import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Helper function to check if user is Pro via database
async function checkProStatus(supabase: Awaited<ReturnType<typeof createClient>>, userId: string): Promise<boolean> {
  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('subscription_tier')
      .eq('id', userId)
      .single();
    
    const tier = profile?.subscription_tier || 'free';
    return tier === 'pro' || tier === 'enterprise';
  } catch {
    return false;
  }
}

// GET - Get a single product
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data, error } = await supabase
      .from('product_ideas')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    return NextResponse.json({ product: data });
  } catch (error) {
    console.error('Product API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH - Update a product
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is Pro from database
    const isPro = await checkProStatus(supabase, user.id);
    
    if (!isPro) {
      return NextResponse.json({ error: 'Pro subscription required' }, { status: 403 });
    }

    const body = await request.json();
    
    // Only allow updating certain fields
    const allowedFields = [
      'name', 'tagline', 'description', 'product_type', 'core_features',
      'tech_stack', 'pricing_model', 'price_point', 'revenue_potential',
      'build_time', 'build_difficulty', 'mvp_scope', 'go_to_market_strategy',
      'target_launch_date', 'status', 'is_favorite', 'notes', 'raw_analysis'
    ];

    const updates: Record<string, unknown> = {};
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updates[field] = body[field];
      }
    }

    const { data, error } = await supabase
      .from('product_ideas')
      .update(updates)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating product:', error);
      return NextResponse.json({ error: error.message || 'Failed to update product' }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // If status is being set to 'launched', also create/update marketplace listing
    if (updates.status === 'launched') {
      // Generate a URL-friendly slug from the product name
      const slug = data.name
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim() + '-' + id.slice(0, 8);

      // Get product assets for thumbnail
      const { data: assets } = await supabase
        .from('product_assets')
        .select('url, category')
        .eq('product_id', id)
        .order('created_at', { ascending: true });

      // Find cover image or first image as thumbnail
      const coverAsset = assets?.find(a => a.category === 'cover');
      const thumbnailUrl = coverAsset?.url || assets?.[0]?.url || null;
      const imageUrls = assets?.map(a => a.url) || [];

      // Map pricing_model to price_type
      const priceTypeMap: Record<string, string> = {
        'one_time': 'one_time',
        'subscription': 'subscription',
        'freemium': 'free',
        'usage_based': 'subscription',
        'other': 'one_time'
      };
      const priceType = priceTypeMap[data.pricing_model] || 'one_time';

      // Check if marketplace listing already exists
      const { data: existingListing } = await supabase
        .from('marketplace_products')
        .select('id')
        .eq('seller_id', user.id)
        .eq('name', data.name)
        .single();

      const marketplaceData = {
        seller_id: user.id,
        name: data.name,
        slug: slug,
        tagline: data.tagline || null,
        description: data.description || null,
        thumbnail_url: thumbnailUrl,
        images: imageUrls,
        price_type: priceType,
        price: data.price_point ? parseFloat(data.price_point.replace(/[^0-9.]/g, '')) || 0 : 0,
        features: data.core_features || [],
        tech_stack: data.tech_stack || [],
        status: 'published',
        published_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      if (existingListing) {
        // Update existing listing
        const { error: marketplaceError } = await supabase
          .from('marketplace_products')
          .update(marketplaceData)
          .eq('id', existingListing.id);

        if (marketplaceError) {
          console.error('Error updating marketplace listing:', marketplaceError);
          // Don't fail the whole request, just log the error
        }
      } else {
        // Create new listing
        const { error: marketplaceError } = await supabase
          .from('marketplace_products')
          .insert({
            ...marketplaceData,
            created_at: new Date().toISOString()
          });

        if (marketplaceError) {
          console.error('Error creating marketplace listing:', marketplaceError);
          // Don't fail the whole request, just log the error
        }
      }
    }

    // If status is being changed to 'archived' or anything other than 'launched', 
    // archive the marketplace listing if one exists
    if (updates.status && updates.status !== 'launched') {
      const { error: archiveError } = await supabase
        .from('marketplace_products')
        .update({ 
          status: 'archived',
          updated_at: new Date().toISOString()
        })
        .eq('seller_id', user.id)
        .eq('name', data.name);

      if (archiveError) {
        console.error('Error archiving marketplace listing:', archiveError);
      }
    }

    return NextResponse.json({ product: data });
  } catch (error) {
    console.error('Product API error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// DELETE - Delete a product
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { error } = await supabase
      .from('product_ideas')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error deleting product:', error);
      return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Product API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
