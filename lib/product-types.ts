// Product Type Definitions and Configurations
export type ProductTypeId = 
  | 'ebook'
  | 'mini-guide'
  | 'notion-template'
  | 'ai-prompts'
  | 'digital-course'
  | 'design-assets'
  | 'software-tool'
  | 'printables'
  | 'mobile-app'
  | 'saas'
  | 'spreadsheet-template'
  | 'automation-workflow'
  | 'chrome-extension';

// Product type categories for routing builder workflows
export type ProductCategory = 'content' | 'software' | 'template' | 'tools-pack';

export function getProductCategory(productTypeId: string): ProductCategory {
  const softwareTypes = ['saas', 'software-tool', 'mobile-app', 'chrome-extension'];
  const templateTypes = ['notion-template', 'spreadsheet-template'];
  const toolsPackTypes = ['ai-prompts', 'automation-workflow'];
  if (softwareTypes.includes(productTypeId)) return 'software';
  if (templateTypes.includes(productTypeId)) return 'template';
  if (toolsPackTypes.includes(productTypeId)) return 'tools-pack';
  return 'content';
}

export interface ProductTypeConfig {
  id: ProductTypeId;
  name: string;
  icon: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedTime: string;
  requiredSkills: string[];
  steps: BuilderStep[];
  aiTools: string[];
  deliverables: string[];
  monetization: string[];
  promptTemplate: string;
}

export interface BuilderStep {
  id: string;
  name: string;
  description: string;
  tasks: BuilderTask[];
  aiAssisted: boolean;
  estimatedMinutes: number;
}

export interface BuilderTask {
  id: string;
  title: string;
  description: string;
  type: 'input' | 'textarea' | 'select' | 'checklist' | 'ai-generate' | 'file-upload';
  required: boolean;
  placeholder?: string;
  options?: string[];
  aiPrompt?: string;
}

export interface AITool {
  id: string;
  name: string;
  icon: string;
  description: string;
  url: string;
  bestFor: string[];
  category: 'code' | 'design' | 'writing' | 'all-in-one';
}

// AI Tools Configuration
export const AI_TOOLS: AITool[] = [
  {
    id: 'lovable',
    name: 'Lovable',
    icon: '/tools/lovable.svg',
    description: 'AI-powered full-stack app builder',
    url: 'https://lovable.dev',
    bestFor: ['Web Apps', 'SaaS', 'Landing Pages'],
    category: 'code',
  },
  {
    id: 'v0',
    name: 'v0',
    icon: '/tools/v0.svg',
    description: 'Vercel\'s AI UI generator',
    url: 'https://v0.dev',
    bestFor: ['UI Components', 'React Apps', 'Next.js'],
    category: 'code',
  },
  {
    id: 'replit',
    name: 'Replit',
    icon: '/tools/replit.svg',
    description: 'AI-powered coding environment',
    url: 'https://replit.com',
    bestFor: ['Full Apps', 'APIs', 'Bots'],
    category: 'code',
  },
  {
    id: 'cursor',
    name: 'Cursor',
    icon: '/tools/cursor.svg',
    description: 'AI-first code editor',
    url: 'https://cursor.com',
    bestFor: ['Complex Projects', 'Refactoring', 'Debugging'],
    category: 'code',
  },
  {
    id: 'bolt',
    name: 'Bolt.new',
    icon: '/tools/bolt.svg',
    description: 'Instant full-stack web apps',
    url: 'https://bolt.new',
    bestFor: ['Quick Prototypes', 'MVPs', 'Web Apps'],
    category: 'code',
  },
  {
    id: 'rork',
    name: 'Rork',
    icon: '/tools/rork.svg',
    description: 'AI-powered software builder for web & SaaS',
    url: 'https://rork.com',
    bestFor: ['Web Apps', 'SaaS', 'Rapid Prototyping'],
    category: 'code',
  },
  {
    id: 'claude',
    name: 'Claude',
    icon: '/tools/claude.svg',
    description: 'Advanced AI assistant for coding & writing',
    url: 'https://claude.ai',
    bestFor: ['Writing', 'Analysis', 'Complex Tasks'],
    category: 'all-in-one',
  },
  {
    id: 'chatgpt',
    name: 'ChatGPT',
    icon: '/tools/chatgpt.svg',
    description: 'OpenAI\'s conversational AI',
    url: 'https://chat.openai.com',
    bestFor: ['Writing', 'Brainstorming', 'Research'],
    category: 'all-in-one',
  },
  {
    id: 'gemini',
    name: 'Gemini',
    icon: '/tools/gemini.svg',
    description: 'Google\'s multimodal AI',
    url: 'https://gemini.google.com',
    bestFor: ['Research', 'Analysis', 'Content'],
    category: 'all-in-one',
  },
  {
    id: 'manus',
    name: 'Manus',
    icon: '/tools/manus.svg',
    description: 'AI agent for complex tasks',
    url: 'https://manus.ai',
    bestFor: ['Automation', 'Research', 'Complex Projects'],
    category: 'all-in-one',
  },
  {
    id: 'canva',
    name: 'Canva',
    icon: '/tools/canva.svg',
    description: 'AI-powered design platform',
    url: 'https://canva.com',
    bestFor: ['Graphics', 'Social Media', 'Presentations'],
    category: 'design',
  },
  {
    id: 'midjourney',
    name: 'Midjourney',
    icon: '/tools/midjourney.svg',
    description: 'AI image generation',
    url: 'https://midjourney.com',
    bestFor: ['Illustrations', 'Covers', 'Art'],
    category: 'design',
  },
  {
    id: 'figma',
    name: 'Figma',
    icon: '/tools/figma.svg',
    description: 'Collaborative design tool',
    url: 'https://figma.com',
    bestFor: ['UI/UX', 'Prototypes', 'Design Systems'],
    category: 'design',
  },
  {
    id: 'google-sheets',
    name: 'Google Sheets',
    icon: '/tools/google-sheets.svg',
    description: 'Spreadsheet creation and automation',
    url: 'https://sheets.google.com',
    bestFor: ['Spreadsheets', 'Data Analysis', 'Templates'],
    category: 'all-in-one',
  },
  {
    id: 'make',
    name: 'Make (Integromat)',
    icon: '/tools/make.svg',
    description: 'Visual automation platform',
    url: 'https://make.com',
    bestFor: ['Workflow Automation', 'Integrations', 'No-Code'],
    category: 'all-in-one',
  },
  {
    id: 'n8n',
    name: 'n8n',
    icon: '/tools/n8n.svg',
    description: 'Open-source workflow automation',
    url: 'https://n8n.io',
    bestFor: ['Self-hosted Automation', 'Workflows', 'APIs'],
    category: 'all-in-one',
  },
  {
    id: 'zapier',
    name: 'Zapier',
    icon: '/tools/zapier.svg',
    description: 'Connect apps and automate workflows',
    url: 'https://zapier.com',
    bestFor: ['App Integrations', 'Automation', 'No-Code'],
    category: 'all-in-one',
  },
];

