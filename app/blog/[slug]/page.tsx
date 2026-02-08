import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';

interface BlogPostData {
  slug: string;
  title: string;
  date: string;
  category: string;
  readTime: string;
  content: string;
}

const posts: Record<string, BlogPostData> = {
  'how-to-find-profitable-niche-2026': {
    slug: 'how-to-find-profitable-niche-2026',
    title: 'How to Find a Profitable Niche in 2026',
    date: '2026-02-07',
    category: 'Strategy',
    readTime: '8 min read',
    content: `
## The Niche Discovery Problem

Most aspiring entrepreneurs fail before they start — not because they lack skills, but because they pick the wrong market. They either go too broad (competing with giants) or too narrow (no real demand).

The sweet spot? **Underserved niches with proven demand and low competition.** Finding them requires a systematic approach, not gut instinct.

## Step 1: Start With Your Skills, Not "Hot Markets"

The biggest mistake is chasing trending markets you know nothing about. Instead, list your top 3-5 skills or areas of expertise. These are your unfair advantages — the foundation of a niche where you can actually deliver value.

## Step 2: Map the Demand Landscape

For each skill area, research:
- **Search volume** for related problems (Google Trends, keyword tools)
- **Community activity** (Reddit threads, Facebook groups, Discord servers)
- **Existing products** and their reviews — especially negative ones

Negative reviews are gold. They tell you exactly what customers want but aren't getting.

## Step 3: Find the Gaps

Look for intersections where:
- People are actively searching for solutions
- Existing products have complaints or missing features
- You have the skills to build something better

This intersection is your **Unique Value Zone (UVZ)**.

## Step 4: Validate Before You Build

Don't build anything yet. Instead:
1. Create a simple landing page describing your solution
2. Share it in relevant communities
3. Measure interest (signups, replies, messages)

If you can get 50+ signups or genuine expressions of interest, you've found a viable niche.

## Step 5: Choose Your Product Type

Not every niche needs a SaaS app. Consider:
- **Ebooks & guides** for knowledge-heavy niches
- **Templates & tools** for workflow-heavy niches
- **Courses** for skill-heavy niches
- **Prompt packs** for AI-related niches

Match the product type to how your audience prefers to consume solutions.

## Let AI Do the Heavy Lifting

This entire process — from skill mapping to niche validation — can be accelerated with AI. ManyMarkets walks you through each step with guided research, real-time validation scores, and product recommendations tailored to your unique strengths.
    `,
  },
  '10-digital-products-build-this-weekend': {
    slug: '10-digital-products-build-this-weekend',
    title: '10 Digital Products You Can Build This Weekend',
    date: '2026-02-05',
    category: 'Products',
    readTime: '6 min read',
    content: `
## You Don't Need Months to Launch

The best digital products solve specific problems for specific people. They don't need to be complex — they need to be useful. Here are 10 products you can realistically build and list for sale in a weekend.

## 1. Notion Template Pack
Create 5-10 templates for a specific use case (freelancer CRM, content calendar, habit tracker). Price: $9-29.

## 2. AI Prompt Pack
Curate and test 50+ prompts for a specific tool (ChatGPT for marketers, Midjourney for product photos). Price: $12-39.

## 3. Ebook / Mini-Guide
Write a focused 5,000-word guide on a topic you know well. Use AI to help draft and edit. Price: $9-19.

## 4. Checklist / Worksheet Bundle
Create printable checklists for a professional process (website launch, SEO audit, hiring). Price: $7-15.

## 5. Email Templates
Write 10-20 email templates for a specific industry (cold outreach for agencies, follow-ups for freelancers). Price: $15-29.

## 6. Spreadsheet Tool
Build a budgeting tracker, project planner, or analytics dashboard in Google Sheets. Price: $19-49.

## 7. Design Asset Kit
Create social media templates, icon sets, or presentation themes in Canva or Figma. Price: $15-39.

## 8. Mini Course (Video or Text)
Record 5-8 short lessons on a focused topic. Host on Gumroad or your own site. Price: $29-79.

## 9. Swipe File
Curate 50+ examples of great headlines, ads, landing pages, or emails for a specific niche. Price: $19-39.

## 10. Workflow Automation Guide
Document step-by-step automation recipes using Zapier, Make, or n8n for a specific business type. Price: $15-29.

## The Key: Pick a Niche First

A "Notion template" is generic. A "Notion CRM template for freelance UX designers" is a product people will pay for. The more specific your audience, the easier it sells.

Use ManyMarkets to find which niche + product combination has the best opportunity score before you start building.
    `,
  },
  'uvz-method-unique-value-zone': {
    slug: 'uvz-method-unique-value-zone',
    title: 'The UVZ Method: Finding Your Unique Value Zone',
    date: '2026-02-03',
    category: 'Framework',
    readTime: '10 min read',
    content: `
## What Is the Unique Value Zone?

The Unique Value Zone (UVZ) is the intersection of three factors:
1. **Your strengths** — skills, knowledge, and experience you already have
2. **Market demand** — problems people are actively trying to solve
3. **Low competition** — gaps where existing solutions fall short

When all three overlap, you've found your UVZ — a market position where you can win without outspending or outworking the competition.

## Why Most People Miss Their UVZ

Entrepreneurs typically optimize for only one of the three factors:
- **Skills-only**: "I'm good at design, so I'll sell design services" → Competing with millions of designers on price
- **Demand-only**: "AI is hot, so I'll build an AI product" → Competing with well-funded startups you can't out-resource
- **Gap-only**: "Nobody's doing X" → Usually because there's no demand for X

The UVZ method forces you to consider all three simultaneously.

## The 5-Phase UVZ Discovery Process

### Phase 1: Industry Discovery
List 3-5 industries or domains where you have genuine knowledge or interest. Don't try to be objective — your passion matters because it determines your ability to create authentic, detailed content.

### Phase 2: Niche Identification
Within each industry, identify 5-10 specific sub-segments. The more specific, the better. "Fitness" → "Home fitness for new parents" → "Postpartum strength training for mothers returning to work."

### Phase 3: UVZ Drilling
For each niche, evaluate:
- Can you create something meaningfully better than what exists?
- Are people spending money on imperfect solutions?
- Can you reach this audience through channels you already have access to?

### Phase 4: Validation
Test your top 2-3 niches with lightweight validation:
- Search volume analysis
- Community engagement research
- Competitive product gap analysis
- Direct outreach to potential customers

### Phase 5: Product Ideation
For your validated niche, brainstorm 3-5 product formats. Consider your audience's buying habits, budget, and preferred consumption method.

## Applying UVZ to Digital Products

The UVZ method works especially well for digital products because:
- Low creation cost means you can experiment freely
- Digital products can be highly specific without inventory risk
- You can validate and iterate quickly
- Multiple product types can serve the same niche

ManyMarkets automates this entire process with AI-guided research, walking you from Phase 1 to Phase 5 in a single conversation.
    `,
  },
  'validate-business-idea-before-building': {
    slug: 'validate-business-idea-before-building',
    title: 'How to Validate a Business Idea Before You Build It',
    date: '2026-02-01',
    category: 'Validation',
    readTime: '7 min read',
    content: `
## The #1 Reason Products Fail

It's not bad execution. It's not lack of funding. It's building something nobody wants. And it happens because founders skip validation and jump straight to building.

Validation doesn't mean asking your friends "would you buy this?" (they'll say yes to be nice). It means finding evidence of real demand before you invest your time.

## 5 Steps to Validate Any Business Idea

### 1. Define the Problem Clearly
Write one sentence describing the problem you're solving and who has it. If you can't do this clearly, you're not ready to validate.

**Bad**: "People need better productivity tools"
**Good**: "Freelance copywriters waste 3+ hours/week manually tracking client feedback across emails, Slack, and Google Docs"

### 2. Search for Existing Solutions
If nobody else is solving this problem, that's usually a red flag, not an opportunity. Look for:
- Direct competitors (same problem, same audience)
- Indirect competitors (same problem, different audience)
- DIY solutions (spreadsheets, manual processes people use today)

### 3. Read the Complaints
Find reviews, forum posts, and social media complaints about existing solutions. What do people wish was different? These complaints are your feature roadmap.

### 4. Quantify the Demand
Use concrete data:
- Google Trends (is interest growing or shrinking?)
- Keyword search volume (how many people search for solutions monthly?)
- Community size (how many people are in relevant subreddits, Facebook groups, Discord servers?)

### 5. Test With a Landing Page
Create a simple page that describes your solution and has a "Join waitlist" or "Get early access" button. Drive 100-200 visitors to it. If 10%+ convert to signups, you have signal.

## The Validation Scorecard

Rate your idea 1-10 on each factor:
- **Demand**: Are people actively looking for solutions?
- **Competition**: Is the market underserved?
- **Feasibility**: Can you actually build this?
- **Profitability**: Will people pay enough to sustain a business?
- **Reach**: Can you access this audience?

A score of 7+ across all five factors is a green light.

## Automate Your Validation

ManyMarkets' Idea Scorer runs this analysis automatically. Paste any business idea and get an instant breakdown of demand, competition, feasibility, and profitability — with AI-powered reasoning for each score.
    `,
  },
};

