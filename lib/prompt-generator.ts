// High-Value SaaS Prompt Generator
// Generates comprehensive, structured prompts for AI-powered development tools

export type PromptMode = 'full-build' | 'spec-only' | 'api-design' | 'ui-design' | 'database-design';

export type SaaSType = 'dashboard' | 'crm' | 'marketplace' | 'analytics' | 'saas-tool' | 'mobile-app' | 'automation' | 'ai-tool' | 'custom';

export interface ProductConfig {
  // Basic Info
  name: string;
  tagline: string;
  description: string;
  productType: SaaSType;
  
  // Target Users
  targetAudience: string;
  userRoles?: string[];
  userSkillLevel?: 'beginner' | 'intermediate' | 'advanced' | 'mixed';
  companySize?: 'solo' | 'small' | 'medium' | 'enterprise' | 'all';
  
  // Problem & Vision
  problemSolved: string;
  successMetrics?: string[];
  
  // Features
  coreFeatures: string[];
  additionalFeatures?: string[];
  
  // Technical
  techStack?: string[];
  integrations?: string[];
  authMethod?: 'email' | 'social' | 'sso' | 'all';
  
  // Business
  pricingModel?: 'free' | 'freemium' | 'subscription' | 'one-time' | 'usage-based';
  plans?: { name: string; price: string; features: string[] }[];
}

// SaaS Type Templates with sensible defaults
export const SAAS_TEMPLATES: Record<SaaSType, Partial<ProductConfig>> = {
  dashboard: {
    userRoles: ['Admin', 'Manager', 'Viewer'],
    techStack: ['Next.js', 'React', 'Tailwind CSS', 'PostgreSQL', 'Prisma'],
    authMethod: 'all',
    pricingModel: 'subscription',
  },
  crm: {
    userRoles: ['Admin', 'Sales Rep', 'Manager', 'Support'],
    techStack: ['Next.js', 'React', 'Tailwind CSS', 'PostgreSQL', 'Prisma'],
    integrations: ['Email', 'Calendar', 'Slack', 'Zapier'],
    authMethod: 'all',
    pricingModel: 'subscription',
  },
  marketplace: {
    userRoles: ['Buyer', 'Seller', 'Admin', 'Support'],
    techStack: ['Next.js', 'React', 'Tailwind CSS', 'PostgreSQL', 'Stripe'],
    integrations: ['Stripe', 'PayPal', 'Email', 'Analytics'],
    authMethod: 'all',
    pricingModel: 'usage-based',
  },
  analytics: {
    userRoles: ['Admin', 'Analyst', 'Viewer'],
    techStack: ['Next.js', 'React', 'Tailwind CSS', 'PostgreSQL', 'Chart.js'],
    integrations: ['Google Analytics', 'Mixpanel', 'Segment'],
    authMethod: 'all',
    pricingModel: 'subscription',
  },
  'saas-tool': {
    userRoles: ['Admin', 'User', 'Team Member'],
    techStack: ['Next.js', 'React', 'Tailwind CSS', 'PostgreSQL', 'Prisma'],
    authMethod: 'all',
    pricingModel: 'freemium',
  },
  'mobile-app': {
    userRoles: ['User', 'Admin'],
    techStack: ['React Native', 'Expo', 'Node.js', 'PostgreSQL'],
    authMethod: 'social',
    pricingModel: 'freemium',
  },
  automation: {
    userRoles: ['Admin', 'User'],
    techStack: ['Next.js', 'React', 'Node.js', 'PostgreSQL', 'Bull Queue'],
    integrations: ['Zapier', 'Make', 'n8n', 'Webhooks'],
    authMethod: 'all',
    pricingModel: 'usage-based',
  },
  'ai-tool': {
    userRoles: ['User', 'Admin', 'API User'],
    techStack: ['Next.js', 'React', 'Python', 'FastAPI', 'PostgreSQL'],
    integrations: ['OpenAI API', 'Anthropic API', 'Hugging Face'],
    authMethod: 'all',
    pricingModel: 'usage-based',
  },
  custom: {
    userRoles: ['Admin', 'User'],
    techStack: ['Next.js', 'React', 'Tailwind CSS', 'PostgreSQL'],
    authMethod: 'email',
    pricingModel: 'subscription',
  },
};

