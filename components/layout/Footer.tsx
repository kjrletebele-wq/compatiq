import Link from 'next/link';
import { Zap } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t border-white/5 bg-[#050a14] mt-auto">
      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-md bg-sky-500 flex items-center justify-center">
              <Zap className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="font-bold text-slate-400 text-sm">CompatIQ</span>
          </Link>
          <nav className="flex flex-wrap gap-x-5 gap-y-1">
            {[
              { href: '/buy-device', label: 'Buy a device' },
              { href: '/have-device', label: 'I have a device' },
              { href: '/how-it-works', label: 'How it works' },
              { href: '/privacy', label: 'Privacy' },
              { href: '/terms', label: 'Terms' },
              { href: '/disclaimer', label: 'Disclaimer' },
            ].map(({ href, label }) => (
              <Link key={href} href={href} className="text-xs text-slate-500 hover:text-slate-300 transition-colors">
                {label}
              </Link>
            ))}
          </nav>
        </div>
        <p className="text-xs text-slate-600 mt-4 leading-relaxed max-w-lg">
          CompatIQ helps you make better buying and ownership decisions using connected data sources. It does not guarantee compatibility, performance, price, or availability. Always verify with the seller or manufacturer before purchase.
        </p>
      </div>
    </footer>
  );
}
