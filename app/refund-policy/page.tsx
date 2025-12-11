import Link from 'next/link';

export default function RefundPolicyPage() {
  return (
    <div className="min-h-screen bg-gray-50">
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
        <h1 className="text-4xl font-black mb-6">Refund Policy</h1>
        <p className="text-gray-700 mb-6">Last updated: December 11, 2025</p>

        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-2">Overview</h2>
          <p className="text-gray-700">ManyMarkets offers digital products and subscription services. This Refund Policy describes when refunds are available, how and when they are granted, and the key billing processes to keep in mind. If any third-party payment provider processes your payment, their refund rules may also apply.</p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-2">Scope</h2>
          <p className="text-gray-700">This policy applies to: (1) subscription fees paid to access the platform’s Pro features, and (2) any one-time purchases or digital product purchases processed directly by ManyMarkets. For purchases processed by third-party platforms, the third-party seller’s refund policy will also apply.</p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-2">Free Trials</h2>
          <p className="text-gray-700">If we offer a free trial, you will not be charged during that trial. If you do not cancel before the trial ends, your subscription automatically converts into a paid subscription and will be charged according to your selected plan. You can cancel anytime during the trial to avoid charges.</p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-2">Subscriptions & Renewals</h2>
          <p className="text-gray-700">Subscriptions renew automatically at the end of each billing period (monthly, annual, etc.) and will be charged to the payment method on file. You can cancel anytime prior to the renewal date to avoid charges. Cancelling a subscription does not generally trigger a refund for fees already billed unless otherwise provided here or required by law.</p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-2">Eligibility for Refunds</h2>
          <p className="text-gray-700">We evaluate refund requests on a case-by-case basis. Examples where refunds may be granted include: (a) an accidental double charge, (b) a billing error on our side, (c) a technical issue that prevented access for a prolonged period, or (d) other good-faith circumstances. We do not generally refund changes of mind or partial feature usage; please contact support if you believe you have grounds for refund.</p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-2">How to Request a Refund</h2>
          <ol className="list-decimal pl-6 text-gray-700">
            <li>Contact support at <a href="mailto:hello@manymarkets.com" className="text-uvz-orange font-bold">hello@manymarkets.com</a> and provide your account details and a description of your refund reason.</li>
            <li>Provide the transaction ID, date of purchase, and any supporting details (screenshots, billing statements) to help us investigate quickly.</li>
            <li>We will evaluate your request and notify you via email within a reasonable time frame (typically three to five business days) regarding outcome and next steps.</li>
          </ol>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-2">Processing Refunds</h2>
          <p className="text-gray-700">If we approve a refund, we will typically issue it using the original payment method. Refund processing may take several business days depending on the payment processor and your bank’s policies. In some cases, we may offer credit to your ManyMarkets account instead of refunding to the original payment method, especially for promotional or marketing-credited purchases.</p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-2">Third-Party Marketplaces</h2>
          <p className="text-gray-700">For purchases made through third-party marketplaces or integrators, refunds will be handled by the third party in accordance with their policies. Please contact the third party for the fastest resolution. If we control the refund process for the transaction (e.g., a charge through our Lemon Squeezy storefront), we will follow the terms above.</p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-2">Chargebacks and Fraud</h2>
          <p className="text-gray-700">If you open a chargeback with your card issuer, your account may be locked while the claim is investigated. If a chargeback is resolved in your favor, we will update your account accordingly. We reserve the right to request additional documentation and to take action, including terminating accounts, if fraud is suspected.</p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-2">Modifications to this Policy</h2>
          <p className="text-gray-700">We may modify this Refund Policy. For material changes, we will provide notice via the Service or email and/or post an updated "Last updated" date at the top of this page.</p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-2">Contact</h2>
          <p className="text-gray-700">If you have questions or want to request a refund, please contact <a href="mailto:hello@manymarkets.com" className="text-uvz-orange font-bold">hello@manymarkets.com</a>.</p>
        </section>

        <p className="text-sm text-gray-600">This Refund Policy is provided for general guidance only. Consult your payment processor terms and local regulations for additional rights and requirements.</p>
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
