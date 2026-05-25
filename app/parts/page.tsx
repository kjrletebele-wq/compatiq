'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Package, Loader2, Copy, Check } from 'lucide-react';
import { PartsResultsTable } from '@/components/parts/PartsResultsTable';
import { ProviderStatusPanel } from '@/components/providers/ProviderStatusPanel';
import type { PartListing, PartsSearchResult } from '@/lib/types/parts';
import type { ComponentType } from '@/lib/types/upgradeability';
import { COMPONENT_LABELS } from '@/lib/types/upgradeability';
import type { ProviderStatus } from '@/lib/types/providers';
import { formatDeviceLabel } from '@/lib/logic/partsSearchQueryBuilder';

interface PartsDeviceContext {
  deviceName: string | null;
  brand: string | null;
  model: string | null;
  category: string | null;
  componentType: string | null;
  componentLabel: string | null;
}

function buildSearchPhrase(componentLabel: string, deviceName: string | null, brand: string | null, model: string | null): string {
  const devicePart = formatDeviceLabel(brand, model, deviceName);
  return `${devicePart} ${componentLabel}`.replace(/\s{2,}/g, ' ').trim();
}

function readPartsDeviceContext(): PartsDeviceContext | null {
  try {
    const raw = sessionStorage.getItem('compatiq_parts_device');
    return raw ? (JSON.parse(raw) as PartsDeviceContext) : null;
  } catch {
    return null;
  }
}

function PartsContent() {
  const params = useSearchParams();
  const componentType = params.get('componentType') as ComponentType | null;
  const category = params.get('category');
  const brand = params.get('brand');
  const model = params.get('model');
  const deviceName = params.get('deviceName');
  const country = params.get('country');
  const city = params.get('city');

  const [items, setItems] = useState<PartListing[]>([]);
  const [statuses, setStatuses] = useState<ProviderStatus[]>([]);
  const [notConnected, setNotConnected] = useState(() => !componentType || !category);
  const [loading, setLoading] = useState(() => !!(componentType && category));
  const [copied, setCopied] = useState(false);
  const [sessionContext] = useState<PartsDeviceContext | null>(readPartsDeviceContext);

  useEffect(() => {
    if (!componentType || !category) return;

    const device = {
      category: category as 'PC' | 'Laptop' | 'Smartphone',
      brand: brand ?? null,
      model: model ?? null,
      deviceName: deviceName ?? model ?? null,
      confidence: 'low' as const,
    };

    fetch('/api/parts/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ device, componentType, country: country ?? null, city: city ?? null }),
    })
      .then(r => r.json())
      .then((r: PartsSearchResult) => {
        setStatuses(r.providerStatuses ?? []);
        if (r.success && r.items?.length > 0) {
          setItems(r.items);
        } else {
          setNotConnected(true);
        }
      })
      .catch(() => setNotConnected(true))
      .finally(() => setLoading(false));
  }, [componentType, category, brand, model, deviceName, country, city]);

  const componentLabel = componentType
    ? (COMPONENT_LABELS[componentType] ?? componentType)
    : (sessionContext?.componentLabel ?? 'Parts');

  // Resolve device display name from URL params or sessionStorage
  const resolvedDeviceName = deviceName ?? sessionContext?.deviceName ?? model ?? null;
  const resolvedBrand = brand ?? sessionContext?.brand ?? null;
  const resolvedModel = model ?? sessionContext?.model ?? null;

  const searchPhrase = componentLabel
    ? buildSearchPhrase(componentLabel, resolvedDeviceName, resolvedBrand, resolvedModel)
    : '';

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(searchPhrase);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback: select text
    }
  }

  return (
    <div className="min-h-screen bg-[#050a14] py-10 px-6">
      <div className="max-w-3xl mx-auto">

        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-200 transition-colors mb-6"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </Link>

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <Package className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">
              {componentLabel}
              {resolvedBrand ? ` for ${resolvedBrand}` : ''}
              {resolvedModel && resolvedModel !== resolvedBrand ? ` ${resolvedModel}` : ''}
            </h1>
            <p className="text-sm text-slate-400">
              {loading
                ? 'Searching…'
                : notConnected
                ? 'No live source connected'
                : `${items.length} result${items.length !== 1 ? 's' : ''}`}
            </p>
          </div>
        </div>

        {/* Results */}
        <div className="space-y-4">
          {loading ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center">
              <Loader2 className="h-7 w-7 animate-spin text-slate-300 mx-auto mb-3" />
              <p className="text-sm text-slate-500">Searching for compatible parts…</p>
            </div>
          ) : (
            <PartsResultsTable
              items={items}
              notConnected={notConnected}
              searchPhrase={searchPhrase}
              onCopySearchPhrase={handleCopy}
              copied={copied}
            />
          )}

          {!loading && notConnected && (
            <div className="space-y-3">
              {/* Setup prompt — shown when all providers are not-configured */}
              {statuses.length === 0 || statuses.every(s => s.status === 'not-configured') ? (
                <div className="bg-amber-950 border border-amber-700 rounded-2xl px-6 py-5">
                  <p className="text-sm font-semibold text-amber-300 mb-1">No live parts source is connected</p>
                  <p className="text-sm text-amber-200/70 mb-4">
                    Open the setup page, paste your SerpApi key, save it, restart the app, then try Find Parts again.
                  </p>
                  <Link
                    href="/setup-live-data"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-sm font-semibold transition-colors"
                  >
                    Open setup page →
                  </Link>
                </div>
              ) : null}

              {/* Manual search fallback */}
              {searchPhrase && (
                <div className="bg-white rounded-2xl border border-slate-200 px-6 py-5">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                    Manual search guidance
                  </p>
                  <p className="text-sm text-slate-600 mb-3">
                    Use this search phrase in Google, Takealot, Amazon, or eBay to find compatible {componentLabel.toLowerCase()} manually:
                  </p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 text-sm font-mono bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800">
                      {searchPhrase}
                    </code>
                    <button
                      type="button"
                      onClick={handleCopy}
                      className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 transition-colors flex-shrink-0"
                    >
                      {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                      {copied ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {statuses.length > 0 && (
            <ProviderStatusPanel statuses={statuses} />
          )}
        </div>

        <p className="text-xs text-slate-600 mt-6 text-center leading-relaxed">
          Compatibility is advisory only. Verify with the seller before purchasing. CompatIQ does not guarantee compatibility.
        </p>
      </div>
    </div>
  );
}

export default function PartsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#050a14] flex items-center justify-center">
        <div className="text-slate-400 text-sm flex items-center gap-2">
          <Loader2 className="animate-spin h-5 w-5" />
          Loading parts…
        </div>
      </div>
    }>
      <PartsContent />
    </Suspense>
  );
}
