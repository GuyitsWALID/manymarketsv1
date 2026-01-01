// Whop configuration and utilities

export const WHOP_CONFIG = {
  // Plan IDs from your Whop dashboard
  PRO_PLAN_ID: process.env.NEXT_PUBLIC_WHOP_PRO_PLAN_ID || '',
  
  // API key for server-side operations (webhooks, etc.)
  API_KEY: process.env.WHOP_API_KEY || '',
  
  // Return URL after checkout
  RETURN_URL: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/upgrade/complete`,
};

// Verify if Whop is properly configured
export function isWhopConfigured(): boolean {
  return Boolean(WHOP_CONFIG.PRO_PLAN_ID);
}
