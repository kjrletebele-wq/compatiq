'use client';

import { useState } from 'react';
import { ArrowRight, Link2, AlertTriangle, Loader2, CheckCircle2, ClipboardPaste } from 'lucide-react';
import type { ProductLinkResult } from '@/lib/types/product';
import type { DeviceSpecs } from '@/lib/types/device';
import { ProviderStatusPanel } from '@/components/providers/ProviderStatusPanel';
import { normaliseSpecsFromText, mergeSpecs } from '@/lib/normalisers/normaliseSpecs';
import { cn } from '@/lib/utils';

interface BuyDeviceLinkFormProps {
  onSuccess: (result: ProductLinkResult) => void;
  onManualFallback: () => void;
}

function isSpecSparse(result: ProductLinkResult): boolean {
  // Sparse = success but no CPU and no RAM — slug-only results, blocked retailers
  return result.success === true && !result.specs?.cpu && !result.specs?.ramGb;
}

export function BuyDeviceLinkForm({ onSuccess, onManualFallback }: BuyDeviceLinkFormProps) {
  const [url, setUrl] = useState('');
  const [country, setCountry] = useState('');
  const [city, setCity] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ProductLinkResult | null>(null);
  // Spec augmentation state — shown when result is sparse
  const [partialResult, setPartialResult] = useState<ProductLinkResult | null>(null);
  const [extraSpecText, setExtraSpecText] = useState('');

  async function handleAnalyse() {
    if (!url.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    setPartialResult(null);
    setExtraSpecText('');

    try {
      const res = await fetch('/api/product/analyse-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim(), country: country || null, city: city || null }),
      });
      const data: ProductLinkResult = await res.json();

      if (data.success) {
        if (isSpecSparse(data)) {
          // Partial result — ask user to paste spec text before continuing
          setPartialResult(data);
          setResult(data);
        } else {
          setResult(data);
          onSuccess(data);
        }
      } else {
        setResult(data);
        setError(
          data.sourceType === 'not-connected'
            ? 'Live product-link analysis is not connected yet. Enter the device details manually to continue.'
            : 'We could not read this product link. Enter the device details manually.'
        );
      }
    } catch {
      setError('A network error occurred. Please try again or enter details manually.');
    } finally {
      setLoading(false);
    }
  }

  function handleContinueWithSpecs() {
    if (!partialResult) return;
    if (extraSpecText.trim()) {
      // Merge pasted spec text into the existing (sparse) specs
      const fromText = normaliseSpecsFromText(extraSpecText.trim()) as DeviceSpecs;
      const existing = partialResult.specs ?? {} as DeviceSpecs;
      const merged = mergeSpecs(existing, fromText);
      const augmented: ProductLinkResult = {
        ...partialResult,
        specs: merged,
        warnings: [
          ...(partialResult.warnings ?? []),
          'Specifications were supplemented by manually pasted spec text.',
        ],
      };
      onSuccess(augmented);
    } else {
      onSuccess(partialResult);
    }
  }

  // ── Partial / sparse result state ────────────────────────────────────────────
  if (partialResult) {
    const deviceName = partialResult.device?.deviceName ?? partialResult.device?.model ?? 'Device';
    const foundSpecs: string[] = [];
    if (partialResult.specs?.storageGb) foundSpecs.push(`${partialResult.specs.storageGb >= 1024 ? partialResult.specs.storageGb / 1024 + 'TB' : partialResult.specs.storageGb + 'GB'} storage`);
    if (partialResult.specs?.operatingSystem) foundSpecs.push(partialResult.specs.operatingSystem);
    if (partialResult.specs?.display) foundSpecs.push(partialResult.specs.display);

    return (
      <div className="space-y-5">
        {/* What we found */}
        <div className="rounded-xl bg-sky-50 border border-sky-200 px-4 py-4 space-y-2">
          <div className="flex items-start gap-2">
            <CheckCircle2 className="h-5 w-5 text-sky-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-slate-800">{deviceName}</p>
              {foundSpecs.length > 0 && (
                <p className="text-xs text-slate-500 mt-0.5">Found: {foundSpecs.join(' · ')}</p>
              )}
            </div>
          </div>
        </div>

        {/* Spec augmentation prompt */}
        <div className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-4 space-y-3">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-amber-800">CPU and RAM not found</p>
              <p className="text-xs text-amber-700 mt-1 leading-relaxed">
                This retailer blocked direct access. Open the product listing, copy the specifications
                section (CPU, RAM, storage, display), and paste it below for a complete analysis.
              </p>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5 flex items-center gap-1.5">
              <ClipboardPaste className="h-3.5 w-3.5" /> Paste product specs here (optional)
            </label>
            <textarea
              value={extraSpecText}
              onChange={(e) => setExtraSpecText(e.target.value)}
              rows={5}
              placeholder={`Example:\nProcessor: AMD Ryzen 5 7520U\nRAM: 16GB DDR5\nStorage: 512GB NVMe SSD\nDisplay: 15.6" FHD\nOS: Windows 11 Home`}
              className="w-full px-3 py-2.5 text-sm border border-amber-200 rounded-xl focus:outline-none focus:border-sky-400 bg-white text-slate-700 placeholder:text-slate-400 font-mono resize-y"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-2">
          <button
            type="button"
            onClick={handleContinueWithSpecs}
            className={cn(
              'flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold transition-colors',
              'bg-sky-500 hover:bg-sky-400 text-white shadow-lg shadow-sky-500/20'
            )}
          >
            <ArrowRight className="h-4 w-4" />
            {extraSpecText.trim() ? 'Add specs and continue' : 'Continue without specs'}
          </button>
          <button
            type="button"
            onClick={() => { setPartialResult(null); setResult(null); }}
            className="text-sm text-slate-500 hover:text-slate-700 px-4 py-3 rounded-xl border border-slate-200 transition-colors"
          >
            Try a different link
          </button>
        </div>

        {result && <ProviderStatusPanel statuses={result.providerStatuses} />}
      </div>
    );
  }

  // ── Normal form state ─────────────────────────────────────────────────────────
  return (
    <div className="space-y-5">
      {/* URL input */}
      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-2">
          Paste the device link
        </label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
            <input
              type="url"
              value={url}
              onChange={(e) => { setUrl(e.target.value); setError(null); setResult(null); }}
              onKeyDown={(e) => e.key === 'Enter' && handleAnalyse()}
              placeholder="Paste a laptop, PC, or smartphone product link from an online store"
              className="w-full pl-9 pr-4 py-3 text-sm border-2 border-slate-200 rounded-xl focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 bg-white text-slate-800 placeholder:text-slate-400 transition-colors"
            />
          </div>
          <button
            type="button"
            onClick={handleAnalyse}
            disabled={!url.trim() || loading}
            className={cn(
              'inline-flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold transition-colors',
              'bg-sky-500 hover:bg-sky-400 text-white shadow-lg shadow-sky-500/20',
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
          >
            {loading ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Analysing…</>
            ) : (
              <><ArrowRight className="h-4 w-4" /> Analyse device</>
            )}
          </button>
        </div>
      </div>

      {/* Store hint */}
      <div className="space-y-1.5">
        <p className="text-xs text-slate-400 leading-relaxed">
          Copy the link straight from the product page in your browser — not a search or category page.
        </p>
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs text-slate-400 mr-0.5">Works best on:</span>
          {[
            'Takealot', 'Incredible Connection', 'Wootware',
            'Computermania', 'Matrix Warehouse', 'Amazon',
          ].map((s) => (
            <span
              key={s}
              className="text-xs px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium"
            >
              {s}
            </span>
          ))}
        </div>
      </div>

      {/* Optional location */}
      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1.5">Country (optional)</label>
          <input
            type="text"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            placeholder="e.g. South Africa, United Kingdom"
            className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-sky-400 bg-white text-slate-700 placeholder:text-slate-400"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1.5">City / nearest city (optional)</label>
          <input
            type="text"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="Johannesburg, Cape Town, London, New York…"
            className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-sky-400 bg-white text-slate-700 placeholder:text-slate-400"
          />
        </div>
      </div>

      {/* Error / not-connected state */}
      {error && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-amber-800 font-medium mb-2">{error}</p>
              <button
                type="button"
                onClick={onManualFallback}
                className="text-sm font-semibold text-sky-600 hover:text-sky-700 underline underline-offset-2"
              >
                Enter device details manually →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Provider status */}
      {result && (
        <ProviderStatusPanel statuses={result.providerStatuses} />
      )}
    </div>
  );
}
