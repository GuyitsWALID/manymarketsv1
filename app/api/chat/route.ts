import { streamText } from 'ai';
import { model } from '@/lib/ai/provider';
import { researchTools } from '@/lib/ai/tools';
import { SYSTEM_PROMPTS } from '@/lib/ai/prompts';

export const runtime = 'edge';

export async function POST(req: Request) {
  const { messages } = await req.json();

  const result = await streamText({
    model,
    messages,
    tools: researchTools,
    system: SYSTEM_PROMPTS.chatbot,
  });

  return result.toTextStreamResponse();
}
