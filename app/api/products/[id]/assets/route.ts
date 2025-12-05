import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET - List assets for a product
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

    const { data: assets, error } = await supabase
      .from('product_assets')
      .select('*')
      .eq('product_id', id)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching assets:', error);
      return NextResponse.json({ error: 'Failed to fetch assets' }, { status: 500 });
    }

    return NextResponse.json({ assets: assets || [] });
  } catch (error) {
    console.error('Assets API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Upload/save a new asset
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: productId } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify user owns this product
    const { data: product, error: productError } = await supabase
      .from('product_ideas')
      .select('id')
      .eq('id', productId)
      .eq('user_id', user.id)
      .single();

    if (productError || !product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    const contentType = request.headers.get('content-type') || '';
    
    // Handle form data (file upload)
    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const file = formData.get('file') as File | null;
      const name = formData.get('name') as string;
      const type = (formData.get('assetType') as string) || (formData.get('type') as string) || 'other';
      const category = formData.get('category') as string || 'uploaded';

      if (!file) {
        return NextResponse.json({ error: 'No file provided' }, { status: 400 });
      }

      // Upload to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${productId}/${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('product-assets')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 });
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('product-assets')
        .getPublicUrl(fileName);

      // Save asset record
      const { data: asset, error: assetError } = await supabase
        .from('product_assets')
        .insert({
          product_id: productId,
          user_id: user.id,
          name: name || file.name,
          type,
          category,
          storage_path: fileName,
          url: publicUrl,
          thumbnail_url: publicUrl,
          file_size: file.size,
          mime_type: file.type,
        })
        .select()
        .single();

      if (assetError) {
        console.error('Asset record error:', assetError);
        return NextResponse.json({ error: 'Failed to save asset record' }, { status: 500 });
      }

      return NextResponse.json({ asset });
    }
    
    // Handle JSON (generated image URL)
    const body = await request.json();
    const { name, type, category, url, thumbnailUrl, fullUrl, prompt } = body;

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    // For generated images, we'll save the external URL directly
    // Optionally, you could download and re-upload to Supabase storage here
    
    // Download the image and upload to Supabase storage
    try {
      const imageUrl = fullUrl || url;
      const imageResponse = await fetch(imageUrl);
      
      if (!imageResponse.ok) {
        throw new Error('Failed to fetch image');
      }
      
      const imageBlob = await imageResponse.blob();
      const fileExt = 'png'; // Pollinations returns PNG
      const fileName = `${user.id}/${productId}/${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('product-assets')
        .upload(fileName, imageBlob, {
          cacheControl: '3600',
          upsert: false,
          contentType: 'image/png',
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        // Fall back to saving the external URL
        const { data: asset, error: assetError } = await supabase
          .from('product_assets')
          .insert({
            product_id: productId,
            user_id: user.id,
            name: name || 'Generated Image',
            type: type || 'image',
            category: category || 'illustration',
            storage_path: '', // No storage path for external URL
            url: fullUrl || url,
            thumbnail_url: thumbnailUrl || url,
            prompt,
            metadata: { source: 'pollinations', original_url: imageUrl },
          })
          .select()
          .single();

        if (assetError) {
          return NextResponse.json({ error: 'Failed to save asset' }, { status: 500 });
        }

        return NextResponse.json({ asset });
      }

      // Get public URL from Supabase storage
      const { data: { publicUrl } } = supabase.storage
        .from('product-assets')
        .getPublicUrl(fileName);

      // Save asset record with Supabase storage URL
      const { data: asset, error: assetError } = await supabase
        .from('product_assets')
        .insert({
          product_id: productId,
          user_id: user.id,
          name: name || 'Generated Image',
          type: type || 'image',
          category: category || 'illustration',
          storage_path: fileName,
          url: publicUrl,
          thumbnail_url: publicUrl,
          prompt,
          mime_type: 'image/png',
          file_size: imageBlob.size,
          metadata: { source: 'pollinations', original_prompt: prompt },
        })
        .select()
        .single();

      if (assetError) {
        console.error('Asset record error:', assetError);
        return NextResponse.json({ error: 'Failed to save asset record' }, { status: 500 });
      }

      return NextResponse.json({ asset });
    } catch (downloadError) {
      console.error('Image download error:', downloadError);
      // Fall back to saving the external URL
      const { data: asset, error: assetError } = await supabase
        .from('product_assets')
        .insert({
          product_id: productId,
          user_id: user.id,
          name: name || 'Generated Image',
          type: type || 'image',
          category: category || 'illustration',
          storage_path: '',
          url: fullUrl || url,
          thumbnail_url: thumbnailUrl || url,
          prompt,
          metadata: { source: 'external' },
        })
        .select()
        .single();

      if (assetError) {
        return NextResponse.json({ error: 'Failed to save asset' }, { status: 500 });
      }

      return NextResponse.json({ asset });
    }
  } catch (error) {
    console.error('Assets API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Delete an asset
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: productId } = await params;
    const { searchParams } = new URL(request.url);
    const assetId = searchParams.get('assetId');
    
    if (!assetId) {
      return NextResponse.json({ error: 'Asset ID is required' }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the asset to find the storage path
    const { data: asset, error: fetchError } = await supabase
      .from('product_assets')
      .select('*')
      .eq('id', assetId)
      .eq('product_id', productId)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !asset) {
      return NextResponse.json({ error: 'Asset not found' }, { status: 404 });
    }

    // Delete from storage if there's a storage path
    if (asset.storage_path) {
      const { error: storageError } = await supabase.storage
        .from('product-assets')
        .remove([asset.storage_path]);

      if (storageError) {
        console.error('Storage delete error:', storageError);
        // Continue to delete the record even if storage delete fails
      }
    }

    // Delete the asset record
    const { error: deleteError } = await supabase
      .from('product_assets')
      .delete()
      .eq('id', assetId)
      .eq('user_id', user.id);

    if (deleteError) {
      console.error('Delete error:', deleteError);
      return NextResponse.json({ error: 'Failed to delete asset' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Assets API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
