import { NextResponse } from 'next/server';
import { generateText } from 'ai';
import { models } from '@/lib/ai/provider';
import { getDailyPrompts as fallbackPrompts } from '@/lib/chat/dailyPrompts';

// Simple in-memory per-day cache to avoid regenerating prompts on every request
let cachedDate = '';
let cachedPrompts: string[] = [];

export async function GET() {
  const today = new Date().toISOString().slice(0, 10);

  // Return cached if same day
  if (cachedDate === today && cachedPrompts.length > 0) {
    return NextResponse.json({ prompts: cachedPrompts, date: today }, { headers: { 'Cache-Control': 'public, max-age=3600' } });
  }

  // Compose system + user prompts for deterministic JSON output
  const systemPrompt = `You are a creative daily prompt generator for ManyMarkets. Produce exactly 5 unique, short, interesting quick prompts suitable for product research and ideation. Return the output as a JSON array of strings and nothing else.`;
  const userPrompt = `Date: ${today}\nContext: general\nRequirements: 5 items, concise (<= 120 chars), varied, and actionable. Output only a JSON array like ["...","..."].`;

  try {
    const model = models.groqLlama70B();
    const { text } = await generateText({ model, system: systemPrompt, prompt: userPrompt });

    let prompts: string[] = [];
    try {
      // Prefer strict JSON parse
      prompts = JSON.parse(text) as string[];
      if (!Array.isArray(prompts)) throw new Error('Not an array');
      prompts = prompts.map(p => (typeof p === 'string' ? p.trim() : String(p))).filter(Boolean).slice(0, 5);
    } catch (parseErr) {
      // Fallback: extract lines or bracketed items
      const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
      // Try to pick up lines that look like prompts
      prompts = lines
        .map(l => l.replace(/^[-*\d.\)\s]+/, ''))
        .filter(l => l.length > 5)
        .slice(0, 5);
    }

    // If generation failed or empty, use deterministic fallback
    if (!prompts || prompts.length === 0) {
      prompts = fallbackPrompts(5, new Date());
    }

    // Cache for the day
    cachedDate = today;
    cachedPrompts = prompts;

    return NextResponse.json({ prompts, date: today, source: 'ai' }, { headers: { 'Cache-Control': 'public, max-age=3600' } });
  } catch (err) {
    console.error('Daily prompts generation failed:', err);
    const prompts = fallbackPrompts(5, new Date());
    cachedDate = today;
    cachedPrompts = prompts;
    return NextResponse.json({ prompts, date: today, source: 'fallback' }, { headers: { 'Cache-Control': 'public, max-age=3600' } });
  }
}
