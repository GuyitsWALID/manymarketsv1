import { NextResponse } from 'next/server';
import { generateText } from 'ai';
import { models } from '../../../../lib/ai/provider';

export async function POST(request: Request) {
  try {
    const { taskId, prompt, context, productType } = await request.json();

    // Build task-specific prompts for short, first-person responses
    let systemPrompt = '';
    let userPrompt = '';

    const contextInfo = Object.entries(context)
      .filter(([, value]) => value && typeof value === 'string')
      .map(([key, value]) => `${key}: ${value}`)
      .join('\n');

    if (taskId === 'targetAudience') {
      systemPrompt = `You are helping a product creator fill out their product form. 
Generate a SHORT, first-person response (2-4 sentences max) describing who this product is for.
Write as if YOU are the product creator describing YOUR target audience.
Start directly with the answer - no explanations, no headers, no bullet points.
Example format: "My target audience is busy professionals aged 25-45 who struggle with productivity and want simple tools to stay organized."`;

      userPrompt = `Product: ${context.name || 'Unknown'}
Tagline: ${context.tagline || 'None'}
Description: ${context.description || 'None'}

Write a brief, first-person description of the target audience (2-4 sentences). Start with "My target audience is..." or similar.`;

    } else if (taskId === 'problemSolved') {
      systemPrompt = `You are helping a product creator fill out their product form.
Generate a SHORT, first-person response (2-4 sentences max) describing what problem this product solves.
Write as if YOU are the product creator describing the problem YOUR product solves.
Start directly with the answer - no explanations, no headers, no bullet points.
Example format: "This product solves the frustration of managing multiple apps for wellness. It helps users save time and reduce stress by providing everything in one place."`;

      userPrompt = `Product: ${context.name || 'Unknown'}
Tagline: ${context.tagline || 'None'}
Description: ${context.description || 'None'}

Write a brief, first-person description of the problem this product solves (2-4 sentences). Start with "This product solves..." or "My product helps..." or similar.`;

    } else if (productType === 'software-tool' || productType === 'saas') {
      // Enhanced prompts for software/SaaS builder - both use the professional PRD workflow
      systemPrompt = getSoftwareBuilderSystemPrompt(taskId);
      userPrompt = getSoftwareBuilderUserPrompt(taskId, context, prompt);
    } else {
      // Default prompt for other tasks
      systemPrompt = `You are an expert digital product creator. 
Provide SHORT, practical, first-person responses (2-4 sentences max).
Write as if you are the product creator filling out their own form.
No explanations, headers, or bullet points - just the direct answer.`;

      userPrompt = `Product Type: ${productType}

Product Information:
${contextInfo || 'No information provided yet'}

Task: ${prompt}

Provide a brief, first-person response (2-4 sentences max).`;
    }

    // Prefer the product-builder Groq key (if configured) for builder traffic
    const hasBuilderKey = !!(process.env.GROQ_PRODUCT_BUILDER_API_KEY && process.env.GROQ_PRODUCT_BUILDER_API_KEY !== '' && process.env.GROQ_PRODUCT_BUILDER_API_KEY !== 'your_groq_api_key');
    console.log(`Builder generation - GROQ_PRODUCT_BUILDER_API_KEY configured: ${hasBuilderKey}`);

    // Candidate models (try in order until one succeeds)
    const candidates: Array<{ name: string; model: any }> = [];
    if (hasBuilderKey) {
      candidates.push({ name: 'groqProductBuilder-70b', model: models.groqProductBuilder() });
    }
    // Add a smaller/faster groq fallback in case the heavy model is rate-limited
    candidates.push({ name: 'groqLlama8B', model: models.groqLlama8B() });
    candidates.push({ name: 'groqMixtral', model: models.groqMixtral() });
    // Finally try Google Gemini as a last-resort fallback
    candidates.push({ name: 'geminiFlash', model: models.geminiFlash() });

    let lastError: any = null;
    for (const cand of candidates) {
      try {
        console.log(`Attempting generation with model: ${cand.name}`);
        const res = await generateText({ model: cand.model, system: systemPrompt, prompt: userPrompt }) as any;
        const text = res?.text || res?.output?.[0]?.content?.[0]?.text || '';
        console.log(`Generation succeeded with model: ${cand.name}`);
        return NextResponse.json({ content: text });
      } catch (err: any) {
        lastError = err;
        console.warn(`Model ${cand.name} failed: ${err?.message || err}`);
        // If rate-limited, continue to next candidate immediately
        if (err?.statusCode === 429 || (err?.data && err.data.error && err.data.error.code === 'rate_limit_exceeded')) {
          console.warn(`Rate-limited on ${cand.name}; trying next fallback model.`);
          continue;
        }
        // For other non-retryable errors, try next candidate as well
        continue;
      }
    }

    // All candidates failed
    console.error('All model candidates failed for builder generation', lastError);
    return NextResponse.json({ error: 'Failed to generate content (all providers failed)' }, { status: 500 });
  } catch (error) {
    console.error('Error generating content:', error);
    return NextResponse.json(
      { error: 'Failed to generate content' },
      { status: 500 }
    );
  }
}

