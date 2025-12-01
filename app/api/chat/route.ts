import { streamText, convertToModelMessages } from 'ai';
import { getModel, models } from '@/lib/ai/provider';
import { researchTools } from '@/lib/ai/tools';
import { SYSTEM_PROMPTS } from '@/lib/ai/prompts';

// Use Node.js runtime for web scraping (axios/cheerio don't work on edge)
export const runtime = 'nodejs';
export const maxDuration = 60; // Allow longer execution for research

export async function POST(req: Request) {
  try {
    const { messages: uiMessages } = await req.json();
    
    // Convert UI messages to model messages (required in AI SDK v5)
    const messages = convertToModelMessages(uiMessages);
    
    console.log('Chat API called with messages:', messages.length);
    
    // Check if at least one API key is configured
    const groqKey = process.env.GROQ_API_KEY;
    const geminiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    
    const hasGroq = groqKey && groqKey !== 'your_groq_api_key';
    const hasGemini = geminiKey && geminiKey !== 'your_gemini_api_key';
    
    if (!hasGroq && !hasGemini) {
      console.error('No AI API key configured');
      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        start(controller) {
          const errorMessage = `⚠️ **AI API Key Not Configured**

To enable the AI research assistant, please configure at least one provider:

**Option 1: Groq (Recommended - Most Generous Free Tier)**
1. Go to [Groq Console](https://console.groq.com/keys)
2. Create a free API key
3. Add to \`.env.local\`:
   \`\`\`
   GROQ_API_KEY=your_groq_key_here
   \`\`\`

**Option 2: Google Gemini**
1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Create a free API key
3. Add to \`.env.local\`:
   \`\`\`
   GOOGLE_GENERATIVE_AI_API_KEY=your_gemini_key_here
   \`\`\`

Then restart the development server. 🚀`;
          
          controller.enqueue(encoder.encode(`0:"${errorMessage.replace(/"/g, '\\"').replace(/\n/g, '\\n')}"\n`));
          controller.close();
        }
      });
      
      return new Response(stream, {
        headers: { 'Content-Type': 'text/plain; charset=utf-8' },
      });
    }

    // Get the model with automatic fallback
    const model = getModel();
    console.log('Using model:', hasGroq ? 'Groq Llama 3.3 70B' : 'Gemini 2.0 Flash');

    const result = streamText({
      model,
      messages,
      // Temporarily commenting out tools to test basic streaming
      // tools: researchTools,
      system: SYSTEM_PROMPTS.chatbot,
      // maxSteps: 5,
      // toolChoice: 'auto',
      onFinish: ({ text, finishReason }) => {
        console.log('Stream finished:', { finishReason, textLength: text?.length });
      },
    });

    console.log('Streaming response started');
    
    // AI SDK v5 - use toUIMessageStreamResponse() for useChat with DefaultChatTransport
    return result.toUIMessageStreamResponse();
    
  } catch (error: unknown) {
    console.error('Chat API error:', error);
    
    // Check if it's a rate limit error and provide helpful message
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (errorMessage.includes('quota') || errorMessage.includes('rate') || errorMessage.includes('429')) {
      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        start(controller) {
          const msg = `⚠️ **Rate Limit Reached**

The AI service is temporarily rate-limited. Please:
1. Wait a few seconds and try again
2. Or configure Groq (more generous limits) in \`.env.local\`:
   \`\`\`
   GROQ_API_KEY=your_groq_key_here
   \`\`\`
   Get a free key at: https://console.groq.com/keys`;
          
          controller.enqueue(encoder.encode(`0:"${msg.replace(/"/g, '\\"').replace(/\n/g, '\\n')}"\n`));
          controller.close();
        }
      });
      
      return new Response(stream, {
        headers: { 'Content-Type': 'text/plain; charset=utf-8' },
      });
    }
    
    return new Response(
      JSON.stringify({ error: 'Failed to process chat request', details: errorMessage }), 
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
