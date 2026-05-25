'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Zap, AlertTriangle } from 'lucide-react';
import { TechnicalSpecsTable } from '@/components/reports/TechnicalSpecsTable';
import { UpgradeabilityGrid } from '@/components/reports/UpgradeabilityGrid';
import { ProviderStatusPanel } from '@/components/providers/ProviderStatusPanel';
import type { DeviceIdentity, DeviceSpecs } from '@/lib/types/device';
import type { UpgradeabilityRecord } from '@/lib/types/upgradeability';
import type { WarrantyInfo } from '@/lib/types/warranty';
import type { ProviderStatus } from '@/lib/types/providers';
import { cn } from '@/lib/utils';

interface HaveDeviceData {
  maskedSerial: string | null;
  device: DeviceIdentity;
  specs: DeviceSpecs | null;
  upgradeability: UpgradeabilityRecord[];
  warranty: WarrantyInfo | null;
  missingInformation: string[];
  sourceType: string;
  providerStatuses: ProviderStatus[];
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 px-6 py-5 shadow-sm">
      <h2 className="text-base font-bold text-slate-800 mb-4">{title}</h2>
      {children}
    </div>
  );
}

function readHaveDeviceFromStorage(): HaveDeviceData | null {
  try {
    const raw = sessionStorage.getItem('compatiq_have_device');
    return raw ? (JSON.parse(raw) as HaveDeviceData) : null;
  } catch {
    return null;
  }
}

export default function HaveDeviceResultPage() {
  const [data] = useState<HaveDeviceData | null>(readHaveDeviceFromStorage);

  if (!data) {
    return (
      <div className="min-h-screen bg-[#050a14] flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl p-8 max-w-md text-center shadow-xl">
          <AlertTriangle className="h-10 w-10 text-amber-500 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-slate-800 mb-2">No device found</h1>
          <p className="text-sm text-slate-500 mb-6">Start a new lookup to identify your device.</p>
          <Link
            href="/have-device"
            className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-white font-semibold px-5 py-2.5 rounded-xl transition-colors text-sm"
          >
            <Zap className="h-4 w-4" /> Find my device
          </Link>
        </div>
      </div>
    );
  }

  const confidenceCls = {
    high: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    medium: 'bg-sky-50 text-sky-700 border-sky-200',
    low: 'bg-amber-50 text-amber-700 border-amber-200',
    unknown: 'bg-slate-100 text-slate-600 border-slate-200',
  };

  return (
    <div className="min-h-screen bg-[#050a14] py-10 px-6">
      <div className="max-w-3xl mx-auto space-y-5">

        <Link
          href="/have-device"
          className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-200 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </Link>

        {/* 1. Device Identity */}
        <div className="bg-white rounded-2xl border border-slate-200 px-6 py-5 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                {data.device.category}
              </p>
              <h1 className="text-xl font-bold text-slate-900">
                {data.device.deviceName ?? data.device.model ?? 'Unknown device'}
              </h1>
              {data.device.brand && (
                <p className="text-sm text-slate-500 mt-0.5">{data.device.brand}</p>
              )}
            </div>
            <div className="flex flex-col gap-1.5 items-start sm:items-end">
              <span className={cn('text-xs font-semibold px-2.5 py-1 rounded-full border', confidenceCls[data.device.confidence])}>
                {data.device.confidence === 'high' ? 'Live source'
                  : data.device.confidence === 'medium' ? 'Partial source'
                  : data.device.confidence === 'low' ? 'Manual input'
                  : 'Source not connected'}
              </span>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap gap-x-6 gap-y-2 text-sm">
            {data.maskedSerial && (
              <span>
                <span className="text-xs font-semibold text-slate-400 uppercase mr-1">Serial</span>
                <span className="font-mono text-slate-700">{data.maskedSerial}</span>
              </span>
            )}
            {data.device.productNumber && (
              <span>
                <span className="text-xs font-semibold text-slate-400 uppercase mr-1">Product no.</span>
                <span className="text-slate-700">{data.device.productNumber}</span>
              </span>
            )}
            {data.device.model && (
              <span>
                <span className="text-xs font-semibold text-slate-400 uppercase mr-1">Model</span>
                <span className="text-slate-700">{data.device.model}</span>
              </span>
            )}
          </div>

          {data.providerStatuses.length > 0 && (
            <div className="mt-3">
              <ProviderStatusPanel statuses={data.providerStatuses} />
            </div>
          )}
        </div>

        {/* 2. Technical Specs */}
        <Section title="Technical specifications">
          <TechnicalSpecsTable category={data.device.category} specs={data.specs} />
        </Section>

        {/* 3. Warranty */}
        {data.warranty && (
          <Section title="Warranty / support">
            <div className="space-y-2 text-sm text-slate-700">
              <div className="flex items-center gap-2">
                <span className={cn('text-xs font-semibold px-2.5 py-1 rounded-full border',
                  data.warranty.status === 'active' ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : data.warranty.status === 'expired' ? 'bg-red-50 text-red-700 border-red-200'
                  : 'bg-slate-100 text-slate-600 border-slate-200'
                )}>
                  {data.warranty.status === 'active' ? 'Warranty active'
                    : data.warranty.status === 'expired' ? 'Warranty expired'
                    : 'Warranty status unknown'}
                </span>
              </div>
              {data.warranty.expiryDate && <p>Expires: {data.warranty.expiryDate}</p>}
              {data.warranty.coverageDescription && <p>{data.warranty.coverageDescription}</p>}
            </div>
          </Section>
        )}

        {/* 4. Replaceable / Upgradeable Components */}
        <Section title="Replaceable and upgradeable components">
          <UpgradeabilityGrid records={data.upgradeability} device={data.device} />
        </Section>

        {/* 5. Missing Information */}
        {data.missingInformation.length > 0 && (
          <Section title="Missing information">
            <p className="text-sm text-slate-600 mb-3 leading-relaxed">
              The following specifications are missing. Confirm these with the manufacturer or service provider.
            </p>
            <div className="flex flex-wrap gap-2">
              {data.missingInformation.map((m) => (
                <span key={m} className="text-xs px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200 font-medium">
                  {m}
                </span>
              ))}
            </div>
          </Section>
        )}

        {/* 6. Disclaimer */}
        <p className="text-xs text-slate-600 text-center pb-4 leading-relaxed">
          CompatIQ provides advisory results based on available data. It does not guarantee performance, compatibility, price, stock, warranty, or repairability. Always verify critical details with the seller or manufacturer before purchase.
        </p>

      </div>
    </div>
  );
}