// Prompt mode configurations
const PROMPT_MODES: Record<PromptMode, { name: string; description: string; outputFormat: string }> = {
  'full-build': {
    name: 'Full Build',
    description: 'Complete implementation with all features',
    outputFormat: `
OUTPUT REQUIREMENTS:
1. Complete, production-ready code
2. All features fully implemented
3. Proper error handling and edge cases
4. Responsive UI design
5. Authentication and authorization
6. Database schema and migrations
7. API routes and business logic
8. Deployment configuration`,
  },
  'spec-only': {
    name: 'Product Spec',
    description: 'Detailed product requirements document',
    outputFormat: `
OUTPUT REQUIREMENTS:
1. Executive Summary
2. Problem Statement & Solution Overview
3. User Personas and Journey Maps
4. Feature Specifications with acceptance criteria
5. Technical Architecture Diagram (text description)
6. Data Model & Entity Relationships
7. API Endpoint Documentation
8. UI/UX Wireframe Descriptions
9. Security & Compliance Requirements
10. Success Metrics & KPIs`,
  },
  'api-design': {
    name: 'API Design',
    description: 'RESTful/GraphQL API specification',
    outputFormat: `
OUTPUT REQUIREMENTS:
1. OpenAPI/Swagger specification
2. All endpoints with request/response schemas
3. Authentication flow documentation
4. Rate limiting and pagination strategies
5. Error response formats
6. Webhook specifications
7. API versioning strategy
8. Example requests and responses`,
  },
  'ui-design': {
    name: 'UI Design',
    description: 'UI components and design system',
    outputFormat: `
OUTPUT REQUIREMENTS:
1. Component hierarchy and structure
2. Page layouts and navigation
3. Design system tokens (colors, typography, spacing)
4. Interactive states (hover, active, disabled)
5. Form patterns and validation
6. Empty states and loading states
7. Error handling UI
8. Responsive breakpoints
9. Accessibility considerations`,
  },
  'database-design': {
    name: 'Database Design',
    description: 'Database schema and data model',
    outputFormat: `
OUTPUT REQUIREMENTS:
1. Entity-Relationship Diagram (text description)
2. Complete database schema with all tables
3. Field types, constraints, and defaults
4. Indexes for performance
5. Foreign key relationships
6. Row-level security policies
7. Migration scripts
8. Seed data for testing`,
  },
};