// Enhanced system prompts for software tool builder
function getSoftwareBuilderSystemPrompt(taskId: string): string {
  const basePrompt = `You are a senior software architect and product manager with 15+ years of experience building production-grade software products. You help founders and developers create professional, secure, and scalable software.

Your responses should be:
- Professional and actionable
- Focused on building real, production-ready software
- Security-conscious (always consider auth, data protection, input validation)
- Design-conscious (clean, modern, NOT gimmicky)
- MVP-focused (prioritize core features, avoid scope creep)`;

  const taskPrompts: Record<string, string> = {
    'core-features': `${basePrompt}

When generating MVP features:
- List only 3-5 essential features maximum
- Focus on the core value proposition
- Each feature should be achievable in 1-2 days
- Explicitly exclude "nice to have" features
- Format as a numbered list with brief descriptions`,

    'differentiators': `${basePrompt}

When identifying differentiators:
- Focus on specific, tangible differences
- Avoid generic claims like "better UX" without specifics
- Connect to the competitor weaknesses mentioned
- Each differentiator should be provable/demonstrable`,

    'prd-full': `${basePrompt}

When generating a PRD (Product Requirements Document):
- Be comprehensive but practical
- Include: Executive Summary, Problem Statement, Target Users, Functional Requirements, Non-Functional Requirements, Technical Architecture, Security Requirements, UI/UX Guidelines, MVP Scope, Success Metrics
- Use markdown formatting with clear sections
- Keep each section focused and actionable
- This document should be usable by developers to build the product`,

    'user-stories': `${basePrompt}

When generating user stories:
- Use the format: "As a [user type], I want to [action] so that [benefit]"
- Include 2-3 acceptance criteria per story
- Focus on user outcomes, not implementation details
- Prioritize stories (P0 = must have, P1 = should have, P2 = nice to have)`,

    'tech-stack': `${basePrompt}

When recommending a tech stack:
- Choose modern, well-supported technologies
- Consider developer experience and hiring pool
- Prioritize: Next.js, TypeScript, Tailwind, PostgreSQL for web apps
- Include specific recommendations for auth, hosting, and database
- Explain WHY each choice makes sense for this specific project`,

    'architecture': `${basePrompt}

When designing architecture:
- Create a clear system diagram (text-based)
- Define data flow between components
- Outline the database schema (main entities and relationships)
- Specify API structure (REST endpoints or tRPC procedures)
- Keep it MVP-focused - don't over-engineer`,

    'security': `${basePrompt}

When creating security requirements:
- Cover: Authentication, Authorization, Data encryption, Input validation, API security
- Be specific about implementation (e.g., "bcrypt with cost factor 12")
- Include a security checklist developers can follow
- Address OWASP Top 10 vulnerabilities
- Don't be paranoid, but don't skip important protections`,

    'design-system': `${basePrompt}

When creating a design system:
- Focus on PROFESSIONAL, CLEAN design - NOT gimmicky or trendy
- Specify: Color palette (with hex codes), Typography scale, Spacing system, Component patterns
- Use a neutral, trustworthy color scheme (blues, grays) with one accent color
- Components should look like they belong in a professional business tool
- Avoid: Excessive gradients, neon colors, playful illustrations, over-animation`,

    'key-screens': `${basePrompt}

When defining key screens:
- List only essential screens for MVP (usually 5-8)
- For each screen specify: Purpose, Main elements, User actions, States (loading, empty, error)
- Keep descriptions concise but complete
- Think mobile-first - how does it work on small screens?`,

    'master-prompt': `${basePrompt}

When generating the master build prompt:
- Create a COMPLETE, COPY-PASTE-READY prompt for AI coding tools
- Include ALL specifications: features, tech stack, architecture, design, security
- Structure it so an AI tool can build a working MVP
- Be specific about file structure and implementation details
- Include code quality standards and best practices
- This prompt should produce production-quality code, not a prototype`,

    'cursor-prompt': `${basePrompt}

When creating a Cursor-specific prompt:
- Structure for Cursor AI's workflow (@codebase, @docs commands)
- Specify file creation order (configs → database → API → components → pages)
- Include Cursor-specific tips (use Tab completion, Composer for multi-file)
- Format as step-by-step implementation guide`,

    'lovable-prompt': `${basePrompt}

When creating a Lovable/Bolt prompt:
- Optimize for visual builders that work iteratively
- Start with clear description of the end result
- Break into phases: Phase 1 (core), Phase 2 (polish), Phase 3 (extras)
- Focus on describing WHAT to build, let the tool figure out HOW`,

    'readme': `${basePrompt}

When writing README and landing copy:
- README: Include product description, features, tech stack, getting started guide
- Landing copy: Headline (benefit-focused), subheadline, 3-4 feature descriptions, CTA
- Be clear and professional, not salesy
- Include setup instructions that actually work`,

    'docs': `${basePrompt}

When creating documentation:
- Write a quick start guide (get running in 5 minutes)
- Document each main feature with examples
- Include an FAQ section
- Add troubleshooting tips for common issues
- Keep it scannable with clear headers`,

    'pricing': `${basePrompt}

When designing pricing:
- Recommend a specific model (freemium, subscription, one-time)
- Provide actual price points with justification
- Define what's in each tier (if multiple tiers)
- Consider the target audience's budget
- Include competitive pricing analysis`,
  };

  return taskPrompts[taskId] || basePrompt;
}

