import Link from 'next/link';

export default function TermsPage() {
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
          <h1 className="text-4xl font-black mb-6">Terms of Service</h1>
          <p className="text-gray-700 mb-6">Last Updated: December 11, 2025</p>

        <section className="mb-6">
          <h2 className="text-lg font-bold mb-1">Company Information</h2>
          <p className="text-gray-700">These Terms are provided by ManyMarkets. Please replace the placeholder business details below with your registered legal entity and business address for production readiness.</p>
          <p className="text-gray-700">Legal Entity: ManyMarkets (replace with registered legal name)</p>
          <p className="text-gray-700">Address: [Your registered address]</p>
          <p className="text-gray-700">Contact: <a href="mailto:hello@manymarkets.com" className="text-uvz-orange font-bold">hello@manymarkets.com</a></p>
        </section>

        <section className="mb-4">
          <p className="text-gray-700">Please also review our <a href="/privacy" className="text-uvz-orange font-bold">Privacy Policy</a> and our <a href="/refund-policy" className="text-uvz-orange font-bold">Refund Policy</a> for important information about how payments and refunds are handled.</p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-2">Acceptance of Terms</h2>
          <p className="text-gray-700">By accessing or using ManyMarkets ("the Service"), you agree to these Terms of Service ("Terms"). If you do not agree, do not use the Service. These Terms form a binding legal contract between you and the operator of ManyMarkets.</p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-2">Changes to the Terms</h2>
          <p className="text-gray-700">We may update the Terms from time to time. We will notify users about material changes via the Service or email. Continued use of the Service after changes indicates acceptance of the updated Terms.</p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-2">Services</h2>
          <p className="text-gray-700">ManyMarkets provides tools and resources for market research, product ideation, and guided product creation. We provide features including AI-driven research, idea scoring, content-building tools, and related services and integrations. Availability may vary and we may modify, limit, or discontinue features at any time.</p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-2">Eligibility</h2>
          <p className="text-gray-700">To use the Service, you must be 18 years or older or otherwise able to form a legally binding agreement in your jurisdiction. If you are using ManyMarkets on behalf of an organization, you represent and warrant that you have the authority to bind that organization to these Terms.</p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-2">User Accounts</h2>
          <p className="text-gray-700">You are responsible for maintaining the security and confidentiality of your account login details. You agree to notify us promptly of any unauthorized access to your account. You are solely responsible for activities that occur under your account.</p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-2">User Content</h2>
          <p className="text-gray-700">You retain ownership of content you submit ("User Content"). By posting or submitting User Content, you grant ManyMarkets a non-exclusive, worldwide, royalty-free license to host, use, copy, display, modify, distribute, and otherwise exploit the User Content for the purpose of operating and improving the Service.</p>
          <p className="text-gray-700">You are responsible for the User Content you submit and must ensure it does not infringe intellectual property rights or violate applicable laws. We may remove content that violates these Terms or is otherwise objectionable.</p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-2">Acceptable Use</h2>
          <p className="text-gray-700">You agree not to use the Service to upload or share content that is illegal, harmful, harassing, hateful, pornographic, or otherwise objectionable. You also agree not to reverse-engineer or misuse the Service or attempt to access restricted areas without authorization.</p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-2">Payment Processor Policies</h2>
          <p className="text-gray-700">ManyMarkets uses third-party payment processors to process payments and manage subscriptions. Transactions are subject to the policies of those processors. Merchant listings and sales must comply with applicable laws and the processor’s acceptable use and content policies; typical prohibited categories include illegal goods and services, drugs, sexually explicit materials where restricted, regulated goods (e.g., firearms), and services that facilitate wrongdoing or discrimination. Failure to comply may lead to payment restrictions or account termination by the processor or ManyMarkets.</p>
          <p className="text-gray-700 mt-2">You must ensure that any product or service you list or sell through ManyMarkets complies with the policies of the payment processor used to process transactions and any applicable laws. Failure to comply may result in suspension of payments, removal of the product, or account termination by the processor or ManyMarkets. If you are uncertain whether a product or service is permitted, contact us at <a href="mailto:hello@manymarkets.com" className="text-uvz-orange font-bold">hello@manymarkets.com</a>.</p>
          <p className="text-gray-700">You must not use the Service to promote or sell content or services that violate the policies of the payment processor or applicable laws, or would otherwise put ManyMarkets at risk. If a payment provider or ManyMarkets determine content violates these Terms or a processor’s policy, we may suspend or restrict access and take additional actions.</p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-2">Fees & Billing</h2>
          <p className="text-gray-700">If you choose a paid plan or upgrade, you agree to pay the applicable subscription fee. Payments may be processed by third-party payment providers. The terms of the payment processor apply to payments you make and may include separate policies for refunds.</p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-2">Cancellation and Termination</h2>
          <p className="text-gray-700">You may cancel your account or subscription at any time through the Service or by contacting support. We may suspend or terminate your access for violations of the Terms or if abuse is detected. Upon termination, any unused prepaid fees may be forfeited as stated in the Refund Policy.</p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-2">Intellectual Property</h2>
          <p className="text-gray-700">ManyMarkets and its licensors retain all rights in content provided by the Service (excluding User Content). The Service, user interface, code, designs, and trademarks are protected by copyright, patent, trade secret, or other laws.</p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-2">Feedback</h2>
          <p className="text-gray-700">If you provide suggestions or feedback, you grant ManyMarkets a worldwide, royalty-free license to use and incorporate such feedback for any purpose.</p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-2">Third-Party Services</h2>
          <p className="text-gray-700">We may integrate third-party products (payment processors, cloud services, analytics). Those services have their own terms and privacy policy. ManyMarkets is not liable for third-party services or their use of your information.</p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-2">Warranties and Disclaimers</h2>
          <p className="text-gray-700">The Service is provided "as is." We disclaim all warranties to the extent permitted by law, including merchantability, fitness for a particular purpose, and non-infringement. We do not guarantee uptime, error-free operation, or specific outcomes from use of the Service.</p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-2">Limitation of Liability</h2>
          <p className="text-gray-700">To the maximum extent permitted by law, ManyMarkets' aggregate liability for damages arising from or related to the Service is limited to direct damages up to the total sum paid by you to ManyMarkets in the 12 months prior to the event, or $100, whichever is greater. We are not liable for indirect, consequential, or punitive damages.</p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-2">Indemnification</h2>
          <p className="text-gray-700">You agree to indemnify and hold ManyMarkets harmless against claims arising from your breach of the Terms, your User Content, or your use of the Service.</p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-2">Governing Law</h2>
          <p className="text-gray-700">The Terms are governed by the laws of the jurisdiction where ManyMarkets is incorporated, except for conflict-of-law rules. You agree to resolve disputes in those courts or via binding arbitration where allowed.</p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-2">Contact</h2>
          <p className="text-gray-700">If you have questions regarding these Terms, contact us at <a href="mailto:hello@manymarkets.com" className="text-uvz-orange font-bold">hello@manymarkets.com</a>.</p>
        </section>

        <section className="mb-6">
          <p className="text-gray-700">These Terms of Service (“Terms”) constitute a legally binding agreement between you and ManyMarkets (“ManyMarkets,” “we,” “us,” or “our”). By accessing or using the ManyMarkets platform, website, tools, or any related services (collectively, the “Service”), you acknowledge that you have read, understood, and agreed to be bound by these Terms. If you do not agree to these Terms, you must not access or use the Service.</p>
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-bold mb-1">1. Eligibility</h2>
          <p className="text-gray-700">You must be at least 18 years old or have the legal capacity to enter into binding agreements in your jurisdiction. If you use the Service on behalf of a business or organization, you represent and warrant that you have authority to bind such entity to these Terms.</p>
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-bold mb-1">2. Changes to These Terms</h2>
          <p className="text-gray-700">We may update or modify these Terms from time to time. When changes are material, we will provide notice via email or through the Service. Continued use of the Service after changes take effect constitutes acceptance of the revised Terms.</p>
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-bold mb-1">3. Description of the Service</h2>
          <p className="text-gray-700">ManyMarkets provides AI-enabled market research tools, idea validation workflows, scoring systems, content-building utilities, and related analytical and productivity features. We reserve the right to add, modify, restrict, suspend, or discontinue any part of the Service at any time without liability.</p>
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-bold mb-1">4. User Accounts</h2>
          <p className="text-gray-700">To access certain features, you must create an account. You are responsible for keeping your login credentials confidential and for all activity under your account. You agree to notify us promptly if you suspect unauthorized use or security breaches.</p>
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-bold mb-1">5. User Content</h2>
          <p className="text-gray-700">You retain all rights to content, data, prompts, inputs, or materials you submit to the Service (“User Content”). By submitting User Content, you grant ManyMarkets a non-exclusive, worldwide, royalty-free, sublicensable license to host, process, store, transmit, display, and otherwise use User Content as necessary to operate, maintain, and improve the Service. You represent that your User Content does not violate any laws or infringe the rights of third parties. We may remove or suspend content that violates these Terms or is deemed harmful, unlawful, or otherwise objectionable.</p>
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-bold mb-1">6. Acceptable Use</h2>
          <p className="text-gray-700">You agree not to:</p>
          <ul className="list-disc pl-6 text-gray-700">
            <li>Use the Service for unlawful, harmful, fraudulent, defamatory, or abusive purposes.</li>
            <li>Upload malware, harmful code, or content containing security risks.</li>
            <li>Interfere with or disrupt the Service, networks, or servers.</li>
            <li>Access or attempt to access non-public portions of the Service without authorization.</li>
            <li>Reverse engineer, decompile, or attempt to extract source code, algorithms, or any proprietary components of the Service.</li>
            <li>Use the Service to build or train competing products or models.</li>
          </ul>
          <p className="text-gray-700 mt-2">We reserve the right to suspend or terminate accounts that violate this section.</p>
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-bold mb-1">7. Fees, Billing & Payments</h2>
          <h3 className="text-lg font-semibold">7.1 Subscription Fees</h3>
          <p className="text-gray-700">Paid plans require payment of applicable subscription fees. Pricing, tiers, and billing intervals are displayed at the time of purchase and may be updated periodically.</p>
          <h3 className="text-lg font-semibold mt-2">7.2 Payment Processing</h3>
          <p className="text-gray-700">Payments are securely processed by third-party payment processors we integrate with. By purchasing a subscription, you agree to be bound by the payment processor’s terms, which may include separate refund, tax, and invoicing policies.</p>
          <h3 className="text-lg font-semibold mt-2">7.3 Taxes</h3>
          <p className="text-gray-700">Depending on your location, taxes such as VAT, GST, or sales taxes may apply. These are calculated and applied by the payment processor.</p>
          <h3 className="text-lg font-semibold mt-2">7.4 Automatic Renewal</h3>
          <p className="text-gray-700">Unless otherwise stated, subscriptions automatically renew at the end of each billing cycle. You may cancel automatic renewal at any time within your account.</p>
          <h3 className="text-lg font-semibold mt-2">7.5 Refunds</h3>
          <p className="text-gray-700">Refund requests are handled in accordance with our Refund Policy and the policies of the payment processor that processed the transaction. If you request a refund, we may coordinate with the processor to resolve the payment and return funds when applicable. Unless otherwise required by law, the processor’s refund policy and the terms described in our Refund Policy govern eligibility for refunds.</p>
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-bold mb-1">8. Cancellation & Termination</h2>
          <p className="text-gray-700">You may cancel your subscription at any time through your account settings. Cancellation prevents future billing but does not retroactively refund charges. We may suspend or terminate your account if you violate these Terms, misuse the Service, engage in fraudulent activity, or if required by law. Upon termination, access to the Service will cease, and prepaid fees may be forfeited depending on the Refund Policy.</p>
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-bold mb-1">9. Intellectual Property</h2>
          <p className="text-gray-700">All rights, title, and interest in and to the Service—including its software, architecture, algorithms, branding, UI/UX designs, content (excluding User Content), trademarks, and other proprietary materials—are owned by ManyMarkets or its licensors. Nothing in these Terms grants you ownership of or rights to the Service beyond the limited, revocable license required for normal use.</p>
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-bold mb-1">10. Feedback</h2>
          <p className="text-gray-700">If you submit feedback, ideas, suggestions, or improvements (“Feedback”), you grant us the right to use such Feedback without restriction or obligation.</p>
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-bold mb-1">11. Third-Party Integrations</h2>
          <p className="text-gray-700">The Service may contain links or integrations with third-party tools, APIs, analytics services, or payment systems. ManyMarkets is not responsible for the actions, content, or policies of third-party providers. Your use of those services is governed by their respective terms.</p>
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-bold mb-1">12. Disclaimer of Warranties</h2>
          <p className="text-gray-700">The Service is provided “as is” and “as available.” To the fullest extent permitted by applicable law, we disclaim all warranties, whether express, implied, statutory, or otherwise, including warranties of merchantability, fitness for a particular purpose, non-infringement, uptime, accuracy, or reliability. We do not guarantee that the Service will be error-free, uninterrupted, secure, or produce any specific outcome.</p>
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-bold mb-1">13. Limitation of Liability</h2>
          <p className="text-gray-700">To the maximum extent permitted by law: ManyMarkets shall not be liable for any indirect, incidental, consequential, special, or punitive damages, including lost profits, lost data, lost opportunities, or business interruptions. Our total cumulative liability for any claim arising from or related to the Service shall not exceed the greater of:</p>
          <ul className="list-disc pl-6 text-gray-700">
            <li>the total fees you paid to ManyMarkets in the twelve (12) months preceding the event, or</li>
            <li>USD $100</li>
          </ul>
          <p className="text-gray-700">These limitations apply even if we have been advised of the possibility of such damages.</p>
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-bold mb-1">14. Indemnification</h2>
          <p className="text-gray-700">You agree to indemnify, defend, and hold harmless ManyMarkets and its officers, directors, contractors, affiliates, and employees from any claims, losses, liabilities, damages, expenses, or costs arising out of: (a) your use of the Service, (b) your User Content, or (c) your violation of these Terms or applicable laws.</p>
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-bold mb-1">15. Governing Law & Dispute Resolution</h2>
          <p className="text-gray-700">These Terms are governed by the laws of the jurisdiction in which ManyMarkets is incorporated, without regard to conflicts-of-law principles. Any disputes shall be resolved exclusively through competent courts in that jurisdiction or, where legally permitted, through binding arbitration.</p>
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-bold mb-1">16. Contact Information</h2>
          <p className="text-gray-700">For questions or concerns regarding these Terms, or for payment verification assistance, contact: <a href="mailto:hello@manymarkets.com" className="text-uvz-orange font-bold">hello@manymarkets.com</a></p>
          <p className="text-gray-700 mt-2">Payment processor terms and policies: consult your payment provider’s documentation for details.</p>
        </section>

        <p className="text-sm text-gray-600">Note: These Terms are provided for informational purposes and may require review or customization by qualified legal counsel to ensure compliance with applicable laws and regulations.</p>
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
            <Link href="/refund-policy" className="text-gray-500 hover:text-black transition-colors">Refund Policy</Link>
            <Link href="/waitlist" className="text-gray-500 hover:text-black transition-colors">Waitlist</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
