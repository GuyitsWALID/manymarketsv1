import { tool } from 'ai';
import { z } from 'zod';
import { searchWeb } from '../research/web-search';
import { generateText } from 'ai';
import { getModel } from './provider';

// Helper function to generate AI analysis
// Uses getModel() to get the model lazily (after env vars are loaded)
async function generateAnalysis(prompt: string): Promise<string> {
  const { text } = await generateText({
    model: getModel(),
    prompt,
  });
  return text;
}

export const researchTools = {
  // Tool 1: Identify Industry Niches
  identify_industry_niches: tool({
    description: 'Analyze an industry and identify 3-5 specific niches with unique value opportunities. Call this when the user mentions an industry they want to explore.',
    parameters: z.object({
      industry: z.string().describe('The industry to analyze (e.g., "health tech", "AI tools", "fitness")'),
      depth: z.number().default(3).describe('Number of niches to identify (1-5)'),
    }),
    execute: async ({ industry, depth }) => {
      // Search for industry trends and opportunities
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
        // Try to parse as JSON, clean up if needed
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
  }),

  // Tool 2: Drill into UVZ
  drill_uvz: tool({
    description: 'Deep dive into a specific niche to identify the exact Unique Value Zone (UVZ). Call this after a niche has been selected to find the hyper-specific opportunity.',
    parameters: z.object({
      niche: z.string().describe('The niche to drill into (e.g., "AI chatbots for customer support")'),
      focus_area: z.string().optional().describe('Specific focus area within the niche'),
    }),
    execute: async ({ niche, focus_area }) => {
      const focusQuery = focus_area ? ` ${focus_area}` : '';
      
      const searchQueries = [
        `${niche} problems challenges`,
        `${niche} solutions gaps`,
        `${niche}${focusQuery} small business needs`,
      ];
      
      const allResults = await Promise.all(searchQueries.map(q => searchWeb(q)));
      const searchContext = allResults.flat().slice(0, 12);
      
      const drillPrompt = `You are a Unique Value Zone (UVZ) specialist. A UVZ is an extremely specific, underserved market position where competition is low but demand exists.

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
      "one_liner": "One sentence that explains the exact value proposition",
      "target_micro_audience": "Super specific audience (e.g., 'Solo freelance copywriters earning $5-10k/month who struggle with client onboarding')",
      "core_problem": "The exact pain point being solved",
      "why_underserved": "Why nobody is solving this well yet",
      "differentiation": "What makes this unique vs existing solutions",
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
  }),

  // Tool 3: Research UVZ Topic
  research_uvz_topic: tool({
    description: 'Gather comprehensive research on a specific UVZ topic. Use this to validate ideas or gather content for product development.',
    parameters: z.object({
      topic: z.string().describe('The topic to research'),
      num_sources: z.number().default(10).describe('Number of sources to gather (1-20)'),
    }),
    execute: async ({ topic, num_sources }) => {
      const searchQueries = [
        `${topic} best practices`,
        `${topic} common mistakes`,
        `${topic} tools software`,
        `how to ${topic}`,
      ];
      
      const allResults = await Promise.all(searchQueries.map(q => searchWeb(q)));
      const sources = allResults.flat().slice(0, num_sources);
      
      const researchPrompt = `Synthesize comprehensive research on: "${topic}"

Sources:
${sources.map(r => `- ${r.title}: ${r.snippet}`).join('\n')}

Provide a structured research report in JSON:
{
  "topic": "${topic}",
  "executive_summary": "3-4 sentence overview",
  "key_findings": [
    {"finding": "Finding 1", "importance": "High/Medium/Low", "source_count": 3},
    {"finding": "Finding 2", "importance": "High/Medium/Low", "source_count": 2}
  ],
  "best_practices": ["Practice 1", "Practice 2", "Practice 3"],
  "common_pitfalls": ["Pitfall 1", "Pitfall 2"],
  "tools_mentioned": ["Tool 1", "Tool 2"],
  "content_opportunities": [
    {"type": "Blog/Video/Course/Tool", "title": "Suggested title", "angle": "Unique angle"}
  ],
  "action_items": ["Action 1", "Action 2"]
}`;

      const research = await generateAnalysis(researchPrompt);
      
      try {
        const jsonMatch = research.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0]);
        }
      } catch {
        // Fallback
      }
      
      return { topic, research, sources: sources.map(r => ({ title: r.title, link: r.link })) };
    },
  }),

  // Tool 4: Validate UVZ Demand
  validate_uvz_demand: tool({
    description: 'Validate market demand for a Unique Value Zone. Call this to check if a UVZ has real demand before building.',
    parameters: z.object({
      uvz_description: z.string().describe('Description of the UVZ to validate'),
    }),
    execute: async ({ uvz_description }) => {
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
  }),

  // Tool 5: Competitive Analysis
  competitive_analysis: tool({
    description: 'Analyze competitors in a UVZ space to identify differentiation opportunities.',
    parameters: z.object({
      uvz: z.string().describe('The UVZ to analyze competitors for'),
      num_competitors: z.number().default(5).describe('Number of competitors to analyze'),
    }),
    execute: async ({ uvz, num_competitors }) => {
      const searchResults = await searchWeb(`${uvz} tools software companies`);
      const competitorContext = searchResults.slice(0, num_competitors * 2);
      
      const competitorPrompt = `Analyze the competitive landscape for: "${uvz}"

Found in research:
${competitorContext.map(r => `- ${r.title}: ${r.snippet} (${r.link})`).join('\n')}

Return JSON analysis:
{
  "uvz": "${uvz}",
  "competitors": [
    {
      "name": "Competitor name",
      "website": "URL if found",
      "positioning": "How they position themselves",
      "strengths": ["Strength 1", "Strength 2"],
      "weaknesses": ["Weakness 1", "Weakness 2"],
      "pricing": "Price range if known",
      "target_audience": "Who they serve"
    }
  ],
  "market_gaps": [
    {"gap": "Underserved need", "opportunity": "How to exploit it", "difficulty": "Easy/Medium/Hard"}
  ],
  "differentiation_strategies": [
    {"strategy": "Strategy name", "description": "How to implement", "uniqueness_score": 8}
  ],
  "saturation_level": "Low/Medium/High",
  "recommended_positioning": "How to position against competitors"
}`;

      const analysis = await generateAnalysis(competitorPrompt);
      
      try {
        const jsonMatch = analysis.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0]);
        }
      } catch {
        // Fallback
      }
      
      return { uvz, analysis, sources: competitorContext.length };
    },
  }),

  // Tool 6: Generate Product Ideas
  generate_product_ideas: tool({
    description: 'Generate digital product or software ideas based on a validated UVZ. Call this after validation to get actionable product concepts.',
    parameters: z.object({
      uvz: z.string().describe('The validated UVZ'),
      target_audience: z.string().describe('The specific target audience'),
      budget_level: z.enum(['bootstrap', 'funded', 'enterprise']).default('bootstrap').describe('Budget level for building'),
    }),
    execute: async ({ uvz, target_audience, budget_level }) => {
      const productPrompt = `Generate innovative digital product ideas for this validated UVZ:

UVZ: "${uvz}"
Target Audience: "${target_audience}"
Budget Level: ${budget_level}

Create 5 product ideas ranging from quick-to-build to ambitious. Return JSON:
{
  "uvz": "${uvz}",
  "target_audience": "${target_audience}",
  "products": [
    {
      "rank": 1,
      "type": "SaaS/Course/Template/Community/Marketplace/Tool/Mobile App",
      "name": "Catchy product name",
      "tagline": "One-liner value prop",
      "description": "2-3 sentence description",
      "core_features": ["Feature 1", "Feature 2", "Feature 3"],
      "tech_stack_suggestion": "Recommended tech if applicable",
      "pricing_model": "One-time/Subscription/Freemium",
      "price_point": "$X/month or $X one-time",
      "build_time": "X weeks/months",
      "build_difficulty": "Easy/Medium/Hard",
      "revenue_potential": "Monthly revenue estimate",
      "mvp_scope": "What to build first",
      "go_to_market": "Launch strategy"
    }
  ],
  "quick_win": "Which product to build first for fastest validation",
  "highest_potential": "Which has best long-term potential",
  "recommended_stack": {
    "frontend": "Suggestion",
    "backend": "Suggestion", 
    "database": "Suggestion",
    "hosting": "Suggestion"
  }
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
  }),

  // Tool 7: Generate Ebook Outline
  generate_ebook_outline: tool({
    description: 'Generate a comprehensive ebook outline for a digital info product.',
    parameters: z.object({
      topic: z.string().describe('Ebook topic'),
      target_audience: z.string().describe('Target reader avatar'),
      page_count: z.number().default(50).describe('Estimated page count'),
    }),
    execute: async ({ topic, target_audience, page_count }) => {
      const outlinePrompt = `Create a comprehensive ebook outline:

Topic: "${topic}"
Target Audience: "${target_audience}"  
Target Length: ~${page_count} pages

Return JSON:
{
  "title": "Compelling ebook title",
  "subtitle": "Clarifying subtitle",
  "target_audience": "${target_audience}",
  "promise": "What reader will achieve",
  "chapters": [
    {
      "number": 1,
      "title": "Chapter title",
      "purpose": "Why this chapter exists",
      "key_points": ["Point 1", "Point 2", "Point 3"],
      "estimated_pages": 5,
      "exercises": ["Exercise if applicable"]
    }
  ],
  "bonuses": ["Bonus idea 1", "Bonus idea 2"],
  "pricing_suggestion": "$X",
  "upsell_opportunities": ["Upsell 1", "Upsell 2"]
}`;

      const outline = await generateAnalysis(outlinePrompt);
      
      try {
        const jsonMatch = outline.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0]);
        }
      } catch {
        // Fallback
      }
      
      return { topic, target_audience, outline };
    },
  }),

  // Tool 8: Generate Marketing Copy
  generate_marketing_copy: tool({
    description: 'Generate marketing materials for a digital product.',
    parameters: z.object({
      product_title: z.string().describe('Product name'),
      uvz: z.string().describe('UVZ description'),
      copy_type: z.enum(['landing_page', 'email_sequence', 'social_posts']).describe('Type of copy'),
    }),
    execute: async ({ product_title, uvz, copy_type }) => {
      const copyPrompt = `Generate ${copy_type.replace('_', ' ')} copy for:

Product: "${product_title}"
UVZ: "${uvz}"

${copy_type === 'landing_page' ? `Return JSON:
{
  "headline": "Power headline",
  "subheadline": "Supporting statement",
  "hero_bullets": ["Benefit 1", "Benefit 2", "Benefit 3"],
  "problem_section": "Agitate the problem",
  "solution_section": "Present the solution",
  "features": [{"feature": "Feature", "benefit": "Why it matters"}],
  "testimonial_prompts": ["What testimonial to collect"],
  "cta_primary": "Main CTA text",
  "cta_secondary": "Secondary CTA",
  "guarantee": "Risk reversal statement",
  "faq": [{"q": "Question", "a": "Answer"}]
}` : copy_type === 'email_sequence' ? `Return JSON:
{
  "sequence_name": "Sequence purpose",
  "emails": [
    {
      "day": 1,
      "subject": "Subject line",
      "preview": "Preview text",
      "body_outline": "Key points to cover",
      "cta": "Call to action"
    }
  ]
}` : `Return JSON:
{
  "posts": [
    {
      "platform": "Twitter/LinkedIn/Instagram",
      "hook": "Opening hook",
      "body": "Post content",
      "cta": "Call to action",
      "hashtags": ["#tag1", "#tag2"]
    }
  ]
}`}`;

      const copy = await generateAnalysis(copyPrompt);
      
      try {
        const jsonMatch = copy.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0]);
        }
      } catch {
        // Fallback
      }
      
      return { product_title, copy_type, copy };
    },
  }),
};
