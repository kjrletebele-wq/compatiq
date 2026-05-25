import Link from 'next/link';
import { Search, Zap, Shield } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#050a14]">
      <div className="max-w-4xl mx-auto px-6 py-16 sm:py-24">

        {/* Hero */}
        <div className="text-center mb-14">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-white mb-4 leading-tight tracking-tight">
            Paste the link before you buy.
          </h1>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
            CompatIQ pulls specs, purpose fit, reviews, and compatible parts from available store data — so you know what you are getting before you pay.
          </p>
        </div>

        {/* Two main journey cards */}
        <div className="grid sm:grid-cols-2 gap-5 mb-12">

          {/* Card A: Buy a device */}
          <div className="bg-white rounded-2xl border border-slate-200 p-7 shadow-sm flex flex-col">
            <div className="w-11 h-11 rounded-xl bg-sky-500 flex items-center justify-center mb-5 shadow-lg shadow-sky-500/20">
              <Search className="h-5 w-5 text-white" />
            </div>
            <h2 className="text-lg font-bold text-slate-900 mb-2">
              I want to buy a device
            </h2>
            <p className="text-sm text-slate-500 leading-relaxed flex-1 mb-6">
              Paste a product link, choose what you need it for, and see specs, suitability, reviews, upgradeability, and other stores.
            </p>
            <Link
              href="/buy-device"
              className="inline-flex items-center justify-center gap-2 bg-sky-500 hover:bg-sky-400 text-white font-semibold px-5 py-2.5 rounded-xl transition-colors shadow-lg shadow-sky-500/20 text-sm w-full"
            >
              Check a device
            </Link>
          </div>

          {/* Card B: Have a device */}
          <div className="bg-white rounded-2xl border border-slate-200 p-7 shadow-sm flex flex-col">
            <div className="w-11 h-11 rounded-xl bg-emerald-500 flex items-center justify-center mb-5 shadow-lg shadow-emerald-500/20">
              <Zap className="h-5 w-5 text-white" />
            </div>
            <h2 className="text-lg font-bold text-slate-900 mb-2">
              I already have a device
            </h2>
            <p className="text-sm text-slate-500 leading-relaxed flex-1 mb-6">
              Enter your serial number to identify your device and find replaceable or upgradeable parts.
            </p>
            <Link
              href="/have-device"
              className="inline-flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-white font-semibold px-5 py-2.5 rounded-xl transition-colors shadow-lg shadow-emerald-500/20 text-sm w-full"
            >
              Find my device
            </Link>
          </div>
        </div>

        {/* Trust note */}
        <div className="flex items-start gap-3 justify-center text-center max-w-lg mx-auto">
          <Shield className="h-4 w-4 text-slate-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-slate-500 leading-relaxed">
            CompatIQ provides advisory results based on available data. It does not guarantee compatibility or availability.
          </p>
        </div>

      </div>
    </div>
  );
}
