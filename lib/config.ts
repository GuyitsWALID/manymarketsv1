export const ENABLE_PRICING = (process.env.NEXT_PUBLIC_ENABLE_PRICING === 'true');
export const SHOW_BILLING = ENABLE_PRICING; // alias for clarity

// Free tier limits
export const FREE_SESSION_LIMIT = 5; // Number of research sessions free users can create
export const FREE_DAILY_IDEAS_DAYS = 7; // Free users can access ideas from the last 7 days
export const FREE_SAVED_IDEAS_LIMIT = 3; // Free users can save up to 3 ideas
export const PRO_SAVED_IDEAS_LIMIT = 100; // Pro users can save up to 100 ideas

// Builder limits
export const FREE_BUILDER_PRODUCTS = 1; // Free users can create 1 product in builder
export const FREE_WATERMARKED_EXPORTS = 1; // Free users get 1 watermarked export
export const WATERMARK_TEXT = 'Made with ManyMarkets.co';

// Referral program
export const REFERRAL_BONUS_SESSIONS = 1; // Bonus sessions per successful referral
export const MAX_REFERRAL_BONUSES = 10; // Maximum referral bonuses a user can earn
