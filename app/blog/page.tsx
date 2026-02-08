import Link from 'next/link';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Blog | ManyMarkets — Tips for Finding Profitable Niches',
  description: 'Learn how to find profitable niches, validate business ideas, and build digital products. Actionable guides for entrepreneurs and creators.',
  openGraph: {
    title: 'ManyMarkets Blog — Niche Discovery & Digital Product Tips',
    description: 'Actionable guides for finding profitable niches and building digital products.',
  },
};

interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  category: string;
  readTime: string;
}

const posts: BlogPost[] = [
  {
    slug: 'how-to-find-profitable-niche-2026',
    title: 'How to Find a Profitable Niche in 2026',
    excerpt: 'The market is more crowded than ever. Here\'s a data-driven framework for finding underserved niches where you can actually compete — and win.',
    date: '2026-02-07',
    category: 'Strategy',
    readTime: '8 min read',
  },
  {
    slug: '10-digital-products-build-this-weekend',
    title: '10 Digital Products You Can Build This Weekend',
    excerpt: 'You don\'t need months to launch a digital product. These 10 product types can go from idea to first sale in a single weekend.',
    date: '2026-02-05',
    category: 'Products',
    readTime: '6 min read',
  },
  {
    slug: 'uvz-method-unique-value-zone',
    title: 'The UVZ Method: Finding Your Unique Value Zone',
    excerpt: 'Stop competing on price. The Unique Value Zone framework helps you find the intersection of low competition, real demand, and your personal strengths.',
    date: '2026-02-03',
    category: 'Framework',
    readTime: '10 min read',
  },
  {
    slug: 'validate-business-idea-before-building',
    title: 'How to Validate a Business Idea Before You Build It',
    excerpt: 'Most products fail because founders skip validation. Here are 5 concrete steps to test demand before writing a single line of code — or a single page.',
    date: '2026-02-01',
    category: 'Validation',
    readTime: '7 min read',
  },
];

function getCategoryColor(category: string) {
  const colors: Record<string, string> = {
    Strategy: 'bg-blue-500',
    Products: 'bg-uvz-orange',
    Framework: 'bg-purple-500',
    Validation: 'bg-green-500',
  };
  return colors[category] || 'bg-gray-500';
}

export default function BlogPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="relative z-10 border-b-2 border-black bg-white/80 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <img src="/2-Photoroom.png" alt="ManyMarkets logo" className="h-10 w-auto" />
          </Link>
          <nav className="flex items-center gap-4">
            <Link href="/" className="text-sm text-gray-700 hover:text-black">Home</Link>
            <Link href="/daily-ideas" className="text-sm text-gray-700 hover:text-black">Daily Ideas</Link>
            <Link href="/login" className="text-sm font-bold bg-uvz-orange text-white px-4 py-2 border-2 border-black shadow-brutal hover:-translate-y-0.5 transition-transform">Get Started</Link>
          </nav>
        </div>
      </header>

      <main className="py-12 md:py-20">
        <div className="max-w-4xl mx-auto px-4">
          {/* Hero */}
          <div className="text-center mb-12 md:mb-16">
            <h1 className="text-3xl md:text-5xl font-black mb-4 uppercase">
              The ManyMarkets <span className="text-uvz-orange">Blog</span>
            </h1>
            <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto">
              Actionable guides for finding profitable niches, validating ideas, and building digital products that sell.
            </p>
          </div>

          {/* Posts */}
          <div className="space-y-6 md:space-y-8">
            {posts.map((post) => (
              <Link
                key={post.slug}
                href={`/blog/${post.slug}`}
                className="block border-2 md:border-4 border-black bg-white p-6 md:p-8 shadow-brutal hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_#000000] transition-all group"
              >
                <div className="flex flex-wrap items-center gap-3 mb-3">
                  <span className={`text-xs font-bold text-white px-2 py-1 rounded-full ${getCategoryColor(post.category)}`}>
                    {post.category}
                  </span>
                  <span className="text-xs text-gray-400 font-medium">
                    {new Date(post.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                  </span>
                  <span className="text-xs text-gray-400 font-medium">{post.readTime}</span>
                </div>
                <h2 className="text-xl md:text-2xl font-black mb-2 group-hover:text-uvz-orange transition-colors">
                  {post.title}
                </h2>
                <p className="text-gray-600 text-sm md:text-base">
                  {post.excerpt}
                </p>
              </Link>
            ))}
          </div>

          {/* CTA */}
          <div className="mt-16 text-center border-2 md:border-4 border-black bg-black text-white p-8 md:p-12 shadow-brutal">
            <h2 className="text-2xl md:text-3xl font-black mb-4 uppercase">
              Stop Reading, Start Building
            </h2>
            <p className="text-gray-300 mb-6 max-w-lg mx-auto">
              ManyMarkets finds profitable niches, validates your ideas, and helps you build digital products — all with AI. Try it free.
            </p>
            <Link
              href="/login"
              className="inline-block bg-uvz-orange text-white font-bold px-8 py-3 border-2 border-white shadow-brutal hover:-translate-y-1 transition-transform"
            >
              Get Started Free
            </Link>
          </div>
        </div>
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