function getSoftwareBuilderUserPrompt(taskId: string, context: Record<string, any>, defaultPrompt: string): string {
  // Build rich context from all available information
  const productInfo = `
Product Name: ${context.name || context.productName || 'Unnamed Product'}
Tagline: ${context.tagline || 'Not specified'}
Type: ${context.type || context.productType || 'Software Tool'}
Problem Being Solved: ${context.problem || context.problemSolved || 'Not specified'}
Target Audience: ${context['target-audience'] || context.targetAudience || 'Not specified'}
UVZ Research: ${context['uvz-summary'] || context.uvz || 'Not provided'}
Competitor Gaps: ${context['competitor-gaps'] || context.competitorWeaknesses || 'Not specified'}
Core Features: ${context['core-features'] || context.coreFeatures || 'Not defined yet'}
Differentiators: ${context.differentiators || 'Not defined yet'}
Tech Stack: ${context['tech-stack'] || context.techStack || 'Not chosen yet'}
Architecture: ${context.architecture || 'Not designed yet'}
Design System: ${context['design-system'] || 'Not defined yet'}
`.trim();

  const taskPrompts: Record<string, string> = {
    'core-features': `Based on this product information:

${productInfo}

Generate 3-5 focused MVP features that:
1. Directly solve the stated problem
2. Can each be built in 1-2 days
3. Together deliver the core value proposition

Format as a numbered list with brief descriptions (1-2 sentences each).`,

    'differentiators': `Based on this product information:

${productInfo}

List 2-3 specific differentiators that:
1. Address the competitor gaps mentioned
2. Align with the UVZ (unique value zone)
3. Are tangible and provable (not vague claims)

Format as bullet points with specific explanations.`,

    'prd-full': `Generate a comprehensive Product Requirements Document (PRD) for:

${productInfo}

Include these sections:
1. Executive Summary
2. Problem Statement & Solution Overview  
3. Target Users & Personas
4. Functional Requirements (features with acceptance criteria)
5. Non-Functional Requirements (performance, scalability, accessibility)
6. Technical Architecture Overview
7. Security Requirements
8. UI/UX Requirements
9. MVP Scope (what's in vs. out)
10. Success Metrics
11. Risks & Mitigations

Use proper markdown formatting. This should be a complete, usable document.`,

    'user-stories': `Based on this product:

${productInfo}

Generate 5-8 user stories covering the main functionality.

Format each as:
**US-X: [Title]**
As a [user type], I want to [action] so that [benefit].

**Acceptance Criteria:**
- [ ] Criteria 1
- [ ] Criteria 2
- [ ] Criteria 3

**Priority:** P0/P1/P2`,

    'tech-stack': `Recommend a tech stack for:

${productInfo}

Provide:
1. Frontend framework and why
2. Backend/API approach and why
3. Database choice and why
4. Authentication solution and why
5. Hosting/deployment recommendation
6. Key libraries/tools

Explain WHY each choice fits this specific project.`,

    'architecture': `Design the system architecture for:

${productInfo}

Include:
1. System diagram (text-based using ASCII or markdown)
2. Component breakdown (frontend, backend, database, external services)
3. Data flow description
4. Database schema outline (main entities and relationships)
5. API structure (main endpoints or procedures)

Keep it MVP-focused - don't over-engineer.`,

    'security': `Create a security requirements checklist for:

${productInfo}

Cover:
1. Authentication (method, session management, password requirements)
2. Authorization (role-based access, permission model)
3. Data security (encryption at rest, in transit, PII handling)
4. Input validation (where and how)
5. API security (rate limiting, CORS, headers)
6. Common vulnerabilities prevention (XSS, CSRF, SQL injection)

Be specific about implementation details.`,

    'design-system': `Create a design system specification for:

${productInfo}

IMPORTANT: Design should be PROFESSIONAL and TRUSTWORTHY, not gimmicky or trendy.

Include:
1. Color palette (primary, secondary, accent, semantic colors) with hex codes
2. Typography scale (font family, sizes, weights)
3. Spacing system (base unit, common values)
4. Border radius and shadows
5. Key component patterns (buttons, inputs, cards, modals)
6. Interaction states (hover, active, disabled, loading, error)

Think: How would a professional B2B SaaS tool look?`,

    'key-screens': `Define the key screens for:

${productInfo}

List 5-8 essential screens, for each provide:
- **Screen Name**
- **Purpose:** What user goal does this serve?
- **Main Elements:** Key UI components
- **User Actions:** What can users do here?
- **States:** Loading, empty, error states

Think mobile-first.`,

    'master-prompt': `Generate a COMPLETE, COPY-PASTE-READY build prompt for AI coding tools.

Product Information:
${productInfo}

${context['tech-stack'] ? `Tech Stack: ${context['tech-stack']}` : ''}
${context.architecture ? `Architecture: ${context.architecture}` : ''}
${context['design-system'] ? `Design System: ${context['design-system']}` : ''}
${context.security ? `Security Requirements: ${context.security}` : ''}

Create a comprehensive prompt that includes:
1. Product overview and goals
2. All features with specifications
3. Technical requirements and stack
4. Database schema
5. API endpoints
6. UI/UX specifications
7. Security requirements
8. File structure
9. Code quality standards
10. What NOT to include (scope boundaries)

This prompt should enable an AI tool to build a WORKING MVP, not a prototype.`,

    'cursor-prompt': `Adapt the build specifications into a Cursor AI-optimized prompt.

Product Information:
${productInfo}

Master Prompt Context:
${context['master-prompt'] || 'Generate based on available information'}

Create a prompt that:
1. Uses Cursor-specific features (@codebase, @docs, Composer)
2. Specifies implementation order (what files to create first)
3. Includes step-by-step building instructions
4. Has clear checkpoints for verification`,

    'lovable-prompt': `Adapt the build specifications for Lovable or Bolt.new.

Product Information:
${productInfo}

Master Prompt Context:
${context['master-prompt'] || 'Generate based on available information'}

Create a prompt that:
1. Clearly describes the end result
2. Breaks building into phases
3. Focuses on WHAT not HOW
4. Includes iteration guidance`,

    'readme': `Create README.md and landing page copy for:

${productInfo}

Include:

## README.md
- Product description
- Features list
- Tech stack
- Getting started (installation, setup, run)
- Environment variables needed
- Contributing guidelines

## Landing Page Copy
- Headline (benefit-focused, not feature-focused)
- Subheadline
- 3-4 feature blocks with icons
- Social proof placeholder
- CTA`,

    'docs': `Create user documentation for:

${productInfo}

Include:
1. Quick Start Guide (get value in 5 minutes)
2. Feature documentation (how to use each feature)
3. FAQ (5-10 common questions)
4. Troubleshooting (common issues and fixes)

Keep it scannable and practical.`,

    'pricing': `Design a pricing strategy for:

${productInfo}

Provide:
1. Recommended pricing model and why
2. Specific price points
3. Tier definitions (if multiple tiers)
4. Feature comparison table
5. Competitive analysis
6. Revenue projections (optional)`,
  };

  return taskPrompts[taskId] || `${productInfo}\n\nTask: ${defaultPrompt}`;
}
