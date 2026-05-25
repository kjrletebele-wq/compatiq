'use client';

import { useState } from 'react';
import { Search, AlertTriangle, Loader2, ShieldCheck, ExternalLink } from 'lucide-react';
import type { DeviceCategory } from '@/lib/types/device';
import type { SerialLookupResult } from '@/lib/providers/serial/SerialLookupProvider';
import { getBrandSupport, ALL_BRAND_SUPPORT } from '@/lib/data/brandSupportUrls';
import { cn } from '@/lib/utils';

interface SerialLookupFormProps {
  onSuccess: (result: SerialLookupResult) => void;
  onManualFallback: () => void;
}

const CATEGORIES: { value: DeviceCategory; label: string }[] = [
  { value: 'Laptop', label: 'Laptop' },
  { value: 'PC', label: 'PC / Desktop' },
  { value: 'Smartphone', label: 'Smartphone' },
];

export function SerialLookupForm({ onSuccess, onManualFallback }: SerialLookupFormProps) {
  const [serial, setSerial] = useState('');
  const [category, setCategory] = useState<DeviceCategory>('Laptop');
  const [brand, setBrand] = useState('');
  const [country, setCountry] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SerialLookupResult | null>(null);

  // Computed once per render — used in the error state brand fallback
  const matchedBrandSupport = getBrandSupport(brand);

  async function handleLookup() {
    if (!serial.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      // SECURITY: sent via POST body only — never in URL
      const res = await fetch('/api/device/serial-lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serialNumber: serial.trim(),
          category,
          brand: brand.trim() || null,
          country: country.trim() || null,
        }),
      });
      const data: SerialLookupResult = await res.json();

      if (data.success) {
        setResult(data);
        onSuccess(data);
      } else {
        setResult(data);
        const isNotConnected = data.sourceType === 'not-connected';
        setError(
          isNotConnected
            ? 'Live serial lookup is not connected yet. Enter device details manually.'
            : 'We could not confidently identify this device from the serial number. Enter the model or product number manually.'
        );
      }
    } catch {
      setError('A network error occurred. Try again or enter details manually.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-5">
      {/* Privacy note */}
      <div className="flex items-start gap-3 rounded-xl bg-sky-50 border border-sky-200 px-4 py-3">
        <ShieldCheck className="h-5 w-5 text-sky-500 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-sky-700 leading-relaxed">
          Your serial number is used only for device lookup. It is masked after submission and is never exposed in URLs or logs.
        </p>
      </div>

      {/* Serial input */}
      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-2">Serial number</label>
        <input
          type="text"
          value={serial}
          onChange={(e) => { setSerial(e.target.value); setError(null); setResult(null); }}
          onKeyDown={(e) => e.key === 'Enter' && handleLookup()}
          placeholder="Enter your device serial number"
          className="w-full px-4 py-3 text-sm border-2 border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 bg-white text-slate-800 placeholder:text-slate-400 transition-colors font-mono"
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
        />
      </div>

      {/* Category */}
      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-2">Device type</label>
        <div className="grid grid-cols-3 gap-2">
          {CATEGORIES.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => setCategory(value)}
              className={cn(
                'py-2.5 rounded-xl border-2 text-sm font-medium transition-colors',
                category === value
                  ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                  : 'border-slate-200 bg-white text-slate-600 hover:border-emerald-300'
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Optional fields */}
      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1.5">Brand (optional)</label>
          <input
            type="text"
            value={brand}
            onChange={(e) => setBrand(e.target.value)}
            placeholder="e.g. Dell, HP, Apple"
            className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-400 bg-white text-slate-700 placeholder:text-slate-400"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1.5">Country (optional)</label>
          <input
            type="text"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            placeholder="e.g. South Africa"
            className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-400 bg-white text-slate-700 placeholder:text-slate-400"
          />
        </div>
      </div>

      <button
        type="button"
        onClick={handleLookup}
        disabled={!serial.trim() || loading}
        className={cn(
          'inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold transition-colors',
          'bg-emerald-500 hover:bg-emerald-400 text-white shadow-lg shadow-emerald-500/20',
          'disabled:opacity-50 disabled:cursor-not-allowed'
        )}
      >
        {loading ? (
          <><Loader2 className="h-4 w-4 animate-spin" /> Looking up…</>
        ) : (
          <><Search className="h-4 w-4" /> Find my device</>
        )}
      </button>

      {/* Error state */}
      {error && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-4 space-y-4">

          {/* Error message + manual fallback */}
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-amber-800 font-medium mb-2">{error}</p>
              <button
                type="button"
                onClick={onManualFallback}
                className="text-sm font-semibold text-emerald-600 hover:text-emerald-700 underline underline-offset-2"
              >
                Enter device details manually →
              </button>
            </div>
          </div>

          {/* Brand support fallback */}
          <div className="border-t border-amber-200 pt-4">
            <p className="text-xs font-semibold text-amber-900 mb-1">
              Not sure of your model number?
            </p>
            <p className="text-xs text-amber-700 mb-3 leading-relaxed">
              Select your brand below to go to their official support page — you can enter your serial number there to find your exact model.
            </p>

            {/* Brand chips */}
            <div className="flex flex-wrap gap-1.5">
              {ALL_BRAND_SUPPORT.map((b) => {
                const isHighlighted = !!brand.trim() && matchedBrandSupport?.name === b.name;
                return (
                  <a
                    key={b.name}
                    href={b.supportUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={`Look up your model using your ${b.lookupType}`}
                    className={cn(
                      'inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg border font-medium transition-colors',
                      isHighlighted
                        ? 'bg-emerald-500 text-white border-emerald-500 shadow-sm'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-emerald-400 hover:text-emerald-700'
                    )}
                  >
                    {b.name}
                    {isHighlighted && <ExternalLink className="h-2.5 w-2.5" />}
                  </a>
                );
              })}
            </div>

            {/* Contextual hint for matched brand */}
            {brand.trim() && matchedBrandSupport && (
              <p className="text-xs text-amber-700 mt-2.5 leading-relaxed">
                On the {matchedBrandSupport.name} page, enter your {matchedBrandSupport.lookupType} to find your model. Then come back and enter it manually above.
              </p>
            )}
          </div>

        </div>
      )}
    </div>
  );
}
