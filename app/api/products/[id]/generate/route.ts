import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateText } from 'ai';
import { groq, google } from '@/lib/ai/provider';
import { autumn } from '@/lib/autumn';

// Helper function to check if user is Pro via Autumn
async function checkProStatus(userId: string): Promise<boolean> {
  try {
    const { data, error } = await autumn.customers.get(userId);
    if (error) return false;
    const plan = data?.products?.[0]?.id || 'free';
    return plan === 'pro' || plan === 'enterprise';
  } catch {
    return false;
  }
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

    // Check if user is Pro via Autumn
    const isPro = await checkProStatus(user.id);
    
    if (!isPro) {
      return NextResponse.json({ error: 'Pro subscription required' }, { status: 403 });
    }

    const body = await request.json();
    const { type } = body; // 'outline' | 'structure' | 'marketing'

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

    let prompt = '';
    let result: { outline?: unknown; structure?: unknown; marketing?: unknown } = {};

    if (type === 'outline') {
      // Generate content outline for the product
      prompt = `You are an expert content creator and product strategist. Generate a comprehensive content outline for a ${product.product_type || 'digital product'}.

PRODUCT DETAILS:
Name: ${product.name}
Tagline: ${product.tagline || 'Not specified'}
Description: ${product.description || 'Not specified'}
Product Type: ${product.product_type || 'ebook'}
Target Audience: ${product.raw_analysis?.targetAudience || 'General audience'}
Problem Solved: ${product.raw_analysis?.problemSolved || 'Not specified'}
Core Features: ${product.core_features?.join(', ') || 'Not specified'}

Generate a detailed content outline with chapters/modules. For an ebook, include chapters. For a course, include modules. For templates, include template variations.

Respond ONLY with valid JSON (no markdown, no explanation):
{
  "title": "Main title",
  "subtitle": "Optional subtitle",
  "chapters": [
    {
      "id": "ch1",
      "number": 1,
      "title": "Chapter Title",
      "description": "Brief description of what this chapter covers",
      "keyPoints": ["Key point 1", "Key point 2", "Key point 3"],
      "estimatedPages": 10,
      "sections": [
        {
          "id": "s1",
          "title": "Section title",
          "content_type": "text|exercise|checklist|case_study|template"
        }
      ]
    }
  ],
  "bonus_content": [
    {
      "title": "Bonus item title",
      "type": "checklist|template|worksheet|guide"
    }
  ],
  "estimated_total_pages": 100,
  "estimated_word_count": 25000
}`;

      const text = await generateWithFallback(prompt);
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        result.outline = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('Failed to parse outline response');
      }

    } else if (type === 'structure') {
      // Generate product structure (modules, chapters, features)
      prompt = `You are an expert product architect. Generate a detailed structure for a ${product.product_type || 'digital product'}.

PRODUCT DETAILS:
Name: ${product.name}
Tagline: ${product.tagline || 'Not specified'}
Description: ${product.description || 'Not specified'}
Product Type: ${product.product_type || 'ebook'}
Target Audience: ${product.raw_analysis?.targetAudience || 'General audience'}
Core Features: ${product.core_features?.join(', ') || 'Not specified'}
Existing Outline: ${JSON.stringify(product.raw_analysis?.outline) || 'None'}

Create a comprehensive product structure with:
- For ebooks: Parts, chapters, sections
- For courses: Modules, lessons, exercises
- For templates: Categories, template types, variations
- For SaaS: Features, user flows, screens

Respond ONLY with valid JSON (no markdown, no explanation):
{
  "product_structure": {
    "type": "ebook|course|template|saas",
    "parts": [
      {
        "id": "part1",
        "title": "Part Title",
        "description": "What this part covers",
        "modules": [
          {
            "id": "mod1",
            "title": "Module/Chapter Title",
            "learning_objectives": ["Objective 1", "Objective 2"],
            "duration_minutes": 30,
            "content_items": [
              {
                "id": "item1",
                "type": "video|text|exercise|quiz|download",
                "title": "Item title",
                "description": "Brief description"
              }
            ]
          }
        ]
      }
    ],
    "total_modules": 10,
    "estimated_completion_time": "4-6 hours",
    "difficulty_progression": "beginner to intermediate"
  },
  "deliverables": [
    {
      "name": "Main Product",
      "format": "PDF|Video|Template|App",
      "description": "Description"
    }
  ],
  "tech_requirements": ["Requirement 1", "Requirement 2"]
}`;

      const text = await generateWithFallback(prompt);
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        result.structure = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('Failed to parse structure response');
      }

    } else if (type === 'marketing') {
      // Generate marketing copy
      prompt = `You are an expert marketing copywriter. Generate compelling marketing copy for a ${product.product_type || 'digital product'}.

PRODUCT DETAILS:
Name: ${product.name}
Tagline: ${product.tagline || 'Not specified'}
Description: ${product.description || 'Not specified'}
Product Type: ${product.product_type || 'ebook'}
Target Audience: ${product.raw_analysis?.targetAudience || 'General audience'}
Problem Solved: ${product.raw_analysis?.problemSolved || 'Not specified'}
Price: ${product.price_point || '$49'}

Generate marketing materials including a headline, subheadline, benefits, and call to action.

Respond ONLY with valid JSON (no markdown, no explanation):
{
  "headline": "Main compelling headline",
  "subheadline": "Supporting statement",
  "hero_description": "2-3 sentences for the hero section",
  "benefits": [
    {
      "icon": "check|star|zap|target|heart",
      "title": "Benefit title",
      "description": "Short description"
    }
  ],
  "social_proof_angle": "What type of social proof would work best",
  "cta_primary": "Primary button text",
  "cta_secondary": "Secondary action text",
  "urgency_element": "Scarcity or urgency angle",
  "guarantee": "What guarantee to offer",
  "faq": [
    {
      "question": "Common question?",
      "answer": "Answer"
    }
  ]
}`;

      const text = await generateWithFallback(prompt);
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        result.marketing = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('Failed to parse marketing response');
      }
    } else if (type === 'chapter-content') {
      // Generate actual written content for a specific chapter
      const { chapterId, chapterTitle, chapterDescription, keyPoints } = body;
      
      if (!chapterId || !chapterTitle) {
        return NextResponse.json({ error: 'Chapter details required' }, { status: 400 });
      }

      const outline = product.raw_analysis?.outline;
      const structure = product.raw_analysis?.structure;

      prompt = `You are an expert ${product.product_type || 'ebook'} writer. Write the FULL content for the following chapter.

PRODUCT: ${product.name}
PRODUCT TYPE: ${product.product_type || 'ebook'}
TARGET AUDIENCE: ${product.raw_analysis?.targetAudience || 'General audience'}
PROBLEM SOLVED: ${product.raw_analysis?.problemSolved || 'Not specified'}

CHAPTER TO WRITE:
Title: ${chapterTitle}
Description: ${chapterDescription || 'Not provided'}
Key Points to Cover: ${keyPoints?.join(', ') || 'Not specified'}

${outline ? `BOOK OUTLINE CONTEXT:
${outline.chapters?.map((c: { number: number; title: string }) => `Chapter ${c.number}: ${c.title}`).join('\n') || ''}` : ''}

Write engaging, practical content that:
1. Has a strong opening hook
2. Covers each key point with actionable advice
3. Includes examples and practical tips
4. Uses bullet points and formatting for readability
5. Ends with a chapter summary or key takeaways

FORMAT: Write in a conversational but professional tone. Use markdown formatting (headers, bullets, bold for emphasis). Aim for 800-1500 words.

Respond ONLY with valid JSON:
{
  "chapterId": "${chapterId}",
  "content": "The full markdown-formatted chapter content goes here...",
  "wordCount": 1000,
  "readingTimeMinutes": 5,
  "keyTakeaways": ["Takeaway 1", "Takeaway 2", "Takeaway 3"]
}`;

      const text = await generateWithFallback(prompt);
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const chapterContent = JSON.parse(jsonMatch[0]);
        
        // Update the outline with the new chapter content
        const updatedOutline = { ...product.raw_analysis?.outline };
        if (updatedOutline.chapters) {
          updatedOutline.chapters = updatedOutline.chapters.map((ch: { id: string; content?: string; wordCount?: number; readingTimeMinutes?: number; keyTakeaways?: string[] }) => 
            ch.id === chapterId 
              ? { 
                  ...ch, 
                  content: chapterContent.content,
                  wordCount: chapterContent.wordCount,
                  readingTimeMinutes: chapterContent.readingTimeMinutes,
                  keyTakeaways: chapterContent.keyTakeaways
                }
              : ch
          );
        }

        // Save to database
        await supabase
          .from('product_ideas')
          .update({
            raw_analysis: {
              ...product.raw_analysis,
              outline: updatedOutline,
            },
          })
          .eq('id', id)
          .eq('user_id', user.id);

        return NextResponse.json({ success: true, chapterContent, outline: updatedOutline });
      } else {
        throw new Error('Failed to parse chapter content response');
      }
    } else if (type === 'all-chapters') {
      // Generate content for ALL chapters at once
      const outline = product.raw_analysis?.outline;
      
      if (!outline?.chapters || outline.chapters.length === 0) {
        return NextResponse.json({ error: 'No chapters found. Generate outline first.' }, { status: 400 });
      }

      const chaptersWithContent: { id: string; content: string; wordCount: number; readingTimeMinutes: number; keyTakeaways: string[] }[] = [];
      
      // Generate content for each chapter
      for (const chapter of outline.chapters) {
        prompt = `You are an expert ${product.product_type || 'ebook'} writer. Write CONCISE, VALUE-PACKED content for this chapter.

PRODUCT: ${product.name}
TARGET AUDIENCE: ${product.raw_analysis?.targetAudience || 'General audience'}

CHAPTER ${chapter.number}: ${chapter.title}
Description: ${chapter.description || 'Not provided'}
Key Points: ${chapter.keyPoints?.join(', ') || 'Cover the main topic'}

Write practical, actionable content with:
- Strong opening (1-2 sentences)
- 3-5 main points with bullet explanations
- Real examples or tips
- Quick summary/takeaways

Keep it focused and valuable. Aim for 400-700 words.

Respond ONLY with valid JSON:
{
  "content": "## ${chapter.title}\\n\\nYour markdown content here...",
  "wordCount": 500,
  "readingTimeMinutes": 3,
  "keyTakeaways": ["Takeaway 1", "Takeaway 2"]
}`;

        try {
          const text = await generateWithFallback(prompt);
          const jsonMatch = text.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            chaptersWithContent.push({
              id: chapter.id,
              content: parsed.content,
              wordCount: parsed.wordCount || 500,
              readingTimeMinutes: parsed.readingTimeMinutes || 3,
              keyTakeaways: parsed.keyTakeaways || [],
            });
          }
        } catch (chapterError) {
          console.error(`Error generating chapter ${chapter.id}:`, chapterError);
          // Continue with other chapters even if one fails
          chaptersWithContent.push({
            id: chapter.id,
            content: `## ${chapter.title}\n\n*Content generation failed. Please try again.*`,
            wordCount: 0,
            readingTimeMinutes: 0,
            keyTakeaways: [],
          });
        }
      }

      // Update all chapters with content
      const updatedOutline = { ...outline };
      updatedOutline.chapters = outline.chapters.map((ch: { id: string }) => {
        const generated = chaptersWithContent.find(c => c.id === ch.id);
        return generated ? { ...ch, ...generated } : ch;
      });

      // Calculate totals
      const totalWordCount = chaptersWithContent.reduce((sum, ch) => sum + (ch.wordCount || 0), 0);
      updatedOutline.estimated_word_count = totalWordCount;
      updatedOutline.estimated_total_pages = Math.ceil(totalWordCount / 250);

      // Save to database
      await supabase
        .from('product_ideas')
        .update({
          raw_analysis: {
            ...product.raw_analysis,
            outline: updatedOutline,
          },
        })
        .eq('id', id)
        .eq('user_id', user.id);

      return NextResponse.json({ 
        success: true, 
        outline: updatedOutline,
        stats: {
          chaptersGenerated: chaptersWithContent.length,
          totalWordCount,
          estimatedPages: Math.ceil(totalWordCount / 250),
        }
      });
    } else {
      return NextResponse.json({ error: 'Invalid generation type' }, { status: 400 });
    }

    // Update the product with the generated content
    const updateData: Record<string, unknown> = {
      raw_analysis: {
        ...product.raw_analysis,
        ...(type === 'outline' && { outline: result.outline }),
        ...(type === 'structure' && { structure: result.structure }),
        ...(type === 'marketing' && { marketing: result.marketing }),
      },
    };

    await supabase
      .from('product_ideas')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', user.id);

    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    console.error('Generate API error:', error);
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