// Product Type Configurations
export const PRODUCT_TYPES: ProductTypeConfig[] = [
  {
    id: 'ebook',
    name: 'eBook / Guide',
    icon: '📚',
    description: 'Digital books, guides, and written content products',
    difficulty: 'beginner',
    estimatedTime: '1-4 weeks',
    requiredSkills: ['writing', 'research'],
    deliverables: ['PDF eBook', 'ePub file', 'Cover design', 'Sales page copy'],
    monetization: ['One-time purchase', 'Bundle deals', 'Lead magnet'],
    aiTools: ['claude', 'chatgpt', 'canva', 'midjourney'],
    steps: [
      {
        id: 'concept',
        name: 'Concept & Outline',
        description: 'Define your book\'s core concept and structure',
        aiAssisted: true,
        estimatedMinutes: 30,
        tasks: [
          { id: 'title', title: 'Book Title', description: 'A compelling, benefit-driven title', type: 'input', required: true, placeholder: 'e.g., "The 30-Day Productivity Blueprint"' },
          { id: 'subtitle', title: 'Subtitle', description: 'Expand on the promise', type: 'input', required: false, placeholder: 'e.g., "Transform Your Work Habits and 10x Your Output"' },
          { id: 'target-audience', title: 'Target Reader', description: 'Who is this book for?', type: 'textarea', required: true, placeholder: 'Describe your ideal reader in detail...' },
          { id: 'problem', title: 'Core Problem', description: 'What problem does this book solve?', type: 'textarea', required: true, placeholder: 'The main pain point your readers face...' },
          { id: 'outline', title: 'Chapter Outline', description: 'AI will generate a detailed outline', type: 'ai-generate', required: true, aiPrompt: 'Generate a detailed chapter outline for this ebook' },
        ],
      },
      {
        id: 'content',
        name: 'Content Creation',
        description: 'Write and refine your book content',
        aiAssisted: true,
        estimatedMinutes: 480,
        tasks: [
          { id: 'intro', title: 'Introduction', description: 'Hook readers and set expectations', type: 'ai-generate', required: true, aiPrompt: 'Write an engaging introduction for this ebook' },
          { id: 'chapters', title: 'Chapter Content', description: 'Generate content for each chapter', type: 'ai-generate', required: true, aiPrompt: 'Write detailed content for each chapter' },
          { id: 'exercises', title: 'Exercises & Worksheets', description: 'Interactive elements for readers', type: 'ai-generate', required: false, aiPrompt: 'Create exercises and worksheets' },
          { id: 'conclusion', title: 'Conclusion & CTA', description: 'Wrap up and guide next steps', type: 'ai-generate', required: true, aiPrompt: 'Write a compelling conclusion with call-to-action' },
        ],
      },
      {
        id: 'design',
        name: 'Design & Formatting',
        description: 'Create visual assets and format the book',
        aiAssisted: true,
        estimatedMinutes: 120,
        tasks: [
          { id: 'cover', title: 'Cover Design', description: 'Create an eye-catching cover', type: 'ai-generate', required: true, aiPrompt: 'Generate cover design concepts and prompts' },
          { id: 'interior', title: 'Interior Layout', description: 'Format pages and typography', type: 'checklist', required: true },
          { id: 'graphics', title: 'Chapter Graphics', description: 'Illustrations and diagrams', type: 'ai-generate', required: false, aiPrompt: 'Generate illustration prompts for each chapter' },
        ],
      },
      {
        id: 'launch',
        name: 'Launch Preparation',
        description: 'Prepare for your book launch',
        aiAssisted: true,
        estimatedMinutes: 60,
        tasks: [
          { id: 'description', title: 'Sales Description', description: 'Compelling product description', type: 'ai-generate', required: true, aiPrompt: 'Write a compelling sales page description' },
          { id: 'pricing', title: 'Pricing Strategy', description: 'Set your price point', type: 'select', required: true, options: ['$9', '$19', '$29', '$39', '$49', 'Custom'] },
          { id: 'bonuses', title: 'Bonus Content', description: 'Additional value to include', type: 'ai-generate', required: false, aiPrompt: 'Suggest bonus content ideas' },
        ],
      },
    ],
    promptTemplate: `Create a comprehensive ebook on the topic: {{title}}

## TARGET AUDIENCE
{{target-audience}}

## CORE PROBLEM SOLVED
{{problem}}

## EBOOK SPECIFICATIONS
- Format: Professional PDF with clean typography
- Length: {{length}} pages approximately
- Style: {{style}}
- Tone: {{tone}}

## REQUIRED SECTIONS
1. Compelling Introduction
2. {{chapters}} Main Chapters
3. Actionable Exercises per Chapter
4. Summary/Key Takeaways
5. Resources Section
6. About the Author

## CONTENT REQUIREMENTS
- Each chapter should be 2,000-3,000 words
- Include practical examples and case studies
- Add actionable tips and frameworks
- Use clear headings and subheadings
- Include bullet points for scanability

Please generate the complete ebook content following this structure.`,
  },
  {
    id: 'notion-template',
    name: 'Notion Template',
    icon: '📝',
    description: 'Productivity templates, dashboards, and systems for Notion',
    difficulty: 'beginner',
    estimatedTime: '3-7 days',
    requiredSkills: ['design', 'teaching'],
    deliverables: ['Notion template', 'Setup guide', 'Video walkthrough'],
    monetization: ['One-time purchase', 'Template bundles', 'Premium support'],
    aiTools: ['claude', 'chatgpt', 'canva'],
    steps: [
      {
        id: 'concept',
        name: 'Template Concept',
        description: 'Define what your template will help users achieve',
        aiAssisted: true,
        estimatedMinutes: 20,
        tasks: [
          { id: 'name', title: 'Template Name', description: 'A clear, benefit-focused name', type: 'input', required: true, placeholder: 'e.g., "Ultimate Content Calendar System"' },
          { id: 'category', title: 'Category', description: 'What type of template?', type: 'select', required: true, options: ['Productivity', 'Project Management', 'Personal Finance', 'Content Creation', 'Business Operations', 'Life OS', 'Student', 'Health & Fitness', 'Other'] },
          { id: 'problem', title: 'Problem Solved', description: 'What pain point does this solve?', type: 'textarea', required: true, placeholder: 'The specific problem users face without this template...' },
          { id: 'features', title: 'Key Features', description: 'Main features and pages', type: 'ai-generate', required: true, aiPrompt: 'Generate key features for this Notion template' },
        ],
      },
      {
        id: 'structure',
        name: 'Template Structure',
        description: 'Plan the pages, databases, and relationships',
        aiAssisted: true,
        estimatedMinutes: 45,
        tasks: [
          { id: 'pages', title: 'Page Structure', description: 'Define main pages and hierarchy', type: 'ai-generate', required: true, aiPrompt: 'Create a detailed page structure for this Notion template' },
          { id: 'databases', title: 'Database Schema', description: 'Define databases and properties', type: 'ai-generate', required: true, aiPrompt: 'Design database schemas with relationships' },
          { id: 'views', title: 'Views & Layouts', description: 'Different views for each database', type: 'ai-generate', required: true, aiPrompt: 'Suggest useful views and layouts' },
          { id: 'automations', title: 'Automations', description: 'Formulas and automations to include', type: 'ai-generate', required: false, aiPrompt: 'Suggest Notion formulas and automations' },
        ],
      },
      {
        id: 'build',
        name: 'Build Template',
        description: 'Create the actual template in Notion',
        aiAssisted: false,
        estimatedMinutes: 180,
        tasks: [
          { id: 'create-pages', title: 'Create Pages', description: 'Build out the page structure', type: 'checklist', required: true },
          { id: 'setup-databases', title: 'Setup Databases', description: 'Create and configure databases', type: 'checklist', required: true },
          { id: 'add-content', title: 'Add Sample Content', description: 'Pre-fill with useful examples', type: 'checklist', required: true },
          { id: 'style', title: 'Style & Polish', description: 'Add icons, covers, and styling', type: 'checklist', required: true },
        ],
      },
      {
        id: 'package',
        name: 'Package & Launch',
        description: 'Prepare documentation and launch',
        aiAssisted: true,
        estimatedMinutes: 60,
        tasks: [
          { id: 'guide', title: 'Setup Guide', description: 'Step-by-step instructions', type: 'ai-generate', required: true, aiPrompt: 'Write a comprehensive setup guide' },
          { id: 'video', title: 'Video Walkthrough', description: 'Record a template tour', type: 'checklist', required: false },
          { id: 'description', title: 'Sales Description', description: 'Compelling product copy', type: 'ai-generate', required: true, aiPrompt: 'Write product description for Gumroad/Notion marketplace' },
        ],
      },
    ],
    promptTemplate: `Design a comprehensive Notion template: {{name}}

## TEMPLATE PURPOSE
Category: {{category}}
Problem Solved: {{problem}}

## REQUIRED COMPONENTS
1. Dashboard/Home Page
2. Core Databases
3. Connected Views
4. Quick Action Buttons
5. Documentation Section

## DATABASE REQUIREMENTS
- Clear property names
- Linked relations between databases
- Useful formulas for automation
- Multiple view types (Table, Board, Calendar, Gallery)

## USER EXPERIENCE
- Clean, intuitive navigation
- Mobile-friendly design
- Pre-filled example content
- Clear instructions

Generate the complete template structure and setup instructions.`,
  },
  {
    id: 'ai-prompts',
    name: 'AI Prompts Pack',
    icon: '🤖',
    description: 'Curated AI prompts for specific use cases',
    difficulty: 'beginner',
    estimatedTime: '1-3 days',
    requiredSkills: ['writing', 'research'],
    deliverables: ['Prompt library', 'Usage guide', 'Example outputs'],
    monetization: ['One-time purchase', 'Subscription', 'Bundles'],
    aiTools: ['claude', 'chatgpt', 'gemini'],
    steps: [
      {
        id: 'niche',
        name: 'Define Niche',
        description: 'Choose your prompt pack focus area',
        aiAssisted: true,
        estimatedMinutes: 15,
        tasks: [
          { id: 'name', title: 'Pack Name', description: 'Catchy, descriptive name', type: 'input', required: true, placeholder: 'e.g., "100 ChatGPT Prompts for Marketers"' },
          { id: 'category', title: 'Category', description: 'Main use case', type: 'select', required: true, options: ['Marketing', 'Writing', 'Coding', 'Business', 'Education', 'Creative', 'Personal', 'Research', 'Other'] },
          { id: 'audience', title: 'Target User', description: 'Who will use these prompts?', type: 'textarea', required: true, placeholder: 'Describe your ideal customer...' },
          { id: 'count', title: 'Number of Prompts', description: 'How many prompts to include', type: 'select', required: true, options: ['25', '50', '100', '200+'] },
        ],
      },
      {
        id: 'create',
        name: 'Create Prompts',
        description: 'Generate and refine your prompts',
        aiAssisted: true,
        estimatedMinutes: 120,
        tasks: [
          { id: 'categories', title: 'Prompt Categories', description: 'Organize prompts by use case', type: 'ai-generate', required: true, aiPrompt: 'Create categories for organizing these prompts' },
          { id: 'prompts', title: 'Generate Prompts', description: 'Create prompts for each category', type: 'ai-generate', required: true, aiPrompt: 'Generate detailed prompts for each category' },
          { id: 'variables', title: 'Add Variables', description: 'Make prompts customizable', type: 'ai-generate', required: true, aiPrompt: 'Add customizable variables to prompts' },
          { id: 'examples', title: 'Example Outputs', description: 'Show what each prompt produces', type: 'ai-generate', required: false, aiPrompt: 'Generate example outputs for key prompts' },
        ],
      },
      {
        id: 'package',
        name: 'Package',
        description: 'Format and prepare for sale',
        aiAssisted: true,
        estimatedMinutes: 45,
        tasks: [
          { id: 'format', title: 'Format Library', description: 'Create searchable format', type: 'checklist', required: true },
          { id: 'guide', title: 'Usage Guide', description: 'How to use prompts effectively', type: 'ai-generate', required: true, aiPrompt: 'Write a guide on using these prompts effectively' },
          { id: 'tips', title: 'Pro Tips', description: 'Advanced usage tips', type: 'ai-generate', required: false, aiPrompt: 'Create pro tips for prompt engineering' },
        ],
      },
    ],
    promptTemplate: `Create a comprehensive AI prompt pack: {{name}}

## TARGET USERS
{{audience}}

## PROMPT REQUIREMENTS
- Total Prompts: {{count}}
- Category: {{category}}
- Include variables for customization [TOPIC], [STYLE], etc.
- Provide example outputs
- Optimize for ChatGPT/Claude/Gemini

## PROMPT STRUCTURE
Each prompt should include:
1. Clear objective
2. Context/role setting
3. Specific instructions
4. Output format
5. Quality requirements

Generate the complete prompt library with examples.`,
  },
  {
    id: 'digital-course',
    name: 'Digital Course',
    icon: '🎓',
    description: 'Online courses, workshops, and educational content',
    difficulty: 'intermediate',
    estimatedTime: '4-12 weeks',
    requiredSkills: ['teaching', 'video', 'writing'],
    deliverables: ['Video lessons', 'Workbooks', 'Resources', 'Community access'],
    monetization: ['One-time', 'Subscription', 'Cohort-based', 'Membership'],
    aiTools: ['claude', 'chatgpt', 'canva', 'figma'],
    steps: [
      {
        id: 'concept',
        name: 'Course Concept',
        description: 'Define your course topic and transformation',
        aiAssisted: true,
        estimatedMinutes: 45,
        tasks: [
          { id: 'title', title: 'Course Title', description: 'Compelling, outcome-focused title', type: 'input', required: true, placeholder: 'e.g., "Master Instagram Reels in 30 Days"' },
          { id: 'transformation', title: 'Student Transformation', description: 'What will students achieve?', type: 'textarea', required: true, placeholder: 'Before: ... → After: ...' },
          { id: 'audience', title: 'Target Student', description: 'Who is this course for?', type: 'textarea', required: true, placeholder: 'Describe your ideal student...' },
          { id: 'format', title: 'Course Format', description: 'How will you deliver content?', type: 'select', required: true, options: ['Self-paced video', 'Live cohort', 'Hybrid', 'Text-based', 'Audio course'] },
        ],
      },
      {
        id: 'curriculum',
        name: 'Curriculum Design',
        description: 'Plan your modules and lessons',
        aiAssisted: true,
        estimatedMinutes: 90,
        tasks: [
          { id: 'modules', title: 'Module Structure', description: 'Break down into modules', type: 'ai-generate', required: true, aiPrompt: 'Create a detailed course curriculum with modules' },
          { id: 'lessons', title: 'Lesson Plans', description: 'Content for each lesson', type: 'ai-generate', required: true, aiPrompt: 'Create lesson plans for each module' },
          { id: 'activities', title: 'Activities & Exercises', description: 'Hands-on learning activities', type: 'ai-generate', required: true, aiPrompt: 'Design activities and exercises' },
          { id: 'assessments', title: 'Assessments', description: 'Quizzes and assignments', type: 'ai-generate', required: false, aiPrompt: 'Create quizzes and assessments' },
        ],
      },
      {
        id: 'content',
        name: 'Content Creation',
        description: 'Create the course materials',
        aiAssisted: true,
        estimatedMinutes: 480,
        tasks: [
          { id: 'scripts', title: 'Video Scripts', description: 'Scripts for each lesson', type: 'ai-generate', required: true, aiPrompt: 'Write video scripts for each lesson' },
          { id: 'slides', title: 'Slide Decks', description: 'Presentation slides', type: 'ai-generate', required: false, aiPrompt: 'Create slide deck outlines' },
          { id: 'workbooks', title: 'Workbooks', description: 'Student workbooks and PDFs', type: 'ai-generate', required: true, aiPrompt: 'Create workbook content and exercises' },
          { id: 'resources', title: 'Bonus Resources', description: 'Templates, checklists, etc.', type: 'ai-generate', required: false, aiPrompt: 'Create bonus resources and templates' },
        ],
      },
      {
        id: 'launch',
        name: 'Launch Prep',
        description: 'Prepare for your course launch',
        aiAssisted: true,
        estimatedMinutes: 120,
        tasks: [
          { id: 'landing', title: 'Landing Page Copy', description: 'Sales page content', type: 'ai-generate', required: true, aiPrompt: 'Write compelling course landing page copy' },
          { id: 'pricing', title: 'Pricing Strategy', description: 'Set your pricing tiers', type: 'ai-generate', required: true, aiPrompt: 'Suggest pricing tiers and packages' },
          { id: 'emails', title: 'Email Sequences', description: 'Launch email series', type: 'ai-generate', required: false, aiPrompt: 'Create launch email sequence' },
          { id: 'platform', title: 'Platform Setup', description: 'Choose and setup platform', type: 'select', required: true, options: ['Teachable', 'Thinkific', 'Kajabi', 'Podia', 'Gumroad', 'Self-hosted'] },
        ],
      },
    ],
    promptTemplate: `Design a comprehensive online course: {{title}}

## STUDENT TRANSFORMATION
{{transformation}}

## TARGET STUDENT
{{audience}}

## COURSE FORMAT
{{format}}

## CURRICULUM REQUIREMENTS
- 4-8 main modules
- 3-6 lessons per module
- Each lesson: 10-20 minutes
- Include exercises and activities
- Progressive skill building

## DELIVERABLES
1. Video scripts for all lessons
2. Slide deck outlines
3. Student workbook content
4. Quizzes and assessments
5. Bonus resources

Generate the complete course curriculum and content outline.`,
  },
  {
    id: 'saas',
    name: 'SaaS / Web App',
    icon: '💻',
    description: 'Software as a Service products and web applications',
    difficulty: 'advanced',
    estimatedTime: '1-4 weeks',
    requiredSkills: ['coding'],
    deliverables: ['Working MVP', 'PRD Document', 'AI Build Prompts', 'Documentation'],
    monetization: ['Monthly subscription', 'Freemium', 'Usage-based', 'One-time license'],
    aiTools: ['cursor', 'claude', 'lovable', 'bolt', 'v0', 'replit'],
    steps: [
      {
        id: 'research-context',
        name: 'Research Context',
        description: 'Import your UVZ research to inform the product',
        aiAssisted: true,
        estimatedMinutes: 15,
        tasks: [
          { id: 'uvz-summary', title: 'Your UVZ', description: 'What makes your idea unique?', type: 'textarea', required: false, placeholder: 'Paste your UVZ research summary here (optional but recommended)...' },
          { id: 'target-audience', title: 'Target Audience', description: 'Who will use this SaaS?', type: 'textarea', required: true, placeholder: 'Be specific: "Small marketing agencies (5-20 employees) who struggle with client reporting and need automated dashboard generation"' },
          { id: 'competitor-gaps', title: 'Competitor Weaknesses', description: 'What are competitors missing?', type: 'textarea', required: false, placeholder: 'Existing solutions are too expensive, complex, or missing key integrations...' },
        ],
      },
      {
        id: 'concept',
        name: 'Product Definition',
        description: 'Define your SaaS product clearly',
        aiAssisted: true,
        estimatedMinutes: 30,
        tasks: [
          { id: 'name', title: 'Product Name', description: 'Clear, memorable name', type: 'input', required: true, placeholder: 'e.g., "ReportFlow", "ClientPulse", "MetricsDash"' },
          { id: 'tagline', title: 'One-Line Pitch', description: 'Explain it in one sentence', type: 'input', required: true, placeholder: 'e.g., "Automated client reporting for marketing agencies"' },
          { id: 'type', title: 'SaaS Type', description: 'What kind of SaaS?', type: 'select', required: true, options: ['B2B SaaS', 'B2C SaaS', 'Internal Tool', 'Marketplace/Platform', 'API Service', 'Developer Tool', 'Analytics Dashboard', 'Automation Tool', 'Communication Tool', 'Project Management', 'CRM/Sales Tool', 'Content Platform'] },
          { id: 'problem', title: 'Core Problem', description: 'The specific problem you solve', type: 'textarea', required: true, placeholder: 'Describe the exact pain point. Be specific about who has it, when it occurs, and why current solutions fail.' },
        ],
      },
      {
        id: 'features',
        name: 'Feature Planning',
        description: 'Define MVP features (keep it focused!)',
        aiAssisted: true,
        estimatedMinutes: 45,
        tasks: [
          { id: 'core-features', title: 'MVP Features (Max 5)', description: 'What\'s essential for v1?', type: 'ai-generate', required: true, aiPrompt: 'Generate 3-5 focused MVP features based on the problem and target audience. Keep it minimal - only what\'s needed to deliver core value.' },
          { id: 'differentiators', title: 'Key Differentiators', description: 'What makes you different?', type: 'ai-generate', required: true, aiPrompt: 'Based on competitor gaps and UVZ, list 2-3 specific ways this SaaS will be different/better than alternatives.' },
          { id: 'out-of-scope', title: 'NOT in MVP', description: 'What are you NOT building initially?', type: 'ai-generate', required: false, aiPrompt: 'List features that should be explicitly excluded from MVP to maintain focus. These are "Phase 2" features.' },
        ],
      },
      {
        id: 'prd',
        name: 'PRD Generation',
        description: 'Generate your Product Requirements Document',
        aiAssisted: true,
        estimatedMinutes: 30,
        tasks: [
          { id: 'prd-full', title: 'Full PRD', description: 'Complete product requirements document', type: 'ai-generate', required: true, aiPrompt: 'Generate a comprehensive PRD including: executive summary, problem statement, solution overview, user personas, functional requirements, non-functional requirements, technical architecture, security requirements, UI/UX requirements, MVP scope, success metrics, and risks.' },
          { id: 'user-stories', title: 'User Stories', description: 'Key user stories for development', type: 'ai-generate', required: true, aiPrompt: 'Generate 5-8 user stories in the format: "As a [user type], I want to [action] so that [benefit]". Include acceptance criteria for each.' },
        ],
      },
      {
        id: 'technical',
        name: 'Technical Specification',
        description: 'Architecture, tech stack, and security',
        aiAssisted: true,
        estimatedMinutes: 45,
        tasks: [
          { id: 'tech-stack', title: 'Tech Stack Recommendation', description: 'Best technologies for this project', type: 'ai-generate', required: true, aiPrompt: 'Recommend a modern, production-ready tech stack for this SaaS. Include: frontend framework, backend/API, database, auth solution, hosting recommendation. Prioritize developer experience and scalability.' },
          { id: 'architecture', title: 'System Architecture', description: 'High-level system design', type: 'ai-generate', required: true, aiPrompt: 'Design the system architecture with: component diagram (text-based), data flow, API structure, and database schema outline. Keep it practical and MVP-focused.' },
          { id: 'security', title: 'Security Checklist', description: 'Security requirements', type: 'ai-generate', required: true, aiPrompt: 'Generate a security checklist including: authentication method, data encryption, input validation, API security, and common vulnerability prevention (XSS, CSRF, SQL injection).' },
        ],
      },
      {
        id: 'design',
        name: 'UI/UX Specification',
        description: 'Professional, non-gimmicky design guidelines',
        aiAssisted: true,
        estimatedMinutes: 30,
        tasks: [
          { id: 'design-system', title: 'Design System', description: 'Colors, typography, components', type: 'ai-generate', required: true, aiPrompt: 'Create a professional design system specification including: color palette (professional, not flashy), typography scale, spacing system, and key component patterns. Focus on clean, trustworthy SaaS design - NOT gimmicky or trendy.' },
          { id: 'key-screens', title: 'Key Screens', description: 'Main screens to build', type: 'ai-generate', required: true, aiPrompt: 'List and describe the key screens/views needed for the SaaS MVP. Include: dashboard, settings, main feature screens. For each: purpose, main elements, user actions, and states (loading, empty, error).' },
          { id: 'ux-patterns', title: 'UX Patterns', description: 'Interaction patterns', type: 'ai-generate', required: true, aiPrompt: 'Define UX patterns for: onboarding flow, error handling, loading states, empty states, and success confirmations. Focus on clarity and professionalism.' },
        ],
      },
      {
        id: 'build-prompts',
        name: 'AI Build Prompts',
        description: 'Generate prompts for AI coding tools',
        aiAssisted: true,
        estimatedMinutes: 30,
        tasks: [
          { id: 'master-prompt', title: 'Master Build Prompt', description: 'Complete prompt for AI tools', type: 'ai-generate', required: true, aiPrompt: 'Generate a comprehensive, copy-paste-ready prompt for AI coding tools (Cursor, Lovable, Bolt, etc.) that includes all product specs, features, technical requirements, and design guidelines. This should be a complete prompt that builds a working SaaS MVP.' },
          { id: 'cursor-prompt', title: 'Cursor/Claude Prompt', description: 'Optimized for Cursor AI', type: 'ai-generate', required: true, aiPrompt: 'Adapt the master prompt specifically for Cursor AI, including file structure, step-by-step implementation order, and Cursor-specific instructions (@codebase, @docs, etc.).' },
          { id: 'lovable-prompt', title: 'Lovable/Bolt Prompt', description: 'Optimized for visual builders', type: 'ai-generate', required: true, aiPrompt: 'Adapt the master prompt for Lovable or Bolt.new, focusing on clear descriptions and iterative building approach. Include what to build first and how to iterate.' },
        ],
      },
      {
        id: 'launch-prep',
        name: 'Launch Preparation',
        description: 'Documentation and go-to-market',
        aiAssisted: true,
        estimatedMinutes: 45,
        tasks: [
          { id: 'readme', title: 'README / Landing Copy', description: 'Project documentation', type: 'ai-generate', required: true, aiPrompt: 'Write a professional README.md that includes: product description, features, getting started guide, and tech stack. Also include landing page copy with headline, subheadline, feature descriptions, and CTA.' },
          { id: 'docs', title: 'User Documentation', description: 'How to use the tool', type: 'ai-generate', required: true, aiPrompt: 'Create user documentation covering: quick start guide, feature explanations, FAQ, and troubleshooting tips. Keep it concise and scannable.' },
          { id: 'pricing', title: 'Pricing Strategy', description: 'How to monetize', type: 'ai-generate', required: true, aiPrompt: 'Design a SaaS pricing strategy with: pricing model recommendation (freemium, tiered subscription), specific price points, feature comparison between tiers, and justification for the pricing.' },
        ],
      },
    ],
    promptTemplate: `# {{name}} - Complete SaaS MVP Build Specification

## PRODUCT OVERVIEW
**Name:** {{name}}
**Tagline:** {{tagline}}
**Type:** {{type}}
**Problem:** {{problem}}

## RESEARCH CONTEXT
**Target Audience:** {{target-audience}}
**UVZ (Unique Value Zone):** {{uvz-summary}}
**Competitor Weaknesses:** {{competitor-gaps}}

## MVP FEATURES
{{core-features}}

## DIFFERENTIATORS
{{differentiators}}

## TECHNICAL SPECIFICATION
### Tech Stack
{{tech-stack}}

### Architecture
{{architecture}}

### Security Requirements
{{security}}

## DESIGN SPECIFICATION
### Design System
{{design-system}}

### Key Screens
{{key-screens}}

### UX Patterns
{{ux-patterns}}

## BUILD INSTRUCTIONS
Build this complete SaaS MVP with all features working. Follow the technical and design specifications exactly.

## TECH STACK
- Frontend: Next.js 14+ with App Router
- Styling: Tailwind CSS
- Database: Supabase (PostgreSQL)
- Auth: Supabase Auth
- Payments: Paddle
- Hosting: Vercel

## UI/UX REQUIREMENTS
- Clean, modern design
- Mobile-responsive
- Dark mode support
- Accessible (WCAG 2.1)
- Fast performance

## DATABASE SCHEMA
{{data-model}}

## USER FLOWS
{{user-flows}}

## PAGES TO BUILD
1. Landing page with pricing
2. Auth pages (login, signup, reset password)
3. Dashboard
4. Core feature pages
5. Settings/Account
6. Admin panel

Please build this complete application with all features working end-to-end.`,
  },
  {
    id: 'design-assets',
    name: 'Design Assets',
    icon: '🎨',
    description: 'Icons, templates, UI kits, and design resources',
    difficulty: 'intermediate',
    estimatedTime: '1-3 weeks',
    requiredSkills: ['design'],
    deliverables: ['Design files', 'Multiple formats', 'Usage license'],
    monetization: ['One-time', 'Bundles', 'Subscription library'],
    aiTools: ['midjourney', 'figma', 'canva', 'claude'],
    steps: [
      {
        id: 'concept',
        name: 'Asset Concept',
        description: 'Define your design asset pack',
        aiAssisted: true,
        estimatedMinutes: 30,
        tasks: [
          { id: 'name', title: 'Pack Name', description: 'Descriptive, searchable name', type: 'input', required: true, placeholder: 'e.g., "Minimal Line Icon Set - 500 Icons"' },
          { id: 'type', title: 'Asset Type', description: 'What kind of assets?', type: 'select', required: true, options: ['Icon Set', 'UI Kit', 'Illustration Pack', 'Social Media Templates', 'Presentation Templates', 'Mockups', 'Fonts', 'Textures/Patterns', 'Other'] },
          { id: 'style', title: 'Visual Style', description: 'Describe the aesthetic', type: 'textarea', required: true, placeholder: 'Minimal, bold, retro, hand-drawn, etc.' },
          { id: 'count', title: 'Number of Assets', description: 'How many items to include', type: 'input', required: true, placeholder: 'e.g., 100, 500, 1000' },
        ],
      },
      {
        id: 'plan',
        name: 'Asset Planning',
        description: 'Plan your asset collection',
        aiAssisted: true,
        estimatedMinutes: 45,
        tasks: [
          { id: 'categories', title: 'Categories', description: 'Organize assets by type', type: 'ai-generate', required: true, aiPrompt: 'Create categories for organizing these design assets' },
          { id: 'list', title: 'Asset List', description: 'List all items to create', type: 'ai-generate', required: true, aiPrompt: 'Generate complete list of assets to create' },
          { id: 'specs', title: 'Technical Specs', description: 'Sizes, formats, variations', type: 'ai-generate', required: true, aiPrompt: 'Define technical specifications' },
        ],
      },
      {
        id: 'create',
        name: 'Create Assets',
        description: 'Design your assets',
        aiAssisted: true,
        estimatedMinutes: 360,
        tasks: [
          { id: 'prompts', title: 'AI Generation Prompts', description: 'Prompts for AI tools', type: 'ai-generate', required: true, aiPrompt: 'Create Midjourney/DALL-E prompts for these assets' },
          { id: 'create', title: 'Create in Design Tool', description: 'Build in Figma/Illustrator', type: 'checklist', required: true },
          { id: 'variations', title: 'Create Variations', description: 'Colors, sizes, formats', type: 'checklist', required: true },
        ],
      },
      {
        id: 'package',
        name: 'Package & Launch',
        description: 'Prepare files for sale',
        aiAssisted: true,
        estimatedMinutes: 60,
        tasks: [
          { id: 'export', title: 'Export Formats', description: 'Export all required formats', type: 'checklist', required: true },
          { id: 'preview', title: 'Preview Images', description: 'Create showcase graphics', type: 'checklist', required: true },
          { id: 'description', title: 'Product Description', description: 'Sales copy and details', type: 'ai-generate', required: true, aiPrompt: 'Write compelling product description' },
          { id: 'license', title: 'License Terms', description: 'Usage rights and terms', type: 'ai-generate', required: true, aiPrompt: 'Create license terms' },
        ],
      },
    ],
    promptTemplate: `Create a design asset pack: {{name}}

## ASSET SPECIFICATIONS
Type: {{type}}
Style: {{style}}
Quantity: {{count}} assets

## VISUAL REQUIREMENTS
- Consistent style throughout
- Multiple size variations
- Editable source files
- High resolution exports

## FILE FORMATS
- SVG (vector)
- PNG (transparent background)
- Source files (Figma/AI/PSD)

## CATEGORIES
{{categories}}

## ASSET LIST
{{list}}

Generate prompts for AI image generation and design specifications.`,
  },
  {
    id: 'printables',
    name: 'Printables',
    icon: '🖨️',
    description: 'Planners, worksheets, wall art, and printable products',
    difficulty: 'beginner',
    estimatedTime: '3-7 days',
    requiredSkills: ['design'],
    deliverables: ['Print-ready PDFs', 'Multiple sizes', 'Instructions'],
    monetization: ['One-time', 'Bundle packs', 'Seasonal collections'],
    aiTools: ['canva', 'midjourney', 'claude'],
    steps: [
      {
        id: 'concept',
        name: 'Printable Concept',
        description: 'Define your printable product',
        aiAssisted: true,
        estimatedMinutes: 20,
        tasks: [
          { id: 'name', title: 'Product Name', description: 'Clear, descriptive name', type: 'input', required: true, placeholder: 'e.g., "2024 Minimal Daily Planner Bundle"' },
          { id: 'type', title: 'Printable Type', description: 'What kind of printable?', type: 'select', required: true, options: ['Planner Pages', 'Wall Art', 'Worksheets', 'Checklists', 'Calendars', 'Stickers', 'Invitations', 'Educational', 'Other'] },
          { id: 'style', title: 'Visual Style', description: 'Design aesthetic', type: 'textarea', required: true, placeholder: 'Minimalist, boho, vintage, colorful, etc.' },
          { id: 'audience', title: 'Target Customer', description: 'Who will buy this?', type: 'textarea', required: true, placeholder: 'Describe your ideal customer...' },
        ],
      },
      {
        id: 'design',
        name: 'Design Planning',
        description: 'Plan your printable designs',
        aiAssisted: true,
        estimatedMinutes: 30,
        tasks: [
          { id: 'pages', title: 'Page List', description: 'List all pages to create', type: 'ai-generate', required: true, aiPrompt: 'Create a list of pages for this printable product' },
          { id: 'sizes', title: 'Size Variations', description: 'Paper sizes to offer', type: 'select', required: true, options: ['US Letter only', 'A4 only', 'Letter + A4', 'Multiple sizes'] },
          { id: 'colors', title: 'Color Schemes', description: 'Color variations to offer', type: 'ai-generate', required: false, aiPrompt: 'Suggest color scheme variations' },
        ],
      },
      {
        id: 'create',
        name: 'Create Designs',
        description: 'Design your printables',
        aiAssisted: true,
        estimatedMinutes: 180,
        tasks: [
          { id: 'templates', title: 'Create in Canva/Figma', description: 'Design all pages', type: 'checklist', required: true },
          { id: 'variations', title: 'Create Size Variations', description: 'Adjust for different paper sizes', type: 'checklist', required: true },
          { id: 'test', title: 'Test Print', description: 'Print and verify quality', type: 'checklist', required: true },
        ],
      },
      {
        id: 'launch',
        name: 'Package & Launch',
        description: 'Prepare for sale',
        aiAssisted: true,
        estimatedMinutes: 45,
        tasks: [
          { id: 'export', title: 'Export PDFs', description: 'Export print-ready files', type: 'checklist', required: true },
          { id: 'mockups', title: 'Create Mockups', description: 'Product preview images', type: 'checklist', required: true },
          { id: 'description', title: 'Product Description', description: 'Sales copy for listing', type: 'ai-generate', required: true, aiPrompt: 'Write Etsy/Gumroad product description' },
          { id: 'instructions', title: 'Printing Instructions', description: 'Guide for customers', type: 'ai-generate', required: true, aiPrompt: 'Write printing instructions for customers' },
        ],
      },
    ],
    promptTemplate: `Create a printable product: {{name}}

## PRODUCT DETAILS
Type: {{type}}
Style: {{style}}
Target Customer: {{audience}}

## PAGE LIST
{{pages}}

## DESIGN REQUIREMENTS
- Print-ready (300 DPI)
- Bleed margins where needed
- Clear, readable fonts
- Consistent styling

## FILE FORMATS
- High-quality PDF
- Size variations: {{sizes}}

Generate design specifications and content for each page.`,
  },
  {
    id: 'software-tool',
    name: 'Software Tool / Extension',
    icon: '🔧',
    description: 'Browser extensions, desktop apps, APIs, or specialized developer tools',
    difficulty: 'advanced',
    estimatedTime: '1-4 weeks',
    requiredSkills: ['coding'],
    deliverables: ['Working MVP', 'PRD Document', 'AI Build Prompts', 'Documentation'],
    monetization: ['One-time license', 'Subscription', 'Freemium', 'Open source + paid features'],
    aiTools: ['cursor', 'claude', 'lovable', 'bolt', 'v0', 'replit'],
    steps: [
      {
        id: 'research-context',
        name: 'Research Context',
        description: 'Import your UVZ research to inform the product',
        aiAssisted: true,
        estimatedMinutes: 15,
        tasks: [
          { id: 'uvz-summary', title: 'Your UVZ', description: 'What makes your idea unique?', type: 'textarea', required: false, placeholder: 'Paste your UVZ research summary here (optional but recommended)...' },
          { id: 'target-audience', title: 'Target Audience', description: 'Who will use this tool?', type: 'textarea', required: true, placeholder: 'Be specific: "Freelance developers who struggle with client communication and need a simple way to share project updates"' },
          { id: 'competitor-gaps', title: 'Competitor Weaknesses', description: 'What are competitors missing?', type: 'textarea', required: false, placeholder: 'Current solutions are too complex, expensive, or missing key features...' },
        ],
      },
      {
        id: 'concept',
        name: 'Product Definition',
        description: 'Define your software tool clearly',
        aiAssisted: true,
        estimatedMinutes: 30,
        tasks: [
          { id: 'name', title: 'Product Name', description: 'Clear, memorable name', type: 'input', required: true, placeholder: 'e.g., "DevUpdate", "QuickAPI", "FormFlow"' },
          { id: 'tagline', title: 'One-Line Pitch', description: 'Explain it in one sentence', type: 'input', required: true, placeholder: 'e.g., "The fastest way to share project updates with clients"' },
          { id: 'type', title: 'Tool Type', description: 'What kind of software?', type: 'select', required: true, options: ['Web App (SaaS)', 'Chrome Extension', 'VS Code Extension', 'Desktop App (Electron)', 'CLI Tool', 'API/Backend Service', 'Mobile App (React Native)', 'Figma Plugin', 'Slack/Discord App', 'Browser Extension (Firefox)', 'Notion Integration', 'Zapier Integration'] },
          { id: 'problem', title: 'Core Problem', description: 'The specific problem you solve', type: 'textarea', required: true, placeholder: 'Describe the exact pain point. Be specific about who has it, when it occurs, and why current solutions fail.' },
        ],
      },
      {
        id: 'features',
        name: 'Feature Planning',
        description: 'Define MVP features (keep it focused!)',
        aiAssisted: true,
        estimatedMinutes: 45,
        tasks: [
          { id: 'core-features', title: 'MVP Features (Max 5)', description: 'What\'s essential for v1?', type: 'ai-generate', required: true, aiPrompt: 'Generate 3-5 focused MVP features based on the problem and target audience. Keep it minimal - only what\'s needed to deliver core value.' },
          { id: 'differentiators', title: 'Key Differentiators', description: 'What makes you different?', type: 'ai-generate', required: true, aiPrompt: 'Based on competitor gaps and UVZ, list 2-3 specific ways this tool will be different/better than alternatives.' },
          { id: 'out-of-scope', title: 'NOT in MVP', description: 'What are you NOT building initially?', type: 'ai-generate', required: false, aiPrompt: 'List features that should be explicitly excluded from MVP to maintain focus. These are "Phase 2" features.' },
        ],
      },
      {
        id: 'prd',
        name: 'PRD Generation',
        description: 'Generate your Product Requirements Document',
        aiAssisted: true,
        estimatedMinutes: 30,
        tasks: [
          { id: 'prd-full', title: 'Full PRD', description: 'Complete product requirements document', type: 'ai-generate', required: true, aiPrompt: 'Generate a comprehensive PRD including: executive summary, problem statement, solution overview, user personas, functional requirements, non-functional requirements, technical architecture, security requirements, UI/UX requirements, MVP scope, success metrics, and risks.' },
          { id: 'user-stories', title: 'User Stories', description: 'Key user stories for development', type: 'ai-generate', required: true, aiPrompt: 'Generate 5-8 user stories in the format: "As a [user type], I want to [action] so that [benefit]". Include acceptance criteria for each.' },
        ],
      },
      {
        id: 'technical',
        name: 'Technical Specification',
        description: 'Architecture, tech stack, and security',
        aiAssisted: true,
        estimatedMinutes: 45,
        tasks: [
          { id: 'tech-stack', title: 'Tech Stack Recommendation', description: 'Best technologies for this project', type: 'ai-generate', required: true, aiPrompt: 'Recommend a modern, production-ready tech stack based on the tool type. Include: frontend framework, backend/API, database, auth solution, hosting recommendation. Prioritize developer experience and scalability.' },
          { id: 'architecture', title: 'System Architecture', description: 'High-level system design', type: 'ai-generate', required: true, aiPrompt: 'Design the system architecture with: component diagram (text-based), data flow, API structure, and database schema outline. Keep it practical and MVP-focused.' },
          { id: 'security', title: 'Security Checklist', description: 'Security requirements', type: 'ai-generate', required: true, aiPrompt: 'Generate a security checklist including: authentication method, data encryption, input validation, API security, and common vulnerability prevention (XSS, CSRF, SQL injection).' },
        ],
      },
      {
        id: 'design',
        name: 'UI/UX Specification',
        description: 'Professional, non-gimmicky design guidelines',
        aiAssisted: true,
        estimatedMinutes: 30,
        tasks: [
          { id: 'design-system', title: 'Design System', description: 'Colors, typography, components', type: 'ai-generate', required: true, aiPrompt: 'Create a professional design system specification including: color palette (professional, not flashy), typography scale, spacing system, and key component patterns. Focus on clean, trustworthy design - NOT gimmicky or trendy.' },
          { id: 'key-screens', title: 'Key Screens', description: 'Main screens to build', type: 'ai-generate', required: true, aiPrompt: 'List and describe the key screens/views needed for the MVP. Include: purpose, main elements, user actions, and states (loading, empty, error). Keep it minimal.' },
          { id: 'ux-patterns', title: 'UX Patterns', description: 'Interaction patterns', type: 'ai-generate', required: true, aiPrompt: 'Define UX patterns for: onboarding flow, error handling, loading states, empty states, and success confirmations. Focus on clarity and professionalism.' },
        ],
      },
      {
        id: 'build-prompts',
        name: 'AI Build Prompts',
        description: 'Generate prompts for AI coding tools',
        aiAssisted: true,
        estimatedMinutes: 30,
        tasks: [
          { id: 'master-prompt', title: 'Master Build Prompt', description: 'Complete prompt for AI tools', type: 'ai-generate', required: true, aiPrompt: 'Generate a comprehensive, copy-paste-ready prompt for AI coding tools (Cursor, Lovable, Bolt, etc.) that includes all product specs, features, technical requirements, and design guidelines. This should be a complete prompt that builds a working MVP.' },
          { id: 'cursor-prompt', title: 'Cursor/Claude Prompt', description: 'Optimized for Cursor AI', type: 'ai-generate', required: true, aiPrompt: 'Adapt the master prompt specifically for Cursor AI, including file structure, step-by-step implementation order, and Cursor-specific instructions (@codebase, @docs, etc.).' },
          { id: 'lovable-prompt', title: 'Lovable/Bolt Prompt', description: 'Optimized for visual builders', type: 'ai-generate', required: true, aiPrompt: 'Adapt the master prompt for Lovable or Bolt.new, focusing on clear descriptions and iterative building approach. Include what to build first and how to iterate.' },
        ],
      },
      {
        id: 'launch-prep',
        name: 'Launch Preparation',
        description: 'Documentation and go-to-market',
        aiAssisted: true,
        estimatedMinutes: 45,
        tasks: [
          { id: 'readme', title: 'README / Landing Copy', description: 'Project documentation', type: 'ai-generate', required: true, aiPrompt: 'Write a professional README.md that includes: product description, features, getting started guide, and tech stack. Also include landing page copy with headline, subheadline, feature descriptions, and CTA.' },
          { id: 'docs', title: 'User Documentation', description: 'How to use the tool', type: 'ai-generate', required: true, aiPrompt: 'Create user documentation covering: quick start guide, feature explanations, FAQ, and troubleshooting tips. Keep it concise and scannable.' },
          { id: 'pricing', title: 'Pricing Strategy', description: 'How to monetize', type: 'ai-generate', required: true, aiPrompt: 'Design a pricing strategy with: pricing model recommendation (freemium, subscription, one-time), specific price points, feature comparison between tiers, and justification for the pricing.' },
        ],
      },
    ],
    promptTemplate: `# {{name}} - Complete MVP Build Specification

## PRODUCT OVERVIEW
**Name:** {{name}}
**Tagline:** {{tagline}}
**Type:** {{type}}
**Problem:** {{problem}}

## RESEARCH CONTEXT
**Target Audience:** {{target-audience}}
**UVZ (Unique Value Zone):** {{uvz-summary}}
**Competitor Weaknesses:** {{competitor-gaps}}

## MVP FEATURES
{{core-features}}

## DIFFERENTIATORS
{{differentiators}}

## TECHNICAL SPECIFICATION
### Tech Stack
{{tech-stack}}

### Architecture
{{architecture}}

### Security Requirements
{{security}}

## DESIGN SPECIFICATION
### Design System
{{design-system}}

### Key Screens
{{key-screens}}

### UX Patterns
{{ux-patterns}}

## BUILD INSTRUCTIONS
Build this complete MVP with all features working. Follow the technical and design specifications exactly.
`,
  },
  {
    id: 'mobile-app',
    name: 'Mobile App',
    icon: '📱',
    description: 'iOS, Android, or cross-platform mobile applications',
    difficulty: 'advanced',
    estimatedTime: '2-4 months',
    requiredSkills: ['coding', 'design'],
    deliverables: ['Working app', 'App store assets', 'Documentation'],
    monetization: ['Freemium', 'Subscription', 'One-time purchase', 'In-app purchases'],
    aiTools: ['cursor', 'claude', 'replit', 'v0', 'figma'],
    steps: [
      {
        id: 'concept',
        name: 'App Concept',
        description: 'Define your mobile app',
        aiAssisted: true,
        estimatedMinutes: 60,
        tasks: [
          { id: 'name', title: 'App Name', description: 'Catchy, memorable name', type: 'input', required: true, placeholder: 'e.g., "FocusTime", "HabitFlow"' },
          { id: 'platform', title: 'Platform', description: 'Target platforms', type: 'select', required: true, options: ['iOS only', 'Android only', 'Both (React Native)', 'Both (Flutter)', 'PWA'] },
          { id: 'problem', title: 'Problem Solved', description: 'Core value proposition', type: 'textarea', required: true, placeholder: 'What problem does this app solve?' },
          { id: 'audience', title: 'Target Users', description: 'Who will use this app?', type: 'textarea', required: true, placeholder: 'Describe your target users...' },
          { id: 'features', title: 'Core Features', description: 'MVP features', type: 'ai-generate', required: true, aiPrompt: 'Generate MVP feature list' },
        ],
      },
      {
        id: 'design',
        name: 'App Design',
        description: 'Design the user experience',
        aiAssisted: true,
        estimatedMinutes: 120,
        tasks: [
          { id: 'flows', title: 'User Flows', description: 'Key user journeys', type: 'ai-generate', required: true, aiPrompt: 'Map user flows' },
          { id: 'screens', title: 'Screen List', description: 'All app screens', type: 'ai-generate', required: true, aiPrompt: 'List all screens needed' },
          { id: 'ui', title: 'UI Style', description: 'Visual design direction', type: 'ai-generate', required: true, aiPrompt: 'Define UI style guide' },
        ],
      },
      {
        id: 'build',
        name: 'Development',
        description: 'Build the app',
        aiAssisted: true,
        estimatedMinutes: 960,
        tasks: [
          { id: 'prompt', title: 'Build Prompt', description: 'Comprehensive coding prompt', type: 'ai-generate', required: true, aiPrompt: 'Generate complete build prompt' },
          { id: 'tool', title: 'Build Tool', description: 'Development approach', type: 'select', required: true, options: ['Cursor + Expo', 'Replit', 'Claude + Manual', 'Flutter', 'Native (Xcode/Android Studio)'] },
          { id: 'progress', title: 'Build Progress', description: 'Track milestones', type: 'checklist', required: true },
        ],
      },
      {
        id: 'launch',
        name: 'App Store Launch',
        description: 'Prepare for app stores',
        aiAssisted: true,
        estimatedMinutes: 180,
        tasks: [
          { id: 'store', title: 'Store Listing', description: 'App store description', type: 'ai-generate', required: true, aiPrompt: 'Write app store listing' },
          { id: 'screenshots', title: 'Screenshots', description: 'App store screenshots', type: 'checklist', required: true },
          { id: 'pricing', title: 'Monetization', description: 'Revenue model', type: 'ai-generate', required: true, aiPrompt: 'Design monetization strategy' },
        ],
      },
    ],
    promptTemplate: `Build a mobile app: {{name}}

## APP OVERVIEW
Platform: {{platform}}
Problem: {{problem}}
Target Users: {{audience}}

## MVP FEATURES
{{features}}

## SCREENS
{{screens}}

## TECHNICAL STACK
- Framework: React Native with Expo
- State: Zustand
- Navigation: Expo Router
- Backend: Supabase
- Styling: NativeWind (Tailwind)

Build this complete mobile app with all features.`,
  },
  // Mini Guide - slimmed-down ebook
  {
    id: 'mini-guide',
    name: 'Mini Guide',
    icon: '📖',
    description: 'Short, focused guides and PDF resources (5-20 pages)',
    difficulty: 'beginner',
    estimatedTime: '1-5 days',
    requiredSkills: ['writing'],
    deliverables: ['PDF Guide', 'Cover design', 'Sales page copy'],
    monetization: ['One-time purchase', 'Lead magnet', 'Bundle with other guides'],
    aiTools: ['claude', 'chatgpt', 'canva'],
    steps: [
      {
        id: 'concept',
        name: 'Concept & Outline',
        description: 'Define your guide\'s focus and structure',
        aiAssisted: true,
        estimatedMinutes: 15,
        tasks: [
          { id: 'title', title: 'Guide Title', description: 'A clear, benefit-driven title', type: 'input', required: true, placeholder: 'e.g., "5 Steps to Better Sleep Tonight"' },
          { id: 'target-audience', title: 'Target Reader', description: 'Who is this guide for?', type: 'textarea', required: true, placeholder: 'Describe your ideal reader...' },
          { id: 'problem', title: 'Core Problem', description: 'What problem does this guide solve?', type: 'textarea', required: true, placeholder: 'The specific pain point your readers face...' },
          { id: 'outline', title: 'Section Outline', description: 'AI will generate a concise outline', type: 'ai-generate', required: true, aiPrompt: 'Generate a focused outline for a short mini-guide (5-20 pages). Keep it concise and actionable.' },
        ],
      },
      {
        id: 'content',
        name: 'Content Creation',
        description: 'Write your guide content',
        aiAssisted: true,
        estimatedMinutes: 120,
        tasks: [
          { id: 'intro', title: 'Introduction', description: 'Quick hook and promise', type: 'ai-generate', required: true, aiPrompt: 'Write a short, punchy introduction for this mini-guide (1-2 pages max)' },
          { id: 'chapters', title: 'Section Content', description: 'Generate content for each section', type: 'ai-generate', required: true, aiPrompt: 'Write concise, actionable content for each section of this mini-guide' },
          { id: 'conclusion', title: 'Conclusion & CTA', description: 'Wrap up with clear next steps', type: 'ai-generate', required: true, aiPrompt: 'Write a brief conclusion with a strong call-to-action' },
        ],
      },
      {
        id: 'launch',
        name: 'Design & Launch',
        description: 'Format and publish your guide',
        aiAssisted: true,
        estimatedMinutes: 30,
        tasks: [
          { id: 'cover', title: 'Cover Design', description: 'Create an attractive cover', type: 'ai-generate', required: true, aiPrompt: 'Generate cover design concepts for this mini-guide' },
          { id: 'description', title: 'Sales Description', description: 'Product listing copy', type: 'ai-generate', required: true, aiPrompt: 'Write a compelling sales description for this mini-guide' },
          { id: 'pricing', title: 'Price', description: 'Set your price', type: 'select', required: true, options: ['Free (Lead Magnet)', '$5', '$9', '$15', '$19', 'Custom'] },
        ],
      },
    ],
    promptTemplate: `Create a focused mini-guide: {{title}}

## TARGET AUDIENCE
{{target-audience}}

## CORE PROBLEM SOLVED
{{problem}}

## GUIDE SPECIFICATIONS
- Length: 5-20 pages
- Format: PDF
- Style: Concise, actionable, scannable

## CONTENT STRUCTURE
{{outline}}

## REQUIREMENTS
- Keep each section focused and practical
- Include actionable takeaways
- Use bullet points and numbered lists
- Add tips and pro-tips callouts

Generate the complete mini-guide content.`,
  },
  // Spreadsheet Template
  {
    id: 'spreadsheet-template',
    name: 'Spreadsheet Template',
    icon: '📊',
    description: 'Google Sheets or Excel templates with formulas, dashboards, and automation',
    difficulty: 'beginner',
    estimatedTime: '3-10 days',
    requiredSkills: ['research', 'teaching'],
    deliverables: ['Google Sheet / Excel template', 'Setup guide', 'Video walkthrough'],
    monetization: ['One-time purchase', 'Template bundles', 'Premium support'],
    aiTools: ['google-sheets', 'claude', 'chatgpt', 'canva'],
    steps: [
      {
        id: 'concept',
        name: 'Template Concept',
        description: 'Define what your spreadsheet will help users achieve',
        aiAssisted: true,
        estimatedMinutes: 20,
        tasks: [
          { id: 'name', title: 'Template Name', description: 'Clear, benefit-focused name', type: 'input', required: true, placeholder: 'e.g., "Freelancer Income & Expense Tracker"' },
          { id: 'category', title: 'Category', description: 'What type of template?', type: 'select', required: true, options: ['Budget & Finance', 'Project Management', 'CRM & Sales', 'Inventory Tracking', 'Data Analytics', 'HR & Hiring', 'Marketing Dashboard', 'Content Calendar', 'Habit Tracker', 'Business Metrics', 'Other'] },
          { id: 'platform', title: 'Platform', description: 'Where will users use this?', type: 'select', required: true, options: ['Google Sheets only', 'Excel only', 'Google Sheets + Excel', 'Airtable'] },
          { id: 'problem', title: 'Problem Solved', description: 'What pain point does this solve?', type: 'textarea', required: true, placeholder: 'The specific problem users face without this template...' },
          { id: 'features', title: 'Key Features', description: 'Main features and capabilities', type: 'ai-generate', required: true, aiPrompt: 'Generate key features for this spreadsheet template, including automation features and formula-driven insights' },
        ],
      },
      {
        id: 'structure',
        name: 'Sheet Structure',
        description: 'Plan the sheets, columns, and formulas',
        aiAssisted: true,
        estimatedMinutes: 45,
        tasks: [
          { id: 'sheets', title: 'Sheet Layout', description: 'Define all sheets and their purpose', type: 'ai-generate', required: true, aiPrompt: 'Create a detailed sheet layout with sheet names, columns, and data types. Include a Dashboard sheet with summary metrics.' },
          { id: 'formulas', title: 'Key Formulas & Functions', description: 'Essential formulas to include', type: 'ai-generate', required: true, aiPrompt: 'Generate the key formulas needed (SUMIFS, VLOOKUP, ArrayFormulas, conditional formatting rules). Include the actual formula syntax.' },
          { id: 'validation', title: 'Data Validation Rules', description: 'Dropdowns and validation', type: 'ai-generate', required: true, aiPrompt: 'Define data validation rules, dropdown options, and input constraints to prevent user errors' },
          { id: 'charts', title: 'Charts & Visualizations', description: 'Dashboard charts to include', type: 'ai-generate', required: false, aiPrompt: 'Suggest charts and visual elements for the dashboard (chart types, data ranges, formatting)' },
        ],
      },
      {
        id: 'build',
        name: 'Build Template',
        description: 'Create the actual spreadsheet',
        aiAssisted: false,
        estimatedMinutes: 180,
        tasks: [
          { id: 'create-sheets', title: 'Create Sheets', description: 'Build out all sheets with headers', type: 'checklist', required: true },
          { id: 'add-formulas', title: 'Add Formulas', description: 'Implement all formulas and automations', type: 'checklist', required: true },
          { id: 'formatting', title: 'Conditional Formatting', description: 'Add color coding and visual cues', type: 'checklist', required: true },
          { id: 'sample-data', title: 'Add Sample Data', description: 'Pre-fill with realistic example data', type: 'checklist', required: true },
          { id: 'protect', title: 'Protect Sheets', description: 'Lock formula cells, protect structure', type: 'checklist', required: true },
        ],
      },
      {
        id: 'package',
        name: 'Package & Launch',
        description: 'Prepare documentation and launch',
        aiAssisted: true,
        estimatedMinutes: 45,
        tasks: [
          { id: 'guide', title: 'Setup Guide', description: 'Step-by-step setup instructions', type: 'ai-generate', required: true, aiPrompt: 'Write a comprehensive setup guide explaining how to duplicate/download the template, customize it, and start entering data' },
          { id: 'video', title: 'Video Walkthrough', description: 'Record a template demo', type: 'checklist', required: false },
          { id: 'description', title: 'Sales Description', description: 'Product listing copy', type: 'ai-generate', required: true, aiPrompt: 'Write a compelling product description highlighting the automation features, formula-driven insights, and time saved. Optimize for Gumroad/Etsy.' },
          { id: 'pricing', title: 'Pricing', description: 'Set your price', type: 'select', required: true, options: ['$9', '$15', '$19', '$29', '$39', 'Custom'] },
        ],
      },
    ],
    promptTemplate: `Create a spreadsheet template: {{name}}

## TEMPLATE PURPOSE
Category: {{category}}
Platform: {{platform}}
Problem Solved: {{problem}}

## KEY FEATURES
{{features}}

## SHEET STRUCTURE
{{sheets}}

## FORMULAS & FUNCTIONS
{{formulas}}

## DATA VALIDATION
{{validation}}

## REQUIREMENTS
- Dashboard with key metrics at a glance
- Conditional formatting for visual clarity
- Data validation to prevent errors
- Sample data pre-filled
- Formula cells protected from editing
- Clean, professional formatting
- Mobile-friendly layout

Generate the complete template specification with exact formulas and sheet structures.`,
  },
  // Automation Workflow
  {
    id: 'automation-workflow',
    name: 'Automation Workflow',
    icon: '⚡',
    description: 'Zapier, Make, or n8n automation templates that save users hours of manual work',
    difficulty: 'intermediate',
    estimatedTime: '3-10 days',
    requiredSkills: ['coding', 'research'],
    deliverables: ['Workflow template', 'Setup guide', 'Troubleshooting doc', 'Video walkthrough'],
    monetization: ['One-time purchase', 'Bundle packs', 'Setup-as-a-service'],
    aiTools: ['zapier', 'make', 'n8n', 'claude', 'chatgpt'],
    steps: [
      {
        id: 'concept',
        name: 'Workflow Concept',
        description: 'Define the automation use case',
        aiAssisted: true,
        estimatedMinutes: 20,
        tasks: [
          { id: 'name', title: 'Workflow Name', description: 'Clear, descriptive name', type: 'input', required: true, placeholder: 'e.g., "Auto-Post Blog to Social Media Pipeline"' },
          { id: 'platform', title: 'Automation Platform', description: 'Which platform to build on?', type: 'select', required: true, options: ['Zapier', 'Make (Integromat)', 'n8n', 'Power Automate', 'Multiple Platforms'] },
          { id: 'use-case', title: 'Use Case', description: 'What does this automate?', type: 'textarea', required: true, placeholder: 'Describe the manual process this replaces (e.g., "Every time a new blog post is published, manually create social posts for Twitter, LinkedIn, and schedule them")' },
          { id: 'audience', title: 'Target User', description: 'Who needs this automation?', type: 'textarea', required: true, placeholder: 'e.g., "Solo content creators who publish 2-4 blog posts per week and waste 2+ hours on social media distribution"' },
          { id: 'triggers', title: 'Triggers & Actions', description: 'Key triggers and automated actions', type: 'ai-generate', required: true, aiPrompt: 'Identify the triggers (events that start the workflow) and actions (what happens automatically). List the apps/services involved.' },
        ],
      },
      {
        id: 'design',
        name: 'Workflow Design',
        description: 'Map out the complete automation flow',
        aiAssisted: true,
        estimatedMinutes: 45,
        tasks: [
          { id: 'steps', title: 'Workflow Steps', description: 'Detailed step-by-step workflow', type: 'ai-generate', required: true, aiPrompt: 'Design the complete workflow with numbered steps. For each step specify: trigger/action type, app/service used, data mapping, and conditional logic (if any).' },
          { id: 'integrations', title: 'Integration Requirements', description: 'Apps and API connections needed', type: 'ai-generate', required: true, aiPrompt: 'List all required app integrations, API credentials, and permissions needed. Include setup instructions for each connection.' },
          { id: 'error-handling', title: 'Error Handling', description: 'How to handle failures', type: 'ai-generate', required: true, aiPrompt: 'Design error handling for each step: retry logic, fallback actions, error notifications, and common failure scenarios with solutions.' },
          { id: 'data-mapping', title: 'Data Transformations', description: 'How data flows between steps', type: 'ai-generate', required: false, aiPrompt: 'Define data transformations between steps: field mapping, data formatting, filtering rules, and any text/data manipulation needed.' },
        ],
      },
      {
        id: 'build',
        name: 'Build & Test',
        description: 'Implement and test the workflow',
        aiAssisted: true,
        estimatedMinutes: 120,
        tasks: [
          { id: 'implement', title: 'Build Workflow', description: 'Create the workflow on chosen platform', type: 'checklist', required: true },
          { id: 'test-scenarios', title: 'Test Scenarios', description: 'Test cases to validate', type: 'ai-generate', required: true, aiPrompt: 'Generate test scenarios: happy path, edge cases, error conditions, and rate limit testing. Include expected inputs and outputs for each.' },
          { id: 'test-run', title: 'Run Tests', description: 'Execute test scenarios', type: 'checklist', required: true },
          { id: 'optimize', title: 'Optimize', description: 'Reduce steps and improve speed', type: 'checklist', required: false },
        ],
      },
      {
        id: 'package',
        name: 'Package & Launch',
        description: 'Document and prepare for sale',
        aiAssisted: true,
        estimatedMinutes: 60,
        tasks: [
          { id: 'guide', title: 'Setup Guide', description: 'Step-by-step setup instructions', type: 'ai-generate', required: true, aiPrompt: 'Write a detailed setup guide: prerequisites, step-by-step setup, connecting apps, configuring triggers/actions, testing checklist, and going live.' },
          { id: 'troubleshoot', title: 'Troubleshooting Guide', description: 'Common issues and fixes', type: 'ai-generate', required: true, aiPrompt: 'Create a troubleshooting guide with common issues, error messages, and their solutions. Include FAQ section.' },
          { id: 'video', title: 'Demo Video', description: 'Record a setup walkthrough', type: 'checklist', required: false },
          { id: 'description', title: 'Product Description', description: 'Sales copy for listing', type: 'ai-generate', required: true, aiPrompt: 'Write a compelling product description emphasizing time saved, manual steps eliminated, and ROI. Include "before vs after" comparison.' },
          { id: 'pricing', title: 'Pricing', description: 'Set your price', type: 'select', required: true, options: ['$19', '$29', '$39', '$49', '$79', 'Custom'] },
        ],
      },
    ],
    promptTemplate: `Create an automation workflow: {{name}}

## PLATFORM
{{platform}}

## USE CASE
{{use-case}}

## TARGET USER
{{audience}}

## TRIGGERS & ACTIONS
{{triggers}}

## WORKFLOW STEPS
{{steps}}

## INTEGRATIONS REQUIRED
{{integrations}}

## ERROR HANDLING
{{error-handling}}

## REQUIREMENTS
- Clear trigger conditions
- Proper error handling at each step
- Rate limit awareness
- Data validation between steps
- Notification on failure
- Easy to customize for different use cases

Generate the complete workflow specification with exact configuration for each step.`,
  },
  // Chrome Extension
  {
    id: 'chrome-extension',
    name: 'Chrome Extension',
    icon: '🧩',
    description: 'Browser extensions for Chrome/Edge with popup, sidebar, or content script functionality',
    difficulty: 'intermediate',
    estimatedTime: '1-3 weeks',
    requiredSkills: ['coding'],
    deliverables: ['Working extension', 'Chrome Web Store listing', 'Privacy policy', 'Documentation'],
    monetization: ['Freemium', 'One-time purchase', 'Subscription', 'Open source + premium'],
    aiTools: ['cursor', 'claude', 'bolt', 'v0', 'chatgpt'],
    steps: [
      {
        id: 'research-context',
        name: 'Research Context',
        description: 'Import your UVZ research to inform the extension',
        aiAssisted: true,
        estimatedMinutes: 15,
        tasks: [
          { id: 'uvz-summary', title: 'Your UVZ', description: 'What makes your idea unique?', type: 'textarea', required: false, placeholder: 'Paste your UVZ research summary here (optional but recommended)...' },
          { id: 'target-audience', title: 'Target Audience', description: 'Who will use this extension?', type: 'textarea', required: true, placeholder: 'Be specific: "Remote workers who use Google Docs daily and need better document organization"' },
          { id: 'competitor-gaps', title: 'Competitor Weaknesses', description: 'What are existing extensions missing?', type: 'textarea', required: false, placeholder: 'Current extensions are too bloated, have privacy issues, or lack key features...' },
        ],
      },
      {
        id: 'concept',
        name: 'Extension Definition',
        description: 'Define your Chrome extension clearly',
        aiAssisted: true,
        estimatedMinutes: 25,
        tasks: [
          { id: 'name', title: 'Extension Name', description: 'Clear, memorable name', type: 'input', required: true, placeholder: 'e.g., "TabFlow", "ClipSaver", "PagePulse"' },
          { id: 'tagline', title: 'One-Line Pitch', description: 'Explain it in one sentence', type: 'input', required: true, placeholder: 'e.g., "Organize your tabs with AI-powered grouping"' },
          { id: 'type', title: 'Extension Type', description: 'How will users interact?', type: 'select', required: true, options: ['Popup (toolbar button)', 'Sidebar Panel', 'Content Script (page overlay)', 'New Tab Override', 'DevTools Panel', 'Background Service', 'Context Menu Actions', 'Omnibox (address bar)'] },
          { id: 'problem', title: 'Core Problem', description: 'The specific problem you solve', type: 'textarea', required: true, placeholder: 'Describe the exact pain point in the browser workflow.' },
        ],
      },
      {
        id: 'features',
        name: 'Feature Planning',
        description: 'Define MVP features',
        aiAssisted: true,
        estimatedMinutes: 30,
        tasks: [
          { id: 'core-features', title: 'MVP Features (Max 5)', description: 'Essential features for v1', type: 'ai-generate', required: true, aiPrompt: 'Generate 3-5 focused MVP features for this Chrome extension. Keep minimal — only what delivers core value.' },
          { id: 'permissions', title: 'Permissions Needed', description: 'Chrome API permissions', type: 'ai-generate', required: true, aiPrompt: 'List the required Chrome extension permissions (e.g., activeTab, storage, tabs, contextMenus) and justify why each is needed. Minimize permissions for user trust.' },
          { id: 'differentiators', title: 'Key Differentiators', description: 'What makes yours better?', type: 'ai-generate', required: true, aiPrompt: 'Based on competitor gaps, list 2-3 specific ways this extension will be different/better than alternatives.' },
        ],
      },
      {
        id: 'technical',
        name: 'Technical Specification',
        description: 'Architecture and Chrome APIs',
        aiAssisted: true,
        estimatedMinutes: 40,
        tasks: [
          { id: 'manifest', title: 'Manifest.json Structure', description: 'Extension manifest configuration', type: 'ai-generate', required: true, aiPrompt: 'Generate the complete manifest.json (v3) including: permissions, content_scripts, background service worker, action/popup, and any web_accessible_resources needed.' },
          { id: 'architecture', title: 'Architecture', description: 'Component architecture', type: 'ai-generate', required: true, aiPrompt: 'Design the extension architecture: background script responsibilities, content script injection, popup/sidebar UI, message passing between components, and storage strategy (chrome.storage.local vs sync).' },
          { id: 'tech-stack', title: 'Tech Stack', description: 'Development tools', type: 'ai-generate', required: true, aiPrompt: 'Recommend tech stack: build tool (Vite/Webpack/Plasmo), UI framework (React/Vue/Vanilla), TypeScript usage, and testing approach for Chrome extensions.' },
        ],
      },
      {
        id: 'build-prompts',
        name: 'Build Prompts',
        description: 'Generate prompts for AI coding tools',
        aiAssisted: true,
        estimatedMinutes: 25,
        tasks: [
          { id: 'master-prompt', title: 'Master Build Prompt', description: 'Complete prompt for AI tools', type: 'ai-generate', required: true, aiPrompt: 'Generate a comprehensive, copy-paste-ready prompt for AI coding tools that builds the complete Chrome extension. Include manifest, all scripts, popup/sidebar UI, message passing, and storage.' },
          { id: 'cursor-prompt', title: 'Cursor/Claude Prompt', description: 'Optimized for Cursor AI', type: 'ai-generate', required: true, aiPrompt: 'Adapt the prompt for Cursor: file structure for Chrome extension, implementation order (manifest → background → content → popup), and Cursor-specific tips.' },
        ],
      },
      {
        id: 'launch-prep',
        name: 'Launch Preparation',
        description: 'Chrome Web Store submission',
        aiAssisted: true,
        estimatedMinutes: 45,
        tasks: [
          { id: 'store-listing', title: 'Web Store Listing', description: 'Chrome Web Store description', type: 'ai-generate', required: true, aiPrompt: 'Write a Chrome Web Store listing: short description (132 chars), full description, feature bullet points, and category recommendation.' },
          { id: 'privacy-policy', title: 'Privacy Policy', description: 'Required for Web Store', type: 'ai-generate', required: true, aiPrompt: 'Generate a privacy policy for this Chrome extension. Cover: data collected, how data is used, third-party sharing, storage location, and user rights. Keep it honest and minimal.' },
          { id: 'screenshots', title: 'Screenshots & Assets', description: 'Store listing images', type: 'checklist', required: true },
          { id: 'pricing', title: 'Monetization', description: 'Revenue model', type: 'ai-generate', required: true, aiPrompt: 'Design a monetization strategy: free vs premium features, pricing tiers, and payment integration approach for a Chrome extension.' },
        ],
      },
    ],
    promptTemplate: `# {{name}} - Chrome Extension Build Specification

## EXTENSION OVERVIEW
**Name:** {{name}}
**Tagline:** {{tagline}}
**Type:** {{type}}
**Problem:** {{problem}}

## RESEARCH CONTEXT
**Target Audience:** {{target-audience}}
**UVZ:** {{uvz-summary}}
**Competitor Gaps:** {{competitor-gaps}}

## MVP FEATURES
{{core-features}}

## PERMISSIONS
{{permissions}}

## TECHNICAL SPECIFICATION
### Manifest.json
{{manifest}}

### Architecture
{{architecture}}

### Tech Stack
{{tech-stack}}

## BUILD INSTRUCTIONS
Build this Chrome extension (Manifest V3) with all features working.

### Project Structure
- manifest.json
- src/background/service-worker.ts
- src/content/content-script.ts
- src/popup/popup.html + popup.ts (or React)
- src/styles/
- src/utils/storage.ts
- src/utils/messaging.ts

### Key Requirements
- Manifest V3 (service workers, not background pages)
- Minimal permissions (request only what's needed)
- Proper message passing between background/content/popup
- chrome.storage for persistent data
- Clean, responsive popup UI
- Error handling and graceful degradation
- Works on Chrome and Edge

Build the complete extension ready for Chrome Web Store submission.`,
  },
];

