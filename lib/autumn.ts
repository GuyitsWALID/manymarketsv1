import { Autumn } from 'autumn-js';

// Initialize Autumn client
export const autumn = new Autumn({
  secretKey: process.env.AUTUMN_API_KEY!,
});

// Product IDs matching your Autumn dashboard
export const PRODUCTS = {
  FREE: 'free',
  PRO: 'pro',
  ENTERPRISE: 'enterprise',
} as const;

// Feature IDs for gating
export const FEATURES = {
  AI_SESSIONS: 'ai_sessions',
  MARKETPLACE_LISTING: 'marketplace_listing',
  BUILDER_STUDIO: 'builder_studio',
  ANALYTICS: 'analytics',
} as const;

export type ProductId = typeof PRODUCTS[keyof typeof PRODUCTS];
export type FeatureId = typeof FEATURES[keyof typeof FEATURES];
