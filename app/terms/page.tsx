import Link from 'next/link';
import { ArrowLeft, FileText } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Use — CompatIQ',
  description: 'Terms and conditions for using CompatIQ.',
};

export default function TermsPage() {
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
            <FileText className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold text-white">Terms of Use</h1>
            <p className="text-slate-400 text-sm mt-1">Last updated: May 2026</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 px-6 py-6 space-y-6 text-slate-700">

          <section className="space-y-2">
            <h2 className="text-base font-bold text-slate-800">Acceptance</h2>
            <p className="text-sm leading-relaxed">
              By using CompatIQ, you agree to these terms. If you do not agree, please do not use the service. CompatIQ is provided free of charge during its beta period with no guarantee of continued availability.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-slate-800">What CompatIQ is</h2>
            <p className="text-sm leading-relaxed">
              CompatIQ is an advisory tool. It analyses device information from public sources and provides informational guidance on compatibility, purpose fit, upgradeability, and parts availability. It is not a retailer, a manufacturer, a reseller, or an authorised service provider for any brand.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-slate-800">What CompatIQ is not</h2>
            <p className="text-sm leading-relaxed">
              CompatIQ does not guarantee the accuracy of any information it provides. Results are generated from publicly available data sources and may be incomplete, outdated, or incorrect. CompatIQ is not a substitute for:
            </p>
            <ul className="text-sm leading-relaxed list-disc list-inside space-y-1 pl-1">
              <li>Advice from a qualified technician or IT professional</li>
              <li>Official specifications from the device manufacturer</li>
              <li>Warranty or compatibility confirmation from the seller</li>
              <li>Legal, financial, or insurance advice</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-slate-800">Your responsibilities</h2>
            <p className="text-sm leading-relaxed">
              You agree to use CompatIQ for lawful purposes only. You must not:
            </p>
            <ul className="text-sm leading-relaxed list-disc list-inside space-y-1 pl-1">
              <li>Attempt to abuse, overload, or disrupt the service</li>
              <li>Use automated scripts to make excessive numbers of requests</li>
              <li>Attempt to extract, scrape, or replicate the underlying data sources</li>
              <li>Use the service in a way that violates any applicable law</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-slate-800">Third-party content</h2>
            <p className="text-sm leading-relaxed">
              CompatIQ displays information retrieved from third-party sources including search engines, e-commerce platforms, and manufacturer databases. We do not own or control this content. Prices, availability, and specifications shown may differ from what you find when you visit the source directly. Always verify before making a purchase.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-slate-800">Limitation of liability</h2>
            <p className="text-sm leading-relaxed">
              To the fullest extent permitted by applicable law, CompatIQ and its developers are not liable for any loss, damage, or cost arising from your use of or reliance on the service — including but not limited to purchasing an incompatible component, making a buying decision based on incorrect data, or any service interruption.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-slate-800">Changes</h2>
            <p className="text-sm leading-relaxed">
              We may update these terms at any time. Continued use of CompatIQ after a change is posted constitutes acceptance of the revised terms.
            </p>
          </section>

        </div>

        <div className="flex gap-4 text-sm">
          <Link href="/privacy" className="text-slate-400 hover:text-slate-200 underline underline-offset-2 transition-colors">Privacy Policy</Link>
          <Link href="/disclaimer" className="text-slate-400 hover:text-slate-200 underline underline-offset-2 transition-colors">Disclaimer</Link>
        </div>

      </div>
    </div>
  );
}
