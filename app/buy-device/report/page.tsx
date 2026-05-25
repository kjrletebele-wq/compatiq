'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Search, AlertTriangle } from 'lucide-react';
import { DeviceOverviewCard } from '@/components/reports/DeviceOverviewCard';
import { TechnicalSpecsTable } from '@/components/reports/TechnicalSpecsTable';
import { PurposeFitReport } from '@/components/reports/PurposeFitReport';
import { UpgradeabilityGrid } from '@/components/reports/UpgradeabilityGrid';
import { ReviewSignalsBlock } from '@/components/reports/ReviewSignalsBlock';
import { StoreComparisonTable } from '@/components/store/StoreComparisonTable';
import { EmptyLiveSourceState } from '@/components/ui/EmptyLiveSourceState';
import type { DeviceIdentity, DeviceSpecs, Purpose } from '@/lib/types/device';
import type { StoreListing } from '@/lib/types/product';
import type { PurposeFitResult } from '@/lib/types/advisory';
import type { UpgradeabilityRecord } from '@/lib/types/upgradeability';

interface ReportData {
  device: DeviceIdentity;
  specs: DeviceSpecs | null;
  storeListing: StoreListing | null;
  purpose: Purpose;
  advisory: {
    purposeFit: PurposeFitResult;
    upgradeability: UpgradeabilityRecord[];
    missingInformation: string[];
    conflictWarnings?: string[];
    confidence: string;
    generatedAt: string;
  };
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 px-6 py-5 shadow-sm">
      <h2 className="text-base font-bold text-slate-800 mb-4">{title}</h2>
      {children}
    </div>
  );
}

function readReportFromStorage(): ReportData | null {
  try {
    const raw = sessionStorage.getItem('compatiq_report');
    return raw ? (JSON.parse(raw) as ReportData) : null;
  } catch {
    return null;
  }
}

export default function BuyDeviceReportPage() {
  // Lazy initializer — reads sessionStorage on first render only (client only, guarded by typeof window)
  const [data] = useState<ReportData | null>(readReportFromStorage);
  const [storeItems, setStoreItems] = useState<StoreListing[]>([]);
  const [storeNotConnected, setStoreNotConnected] = useState(false);
  const [reviewSignals, setReviewSignals] = useState<import('@/lib/types/reviews').ReviewSignal[]>([]);
  const [reviewNotConnected, setReviewNotConnected] = useState(false);

  useEffect(() => {
    if (!data?.device) return;
    // Fetch stores — send specs so the provider can build a specific query and score results
    fetch('/api/store/search-device', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ device: data.device, specs: data.specs, country: null, city: null }),
    })
      .then(r => r.json())
      .then(r => {
        if (r.success && r.items?.length > 0) setStoreItems(r.items);
        else setStoreNotConnected(true);
      })
      .catch(() => setStoreNotConnected(true));

    // Reviews — include specs so the provider can build exact-model queries
    fetch('/api/reviews/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ device: data.device, specs: data.specs }),
    })
      .then(r => r.json())
      .then(r => {
        if (r.success && r.signals?.length > 0) {
          setReviewSignals(r.signals);
        } else {
          setReviewNotConnected(true);
        }
      })
      .catch(() => setReviewNotConnected(true));
  }, [data?.device]);

  if (!data) {
    return (
      <div className="min-h-screen bg-[#050a14] flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl p-8 max-w-md text-center shadow-xl">
          <AlertTriangle className="h-10 w-10 text-amber-500 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-slate-800 mb-2">No report found</h1>
          <p className="text-sm text-slate-500 mb-6">Start a new device check to generate a report.</p>
          <Link
            href="/buy-device"
            className="inline-flex items-center gap-2 bg-sky-500 hover:bg-sky-400 text-white font-semibold px-5 py-2.5 rounded-xl transition-colors text-sm"
          >
            <Search className="h-4 w-4" /> Check a device
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050a14] py-10 px-6">
      <div className="max-w-3xl mx-auto space-y-5">

        <Link
          href="/buy-device"
          className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-200 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </Link>

        {/* 1. Device Overview */}
        <DeviceOverviewCard
          device={data.device}
          specs={data.specs}
          storeListing={data.storeListing}
        />

        {/* 2. Full Technical Specifications */}
        <Section title="Full technical specifications">
          <TechnicalSpecsTable category={data.device.category} specs={data.specs} />
        </Section>

        {/* 3. Purpose Fit Advisory */}
        <Section title={`Purpose fit advisory`}>
          <PurposeFitReport result={data.advisory.purposeFit} />
        </Section>

        {/* 4. Upgradeability and Repairability */}
        <Section title="Upgradeability and repairability">
          {data.advisory.upgradeability?.length > 0 ? (
            <UpgradeabilityGrid records={data.advisory.upgradeability} device={data.device} />
          ) : (
            <EmptyLiveSourceState message="Upgradeability data not available for this device." />
          )}
        </Section>

        {/* 5. Worldwide Review Signals */}
        <Section title="Worldwide review signals">
          <ReviewSignalsBlock signals={reviewSignals} notConnected={reviewNotConnected} />
        </Section>

        {/* 6. Other Stores */}
        <Section title="Other stores selling this device">
          <StoreComparisonTable items={storeItems} notConnected={storeNotConnected} />
        </Section>

        {/* 7. Missing Information and Conflict Warnings */}
        {(data.advisory.missingInformation?.length > 0 || (data.advisory.conflictWarnings?.length ?? 0) > 0) && (
          <Section title="Missing information and confidence">
            <div className="space-y-4">
              {data.advisory.conflictWarnings && data.advisory.conflictWarnings.length > 0 && (
                <div className="space-y-2">
                  {data.advisory.conflictWarnings.map((w: string, i: number) => (
                    <div key={i} className="rounded-xl bg-orange-50 border border-orange-200 px-4 py-3 flex items-start gap-2">
                      <AlertTriangle className="h-4 w-4 text-orange-500 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-orange-800 leading-relaxed">{w}</p>
                    </div>
                  ))}
                </div>
              )}
              {data.advisory.missingInformation?.length > 0 && (
                <div className="space-y-3">
                  <p className="text-sm text-slate-600 leading-relaxed">
                    The following specifications were not available. This reduces advisory confidence. Confirm these with the seller or manufacturer before purchasing.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {data.advisory.missingInformation.map((m: string) => (
                      <span key={m} className="text-xs px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200 font-medium">
                        {m}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Section>
        )}

        {/* 8. Disclaimer */}
        <p className="text-xs text-slate-600 text-center pb-4 leading-relaxed">
          CompatIQ provides advisory results based on available data. It does not guarantee performance, compatibility, price, stock, warranty, or repairability. Always verify critical details with the seller or manufacturer before purchase.
        </p>

      </div>
    </div>
  );
}