// Generate the comprehensive build prompt
export function generateBuildPrompt(config: ProductConfig, mode: PromptMode = 'full-build'): string {
  const template = SAAS_TEMPLATES[config.productType] || SAAS_TEMPLATES.custom;
  const modeConfig = PROMPT_MODES[mode];
  
  // Merge template defaults with config
  const mergedConfig = {
    ...template,
    ...config,
    userRoles: config.userRoles || template.userRoles || ['Admin', 'User'],
    techStack: config.techStack || template.techStack || ['Next.js', 'React', 'Tailwind CSS'],
    integrations: config.integrations || template.integrations || [],
  };

  const prompt = `
# 🚀 ${config.name} - ${modeConfig.name} Specification

You are an expert full-stack developer and SaaS architect with 15+ years of experience building production-grade applications. You will build a complete, high-quality ${config.productType} application following this detailed specification.

---

## 📋 PRODUCT OVERVIEW

**Product Name:** ${config.name}
**Tagline:** ${config.tagline || 'A powerful solution for modern teams'}
**Type:** ${formatProductType(config.productType)}

### Vision Statement
${config.description || 'No description provided'}

### Problem Being Solved
${config.problemSolved || 'Not specified'}

### Success Metrics
${config.successMetrics?.length ? config.successMetrics.map(m => `- ${m}`).join('\n') : `- User adoption and retention
- Time saved for users
- Revenue growth
- Customer satisfaction score`}

---

## 👥 TARGET USERS & PERSONAS

**Primary Audience:** ${config.targetAudience || 'Not specified'}
**User Skill Level:** ${formatSkillLevel(config.userSkillLevel)}
**Company Size:** ${formatCompanySize(config.companySize)}

### User Roles & Permissions
${mergedConfig.userRoles?.map((role, i) => `${i + 1}. **${role}**
   - Access Level: ${getRoleAccessLevel(role)}
   - Key Actions: ${getRoleActions(role, config.productType)}`).join('\n\n')}

### User Journey
1. **Discovery:** User finds the product through ${getDiscoveryChannels(config.productType)}
2. **Onboarding:** Quick setup with ${getOnboardingStyle(config.productType)}
3. **First Value:** User achieves first success within ${getTimeToValue(config.productType)}
4. **Habit Formation:** Regular use through ${getHabitDrivers(config.productType)}
5. **Expansion:** User upgrades or refers others

---

## ⚡ CORE FEATURES

${config.coreFeatures?.length ? config.coreFeatures.map((feature, i) => `
### Feature ${i + 1}: ${feature}
**Priority:** ${i < 3 ? 'Must Have (P0)' : i < 6 ? 'Should Have (P1)' : 'Nice to Have (P2)'}
**Description:** Implement ${feature} with full functionality
**User Story:** As a user, I want to ${feature.toLowerCase()} so that I can achieve my goals efficiently
**Acceptance Criteria:**
- [ ] Feature is fully functional and tested
- [ ] UI is intuitive and responsive
- [ ] Edge cases are handled gracefully
- [ ] Loading and error states are implemented
- [ ] Feature works across all user roles (with appropriate permissions)
**Edge Cases to Handle:**
- Empty states (no data)
- Error states (network, validation)
- Loading states (skeleton UI)
- Concurrent access/updates
- Large data sets (pagination)
`).join('\n') : 'No features specified'}

${config.additionalFeatures?.length ? `
### Additional Features (Phase 2)
${config.additionalFeatures.map(f => `- ${f}`).join('\n')}
` : ''}

---

## 🗄️ DATA MODEL & ENTITIES

Design a complete database schema with the following entities:

### Core Entities
${generateDataModel(config)}

### Relationships
- All entities should have proper foreign key relationships
- Implement cascade deletes where appropriate
- Use soft deletes for user-facing data
- Add created_at, updated_at timestamps to all tables
- Include created_by, updated_by for audit trails

### Security
- Implement Row Level Security (RLS) policies
- Encrypt sensitive data at rest
- Hash passwords with bcrypt (cost factor 12)
- Store API keys securely

---

## 🎨 UX/UI SPECIFICATIONS

### Design System
- **Style:** Modern, clean, professional
- **Colors:** Use a cohesive color palette with primary, secondary, and accent colors
- **Typography:** Inter or similar modern sans-serif font
- **Spacing:** 4px base unit grid system
- **Border Radius:** Rounded corners (8px standard, 12px for cards)
- **Shadows:** Subtle shadows for depth and hierarchy

### Key Screens
${generateUIScreens(config)}

### Interactive States
- **Hover:** Subtle color change or shadow
- **Active/Pressed:** Slightly darker or inset
- **Disabled:** Reduced opacity (50%)
- **Loading:** Skeleton screens or spinners
- **Error:** Red accent with clear error message
- **Success:** Green accent with confirmation

### Responsive Breakpoints
- Mobile: < 640px
- Tablet: 640px - 1024px
- Desktop: > 1024px

---

## 🔧 TECHNICAL ARCHITECTURE

### Tech Stack
${mergedConfig.techStack?.map(t => `- ${t}`).join('\n')}

### Authentication & Authorization
- **Method:** ${formatAuthMethod(mergedConfig.authMethod)}
- Implement JWT tokens with refresh token rotation
- Session management with secure cookies
- Role-based access control (RBAC)
- Magic link / passwordless option

### API Design
- RESTful API with consistent naming
- Proper HTTP status codes
- Request validation with Zod
- Rate limiting (100 req/min for free, 1000 for paid)
- Pagination for list endpoints
- Filtering and sorting support

### Integrations
${mergedConfig.integrations?.length ? mergedConfig.integrations.map(i => `- ${i}`).join('\n') : '- None specified'}

### Performance Requirements
- Page load time: < 2 seconds
- API response time: < 200ms (p95)
- Support 1000+ concurrent users
- Implement caching where appropriate
- Lazy load non-critical components

### Security Requirements
- HTTPS everywhere
- CSRF protection
- XSS prevention
- SQL injection prevention
- Input sanitization
- Rate limiting
- Audit logging

---

## 💰 BUSINESS MODEL

### Pricing Model
**Type:** ${formatPricingModel(config.pricingModel)}

${config.plans?.length ? `
### Pricing Plans
${config.plans.map(plan => `
**${plan.name}** - ${plan.price}
${plan.features.map(f => `  - ${f}`).join('\n')}
`).join('\n')}
` : generateDefaultPricing(config.pricingModel)}

### Monetization Features
- Subscription management
- Usage tracking and limits
- Upgrade prompts at limit thresholds
- Team/seat-based pricing support
- Annual discount option (20% off)

---

## 🚀 IMPLEMENTATION GUIDELINES

### Code Quality Standards
- TypeScript strict mode enabled
- ESLint + Prettier for code formatting
- Comprehensive error handling
- Meaningful variable and function names
- Comments for complex logic
- Unit tests for critical paths

### File Structure
\`\`\`
/app
  /api          # API routes
  /(auth)       # Auth pages
  /(dashboard)  # Main app pages
/components
  /ui           # Reusable UI components
  /features     # Feature-specific components
/lib
  /db           # Database utilities
  /utils        # Helper functions
  /hooks        # Custom React hooks
/types          # TypeScript types
\`\`\`

### Development Workflow
1. Set up project with all dependencies
2. Implement database schema
3. Build authentication system
4. Create core UI components
5. Implement features in priority order
6. Add integrations
7. Testing and polish
8. Deploy to production

---

${modeConfig.outputFormat}

---

## ⚠️ IMPORTANT CONSTRAINTS

1. **DO NOT** use placeholder or mock data in production code
2. **DO NOT** skip error handling or edge cases
3. **DO NOT** hardcode sensitive values (use environment variables)
4. **DO NOT** ignore accessibility (a11y) requirements
5. **DO NOT** leave console.log statements in production code
6. **ALWAYS** validate user input on both client and server
7. **ALWAYS** implement proper loading and error states
8. **ALWAYS** make the UI responsive and mobile-friendly
9. **ALWAYS** follow security best practices
10. **ALWAYS** write clean, maintainable, documented code

---

## 🎯 DELIVERABLES CHECKLIST

- [ ] Complete, working application
- [ ] All core features implemented
- [ ] Authentication and authorization
- [ ] Responsive UI design
- [ ] Database with proper schema
- [ ] API routes with validation
- [ ] Error handling throughout
- [ ] Loading states and skeletons
- [ ] Environment variable configuration
- [ ] README with setup instructions

---

Now, build this ${config.name} application following ALL specifications above. Start with the project structure and implement each component systematically. The code should be production-ready, not a prototype.
`.trim();

  return prompt;
}

