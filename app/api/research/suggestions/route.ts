import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateText } from 'ai';
import { groq, google } from '@/lib/ai/provider';

const PRODUCT_TYPES = [
  { id: 'ebook', name: 'E-book/Guide', icon: '📚' },
  { id: 'course', name: 'Online Course', icon: '🎓' },
  { id: 'template', name: 'Templates/Tools', icon: '📋' },
  { id: 'saas', name: 'SaaS/Software', icon: '💻' },
  { id: 'community', name: 'Paid Community', icon: '👥' },
  { id: 'coaching', name: 'Coaching/Consulting', icon: '🎯' },
  { id: 'newsletter', name: 'Paid Newsletter', icon: '📧' },
  { id: 'audio', name: 'Podcast/Audio', icon: '🎙️' },
];

// Helper function to create fallback suggestions when AI fails
function createFallbackSuggestions(session: { industry?: string; selected_niche?: string }, skills: { skills: string[] }) {
  return [
    {
      id: 'fallback-ebook',
      type: 'ebook',
      name: `${session.selected_niche || session.industry || 'Niche'} Success Guide`,
      description: 'A comprehensive ebook covering the key insights from your research. Perfect for establishing authority and generating passive income.',
      matchScore: 75,
      skillsMatch: skills.skills.slice(0, 2),
      timeToLaunch: '2-3 weeks',
      revenueModel: 'One-time $29-49',
      difficulty: 'Easy' as const,
      whyThisProduct: 'Ebooks are the fastest way to monetize expertise and validate demand.',
      mvpScope: ['Core content (10-15 chapters)', 'PDF formatting', 'Sales page'],
      estimatedEarnings: '$500-1k/month',
    },
    {
      id: 'fallback-template',
      type: 'template',
      name: `${session.selected_niche || session.industry || 'Productivity'} Template Pack`,
      description: 'Ready-to-use templates that solve a specific problem for your audience. High value, quick to create.',
      matchScore: 70,
      skillsMatch: skills.skills.slice(0, 2),
      timeToLaunch: '1-2 weeks',
      revenueModel: 'One-time $19-39',
      difficulty: 'Easy' as const,
      whyThisProduct: 'Templates have high perceived value and are quick to create.',
      mvpScope: ['5-10 templates', 'Usage guide', 'Gumroad/Notion setup'],
      estimatedEarnings: '$300-800/month',
    },
    {
      id: 'fallback-community',
      type: 'community',
      name: `${session.selected_niche || session.industry || 'Niche'} Inner Circle`,
      description: 'A paid community for people in your niche to connect and grow together. Builds recurring revenue.',
      matchScore: 65,
      skillsMatch: skills.skills.slice(0, 2),
      timeToLaunch: '1-2 weeks',
      revenueModel: 'Subscription $19-49/mo',
      difficulty: 'Medium' as const,
      whyThisProduct: 'Communities build recurring revenue and create strong customer relationships.',
      mvpScope: ['Discord/Circle setup', 'Welcome content', 'Weekly live calls'],
      estimatedEarnings: '$500-2k/month',
    },
  ];
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { sessionId, skills } = body;

    if (!sessionId || !skills) {
      return NextResponse.json({ error: 'Missing sessionId or skills' }, { status: 400 });
    }

    // Fetch session data
    const { data: session } = await supabase
      .from('research_sessions')
      .select('*')
      .eq('id', sessionId)
      .eq('user_id', user.id)
      .single();

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // Fetch session messages to get research context
    const { data: messages } = await supabase
      .from('messages')
      .select('role, content')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });

    // Build research summary from messages
    const conversationContext = messages
      ?.slice(-10)
      .map(m => `${m.role}: ${m.content}`)
      .join('\n') || '';

    const skillsList = skills.skills.join(', ');
    const experienceLevel = skills.experienceLevel;
    const timeCommitment = skills.timeCommitment;
    const additionalNotes = skills.additionalNotes || 'None';

    // Generate product suggestions using AI
    const prompt = `You are a product strategy expert. Based on the following research and user profile, suggest the top 3 digital products they should build.

RESEARCH CONTEXT:
Industry: ${session.industry || 'Not specified'}
Selected Niche: ${session.selected_niche || 'Not specified'}
Selected UVZ: ${session.selected_uvz || 'Not specified'}

Recent Conversation:
${conversationContext}

USER PROFILE:
Skills: ${skillsList}
Experience Level: ${experienceLevel}
Time Commitment: ${timeCommitment}
Additional Notes: ${additionalNotes}

AVAILABLE PRODUCT TYPES:
${PRODUCT_TYPES.map(p => `- ${p.id}: ${p.name}`).join('\n')}

Generate exactly 3 product suggestions in JSON format. Each suggestion should:
1. Match the user's skills and experience level
2. Fit their time commitment
3. Solve a real problem identified in the research
4. Be achievable for their experience level

Respond ONLY with a valid JSON array (no markdown, no explanation):
[
  {
    "id": "unique-id-1",
    "type": "ebook|course|template|saas|community|coaching|newsletter|audio",
    "name": "Product Name",
    "description": "2-3 sentence description",
    "matchScore": 85,
    "skillsMatch": ["skill1", "skill2"],
    "timeToLaunch": "2-4 weeks",
    "revenueModel": "One-time purchase $49",
    "difficulty": "Easy|Medium|Hard",
    "whyThisProduct": "1-2 sentences explaining why this is perfect for them",
    "mvpScope": ["Feature 1", "Feature 2", "Feature 3"],
    "estimatedEarnings": "$500-2k/month"
  }
]`;

    let text = '';
    
    // Try Groq first, fallback to Google if it fails
    try {
      const result = await generateText({
        model: groq('llama-3.3-70b-versatile'),
        prompt,
      });
      text = result.text;
    } catch (groqError) {
      console.error('Groq API error, trying Google fallback:', groqError);
      try {
        const result = await generateText({
          model: google('gemini-2.0-flash'),
          prompt,
        });
        text = result.text;
      } catch (googleError) {
        console.error('Google API also failed:', googleError);
        // Return fallback suggestions if both APIs fail
        const fallbackSuggestions = createFallbackSuggestions(session, skills);
        return NextResponse.json({
          suggestions: fallbackSuggestions,
          researchSummary: {
            niche: session.selected_niche || session.industry || 'Your niche',
            uvz: session.selected_uvz || 'Your unique value zone',
            targetAudience: 'Your target audience',
          },
        });
      }
    }

    // Parse AI response
    let suggestions;
    try {
      // Try to extract JSON from the response
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        suggestions = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON array found in response');
      }
    } catch (parseError) {
      console.error('Error parsing AI response:', parseError, text);
      // Return fallback suggestions using helper function
      suggestions = createFallbackSuggestions(session, skills);
    }

    // Extract research summary
    const researchSummary = {
      niche: session.selected_niche || session.industry || 'Your niche',
      uvz: session.selected_uvz || 'Your unique value zone',
      targetAudience: 'Your target audience',
    };

    return NextResponse.json({
      suggestions,
      researchSummary,
    });
  } catch (error) {
    console.error('Error generating product suggestions:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: `Failed to generate suggestions: ${errorMessage}` },
      { status: 500 }
    );
  }
}
