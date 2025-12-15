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

    const prompt = `You are an expert business analyst. For the business idea below, compute an overall viability score from 0-100.
  You MUST evaluate and return the following component scores (0-100):
  - "trending": how strongly current demand and momentum indicate growth (use signals like search trends, social interest, recent news, niche growth) — 0 means no momentum, 100 means clearly trending upward.
  - "specificity": how specific and well-defined the idea is (not generic or overly broad). 0 = very general, 100 = highly specific actionable idea.
  - "trust": your confidence in the assessment based on available signals and ambiguity (0 = low confidence/high uncertainty, 100 = high confidence/low uncertainty).

  Compute an overall "score" (0-100) that weights these components (describe weights in your breakdown). Then provide a detailed, evidence-backed explanation that justifies the score and each component, noting any assumptions and uncertainties.

  Business Idea: "${idea.trim()}"

  Respond with ONLY valid JSON in this exact format (no markdown, no code blocks):
  {"score": <number 0-100>, "trending": <number 0-100>, "specificity": <number 0-100>, "trust": <number 0-100>, "reason": "<detailed explanation, multiple sentences, include evidence and assumptions>", "breakdown": ["<short bullet 1>", "<short bullet 2>"]}
  `;

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
    let parsed: any;
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
        trending: 50,
        specificity: 50,
        trust: 40,
        reason: 'Unable to fully analyze. The idea shows potential but needs more specific details about target market, unique value proposition, and monetization strategy.',
        breakdown: [
          'Insufficient data to compute trending signals',
          'Idea needs clearer specificity and target market description',
        ],
      };
    }

    // Validate and clamp score
    const score = Math.min(100, Math.max(0, parseInt(parsed.score) || 50));
    const trending = Math.min(100, Math.max(0, parseInt(parsed.trending) || 0));
    const specificity = Math.min(100, Math.max(0, parseInt(parsed.specificity) || 0));
    const trust = Math.min(100, Math.max(0, parseInt(parsed.trust) || 0));
    const reason = parsed.reason || 'Analysis complete.';
    const breakdown = Array.isArray(parsed.breakdown) ? parsed.breakdown : (parsed.breakdown ? [String(parsed.breakdown)] : []);

    return NextResponse.json({ score, trending, specificity, trust, reason, breakdown });
  } catch (error) {
    console.error('Error scoring idea:', error);
    return NextResponse.json(
      { error: 'Failed to score idea' },
      { status: 500 }
    );
  }
}
