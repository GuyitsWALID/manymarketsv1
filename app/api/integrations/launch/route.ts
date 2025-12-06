import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { GumroadAPI, LaunchResult, MarketplacePlatform } from '@/lib/marketplace-integrations';

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
      };
      connections: Record<string, { accessToken: string }>;
    } = body;

    const results: LaunchResult[] = [];

    // Launch to each selected platform
    for (const platform of platforms) {
      if (platform === 'manymarkets') {
        // Launch to ManyMarkets (update product status)
        const { error } = await supabase
          .from('product_ideas')
          .update({ 
            status: 'launched',
            launched_at: new Date().toISOString(),
            price: productData.price,
          })
          .eq('id', productId)
          .eq('user_id', user.id);

        results.push({
          platform: 'manymarkets',
          success: !error,
          productUrl: error ? undefined : `/marketplace?product=${productId}`,
          productId: error ? undefined : productId,
          error: error?.message,
        });
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
