import { NextRequest, NextResponse } from 'next/server';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { generateText } from 'ai';
import { getModel } from '@/lib/ai/provider';
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
  // Try primary model first
  try {
    console.log('Attempting AI generation with primary model...');
    const { text } = await generateText({
      model: getModel(),
      prompt,
    });
    return text;
  } catch (primaryError: any) {
    console.error('Primary AI model failed:', primaryError?.message || primaryError);
    
    // If Groq fails, try Gemini directly
    try {
      console.log('Falling back to Gemini...');
      const { google } = await import('@/lib/ai/provider');
      const { text } = await generateText({
        model: google('gemini-2.0-flash'),
        prompt,
      });
      return text;
    } catch (fallbackError: any) {
      console.error('Fallback model also failed:', fallbackError?.message || fallbackError);
      throw new Error(`AI generation failed: ${primaryError?.message || 'Unknown error'}`);
    }
  }
}

export async function POST(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
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
        ideaData = JSON.parse(jsonMatch[0]);
      } else {
        console.error('No JSON found in response. Full response:', analysis);
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      console.error('Raw response:', analysis.substring(0, 1000));
      return NextResponse.json({ error: 'Failed to parse AI response' }, { status: 500 });
    }
    
    // Step 3: Save to database
    const { data: newIdea, error: insertError } = await getSupabaseAdmin()
      .from('daily_niche_ideas')
      .insert({
        featured_date: today,
        display_order: 0,
        name: ideaData.name,
        industry: ideaData.industry || industry,
        one_liner: ideaData.one_liner,
        description: ideaData.description,
        target_audience: ideaData.target_audience,
        core_problem: ideaData.core_problem,
        opportunity_score: ideaData.opportunity_score,
        demand_level: ideaData.demand_level?.toLowerCase() || 'medium',
        competition_level: ideaData.competition_level?.toLowerCase() || 'medium',
        trending_score: ideaData.trending_score,
        market_size: ideaData.market_size,
        growth_rate: ideaData.growth_rate,
        pain_points: ideaData.pain_points || [],
        monetization_ideas: ideaData.monetization_ideas || [],
        product_ideas: ideaData.product_ideas || [],
        validation_signals: ideaData.validation_signals || [],
        full_research_report: ideaData.full_research_report,
        sources: searchContext.slice(0, 10).map(r => ({ title: r.title, link: r.link })),
        is_published: true,
        is_featured: true,
        generated_by: 'ai-cron',
        generation_prompt: industry,
      })
      .select()
      .single();
    
    if (insertError || !newIdea) {
      console.error('Failed to insert idea:', insertError);
      return NextResponse.json({ error: 'Failed to save idea' }, { status: 500 });
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
