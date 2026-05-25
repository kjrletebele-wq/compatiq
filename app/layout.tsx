import type { Metadata } from 'next';
import './globals.css';
import { TopNav } from '@/components/layout/TopNav';
import { Footer } from '@/components/layout/Footer';
import { BetaBanner } from '@/components/layout/BetaBanner';

export const metadata: Metadata = {
  title: 'CompatIQ — Know before you buy or replace',
  description: 'Check device specs, purpose fit, upgradeability, reviews, and compatible parts using connected data sources.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-[#050a14] text-slate-100 min-h-screen flex flex-col antialiased">
        <BetaBanner />
        <TopNav />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
