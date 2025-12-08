import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { GumroadAPI, LaunchResult, MarketplacePlatform } from '@/lib/marketplace-integrations';

// Helper to generate URL-friendly slug
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    + '-' + Date.now().toString(36);
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { 
      productId, 
      platforms, 
      productData, 
      connections 
    }: {
      productId: string;
      platforms: MarketplacePlatform[];
      productData: {
        name: string;
        description: string;
        price: number;
        currency?: string;
        tags?: string[];
        productType?: string;
        tagline?: string;
        thumbnailUrl?: string;
        categoryId?: string;
      };
      connections: Record<string, { accessToken: string }>;
    } = body;

    const results: LaunchResult[] = [];

    // Launch to each selected platform
    for (const platform of platforms) {
      if (platform === 'manymarkets') {
        try {
          // First update the product_ideas status
          const { error: updateError } = await supabase
            .from('product_ideas')
            .update({ 
              status: 'launched',
              launched_at: new Date().toISOString(),
              price: productData.price,
            })
            .eq('id', productId)
            .eq('user_id', user.id);

          if (updateError) {
            results.push({
              platform: 'manymarkets',
              success: false,
              error: updateError.message,
            });
            continue;
          }

          // Check if product already exists in marketplace_products
          const { data: existingProduct, error: checkError } = await supabase
            .from('marketplace_products')
            .select('id')
            .eq('seller_id', user.id)
            .eq('name', productData.name)
            .maybeSingle();  // Use maybeSingle() to avoid error when no rows found

          console.log('Checking for existing product:', { name: productData.name, sellerId: user.id, existingProduct, checkError });

          if (existingProduct) {
            // Update existing marketplace product
            const { error: mpUpdateError } = await supabase
              .from('marketplace_products')
              .update({
                status: 'published',
                published_at: new Date().toISOString(),
                price: productData.price,
                description: productData.description,
                tagline: productData.tagline || productData.name,
                category_id: productData.categoryId || null,
                updated_at: new Date().toISOString(),
              })
              .eq('id', existingProduct.id);

            if (mpUpdateError) {
              console.error('Error updating marketplace product:', mpUpdateError);
            }

            results.push({
              platform: 'manymarkets',
              success: true,
              productUrl: `/marketplace?product=${existingProduct.id}`,
              productId: existingProduct.id,
            });
          } else {
            // Create new entry in marketplace_products table
            console.log('Creating new marketplace product for:', productData.name);
            const { data: newProduct, error: mpError } = await supabase
              .from('marketplace_products')
              .insert({
                seller_id: user.id,
                name: productData.name,
                slug: generateSlug(productData.name),
                tagline: productData.tagline || productData.name,
                description: productData.description,
                thumbnail_url: productData.thumbnailUrl || null,
                price_type: productData.price > 0 ? 'one_time' : 'free',
                price: productData.price,
                currency: productData.currency || 'USD',
                features: productData.tags || [],
                category_id: productData.categoryId || null,
                status: 'published',
                published_at: new Date().toISOString(),
              })
              .select('id')
              .single();

            if (mpError) {
              console.error('Error creating marketplace product:', mpError);
              results.push({
                platform: 'manymarkets',
                success: false,
                error: mpError.message,
              });
              continue;
            }

            results.push({
              platform: 'manymarkets',
              success: true,
              productUrl: `/marketplace?product=${newProduct.id}`,
              productId: newProduct.id,
            });
          }
        } catch (err) {
          console.error('ManyMarkets launch error:', err);
          results.push({
            platform: 'manymarkets',
            success: false,
            error: 'Failed to launch to ManyMarkets',
          });
        }
      } else if (platform === 'gumroad') {
        // Launch to Gumroad
        const connection = connections.gumroad;
        if (!connection?.accessToken) {
          results.push({
            platform: 'gumroad',
            success: false,
            error: 'Not connected to Gumroad',
          });
          continue;
        }

        const gumroad = new GumroadAPI(connection.accessToken);
        const result = await gumroad.createProduct({
          name: productData.name,
          description: productData.description,
          price: productData.price,
          currency: productData.currency,
          tags: productData.tags,
        });

        // Store external product ID in our database
        if (result.success && result.productId) {
          await supabase
            .from('product_ideas')
            .update({ 
              external_ids: {
                gumroad: {
                  id: result.productId,
                  url: result.productUrl,
                  launchedAt: new Date().toISOString(),
                }
              }
            })
            .eq('id', productId)
            .eq('user_id', user.id);
        }

        results.push(result);
      }
    }

    const allSuccess = results.every(r => r.success);
    const anySuccess = results.some(r => r.success);

    return NextResponse.json({
      success: anySuccess,
      allSuccess,
      results,
      message: allSuccess 
        ? 'Product launched to all platforms!' 
        : anySuccess 
          ? 'Product launched to some platforms with errors'
          : 'Failed to launch product',
    });
  } catch (error) {
    console.error('Launch error:', error);
    return NextResponse.json(
      { error: 'Failed to launch product' },
      { status: 500 }
    );
  }
}
