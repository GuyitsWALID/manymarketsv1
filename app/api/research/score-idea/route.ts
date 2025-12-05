import { NextRequest, NextResponse } from 'next/server';
import { generateText } from 'ai';
import { groq, google } from '@/lib/ai/provider';

export async function POST(request: NextRequest) {
  try {
    const { idea } = await request.json();

    if (!idea || typeof idea !== 'string' || idea.trim().length < 3) {
      return NextResponse.json(
        { error: 'Please provide a valid business idea' },
        { status: 400 }
      );
    }

    const prompt = `You are an expert business analyst. Score this business idea on a scale of 0-100 based on:
- Market potential and demand
- Competition level
- Feasibility and execution difficulty
- Revenue potential
- Target audience clarity

Business Idea: "${idea.trim()}"

Respond with ONLY valid JSON in this exact format (no markdown, no code blocks):
{"score": <number 0-100>, "reason": "<2-3 sentence explanation>"}`;

    let result;
    
    // Try Groq first, fall back to Gemini
    try {
      console.log('Scoring idea with Groq...');
      result = await generateText({
        model: groq('llama-3.3-70b-versatile'),
        prompt,
      });
    } catch (groqError) {
      console.log('Groq failed, trying Gemini...', groqError);
      result = await generateText({
        model: google('gemini-2.0-flash'),
        prompt,
      });
    }

    // Parse the response
    let parsed;
    try {
      // Clean the response - remove any markdown formatting
      let cleanText = result.text.trim();
      cleanText = cleanText.replace(/```json\s*/gi, '').replace(/```\s*/g, '');
      
      // Find JSON object
      const jsonMatch = cleanText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.error('Failed to parse AI response:', result.text);
      // Fallback with reasonable defaults
      parsed = {
        score: 50,
        reason: 'Unable to fully analyze. The idea shows potential but needs more specific details about target market, unique value proposition, and monetization strategy.'
      };
    }

    // Validate and clamp score
    const score = Math.min(100, Math.max(0, parseInt(parsed.score) || 50));
    const reason = parsed.reason || 'Analysis complete.';

    return NextResponse.json({ score, reason });
  } catch (error) {
    console.error('Error scoring idea:', error);
    return NextResponse.json(
      { error: 'Failed to score idea' },
      { status: 500 }
    );
  }
}
