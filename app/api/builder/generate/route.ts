import { NextResponse } from 'next/server';
import { generateText } from 'ai';
import { models } from '../../../../lib/ai/provider';

export async function POST(request: Request) {
  try {
    const { taskId, prompt, context, productType } = await request.json();

    // Build task-specific prompts for short, first-person responses
    let systemPrompt = '';
    let userPrompt = '';

    const contextInfo = Object.entries(context)
      .filter(([, value]) => value && typeof value === 'string')
      .map(([key, value]) => `${key}: ${value}`)
      .join('\n');

    if (taskId === 'targetAudience') {
      systemPrompt = `You are helping a product creator fill out their product form. 
Generate a SHORT, first-person response (2-4 sentences max) describing who this product is for.
Write as if YOU are the product creator describing YOUR target audience.
Start directly with the answer - no explanations, no headers, no bullet points.
Example format: "My target audience is busy professionals aged 25-45 who struggle with productivity and want simple tools to stay organized."`;

      userPrompt = `Product: ${context.name || 'Unknown'}
Tagline: ${context.tagline || 'None'}
Description: ${context.description || 'None'}

Write a brief, first-person description of the target audience (2-4 sentences). Start with "My target audience is..." or similar.`;

    } else if (taskId === 'problemSolved') {
      systemPrompt = `You are helping a product creator fill out their product form.
Generate a SHORT, first-person response (2-4 sentences max) describing what problem this product solves.
Write as if YOU are the product creator describing the problem YOUR product solves.
Start directly with the answer - no explanations, no headers, no bullet points.
Example format: "This product solves the frustration of managing multiple apps for wellness. It helps users save time and reduce stress by providing everything in one place."`;

      userPrompt = `Product: ${context.name || 'Unknown'}
Tagline: ${context.tagline || 'None'}
Description: ${context.description || 'None'}

Write a brief, first-person description of the problem this product solves (2-4 sentences). Start with "This product solves..." or "My product helps..." or similar.`;

    } else {
      // Default prompt for other tasks
      systemPrompt = `You are an expert digital product creator. 
Provide SHORT, practical, first-person responses (2-4 sentences max).
Write as if you are the product creator filling out their own form.
No explanations, headers, or bullet points - just the direct answer.`;

      userPrompt = `Product Type: ${productType}

Product Information:
${contextInfo || 'No information provided yet'}

Task: ${prompt}

Provide a brief, first-person response (2-4 sentences max).`;
    }

    // Prefer the product-builder Groq key (if configured) for builder traffic
    const hasBuilderKey = !!(process.env.GROQ_PRODUCT_BUILDER_API_KEY && process.env.GROQ_PRODUCT_BUILDER_API_KEY !== '' && process.env.GROQ_PRODUCT_BUILDER_API_KEY !== 'your_groq_api_key');
    console.log(`Builder generation - GROQ_PRODUCT_BUILDER_API_KEY configured: ${hasBuilderKey}`);

    // Candidate models (try in order until one succeeds)
    const candidates: Array<{ name: string; model: any }> = [];
    if (hasBuilderKey) {
      candidates.push({ name: 'groqProductBuilder-70b', model: models.groqProductBuilder() });
    }
    // Add a smaller/faster groq fallback in case the heavy model is rate-limited
    candidates.push({ name: 'groqLlama8B', model: models.groqLlama8B() });
    candidates.push({ name: 'groqMixtral', model: models.groqMixtral() });
    // Finally try Google Gemini as a last-resort fallback
    candidates.push({ name: 'geminiFlash', model: models.geminiFlash() });

    let lastError: any = null;
    for (const cand of candidates) {
      try {
        console.log(`Attempting generation with model: ${cand.name}`);
        const res = await generateText({ model: cand.model, system: systemPrompt, prompt: userPrompt });
        const text = res.text || (res?.output?.[0]?.content[0]?.text) || '';
        console.log(`Generation succeeded with model: ${cand.name}`);
        return NextResponse.json({ content: text });
      } catch (err: any) {
        lastError = err;
        console.warn(`Model ${cand.name} failed: ${err?.message || err}`);
        // If rate-limited, continue to next candidate immediately
        if (err?.statusCode === 429 || (err?.data && err.data.error && err.data.error.code === 'rate_limit_exceeded')) {
          console.warn(`Rate-limited on ${cand.name}; trying next fallback model.`);
          continue;
        }
        // For other non-retryable errors, try next candidate as well
        continue;
      }
    }

    // All candidates failed
    console.error('All model candidates failed for builder generation', lastError);
    return NextResponse.json({ error: 'Failed to generate content (all providers failed)' }, { status: 500 });

    return NextResponse.json({ content: text });
  } catch (error) {
    console.error('Error generating content:', error);
    return NextResponse.json(
      { error: 'Failed to generate content' },
      { status: 500 }
    );
  }
}
