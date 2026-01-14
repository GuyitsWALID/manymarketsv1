import { NextRequest, NextResponse } from 'next/server';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { generateText } from 'ai';
import { getModel, getDailyModel } from '@/lib/ai/provider';
import { searchWeb } from '@/lib/research/web-search';
import { queueEmailsForIdea } from '@/lib/email';

// Verify cron secret to prevent unauthorized access
const CRON_SECRET = process.env.CRON_SECRET;

// Lazy-initialized Supabase admin client (prevents build-time errors)
let _supabaseAdmin: SupabaseClient | null = null;
function getSupabaseAdmin(): SupabaseClient {
  if (!_supabaseAdmin) {
    _supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
  }
  return _supabaseAdmin;
}

// Rotating industries for variety
const INDUSTRIES = [
  'AI & Automation',
  'Remote Work & Productivity',
  'Health & Wellness',
  'Education & E-Learning',
  'Creator Economy',
  'Sustainability & Green Tech',
  'Finance & Investing',
  'Gaming & Entertainment',
  'E-commerce & Retail',
  'Real Estate & PropTech',
  'Food & Beverage',
  'Fitness & Sports',
  'Pet Industry',
  'Beauty & Personal Care',
  'Travel & Hospitality',
  'Parenting & Family',
  'Career & Professional Development',
  'Mental Health & Mindfulness',
  'Home & DIY',
  'B2B SaaS & Enterprise',
];

// Helper function to generate AI analysis with fallback
async function generateAnalysis(prompt: string): Promise<string> {
  // Try a series of models with sensible token limits and fallbacks.
  // Prefer the daily API key models (groqDaily) and fall back to smaller groq models
  // before attempting Gemini.
  const modelCandidates: { name: string; modelFactory: any; maxTokens: number }[] = [];

  // Primary (prefers GROQ_DAILY_API_KEY via getDailyModel)
  modelCandidates.push({ name: 'groq-daily-primary', modelFactory: getDailyModel(), maxTokens: 4000 });

  // Lower-cost groq alternatives using the same daily key (if set)
  // Import groqDaily at runtime to avoid module load issues
  try {
    const { groqDaily } = await import('@/lib/ai/provider');
    modelCandidates.push({ name: 'groq-daily-8b', modelFactory: groqDaily('llama-3.1-8b-instant'), maxTokens: 2500 });
    modelCandidates.push({ name: 'groq-daily-mixtral', modelFactory: groqDaily('mixtral-8x7b-32768'), maxTokens: 2500 });
  } catch (e) {
    // If groqDaily isn't available for some reason, we'll skip these
    console.warn('groqDaily import failed or unavailable, skipping smaller groq alternatives');
  }

  // Finally, try Gemini fallback (if groq options exhausted)
  modelCandidates.push({ name: 'gemini-flash', modelFactory: (await import('@/lib/ai/provider')).google('gemini-2.0-flash'), maxTokens: 2000 });

  // Helper to detect rate-limit/quota errors
  function isRateLimitError(err: any) {
    const msg = String(err?.message || err || '').toLowerCase();
    return msg.includes('rate limit') || msg.includes('quota') || msg.includes('tokens per day') || msg.includes('exceeded');
  }

  for (const candidate of modelCandidates) {
    console.log(`Attempting AI generation with model candidate: ${candidate.name}`);

    // Try several attempts with exponential backoff for transient errors
    const maxAttempts = 3;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const { text } = await generateText({ model: candidate.modelFactory, prompt, maxTokens: candidate.maxTokens } as any);
        console.log(`AI generation succeeded with ${candidate.name} on attempt ${attempt}`);
        return text;
      } catch (err: any) {
        console.error(`Model ${candidate.name} attempt ${attempt} failed:`, err?.message || err);
        if (isRateLimitError(err)) {
          console.warn(`Model ${candidate.name} hit rate/quota limits: ${err?.message || err}`);
          // Break out of attempts and try next candidate model
          break;
        }
        // For transient errors, wait and retry
        if (attempt < maxAttempts) {
          const waitMs = Math.min(5000 * Math.pow(2, attempt - 1), 20000);
          console.log(`Retrying ${candidate.name} after ${waitMs}ms (attempt ${attempt + 1})`);
          await new Promise(r => setTimeout(r, waitMs));
          continue;
        } else {
          console.warn(`Exhausted attempts for ${candidate.name}, moving to next candidate`);
        }
      }
    }
  }

  // If we reach here, all models failed
  throw new Error('AI generation failed: All models exhausted or rate-limited');
}

