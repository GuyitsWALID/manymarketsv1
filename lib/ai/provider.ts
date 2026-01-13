import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createGroq } from '@ai-sdk/groq';

// Google Gemini provider (backup)
export const google = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
});

// Groq provider (primary - very generous free tier: 30 RPM, 15k tokens/min)
export const groq = createGroq({
  apiKey: process.env.GROQ_API_KEY,
});

// Optional: Daily-ideas specific Groq provider (use a separate API key to avoid rate limits)
export const groqDaily = createGroq({
  apiKey: process.env.GROQ_DAILY_API_KEY || process.env.GROQ_API_KEY,
});


// Model configuration with fallback support
// Primary: Groq Llama 3.3 70B - fast and capable, generous free tier
// Fallback: Gemini 2.0 Flash - if Groq key not available
export const getModel = () => {
  // Check if Groq API key is configured
  if (process.env.GROQ_API_KEY && process.env.GROQ_API_KEY !== 'your_groq_api_key') {
    console.log('Using Groq Llama 3.3 70B (primary)');
    return groq('llama-3.3-70b-versatile');
  }
  
  // Fallback to Gemini
  console.log('Using Google Gemini 2.0 Flash (fallback)');
  return google('gemini-2.0-flash');
};

// Model getter that prefers the daily-ideas Groq key when available
export const getDailyModel = () => {
  if (process.env.GROQ_DAILY_API_KEY && process.env.GROQ_DAILY_API_KEY !== '' && process.env.GROQ_DAILY_API_KEY !== 'your_groq_api_key') {
    console.log('Using Groq DAILY API key for daily idea generation');
    return groqDaily('llama-3.3-70b-versatile');
  }
  // Fall back to the default model selection
  return getModel();
};

// Export default model getter for backwards compatibility
// IMPORTANT: Call this as a function, don't use a static export
// because env vars may not be available at module load time
export const model = getModel();

// Export individual models for specific use cases
export const models = {
  // Groq models - all free with generous limits
  groqLlama70B: () => groq('llama-3.3-70b-versatile'),    // Best quality
  groqLlama8B: () => groq('llama-3.1-8b-instant'),        // Fastest
  groqMixtral: () => groq('mixtral-8x7b-32768'),          // Good balance
  
  // Google models - free tier with limits
  geminiFlash: () => google('gemini-2.0-flash'),          // Fast
  geminiPro: () => google('gemini-1.5-pro'),              // Most capable
};
