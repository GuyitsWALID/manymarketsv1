import { createGoogleGenerativeAI } from '@ai-sdk/google';

export const google = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
});

// Use Gemini 2.0 Flash for fast responses
export const model = google('gemini-2.0-flash-exp');