// Helper function to get recommended product types based on skills
export function getRecommendedProductTypes(skills: string[], experience: string): ProductTypeConfig[] {
  const skillMap: Record<string, ProductTypeId[]> = {
    'writing': ['ebook', 'mini-guide', 'ai-prompts', 'digital-course'],
    'design': ['notion-template', 'design-assets', 'printables', 'digital-course', 'spreadsheet-template'],
    'coding': ['saas', 'software-tool', 'mobile-app', 'chrome-extension', 'automation-workflow'],
    'video': ['digital-course'],
    'teaching': ['digital-course', 'ebook', 'notion-template', 'spreadsheet-template'],
    'marketing': ['ai-prompts', 'notion-template', 'ebook', 'automation-workflow'],
    'research': ['ebook', 'ai-prompts', 'digital-course', 'spreadsheet-template'],
    'community': ['digital-course', 'saas'],
  };

  const experienceFilter = {
    'beginner': ['beginner'],
    'intermediate': ['beginner', 'intermediate'],
    'advanced': ['beginner', 'intermediate', 'advanced'],
    'expert': ['beginner', 'intermediate', 'advanced'],
  };

  const allowedDifficulties = experienceFilter[experience as keyof typeof experienceFilter] || ['beginner'];
  
  const recommendedIds = new Set<ProductTypeId>();
  skills.forEach(skill => {
    const types = skillMap[skill] || [];
    types.forEach(type => recommendedIds.add(type));
  });

  return PRODUCT_TYPES
    .filter(type => recommendedIds.has(type.id) && allowedDifficulties.includes(type.difficulty))
    .sort((a, b) => {
      const difficultyOrder = { beginner: 0, intermediate: 1, advanced: 2 };
      return difficultyOrder[a.difficulty] - difficultyOrder[b.difficulty];
    });
}

// Helper to get AI tools for a product type
export function getToolsForProductType(productTypeId: ProductTypeId): AITool[] {
  const config = PRODUCT_TYPES.find(t => t.id === productTypeId);
  if (!config) return [];
  
  return AI_TOOLS.filter(tool => config.aiTools.includes(tool.id));
}
