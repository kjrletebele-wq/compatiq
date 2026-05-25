import Link from 'next/link';
import { ArrowLeft, ShieldCheck } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy — CompatIQ',
  description: 'How CompatIQ handles your data.',
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#050a14] py-12 px-6">
      <div className="max-w-3xl mx-auto space-y-8">

        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-200 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </Link>

        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-sky-500 flex items-center justify-center flex-shrink-0 mt-0.5">
            <ShieldCheck className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold text-white">Privacy Policy</h1>
            <p className="text-slate-400 text-sm mt-1">Last updated: May 2026</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 px-6 py-6 space-y-6 text-slate-700">

          <section className="space-y-2">
            <h2 className="text-base font-bold text-slate-800">What CompatIQ collects</h2>
            <p className="text-sm leading-relaxed">
              CompatIQ does not require you to create an account. We do not collect your name, email address, or payment information.
            </p>
            <p className="text-sm leading-relaxed">
              When you use the tool, we may temporarily process the following to generate your advisory:
            </p>
            <ul className="text-sm leading-relaxed list-disc list-inside space-y-1 pl-1">
              <li>Product links you paste (used to fetch device information)</li>
              <li>Device specifications you enter manually</li>
              <li>Serial numbers you submit — these are hashed and masked before any processing and are never stored or logged in readable form</li>
              <li>Country and city if you provide them (used only to improve search relevance)</li>
            </ul>
            <p className="text-sm leading-relaxed">
              None of this information is stored permanently, sold, or shared with third parties beyond what is described below.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-slate-800">Third-party data sources</h2>
            <p className="text-sm leading-relaxed">
              To provide results, CompatIQ calls third-party APIs including SerpApi (for search results) and the eBay Browse API (for product listings). When you trigger a search, your query — which may include a device name or part description — is sent to these services. Please review their privacy policies:
            </p>
            <ul className="text-sm leading-relaxed list-disc list-inside space-y-1 pl-1">
              <li><a href="https://serpapi.com/privacy" target="_blank" rel="noopener noreferrer" className="text-sky-600 underline hover:text-sky-700">SerpApi Privacy Policy</a></li>
              <li><a href="https://www.ebay.com/help/policies/member-behaviour-policies/user-privacy-notice-privacy-policy?id=4260" target="_blank" rel="noopener noreferrer" className="text-sky-600 underline hover:text-sky-700">eBay Privacy Policy</a></li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-slate-800">Cookies and tracking</h2>
            <p className="text-sm leading-relaxed">
              CompatIQ does not use advertising cookies, tracking pixels, or behavioural analytics. We may use essential session data (such as browser sessionStorage) to carry device information between pages within your current session. This data is cleared when you close the browser tab.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-slate-800">Data security</h2>
            <p className="text-sm leading-relaxed">
              All API requests are made over HTTPS. Serial numbers are masked immediately on receipt and are never exposed in URLs, logs, or API responses. We do not store device reports or search histories on our servers.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-slate-800">Children</h2>
            <p className="text-sm leading-relaxed">
              CompatIQ is not directed at children under 13. We do not knowingly collect information from anyone under 13.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-slate-800">Changes to this policy</h2>
            <p className="text-sm leading-relaxed">
              We may update this policy as the product evolves. The date at the top of this page reflects the most recent revision.
            </p>
          </section>

        </div>

        <div className="flex gap-4 text-sm">
          <Link href="/terms" className="text-slate-400 hover:text-slate-200 underline underline-offset-2 transition-colors">Terms of Use</Link>
          <Link href="/disclaimer" className="text-slate-400 hover:text-slate-200 underline underline-offset-2 transition-colors">Disclaimer</Link>
        </div>

      </div>
    </div>
  );
}
