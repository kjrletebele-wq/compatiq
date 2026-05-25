'use client';

import { useState } from 'react';
import type { StoreListing } from '@/lib/types/product';
import { EmptyLiveSourceState } from '@/components/ui/EmptyLiveSourceState';
import { cn } from '@/lib/utils';
import { ChevronDown, ChevronUp, AlertTriangle } from 'lucide-react';

interface StoreComparisonTableProps {
  items: StoreListing[];
  notConnected?: boolean;
}

const matchConfig = {
  exact:   { label: 'Exact match',           cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  likely:  { label: 'Likely same device',    cls: 'bg-sky-50 text-sky-700 border-sky-200' },
  similar: { label: 'Similar alternative',   cls: 'bg-amber-50 text-amber-700 border-amber-200' },
  unknown: { label: 'Unverified',            cls: 'bg-slate-100 text-slate-600 border-slate-200' },
};

type SortKey = 'price-asc' | 'price-desc';

export function StoreComparisonTable({ items, notConnected }: StoreComparisonTableProps) {
  const [sort, setSort] = useState<SortKey>('price-asc');
  const [filterCountry, setFilterCountry] = useState('');
  const [showSimilar, setShowSimilar] = useState(false);

  if (notConnected || !items.length) {
    return (
      <EmptyLiveSourceState
        message="No live store source is connected yet."
        subtitle="Connect store or search providers to compare prices across stores by country and city."
      />
    );
  }

  const countries = [...new Set(items.map(i => i.country).filter(Boolean))];

  const sortFn = (a: StoreListing, b: StoreListing) => {
    if (sort === 'price-asc') return (a.price ?? Infinity) - (b.price ?? Infinity);
    return (b.price ?? -Infinity) - (a.price ?? -Infinity);
  };

  const base = filterCountry ? items.filter(i => i.country === filterCountry) : [...items];

  const exactOrLikely = base.filter(i => i.matchConfidence === 'exact' || i.matchConfidence === 'likely').sort(sortFn);
  const similar = base.filter(i => i.matchConfidence === 'similar').sort(sortFn);
  // unknown items are hidden entirely

  const renderItem = (item: StoreListing) => {
    const mc = matchConfig[item.matchConfidence] ?? matchConfig.unknown;
    return (
      <div key={item.id} className="bg-white rounded-xl border border-slate-200 p-4 flex flex-col sm:flex-row sm:items-start gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-2 mb-1 flex-wrap">
            <p className="text-sm font-semibold text-slate-800 leading-snug">{item.productName}</p>
            <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full border flex-shrink-0 whitespace-nowrap', mc.cls)}>
              {mc.label}
            </span>
          </div>
          <p className="text-xs text-slate-500">
            {item.storeName}{item.country ? ` · ${item.country}` : ''}{item.city ? `, ${item.city}` : ''}
            {item.matchScore !== undefined && (
              <span className="ml-2 text-slate-300">score: {item.matchScore}</span>
            )}
          </p>
          {item.availability && <p className="text-xs text-slate-400 mt-0.5">{item.availability}</p>}

          {/* Match reasons */}
          {item.matchReasons && item.matchReasons.length > 0 && (
            <p className="text-xs text-emerald-600 mt-1">
              Matches: {item.matchReasons.join(' · ')}
            </p>
          )}

          {/* Conflict warnings */}
          {item.matchConflicts && item.matchConflicts.length > 0 && (
            <div className="mt-1 space-y-0.5">
              {item.matchConflicts.map((c, i) => (
                <div key={i} className="flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3 text-amber-500 flex-shrink-0" />
                  <p className="text-xs text-amber-700">{c}</p>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="flex items-center gap-4 flex-shrink-0">
          {item.price != null && (
            <p className="text-lg font-bold text-slate-900">
              {item.currency ? `${item.currency} ` : ''}{item.price.toLocaleString()}
            </p>
          )}
          <a
            href={item.productUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-sm font-semibold text-sky-600 hover:text-sky-700 underline underline-offset-2 flex-shrink-0"
          >
            Go to store
          </a>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as SortKey)}
          className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 bg-white text-slate-700 focus:outline-none focus:border-sky-400"
        >
          <option value="price-asc">Price: low to high</option>
          <option value="price-desc">Price: high to low</option>
        </select>
        {countries.length > 0 && (
          <select
            value={filterCountry}
            onChange={(e) => setFilterCountry(e.target.value)}
            className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 bg-white text-slate-700 focus:outline-none focus:border-sky-400"
          >
            <option value="">All countries</option>
            {countries.map(c => <option key={c!} value={c!}>{c}</option>)}
          </select>
        )}
      </div>

      {/* Exact / likely match section */}
      {exactOrLikely.length > 0 ? (
        <div className="space-y-3">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Same device</p>
          <div className="grid gap-3">{exactOrLikely.map(renderItem)}</div>
        </div>
      ) : (
        <div className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800">
          No exact same-device listings found from connected providers. Verify specs carefully before purchasing any alternative.
        </div>
      )}

      {/* Similar alternatives — collapsed by default */}
      {similar.length > 0 && (
        <div className="space-y-2">
          <button
            onClick={() => setShowSimilar(v => !v)}
            className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wide hover:text-slate-700 transition-colors"
          >
            {showSimilar ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            Similar alternatives ({similar.length}) — specs differ, verify before buying
          </button>
          {showSimilar && (
            <div className="rounded-xl bg-amber-50/50 border border-amber-100 p-3 space-y-3">
              <p className="text-xs text-amber-700">
                These listings match the brand and general category but have conflicting CPU, RAM, or storage. They are not the same device as the one you checked.
              </p>
              <div className="grid gap-3">{similar.map(renderItem)}</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
