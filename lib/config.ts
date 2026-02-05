export const ENABLE_PRICING = (process.env.NEXT_PUBLIC_ENABLE_PRICING === 'true');
export const SHOW_BILLING = ENABLE_PRICING; // alias for clarity

// Free tier limits
export const FREE_SESSION_LIMIT = 5; // Number of research sessions free users can create
export const FREE_DAILY_IDEAS_DAYS = 7; // Free users can access ideas from the last 7 days
export const FREE_SAVED_IDEAS_LIMIT = 3; // Free users can save up to 3 ideas
export const PRO_SAVED_IDEAS_LIMIT = 100; // Pro users can save up to 100 ideas