// Helper functions
function formatProductType(type: SaaSType): string {
  const types: Record<SaaSType, string> = {
    dashboard: 'Admin Dashboard / Analytics Platform',
    crm: 'Customer Relationship Management (CRM)',
    marketplace: 'Two-Sided Marketplace',
    analytics: 'Analytics & Business Intelligence Tool',
    'saas-tool': 'SaaS Application',
    'mobile-app': 'Mobile Application',
    automation: 'Automation & Workflow Tool',
    'ai-tool': 'AI-Powered Application',
    custom: 'Custom Software Application',
  };
  return types[type] || type;
}

function formatSkillLevel(level?: string): string {
  const levels: Record<string, string> = {
    beginner: 'Beginner (non-technical users)',
    intermediate: 'Intermediate (some technical knowledge)',
    advanced: 'Advanced (technical/power users)',
    mixed: 'Mixed (all skill levels)',
  };
  return levels[level || 'mixed'] || 'Mixed (all skill levels)';
}

function formatCompanySize(size?: string): string {
  const sizes: Record<string, string> = {
    solo: 'Solo entrepreneurs and freelancers',
    small: 'Small businesses (1-50 employees)',
    medium: 'Medium businesses (50-500 employees)',
    enterprise: 'Enterprise (500+ employees)',
    all: 'All company sizes',
  };
  return sizes[size || 'all'] || 'All company sizes';
}

