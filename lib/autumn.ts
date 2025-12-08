import { Autumn } from 'autumn-js';

// Lazy initialization to prevent build errors when env vars are missing
let _autumn: Autumn | null = null;

export function getAutumn(): Autumn {
  if (!_autumn) {
    const secretKey = process.env.AUTUMN_API_KEY;
    if (!secretKey) {
      throw new Error('AUTUMN_API_KEY environment variable is not set');
    }
    _autumn = new Autumn({ secretKey });
  }
  return _autumn;
}

// Legacy export for backward compatibility - use getAutumn() instead
export const autumn = {
  get client() {
    return getAutumn();
  }
};

// Product IDs matching your Autumn dashboard
export const PRODUCTS = {
  FREE: 'free',
  PRO: 'pro',
  ENTERPRISE: 'enterprise',
} as const;

// Feature IDs for gating
export const FEATURES = {
  AI_SESSIONS: 'ai_sessions',
  BUILDER_STUDIO: 'builder_studio',
  ANALYTICS: 'analytics',
  IDEA_SCORER: 'idea_scorer',
} as const;

export type ProductId = typeof PRODUCTS[keyof typeof PRODUCTS];
export type FeatureId = typeof FEATURES[keyof typeof FEATURES];
