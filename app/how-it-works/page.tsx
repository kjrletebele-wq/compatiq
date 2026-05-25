import Link from 'next/link';
import { Search, Zap, ArrowRight, Shield } from 'lucide-react';

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen bg-[#050a14] py-12 px-6">
      <div className="max-w-3xl mx-auto space-y-8">

        <div className="text-center">
          <h1 className="text-3xl font-extrabold text-white mb-3">How CompatIQ works</h1>
          <p className="text-slate-400 leading-relaxed max-w-xl mx-auto">
            CompatIQ is a device advisory tool. It helps you make informed decisions before buying a device or when managing one you already own.
          </p>
        </div>

        {/* Journey 1 */}
        <div className="bg-white rounded-2xl border border-slate-200 px-6 py-6 shadow-sm">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 rounded-xl bg-sky-500 flex items-center justify-center">
              <Search className="h-4 w-4 text-white" />
            </div>
            <h2 className="text-base font-bold text-slate-800">Journey 1 — Buying a device</h2>
          </div>
          <ol className="space-y-4">
            {[
              { step: '1', title: 'Paste the product link', desc: 'Paste a link from any online store. CompatIQ attempts to extract device information from the page using connected data sources. If no provider is connected, you can enter details manually.' },
              { step: '2', title: 'Select your purpose', desc: 'Choose what you primarily need the device for — graphic design, programming, gaming, accounting, school, and more.' },
              { step: '3', title: 'Review the advisory', desc: 'CompatIQ generates a purpose fit assessment, upgradeability analysis, review signals (if connected), and a comparison of other stores selling the same device (if connected).' },
              { step: '4', title: 'Find parts or compare stores', desc: 'From the report, you can find compatible parts or accessories, and compare prices across stores.' },
            ].map((item) => (
              <li key={item.step} className="flex gap-4">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-sky-100 text-sky-600 text-xs font-bold flex items-center justify-center mt-0.5">
                  {item.step}
                </span>
                <div>
                  <p className="text-sm font-semibold text-slate-800">{item.title}</p>
                  <p className="text-sm text-slate-500 mt-0.5 leading-relaxed">{item.desc}</p>
                </div>
              </li>
            ))}
          </ol>
          <div className="mt-5">
            <Link
              href="/buy-device"
              className="inline-flex items-center gap-2 bg-sky-500 hover:bg-sky-400 text-white font-semibold px-5 py-2.5 rounded-xl transition-colors text-sm shadow-lg shadow-sky-500/20"
            >
              Check a device <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        {/* Journey 2 */}
        <div className="bg-white rounded-2xl border border-slate-200 px-6 py-6 shadow-sm">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500 flex items-center justify-center">
              <Zap className="h-4 w-4 text-white" />
            </div>
            <h2 className="text-base font-bold text-slate-800">Journey 2 — Owning a device</h2>
          </div>
          <ol className="space-y-4">
            {[
              { step: '1', title: 'Enter your serial number', desc: 'Your serial number is sent via POST only and never placed in a URL or log. It is masked immediately after submission.' },
              { step: '2', title: 'Device is identified', desc: 'If a connected serial provider can identify the device, full specs and warranty info are returned. If not, you can enter the model manually.' },
              { step: '3', title: 'Review upgradeability', desc: 'See which components are upgradeable, replaceable, or locked. Status is based on source data where available, and conservative defaults where not.' },
              { step: '4', title: 'Find compatible parts', desc: 'Click "Find parts" on any component to search for compatible replacements, upgrades, or accessories.' },
            ].map((item) => (
              <li key={item.step} className="flex gap-4">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 text-xs font-bold flex items-center justify-center mt-0.5">
                  {item.step}
                </span>
                <div>
                  <p className="text-sm font-semibold text-slate-800">{item.title}</p>
                  <p className="text-sm text-slate-500 mt-0.5 leading-relaxed">{item.desc}</p>
                </div>
              </li>
            ))}
          </ol>
          <div className="mt-5">
            <Link
              href="/have-device"
              className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-white font-semibold px-5 py-2.5 rounded-xl transition-colors text-sm shadow-lg shadow-emerald-500/20"
            >
              Find my device <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        {/* Data sources */}
        <div className="bg-white rounded-2xl border border-slate-200 px-6 py-6 shadow-sm">
          <h2 className="text-base font-bold text-slate-800 mb-4">Data sources and providers</h2>
          <div className="space-y-3 text-sm text-slate-600 leading-relaxed">
            <p>CompatIQ uses a provider-based architecture. Each data type has a separate provider layer. When a provider is not configured, CompatIQ shows a clear &quot;not connected&quot; message — no fake or placeholder data is shown.</p>
            <div className="rounded-xl bg-slate-50 border border-slate-200 px-4 py-4 space-y-2">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Provider categories</p>
              {[
                { label: 'Product link analysis', desc: 'Extracts device information from product page metadata and JSON-LD schemas.' },
                { label: 'Serial number lookup', desc: 'Dell, HP, Lenovo, Apple GSX — requires authorised API credentials.' },
                { label: 'Parts search', desc: 'eBay Browse API, local SA retailers — requires API keys.' },
                { label: 'Store comparison', desc: 'eBay, Google Shopping — requires API keys.' },
                { label: 'Review signals', desc: 'Reddit, YouTube, review aggregators — requires API keys.' },
              ].map(({ label, desc }) => (
                <div key={label} className="flex gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400 flex-shrink-0 mt-1.5" />
                  <p><span className="font-semibold text-slate-700">{label}:</span> {desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Advisory language */}
        <div className="bg-white rounded-2xl border border-slate-200 px-6 py-6 shadow-sm">
          <h2 className="text-base font-bold text-slate-800 mb-4">Advisory language</h2>
          <div className="space-y-2">
            {[
              { rating: 'Strong fit', desc: 'Device meets or exceeds requirements for this purpose.' },
              { rating: 'Good fit', desc: 'Device is suitable with minor limitations.' },
              { rating: 'Usable with limits', desc: 'Device can handle the purpose, but performance may be noticeably limited.' },
              { rating: 'Not ideal', desc: 'Device is below the recommended specs for this purpose.' },
              { rating: 'Not enough information', desc: 'Too many specifications are missing to give a confident rating.' },
            ].map(({ rating, desc }) => (
              <div key={rating} className="flex gap-3 text-sm">
                <span className="font-semibold text-slate-700 w-44 flex-shrink-0">{rating}</span>
                <span className="text-slate-500">{desc}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Disclaimer */}
        <div className="flex items-start gap-3 bg-white rounded-2xl border border-slate-200 px-6 py-5 shadow-sm">
          <Shield className="h-5 w-5 text-slate-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-slate-600 leading-relaxed">
            CompatIQ provides advisory results based on available data. It does not guarantee performance, compatibility, price, stock, warranty, or repairability. Always verify critical details with the seller or manufacturer before purchase.
          </p>
        </div>

      </div>
    </div>
  );
}
