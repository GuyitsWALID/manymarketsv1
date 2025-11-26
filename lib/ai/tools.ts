import { tool } from 'ai';
import { z } from 'zod';

export const researchTools = {
  // Tool 1: Identify Industry Niches
  identify_industry_niches: tool({
    description: 'Analyze an industry and identify 3+ specific niches with unique value opportunities. Returns detailed niche analysis with market data.',
    inputSchema: z.object({
      industry: z.string().describe('The industry to analyze (e.g., "health tech", "AI tools")'),
      depth: z.number().default(3).describe('Number of niches to identify (1-5)'),
    }),
  }),

  // Tool 2: Drill into UVZ
  drill_uvz: tool({
    description: 'Deep dive into a specific niche to identify the exact Unique Value Zone (UVZ) - the specific problem, audience, and opportunity that differentiates it.',
    inputSchema: z.object({
      niche: z.string().describe('The niche to drill into (e.g., "AI chatbots for customer support")'),
      focus_area: z.string().optional().describe('Specific focus area within the niche'),
    }),
  }),

  // Tool 3: Research UVZ Topic
  research_uvz_topic: tool({
    description: 'Gather comprehensive research on a UVZ topic using web search and AI analysis. Returns insights, best practices, and content opportunities.',
    inputSchema: z.object({
      topic: z.string().describe('The topic to research'),
      num_sources: z.number().default(10).describe('Number of sources to gather (1-20)'),
    }),
  }),

  // Tool 4: Validate UVZ Demand
  validate_uvz_demand: tool({
    description: 'Validate market demand for a UVZ by analyzing search trends, discussions, and market signals. Returns demand score and recommendation.',
    inputSchema: z.object({
      uvz_description: z.string().describe('Description of the UVZ to validate'),
    }),
  }),

  // Tool 5: Competitive Analysis
  competitive_analysis: tool({
    description: 'Analyze competitors in a UVZ space to identify differentiation opportunities and market gaps.',
    inputSchema: z.object({
      uvz: z.string().describe('The UVZ to analyze competitors for'),
      num_competitors: z.number().default(5).describe('Number of competitors to analyze'),
    }),
  }),

  // Tool 6: Generate Ebook Outline
  generate_ebook_outline: tool({
    description: 'Generate a comprehensive ebook outline based on research. Includes chapter structure, learning objectives, and content flow.',
    inputSchema: z.object({
      topic: z.string().describe('Ebook topic'),
      target_audience: z.string().describe('Target reader avatar'),
      page_count: z.number().default(50).describe('Estimated page count'),
    }),
  }),

  // Tool 7: Expand Chapter
  expand_chapter: tool({
    description: 'Expand a chapter from an outline into detailed sections with talking points, examples, and action items.',
    inputSchema: z.object({
      chapter_title: z.string().describe('Chapter title to expand'),
      key_points: z.string().optional().describe('Specific points to cover'),
    }),
  }),

  // Tool 8: Generate Chapter Content
  generate_chapter_content: tool({
    description: 'Generate full written content (2000-3000 words) for a chapter in the specified tone.',
    inputSchema: z.object({
      chapter_title: z.string().describe('Chapter title'),
      outline: z.string().describe('Chapter outline or structure'),
      tone: z.string().default('professional').describe('Writing tone (professional, friendly, technical)'),
    }),
  }),

  // Tool 9: Generate Marketing Copy
  generate_marketing_copy: tool({
    description: 'Generate marketing materials including landing pages, email sequences, or social media posts.',
    inputSchema: z.object({
      product_title: z.string().describe('Product name'),
      uvz: z.string().describe('UVZ description'),
      copy_type: z.enum(['landing_page', 'email_sequence', 'social_posts']).describe('Type of copy to generate'),
    }),
  }),
};
