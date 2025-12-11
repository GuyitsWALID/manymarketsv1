import Link from 'next/link';

export default function PrivacyPage() {
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
            <Link href="/waitlist" className="text-sm text-gray-700 hover:text-black">Waitlist</Link>
            <Link href="/login" className="text-sm text-gray-700 hover:text-black">Login</Link>
          </nav>
        </div>
      </header>

      <main className="py-16">
        <div className="max-w-6xl mx-auto px-4">
        <h1 className="text-4xl font-black mb-6">Privacy Policy</h1>
        <p className="text-gray-700 mb-6">Last updated: December 11, 2025</p>

        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-2">Overview</h2>
          <p className="text-gray-700">This Privacy Policy explains how ManyMarkets collects, uses, discloses, and protects personal information. By using the Service, you consent to the practices described below.</p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-2">Information We Collect</h2>
          <p className="text-gray-700">We collect information that helps us deliver and improve the Service, including:</p>
          <ul className="list-disc pl-6 text-gray-700 mt-2">
            <li>Account information (name, email, password)</li>
            <li>Profile and billing information</li>
            <li>User Content (uploads and submitted data)</li>
            <li>Usage data, device identifiers, IP addresses</li>
            <li>Third-party data (e.g. social account profile) when you link or authenticate via a provider</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-2">How We Use Information</h2>
          <p className="text-gray-700">We use your information to operate the Service, verify accounts, provide support, process payments, personalize content, perform analytics, and send marketing communications when permitted. We may also use aggregated or de-identified data for research and product development.</p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-2">Legal Basis for Processing</h2>
          <p className="text-gray-700">If you are a resident of jurisdictions that require a legal basis (like the EU), our processing is generally based on: performance of a contract, your consent (where required), compliance with legal obligations, and our legitimate interests to operate, secure, and improve the Service.</p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-2">Cookies & Tracking</h2>
          <p className="text-gray-700">We use cookies and similar technologies for authentication, personalization, and analytics. You can manage cookie settings in your browser. We use third-party analytics providers (e.g., Vercel Analytics, Google Analytics, etc.) to understand usage and performance.</p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-2">Third Parties & Service Providers</h2>
          <p className="text-gray-700">We may share data with our service providers and partners to operate the Service (hosting, payment processing, analytics). We require service providers to take reasonable measures to protect your information and to use it only for permitted purposes.</p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-2">Data Security</h2>
          <p className="text-gray-700">We apply reasonable security safeguards including encryption in transit, secure hosting, and access controls. However, no online system is completely secure, and we can't guarantee absolute security.</p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-2">International Transfer</h2>
          <p className="text-gray-700">Your information may be processed outside your home country. Where required, we use legally recognized transfer mechanisms or protections based on local laws.</p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-2">Your Rights</h2>
          <p className="text-gray-700">Depending on your jurisdiction, you may have rights such as access, correction, deletion, data portability, or objection to processing. To exercise your rights, contact us at <a href="mailto:privacy@manymarkets.com" className="text-uvz-orange font-bold">privacy@manymarkets.com</a>.</p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-2">Retention</h2>
          <p className="text-gray-700">We retain personal data for as long as necessary to provide the Service, comply with legal obligations, resolve disputes, and enforce agreements. Retention periods may vary by data type and our legal obligations.</p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-2">Children</h2>
          <p className="text-gray-700">The Service is not intended for children under 13. We do not knowingly collect personal data from children under 13. If you believe a child has provided personal data, please contact us so we can remove it.</p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-2">Changes to this Policy</h2>
          <p className="text-gray-700">We may update this policy. For material changes, we will provide notice via the Service or email. Continued use after updates indicates acceptance of the revised policy.</p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-2">Contact</h2>
          <p className="text-gray-700">If you have questions about this Privacy Policy, contact <a href="mailto:privacy@manymarkets.com" className="text-uvz-orange font-bold">privacy@manymarkets.com</a>.</p>
        </section>

        <p className="text-sm text-gray-600">This Privacy Policy is provided for general guidance only. It is not legal advice. Please consult a privacy lawyer to ensure compliance with laws that apply to your users and business.</p>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t-2 border-black bg-white py-8 px-4">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div className="flex items-center gap-2 justify-center sm:justify-start w-full sm:w-auto mb-2 sm:mb-0">
            <img src="/2-Photoroom.png" alt="ManyMarkets footer logo" className="h-10 w-auto" />
          </div>
          <p className="text-sm text-gray-500 w-full sm:w-auto mb-2 sm:mb-0">© {new Date().getFullYear()} ManyMarkets. All rights reserved.</p>
          <div className="flex gap-4 text-sm w-full sm:w-auto justify-center sm:justify-end">
            <Link href="/" className="text-gray-500 hover:text-black transition-colors">Home</Link>
            <Link href="/privacy" className="text-gray-500 hover:text-black transition-colors">Privacy</Link>
            <Link href="/terms" className="text-gray-500 hover:text-black transition-colors">Terms</Link>
            <Link href="/refund-policy" className="text-gray-500 hover:text-black transition-colors">Refund Policy</Link>
            <Link href="/waitlist" className="text-gray-500 hover:text-black transition-colors">Waitlist</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
