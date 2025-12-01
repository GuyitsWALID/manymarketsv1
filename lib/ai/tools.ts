import { tool } from 'ai';
import { z } from 'zod';
import { searchWeb } from '../research/web-search';
import { generateText } from 'ai';
import { getModel } from './provider';

// Helper function to generate AI analysis
async function generateAnalysis(prompt: string): Promise<string> {
  const { text } = await generateText({
    model: getModel(),
    prompt,
  });
  return text;
}

// Tool 1: Identify Industry Niches
const identify_industry_niches = tool({
  description: 'Analyze an industry and identify 3-5 specific niches with unique value opportunities. Call this when the user mentions an industry they want to explore.',
  inputSchema: z.object({
    industry: z.string().describe('The industry to analyze'),
    depth: z.number().default(3).describe('Number of niches to identify (1-5)'),
  }),
  execute: async (args) => {
    const { industry, depth } = args;
    const searchQueries = [
      `${industry} emerging trends 2024`,
      `${industry} underserved markets`,
      `${industry} startup opportunities gaps`,
    ];
    
    const allResults = await Promise.all(searchQueries.map(q => searchWeb(q)));
    const searchContext = allResults.flat().slice(0, 15);
    
    const analysisPrompt = `You are a market research expert. Analyze the "${industry}" industry and identify exactly ${depth} highly specific, underserved niches.

Web Research Context:
${searchContext.map(r => `- ${r.title}: ${r.snippet}`).join('\n')}

For EACH niche, provide a detailed JSON analysis:

Return ONLY valid JSON in this exact format:
{
  "industry": "${industry}",
  "niches": [
    {
      "name": "Specific Niche Name",
      "description": "2-3 sentence description",
      "target_audience": "Exact customer avatar with demographics",
      "market_size": "Estimated market size with growth rate",
      "pain_points": ["Pain 1", "Pain 2", "Pain 3"],
      "opportunity_score": 8.5,
      "competition_level": "Low/Medium/High",
      "monetization_ideas": ["Idea 1", "Idea 2"],
      "uvz_potential": "Why this could become a Unique Value Zone"
    }
  ],
  "key_insights": ["Insight 1", "Insight 2", "Insight 3"],
  "recommended_next_step": "Which niche to explore deeper and why"
}`;

    const analysis = await generateAnalysis(analysisPrompt);
    
    try {
      const jsonMatch = analysis.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch {
      // Return structured response even if JSON parsing fails
    }
    
    return {
      industry,
      analysis,
      sources: searchContext.slice(0, 5).map(r => ({ title: r.title, link: r.link })),
    };
  },
});

// Tool 2: Drill into UVZ
const drill_uvz = tool({
  description: 'Deep dive into a specific niche to identify the exact Unique Value Zone (UVZ). Call this after a niche has been selected.',
  inputSchema: z.object({
    niche: z.string().describe('The niche to drill into'),
    focus_area: z.string().optional().describe('Specific focus area within the niche'),
  }),
  execute: async (args) => {
    const { niche, focus_area } = args;
    const focusQuery = focus_area ? ` ${focus_area}` : '';
    
    const searchQueries = [
      `${niche} problems challenges`,
      `${niche} solutions gaps`,
      `${niche}${focusQuery} small business needs`,
    ];
    
    const allResults = await Promise.all(searchQueries.map(q => searchWeb(q)));
    const searchContext = allResults.flat().slice(0, 12);
    
    const drillPrompt = `You are a Unique Value Zone (UVZ) specialist. A UVZ is an extremely specific, underserved market position.

Niche: "${niche}"
${focus_area ? `Focus Area: "${focus_area}"` : ''}

Research Context:
${searchContext.map(r => `- ${r.title}: ${r.snippet}`).join('\n')}

Drill deep and identify 2-3 potential Unique Value Zones within this niche.

Return ONLY valid JSON:
{
  "niche": "${niche}",
  "uvz_opportunities": [
    {
      "uvz_name": "Very specific UVZ name",
      "one_liner": "One sentence value proposition",
      "target_micro_audience": "Super specific audience",
      "core_problem": "The exact pain point being solved",
      "why_underserved": "Why nobody is solving this well yet",
      "differentiation": "What makes this unique",
      "validation_signals": ["Signal 1", "Signal 2"],
      "score": 8.5
    }
  ],
  "recommended_uvz": "Which UVZ has the best potential and why",
  "product_ideas": [
    {
      "type": "SaaS/Course/Template/Community/Tool",
      "name": "Product name idea",
      "description": "What it does",
      "price_range": "$X-$Y",
      "effort_level": "Low/Medium/High"
    }
  ]
}`;

    const analysis = await generateAnalysis(drillPrompt);
    
    try {
      const jsonMatch = analysis.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch {
      // Fallback
    }
    
    return {
      niche,
      focus_area,
      analysis,
      sources: searchContext.slice(0, 5).map(r => ({ title: r.title, link: r.link })),
    };
  },
});

// Tool 3: Validate UVZ Demand
const validate_uvz_demand = tool({
  description: 'Validate market demand for a Unique Value Zone. Call this to check if a UVZ has real demand before building.',
  inputSchema: z.object({
    uvz_description: z.string().describe('Description of the UVZ to validate'),
  }),
  execute: async (args) => {
    const { uvz_description } = args;
    const searchQueries = [
      `${uvz_description} reviews`,
      `${uvz_description} reddit`,
      `${uvz_description} alternative solutions`,
      `${uvz_description} complaints problems`,
    ];
    
    const allResults = await Promise.all(searchQueries.map(q => searchWeb(q)));
    const marketSignals = allResults.flat().slice(0, 15);
    
    const validationPrompt = `You are a market validation expert. Evaluate demand for this UVZ:

"${uvz_description}"

Market Signals Found:
${marketSignals.map(r => `- ${r.title}: ${r.snippet}`).join('\n')}

Analyze and return JSON:
{
  "uvz": "${uvz_description}",
  "demand_analysis": {
    "overall_score": 8.5,
    "demand_level": "High/Medium/Low",
    "confidence": 0.85,
    "verdict": "GO/CAUTION/NO-GO"
  },
  "positive_signals": [
    {"signal": "What was found", "strength": "Strong/Moderate/Weak", "source": "Where found"}
  ],
  "concerns": [
    {"concern": "Potential issue", "severity": "High/Medium/Low", "mitigation": "How to address"}
  ],
  "competition_snapshot": {
    "saturation": "Low/Medium/High",
    "top_players": ["Competitor 1", "Competitor 2"],
    "gaps_to_exploit": ["Gap 1", "Gap 2"]
  },
  "recommendation": "Clear recommendation with reasoning",
  "next_steps": ["Step 1", "Step 2", "Step 3"]
}`;

    const validation = await generateAnalysis(validationPrompt);
    
    try {
      const jsonMatch = validation.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch {
      // Fallback
    }
    
    return { uvz_description, validation, signals: marketSignals.length };
  },
});

// Tool 4: Generate Product Ideas
const generate_product_ideas = tool({
  description: 'Generate digital product ideas based on a validated UVZ.',
  inputSchema: z.object({
    uvz: z.string().describe('The validated UVZ'),
    target_audience: z.string().describe('The specific target audience'),
    budget_level: z.enum(['bootstrap', 'funded', 'enterprise']).default('bootstrap').describe('Budget level'),
  }),
  execute: async (args) => {
    const { uvz, target_audience, budget_level } = args;
    const productPrompt = `Generate innovative digital product ideas for this validated UVZ:

UVZ: "${uvz}"
Target Audience: "${target_audience}"
Budget Level: ${budget_level}

Create 5 product ideas. Return JSON:
{
  "uvz": "${uvz}",
  "target_audience": "${target_audience}",
  "products": [
    {
      "rank": 1,
      "type": "SaaS/Course/Template/Community/Tool",
      "name": "Product name",
      "tagline": "One-liner value prop",
      "description": "2-3 sentence description",
      "core_features": ["Feature 1", "Feature 2", "Feature 3"],
      "pricing_model": "One-time/Subscription/Freemium",
      "price_point": "$X/month or $X one-time",
      "build_time": "X weeks/months",
      "build_difficulty": "Easy/Medium/Hard",
      "mvp_scope": "What to build first"
    }
  ],
  "quick_win": "Which product to build first",
  "highest_potential": "Which has best long-term potential"
}`;

    const ideas = await generateAnalysis(productPrompt);
    
    try {
      const jsonMatch = ideas.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch {
      // Fallback
    }
    
    return { uvz, target_audience, ideas };
  },
});

// Export all tools
export const researchTools = {
  identify_industry_niches,
  drill_uvz,
  validate_uvz_demand,
  generate_product_ideas,
};