export async function generateStaticParams() {
  return Object.keys(posts).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = posts[slug];
  if (!post) return { title: 'Post Not Found' };
  return {
    title: `${post.title} | ManyMarkets Blog`,
    description: post.content.slice(0, 160).replace(/[#\n]/g, '').trim(),
    openGraph: {
      title: post.title,
      description: post.content.slice(0, 160).replace(/[#\n]/g, '').trim(),
      type: 'article',
      publishedTime: post.date,
    },
  };
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = posts[slug];

  if (!post) {
    notFound();
  }

  const shareUrl = `https://manymarkets.com/blog/${post.slug}`;
  const shareText = encodeURIComponent(`${post.title} — via ManyMarkets Blog`);

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="relative z-10 border-b-2 border-black bg-white/80 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <img src="/2-Photoroom.png" alt="ManyMarkets logo" className="h-10 w-auto" />
          </Link>
          <nav className="flex items-center gap-4">
            <Link href="/blog" className="text-sm text-gray-700 hover:text-black">Blog</Link>
            <Link href="/daily-ideas" className="text-sm text-gray-700 hover:text-black">Daily Ideas</Link>
            <Link href="/login" className="text-sm font-bold bg-uvz-orange text-white px-4 py-2 border-2 border-black shadow-brutal hover:-translate-y-0.5 transition-transform">Get Started</Link>
          </nav>
        </div>
      </header>

      <main className="py-12 md:py-20">
        <article className="max-w-3xl mx-auto px-4">
          {/* Meta */}
          <div className="mb-8">
            <Link href="/blog" className="text-sm text-uvz-orange font-bold hover:underline mb-4 inline-block">&larr; Back to Blog</Link>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-black mb-4">{post.title}</h1>
            <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500">
              <span>{new Date(post.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
              <span>&middot;</span>
              <span>{post.readTime}</span>
              <span>&middot;</span>
              <span className="font-bold text-uvz-orange">{post.category}</span>
            </div>
          </div>

          {/* Content */}
          <div className="prose prose-lg max-w-none prose-headings:font-black prose-h2:text-2xl prose-h2:mt-10 prose-h2:mb-4 prose-h3:text-xl prose-h3:mt-8 prose-h3:mb-3 prose-p:text-gray-700 prose-p:leading-relaxed prose-strong:text-black prose-ul:text-gray-700 prose-li:text-gray-700">
            {post.content.split('\n').map((line, i) => {
              const trimmed = line.trim();
              if (!trimmed) return null;
              if (trimmed.startsWith('## ')) return <h2 key={i}>{trimmed.replace('## ', '')}</h2>;
              if (trimmed.startsWith('### ')) return <h3 key={i}>{trimmed.replace('### ', '')}</h3>;
              if (trimmed.startsWith('- ')) return <ul key={i}><li>{trimmed.replace('- ', '')}</li></ul>;
              if (trimmed.startsWith('**Bad**:') || trimmed.startsWith('**Good**:')) {
                const parts = trimmed.split('**');
                return <p key={i} className="pl-4 border-l-4 border-uvz-orange bg-gray-50 py-2 px-3 text-sm"><strong>{parts[1]}</strong>{parts[2]}</p>;
              }
              // Handle bold text within paragraphs
              const boldRegex = /\*\*(.*?)\*\*/g;
              const segments = trimmed.split(boldRegex);
              return (
                <p key={i}>
                  {segments.map((segment, j) =>
                    j % 2 === 1 ? <strong key={j}>{segment}</strong> : segment
                  )}
                </p>
              );
            })}
          </div>

          {/* Share */}
          <div className="mt-12 pt-8 border-t-2 border-black">
            <p className="font-black text-sm uppercase mb-3">Share this article</p>
            <div className="flex gap-3">
              <a
                href={`https://x.com/intent/tweet?text=${shareText}&url=${encodeURIComponent(shareUrl)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="p-3 border-2 border-black bg-white hover:bg-gray-50 shadow-brutal hover:-translate-y-0.5 transition-transform"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
              </a>
              <a
                href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="p-3 border-2 border-black bg-white hover:bg-gray-50 shadow-brutal hover:-translate-y-0.5 transition-transform"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
              </a>
            </div>
          </div>

          {/* CTA */}
          <div className="mt-12 border-2 md:border-4 border-black bg-black text-white p-8 shadow-brutal">
            <h2 className="text-2xl font-black mb-3 uppercase">Ready to Find Your Niche?</h2>
            <p className="text-gray-300 mb-6">
              ManyMarkets uses AI to help you discover profitable niches, validate ideas, and build digital products. Start free — no credit card required.
            </p>
            <Link
              href="/login"
              className="inline-block bg-uvz-orange text-white font-bold px-8 py-3 border-2 border-white shadow-brutal hover:-translate-y-1 transition-transform"
            >
              Start Building Free
            </Link>
          </div>
        </article>
      </main>

      {/* Footer */}
      <footer className="border-t-2 border-black bg-black text-white py-8">
        <div className="max-w-4xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-gray-400">&copy; 2026 ManyMarkets. All rights reserved.</p>
          <div className="flex gap-6 text-sm">
            <Link href="/privacy" className="text-gray-400 hover:text-uvz-orange transition-colors">Privacy</Link>
            <Link href="/terms" className="text-gray-400 hover:text-uvz-orange transition-colors">Terms</Link>
            <Link href="/refund-policy" className="text-gray-400 hover:text-uvz-orange transition-colors">Refund Policy</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
