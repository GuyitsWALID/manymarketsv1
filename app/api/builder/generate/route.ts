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

    // Use GROQ Llama 3.3 70B explicitly for consistent results
    const model = models.groqLlama70B();
    const { text } = await generateText({
      model,
      system: systemPrompt,
      prompt: userPrompt,
    });

    return NextResponse.json({ content: text });
  } catch (error) {
    console.error('Error generating content:', error);
    return NextResponse.json(
      { error: 'Failed to generate content' },
      { status: 500 }
    );
  }
}