export async function POST(request: NextRequest) {
  // Verify cron secret - Vercel sends this automatically for cron jobs
  // For manual triggers, use Authorization header
  const authHeader = request.headers.get('authorization');
  const vercelCronHeader = request.headers.get('x-vercel-cron');
  
  // Allow if: Vercel cron header present, OR valid CRON_SECRET auth header, OR no CRON_SECRET set
  const isVercelCron = vercelCronHeader === '1';
  const isValidAuth = CRON_SECRET && authHeader === `Bearer ${CRON_SECRET}`;
  const noSecretConfigured = !CRON_SECRET;
  
  if (!isVercelCron && !isValidAuth && !noSecretConfigured) {
    console.log('Unauthorized cron attempt. Headers:', { authHeader: !!authHeader, vercelCron: vercelCronHeader });
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    const today = new Date().toISOString().split('T')[0];
    
    // Check if we already have an idea for today
    const { data: existingIdea } = await getSupabaseAdmin()
      .from('daily_niche_ideas')
      .select('id')
      .eq('featured_date', today)
      .single();
    
    if (existingIdea) {
      return NextResponse.json({ 
        message: 'Idea already exists for today',
        ideaId: existingIdea.id,
      });
    }
    
    // Pick a random industry based on day of year
    const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
    const industry = INDUSTRIES[dayOfYear % INDUSTRIES.length];
    
    console.log(`Generating daily idea for industry: ${industry}`);
    
    // Step 1: Research the industry
    const searchQueries = [
      `${industry} emerging trends 2025`,
      `${industry} underserved markets startups`,
      `${industry} problems pain points reddit`,
      `${industry} startup opportunities gaps`,
    ];
    
    const allResults = await Promise.all(searchQueries.map(q => searchWeb(q)));
    const searchContext = allResults.flat().slice(0, 20);
    
    // Build context string - works with or without web results
    const webResearchSection = searchContext.length > 0 
      ? `Web Research Context:
${searchContext.map(r => `- ${r.title}: ${r.snippet}`).join('\n')}`
      : `Note: Use your training knowledge about ${industry} trends, pain points, and opportunities from 2024-2025.`;
    
    // Step 2: Generate a complete niche idea with full research
    const generationPrompt = `You are an expert market researcher finding a hidden gem niche opportunity.

Industry: "${industry}"

${webResearchSection}

Find ONE highly specific, underserved niche opportunity (Unique Value Zone) in this industry.

Requirements:
1. Must be SPECIFIC - not broad like "health apps" but specific like "Sleep tracking for night shift nurses"
2. Must have REAL demand signals based on market trends
3. Must have LOW to MEDIUM competition
4. Must be actionable for a solo founder or small team

CRITICAL: Return ONLY valid, parseable JSON. Do NOT include literal newlines inside string values - use \\n if needed. Keep all text on single lines within quotes.

Return ONLY valid JSON:
{
  "name": "Specific Niche Name (5-8 words max)",
  "industry": "${industry}",
  "one_liner": "One compelling sentence describing the opportunity",
  "description": "2-3 paragraph detailed description of the niche opportunity",
  "target_audience": "Super specific target customer with demographics, psychographics, and behaviors",
  "core_problem": "The exact painful problem this audience faces that isn't being solved well",
  "opportunity_score": 8.5,
  "demand_level": "high",
  "competition_level": "low",
  "trending_score": 7.5,
  "market_size": "$X.XB (be specific with a number)",
  "growth_rate": "XX% CAGR",
  "pain_points": [
    "Specific pain point 1 with context",
    "Specific pain point 2 with context",
    "Specific pain point 3 with context",
    "Specific pain point 4 with context",
    "Specific pain point 5 with context"
  ],
  "monetization_ideas": [
    {
      "model": "SaaS/Course/Template/Community/Marketplace/Consulting",
      "description": "How to monetize",
      "price_range": "$X-$Y",
      "recurring": true
    },
    {
      "model": "Second monetization model",
      "description": "Alternative way to monetize",
      "price_range": "$X-$Y",
      "recurring": false
    }
  ],
  "product_ideas": [
    {
      "type": "SaaS",
      "name": "Product 1 name",
      "tagline": "One-liner",
      "description": "What it does and why it's valuable",
      "core_features": ["Feature 1", "Feature 2", "Feature 3"],
      "price_point": "$X/month",
      "build_time": "X weeks",
      "build_difficulty": "Easy/Medium/Hard",
      "mvp_scope": "Minimum viable product description"
    },
    {
      "type": "Course",
      "name": "Product 2 name",
      "tagline": "One-liner",
      "description": "Educational product idea",
      "core_features": ["Module 1", "Module 2", "Module 3"],
      "price_point": "$X one-time",
      "build_time": "X weeks",
      "build_difficulty": "Easy/Medium/Hard",
      "mvp_scope": "MVP description"
    },
    {
      "type": "Template/Tool",
      "name": "Product 3 name",
      "tagline": "One-liner",
      "description": "Downloadable or tool-based product",
      "core_features": ["Feature 1", "Feature 2", "Feature 3"],
      "price_point": "$X one-time",
      "build_time": "X weeks",
      "build_difficulty": "Easy",
      "mvp_scope": "MVP description"
    },
    {
      "type": "Community",
      "name": "Product 4 name",
      "tagline": "One-liner",
      "description": "Community or membership product",
      "core_features": ["Benefit 1", "Benefit 2", "Benefit 3"],
      "price_point": "$X/month",
      "build_time": "X weeks",
      "build_difficulty": "Medium",
      "mvp_scope": "MVP description"
    },
    {
      "type": "Service/Consulting",
      "name": "Product 5 name",
      "tagline": "One-liner",
      "description": "Done-for-you or consulting service",
      "core_features": ["Deliverable 1", "Deliverable 2", "Deliverable 3"],
      "price_point": "$X per project",
      "build_time": "X weeks",
      "build_difficulty": "Medium",
      "mvp_scope": "MVP description"
    }
  ],
  "validation_signals": [
    {
      "type": "Search Demand",
      "description": "Evidence of people searching for solutions in this space",
      "evidence": "Specific data point or observation"
    },
    {
      "type": "Social Proof",
      "description": "Communities, discussions, or groups focused on this problem",
      "evidence": "Where you found this (Reddit, Facebook groups, etc.)"
    },
    {
      "type": "Competitor Activity",
      "description": "Existing solutions and their limitations",
      "evidence": "What competitors exist and where they fall short"
    },
    {
      "type": "Market Trend",
      "description": "Growing trend supporting this opportunity",
      "evidence": "Data or news supporting the trend"
    }
  ],
  "full_research_report": {
    "executive_summary": "2-3 sentence overview of the opportunity",
    "market_analysis": {
      "overview": "Market landscape description",
      "size_and_growth": "Detailed market size and growth projections",
      "key_trends": ["Trend 1", "Trend 2", "Trend 3"],
      "drivers": ["Driver 1", "Driver 2"]
    },
    "competitive_landscape": {
      "saturation_level": "Low/Medium/High",
      "major_players": ["Player 1 - what they do", "Player 2 - what they do"],
      "gaps_and_opportunities": ["Gap 1", "Gap 2"],
      "barriers_to_entry": "Low/Medium/High with explanation"
    },
    "target_customer_profile": {
      "demographics": "Age, location, income, etc.",
      "psychographics": "Values, interests, lifestyle",
      "behaviors": "Online habits, buying patterns",
      "where_to_find_them": ["Channel 1", "Channel 2", "Channel 3"]
    },
    "go_to_market_strategy": {
      "positioning": "How to position in the market",
      "channels": ["Marketing channel 1", "Channel 2"],
      "quick_wins": ["Quick win 1", "Quick win 2"],
      "content_ideas": ["Content idea 1", "Content idea 2"]
    },
    "risk_assessment": {
      "risks": [
        {"risk": "Risk description", "severity": "High/Medium/Low", "mitigation": "How to mitigate"}
      ],
      "overall_risk_level": "Low/Medium/High"
    },
    "action_plan": {
      "week_1": "What to do first week",
      "month_1": "First month milestones",
      "month_3": "Three month goals"
    },
    "verdict": "GO/CAUTION - clear recommendation with reasoning"
  }
}`;

    const analysis = await generateAnalysis(generationPrompt);
    
    // Log the raw response for debugging
    console.log('AI Response length:', analysis.length);
    console.log('AI Response first 500 chars:', analysis.substring(0, 500));
    
    let ideaData: any;
    try {
      // Try to extract JSON from the response - handle markdown code blocks
      let jsonStr = analysis;
      
      // Remove markdown code blocks if present
      const codeBlockMatch = analysis.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (codeBlockMatch) {
        jsonStr = codeBlockMatch[1];
      }
      
      // Find the JSON object
      const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        let rawJson = jsonMatch[0];

        // Trim any trailing characters after the final closing brace (common when AI output is followed by extra text)
        const lastClose = rawJson.lastIndexOf('}');
        if (lastClose !== -1) rawJson = rawJson.substring(0, lastClose + 1);
        // 1. Replace literal newlines inside strings with escaped newlines
        // This regex matches content between quotes and fixes unescaped newlines
        rawJson = rawJson.replace(/"([^"\\]*(\\.[^"\\]*)*)"/g, (match) => {
          // Replace actual newlines/carriage returns with escaped versions inside strings
          return match
            .replace(/\r\n/g, '\\n')
            .replace(/\r/g, '\\n')
            .replace(/\n/g, '\\n')
            .replace(/\t/g, '\\t');
        });
        
        // 2. Try to parse, if it fails, try a more aggressive cleanup
        try {
          ideaData = JSON.parse(rawJson);
        } catch (firstParseError: any) {
          console.log('First parse attempt failed, trying aggressive cleanup...');
          
          // Check if JSON is truncated (common with token limits)
          // Look for unclosed braces/brackets
          const openBraces = (rawJson.match(/\{/g) || []).length;
          const closeBraces = (rawJson.match(/\}/g) || []).length;
          const openBrackets = (rawJson.match(/\[/g) || []).length;
          const closeBrackets = (rawJson.match(/\]/g) || []).length;
          
          if (openBraces > closeBraces || openBrackets > closeBrackets) {
            console.log('Detected truncated JSON, attempting to close it...');
            // Find the last complete key-value pair and close from there
            // Remove any incomplete string at the end
            rawJson = rawJson.replace(/,\s*"[^"]*"?\s*:?\s*"?[^"]*$/, '');
            rawJson = rawJson.replace(/,\s*"[^"]*$/, '');
            rawJson = rawJson.replace(/,\s*\[[^\]]*$/, '');
            rawJson = rawJson.replace(/,\s*\{[^}]*$/, '');
            // Add closing brackets/braces
            for (let i = 0; i < openBrackets - closeBrackets; i++) rawJson += ']';
            for (let i = 0; i < openBraces - closeBraces; i++) rawJson += '}';
          }
          
          // More aggressive: remove all control characters except those that are properly escaped
          rawJson = rawJson.replace(/[\x00-\x1F\x7F]/g, (char) => {
            // Keep only if it's a space
            return char === ' ' ? ' ' : '';
          });
          
          try {
            ideaData = JSON.parse(rawJson);
          } catch (secondParseError) {
            console.error('Second parse also failed:', secondParseError);
            throw firstParseError; // Throw original error
          }
        }
      } else {
        console.error('No JSON found in response. Full response:', analysis);
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      console.error('Raw response:', analysis.substring(0, 1000));
      return NextResponse.json({ error: 'Failed to parse AI response' }, { status: 500 });
    }
    
    // Step 3: Sanitize/normalize fields before saving to database
    function sanitizeScore(value: any) {
      if (value === null || value === undefined) return null;
      const s = String(value).trim();
      const m = s.match(/-?\d+(?:\.\d+)?/);
      if (!m) return null;
      let num = parseFloat(m[0]);
      if (!isFinite(num)) return null;
      // Clamp to 0-10 and round to one decimal for variability
      num = Math.max(0, Math.min(10, num));
      return Math.round(num * 10) / 10;
    }

    function normalizeLevel(value: any) {
      if (!value) return 'medium';
      const v = String(value).toLowerCase();
      if (['low', 'medium', 'high'].includes(v)) return v;
      return 'medium';
    }

    const opportunityScore = sanitizeScore(ideaData.opportunity_score);
    const problemScore = sanitizeScore(ideaData.problem_score);
    const feasibilityScore = sanitizeScore(ideaData.feasibility_score);

    // Compute total score as average of available component scores (fallback to opportunity)
    const scores = [opportunityScore, problemScore, feasibilityScore].filter(s => s != null) as number[];
    let totalScore = scores.length > 0 ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10 : (opportunityScore || null);

    // If all component scores are present but identical (likely a repeated output), add a tiny deterministic jitter to increase variety
    if (scores.length === 3 && opportunityScore === problemScore && problemScore === feasibilityScore && totalScore != null) {
      // Deterministic pseudo-hash from name to keep it reproducible
      const nameHash = String(ideaData.name || '').split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
      const jitter = ((nameHash % 9) - 4) * 0.1; // -0.4 .. +0.4
      totalScore = Math.max(0, Math.min(10, Math.round((totalScore + jitter) * 10) / 10));
    }

    const sanitizedIdea = {
      featured_date: today,
      display_order: 0,
      name: String(ideaData.name || 'Untitled').slice(0, 4000),
      industry: ideaData.industry || industry,
      one_liner: ideaData.one_liner || '',
      description: ideaData.description || '',
      target_audience: ideaData.target_audience || '',
      core_problem: ideaData.core_problem || '',
      opportunity_score: opportunityScore,
      problem_score: problemScore,
      feasibility_score: feasibilityScore,
      total_score: totalScore,
      scores_explanation: ideaData.scores_explanation || null,
      demand_level: normalizeLevel(ideaData.demand_level),
      competition_level: normalizeLevel(ideaData.competition_level),
      trending_score: sanitizeScore(ideaData.trending_score),
      market_size: ideaData.market_size || null,
      growth_rate: ideaData.growth_rate || null,
      pain_points: Array.isArray(ideaData.pain_points) ? ideaData.pain_points : (ideaData.pain_points ? [ideaData.pain_points] : []),
      monetization_ideas: Array.isArray(ideaData.monetization_ideas) ? ideaData.monetization_ideas : [],
      product_ideas: Array.isArray(ideaData.product_ideas) ? ideaData.product_ideas : [],
      validation_signals: Array.isArray(ideaData.validation_signals) ? ideaData.validation_signals : [],
      full_research_report: ideaData.full_research_report || null,
      sources: searchContext.slice(0, 10).map(r => ({ title: r.title, link: r.link })),
      is_published: true,
      is_featured: true,
      generated_by: 'ai-cron',
      generation_prompt: industry,
    };

    console.log('Sanitized idea before insert:', {
      opportunity_score: sanitizedIdea.opportunity_score,
      trending_score: sanitizedIdea.trending_score,
      demand_level: sanitizedIdea.demand_level,
      competition_level: sanitizedIdea.competition_level,
    });

    let newIdea: any = null;
    let insertError: any = null;
    const insertResult = await getSupabaseAdmin()
      .from('daily_niche_ideas')
      .insert(sanitizedIdea)
      .select()
      .single();
    newIdea = insertResult.data;
    insertError = insertResult.error;
    
    if (insertError || !newIdea) {
      console.error('Failed to insert idea:', insertError);

      // Retry with relaxed numeric fields if there's an integer parsing error
      const errMsg = insertError?.message || '';
      if (errMsg.includes('invalid input syntax for type integer') || errMsg.includes('invalid input syntax')) {
        console.log('Retrying insert with integer fields coerced to integers or null');
        const fallback = { ...sanitizedIdea } as any;
        try {
          if (fallback.opportunity_score != null) fallback.opportunity_score = Math.round(Number(fallback.opportunity_score));
        } catch (e) { fallback.opportunity_score = null; }
        try {
          if (fallback.trending_score != null) fallback.trending_score = Math.round(Number(fallback.trending_score));
        } catch (e) { fallback.trending_score = null; }

        const { data: retryIdea, error: retryError } = await getSupabaseAdmin()
          .from('daily_niche_ideas')
          .insert(fallback)
          .select()
          .single();

        if (retryError || !retryIdea) {
          console.error('Retry insert failed:', retryError);
          return NextResponse.json({ error: 'Failed to save idea' }, { status: 500 });
        }

        console.log(`Created daily idea on retry: ${retryIdea.id} - ${retryIdea.name}`);
        newIdea = retryIdea;

      } else {
        return NextResponse.json({ error: 'Failed to save idea' }, { status: 500 });
      }
    }
    
    console.log(`Created daily idea: ${newIdea.id} - ${newIdea.name}`);
    
    // Step 4: Queue emails for all users
    const { queued } = await queueEmailsForIdea(newIdea.id);
    console.log(`Queued ${queued} emails for idea ${newIdea.id}`);
    
    return NextResponse.json({
      success: true,
      ideaId: newIdea.id,
      name: newIdea.name,
      industry: newIdea.industry,
      emailsQueued: queued,
    });
    
  } catch (error) {
    console.error('Error generating daily idea:', error);
    return NextResponse.json({ 
      error: 'Failed to generate daily idea',
      details: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}

// Also support GET for Vercel Cron
export async function GET(request: NextRequest) {
  return POST(request);
}
