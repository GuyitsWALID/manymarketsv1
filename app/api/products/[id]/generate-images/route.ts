import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateText } from 'ai';
import { groq, google } from '@/lib/ai/provider';

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

interface ImageSuggestion {
  id: string;
  title: string;
  description: string;
  prompt: string;
  category: 'cover' | 'chapter' | 'illustration' | 'diagram' | 'icon';
  priority: number;
}

export async function POST(
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
    const { action, prompt } = body; // 'suggest' | 'generate'

    // Get the product
    const { data: product, error: productError } = await supabase
      .from('product_ideas')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (productError || !product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    if (action === 'suggest') {
      // Generate image suggestions based on product content
      const outline = product.raw_analysis?.outline;
      const structure = product.raw_analysis?.structure;
      
      const aiPrompt = `You are an expert visual content strategist. Based on the following product details, suggest 5-8 images that should be created for this ${product.product_type || 'digital product'}.

PRODUCT DETAILS:
Name: ${product.name}
Type: ${product.product_type || 'ebook'}
Description: ${product.description || 'Not specified'}
Target Audience: ${product.raw_analysis?.targetAudience || 'General audience'}

${outline ? `CONTENT OUTLINE:
Title: ${outline.title}
Chapters: ${outline.chapters?.map((c: { number: number; title: string }) => `${c.number}. ${c.title}`).join(', ') || 'None'}` : ''}

${structure ? `PRODUCT STRUCTURE:
Parts: ${structure.product_structure?.parts?.map((p: { title: string }) => p.title).join(', ') || 'None'}` : ''}

Generate image suggestions for:
1. A main cover image
2. Chapter/section illustrations (based on the outline)
3. Supporting diagrams or infographics
4. Icons or decorative elements

Respond ONLY with valid JSON (no markdown, no explanation):
{
  "suggestions": [
    {
      "id": "img-1",
      "title": "Cover Image",
      "description": "Brief description of what this image shows",
      "prompt": "Detailed image generation prompt for DALL-E or Stable Diffusion, be very specific about style, colors, composition",
      "category": "cover|chapter|illustration|diagram|icon",
      "priority": 1
    }
  ]
}`;

      const text = await generateWithFallback(aiPrompt);
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        const result = JSON.parse(jsonMatch[0]);
        return NextResponse.json({ suggestions: result.suggestions });
      } else {
        throw new Error('Failed to parse suggestions');
      }
    } else if (action === 'generate') {
      // Generate actual image using an image generation service
      // For now, we'll use Unsplash API for free stock images based on prompt keywords
      // In production, you would integrate with DALL-E, Midjourney, or Stable Diffusion
      
      if (!prompt) {
        return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
      }

      // Extract keywords from the prompt for Unsplash search
      const keywords = prompt.split(' ')
        .filter((word: string) => word.length > 3)
        .slice(0, 3)
        .join(',');

      // Use Unsplash Source for random images based on keywords
      // This is a free service that returns random photos
      const imageUrl = `https://source.unsplash.com/800x600/?${encodeURIComponent(keywords)}`;
      
      // Alternative: Use Lorem Picsum for placeholder
      // const imageUrl = `https://picsum.photos/seed/${Date.now()}/800/600`;

      return NextResponse.json({ 
        imageUrl,
        prompt,
        source: 'unsplash'
      });
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Generate images API error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: `Failed to generate: ${errorMessage}` }, { status: 500 });
  }
}

async function generateWithFallback(prompt: string): Promise<string> {
  try {
    const result = await generateText({
      model: groq('llama-3.3-70b-versatile'),
      prompt,
    });
    return result.text;
  } catch (groqError) {
    console.error('Groq API error, trying Google fallback:', groqError);
    try {
      const result = await generateText({
        model: google('gemini-2.0-flash'),
        prompt,
      });
      return result.text;
    } catch (googleError) {
      console.error('Google API also failed:', googleError);
      throw new Error('All AI providers failed');
    }
  }
}