function formatAuthMethod(method?: string): string {
  const methods: Record<string, string> = {
    email: 'Email/Password',
    social: 'Social Login (Google, GitHub, etc.)',
    sso: 'SSO/SAML',
    all: 'Email, Social, and SSO options',
  };
  return methods[method || 'email'] || 'Email/Password';
}

function formatPricingModel(model?: string): string {
  const models: Record<string, string> = {
    free: 'Free (ad-supported or open source)',
    freemium: 'Freemium (free tier + paid plans)',
    subscription: 'Monthly/Annual Subscription',
    'one-time': 'One-Time Purchase',
    'usage-based': 'Usage-Based / Pay-As-You-Go',
  };
  return models[model || 'subscription'] || 'Subscription';
}

function getRoleAccessLevel(role: string): string {
  const levels: Record<string, string> = {
    Admin: 'Full access to all features, settings, and user management',
    Manager: 'Access to team features, reports, and limited settings',
    User: 'Access to core features within their scope',
    Viewer: 'Read-only access to shared content',
    'Team Member': 'Collaborative access within team projects',
    'Sales Rep': 'Access to leads, contacts, and deals',
    Support: 'Access to tickets, customers, and knowledge base',
    Buyer: 'Access to browse, purchase, and manage orders',
    Seller: 'Access to listings, orders, and seller dashboard',
    Analyst: 'Access to reports, data exports, and dashboards',
    'API User': 'Programmatic access via API keys',
  };
  return levels[role] || 'Standard user access';
}

function getRoleActions(role: string, productType: SaaSType): string {
  const actions: Record<string, string> = {
    Admin: 'Manage users, configure settings, view all data, billing',
    Manager: 'Create reports, manage team, approve workflows',
    User: 'Use core features, manage own data, collaborate',
    Viewer: 'View dashboards, download reports',
  };
  return actions[role] || 'Perform role-specific tasks';
}

function getDiscoveryChannels(type: SaaSType): string {
  return 'organic search, social media, referrals, or Product Hunt';
}

function getOnboardingStyle(type: SaaSType): string {
  return 'guided walkthrough, sample data, and quick-start templates';
}

function getTimeToValue(type: SaaSType): string {
  return '5 minutes';
}

function getHabitDrivers(type: SaaSType): string {
  return 'notifications, email summaries, and integrations with daily tools';
}

function generateDataModel(config: ProductConfig): string {
  const baseEntities = `
1. **Users**
   - id, email, name, avatar_url, role, created_at, updated_at
   - Password hash, email verification status, last login

2. **Organizations/Teams** (if multi-tenant)
   - id, name, slug, plan, owner_id, settings, created_at

3. **Memberships** (user-org relationship)
   - id, user_id, org_id, role, invited_at, accepted_at`;

  const featureEntities = config.coreFeatures?.slice(0, 5).map((feature, i) => {
    const entityName = feature.split(' ')[0];
    return `
${i + 4}. **${entityName}s** (from feature: ${feature})
   - id, name/title, description, status, owner_id, org_id
   - Feature-specific fields based on functionality
   - created_at, updated_at, archived_at`;
  }).join('') || '';

  return baseEntities + featureEntities + `

${config.coreFeatures?.length ? config.coreFeatures.length + 4 : 4}. **Activity Log**
   - id, user_id, action, entity_type, entity_id, metadata, created_at

${config.coreFeatures?.length ? config.coreFeatures.length + 5 : 5}. **Notifications**
   - id, user_id, type, title, body, read_at, created_at`;
}

