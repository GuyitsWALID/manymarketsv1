export const DAILY_PROMPTS: string[] = [
  "My one-sentence elevator pitch: what's my product and who is it for?",
  "Give me 3 underserved micro-niches in the ${industry} space.",
  "Describe a high-value freelance service I could build in 7 days.",
  "Suggest 5 quick marketing hooks for a product that saves time for small teams.",
  "What's a simple pricing strategy to maximize early adoption for a digital tool?",
  "List 3 creative lead magnet ideas for an ebook about productivity.",
  "Give a 2-sentence pitch that would convert on a landing page for a SaaS tool.",
  "Suggest 4 low-cost channels to validate demand for a new course.",
  "Write a short cold DM to test interest in a beta product (friendly, first-person).",
  "Outline a 3-step onboarding checklist that reduces churn for a digital product.",
  "Name 5 adjacent audiences who'd pay for this product and why.",
  "Generate a short, first-person testimonial prompt we can ask early users to write.",
  "Brainstorm 3 premium upsell ideas for a basic digital product.",
  "Suggest a creative giveaway to grow an email list in 30 days.",
  "Give a 2-sentence cold email subject + opener to pitch to potential partners.",
  "What features should a minimal MVP include to validate core value quickly?",
  "List 4 content starter ideas for a week of social posts about a launch.",
  "Suggest 3 partnership types that can boost early distribution for a product.",
  "Write a short value proposition emphasizing speed and simplicity in first person.",
  "Provide a 30-word description for an app store listing that converts.",
];

function mulberry32(seed: number) {
  return function() {
    let t = (seed += 0x6D2B79F5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function getDailyPrompts(count = 3, date = new Date()): string[] {
  const days = Math.floor(date.valueOf() / 86400000); // UTC-based day count
  const rng = mulberry32(days);
  const arr = DAILY_PROMPTS.slice();
  // Fisher-Yates shuffle with seeded RNG
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr.slice(0, Math.min(count, arr.length));
}
