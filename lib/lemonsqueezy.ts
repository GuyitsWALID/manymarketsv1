// lib/lemonsqueezy.ts
// Deprecated: Lemon Squeezy support has been removed and migrated to Paddle.
// Keep this file as a deprecation shim to make accidental imports fail clearly.

export function unsupported() {
  throw new Error('Lemon Squeezy integration has been removed. Use lib/paddle.ts instead');
}

export const PRODUCTS = {
  FREE: 'free',
  PRO: 'pro',
} as const;

export const createCheckout = async () => { unsupported(); };
export const getCustomerSubscriptions = async () => { unsupported(); };
export const cancelSubscription = async () => { unsupported(); };
export const verifyWebhookSignature = () => { unsupported(); };
export const isActiveSubscription = () => { unsupported(); };

export default {
  PRODUCTS,
  createCheckout,
  getCustomerSubscriptions,
  cancelSubscription,
  verifyWebhookSignature,
  isActiveSubscription,
};