function generateUIScreens(config: ProductConfig): string {
  return `
1. **Landing Page**
   - Hero section with value proposition
   - Feature highlights
   - Pricing section
   - Testimonials/social proof
   - CTA buttons

2. **Authentication**
   - Login page (email, social options)
   - Registration page
   - Forgot password flow
   - Email verification

3. **Dashboard (Main)**
   - Overview cards with key metrics
   - Recent activity feed
   - Quick actions
   - Navigation sidebar

4. **Feature Pages**
${config.coreFeatures?.slice(0, 5).map((f, i) => `   - ${f} page with list view, detail view, and CRUD actions`).join('\n') || '   - Core feature pages'}

5. **Settings**
   - Profile settings
   - Account settings
   - Team/organization settings
   - Billing and subscription
   - Integrations
   - API keys

6. **Onboarding**
   - Welcome modal
   - Setup wizard
   - Feature tour
   - Sample data import`;
}

function generateDefaultPricing(model?: string): string {
  switch (model) {
    case 'freemium':
      return `
### Pricing Plans
**Free** - $0/month
  - Basic features
  - Limited usage (100 items/month)
  - Community support

**Pro** - $19/month
  - All features
  - Unlimited usage
  - Priority support
  - API access

**Team** - $49/month
  - Everything in Pro
  - 5 team members
  - Admin controls
  - SSO

**Enterprise** - Custom
  - Unlimited team members
  - Custom integrations
  - Dedicated support
  - SLA`;
    case 'subscription':
      return `
### Pricing Plans
**Starter** - $9/month
  - Core features
  - 1 user
  - Email support

**Professional** - $29/month
  - All features
  - 5 users
  - Priority support

**Business** - $79/month
  - Everything in Pro
  - Unlimited users
  - API access
  - Custom branding`;
    default:
      return `
### Pricing Plans
Implement flexible pricing based on the business model.`;
  }
}

// Export a simpler function for the builder
export function generateQuickPrompt(
  name: string,
  description: string,
  targetAudience: string,
  problemSolved: string,
  features: string[],
  productType: string
): string {
  const saasType = mapProductTypeToSaaSType(productType);
  
  return generateBuildPrompt({
    name,
    tagline: description.substring(0, 100),
    description,
    productType: saasType,
    targetAudience,
    problemSolved,
    coreFeatures: features,
  });
}

function mapProductTypeToSaaSType(productType: string): SaaSType {
  const mapping: Record<string, SaaSType> = {
    'saas': 'saas-tool',
    'software-tool': 'saas-tool',
    'mobile-app': 'mobile-app',
    'dashboard': 'dashboard',
    'analytics': 'analytics',
    'marketplace': 'marketplace',
    'crm': 'crm',
    'automation': 'automation',
    'ai-tool': 'ai-tool',
  };
  return mapping[productType] || 'saas-tool';
}

// Create a ProductConfig from product data
export function createPromptConfigFromProduct(
  product: {
    name: string;
    description: string;
    targetAudience?: string;
    problemSolved?: string;
    coreFeatures: string[];
    additionalFeatures?: string[];
    productType: string;
  },
  mode: PromptMode = 'full-build'
): { config: ProductConfig; mode: PromptMode } {
  const saasType = mapProductTypeToSaaSType(product.productType);
  const template = SAAS_TEMPLATES[saasType] || SAAS_TEMPLATES.custom;
  
  const config: ProductConfig = {
    name: product.name,
    tagline: product.description?.substring(0, 100) || '',
    description: product.description || '',
    productType: saasType,
    targetAudience: product.targetAudience || 'General users',
    problemSolved: product.problemSolved || 'Not specified',
    coreFeatures: product.coreFeatures || [],
    additionalFeatures: product.additionalFeatures || [],
    ...template,
  };
  
  return { config, mode };
}

// Alias for backward compatibility
export const generateComprehensiveSaaSPrompt = (params: { config: ProductConfig; mode: PromptMode }): string => {
  return generateBuildPrompt(params.config, params.mode);
};
