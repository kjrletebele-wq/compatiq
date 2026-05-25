'use client';

import { useState } from 'react';
import type { PartListing } from '@/lib/types/parts';
import { COMPONENT_LABELS } from '@/lib/types/upgradeability';
import { EmptyLiveSourceState } from '@/components/ui/EmptyLiveSourceState';
import { cn } from '@/lib/utils';

interface PartsResultsTableProps {
  items: PartListing[];
  notConnected?: boolean;
  searchPhrase?: string;
  onCopySearchPhrase?: () => void;
  copied?: boolean;
}

const confidenceConfig = {
  high:    { label: 'High confidence',   cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  medium:  { label: 'Medium confidence', cls: 'bg-sky-50 text-sky-700 border-sky-200' },
  low:     { label: 'Low confidence',    cls: 'bg-amber-50 text-amber-700 border-amber-200' },
  unknown: { label: 'Unverified',        cls: 'bg-slate-100 text-slate-600 border-slate-200' },
};

const conditionCls: Record<string, string> = {
  New:        'text-emerald-600',
  Used:       'text-amber-600',
  Refurbished:'text-sky-600',
  Unknown:    'text-slate-400',
};

export function PartsResultsTable({ items, notConnected }: PartsResultsTableProps) {
  const [sort, setSort] = useState<'price-asc' | 'price-desc' | 'compat'>('compat');
  const [filterCondition, setFilterCondition] = useState('');

  if (notConnected || !items.length) {
    return (
      <EmptyLiveSourceState
        message="No live parts source is connected yet."
        subtitle="Connect a parts provider to search live stores for compatible components."
      />
    );
  }

  let filtered = filterCondition ? items.filter(i => i.condition === filterCondition) : [...items];
  filtered = filtered.sort((a, b) => {
    if (sort === 'price-asc') return (a.price ?? Infinity) - (b.price ?? Infinity);
    if (sort === 'price-desc') return (b.price ?? -Infinity) - (a.price ?? -Infinity);
    // compat: high > medium > low > unknown
    const order = { high: 0, medium: 1, low: 2, unknown: 3 };
    return (order[a.compatibilityConfidence] ?? 3) - (order[b.compatibilityConfidence] ?? 3);
  });

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-3">
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as typeof sort)}
          className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 bg-white text-slate-700 focus:outline-none focus:border-sky-400"
        >
          <option value="compat">Best compatibility</option>
          <option value="price-asc">Price: low to high</option>
          <option value="price-desc">Price: high to low</option>
        </select>
        <select
          value={filterCondition}
          onChange={(e) => setFilterCondition(e.target.value)}
          className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 bg-white text-slate-700 focus:outline-none focus:border-sky-400"
        >
          <option value="">Any condition</option>
          <option value="New">New</option>
          <option value="Used">Used</option>
          <option value="Refurbished">Refurbished</option>
        </select>
      </div>

      <div className="grid gap-3">
        {filtered.map((item) => {
          const cc = confidenceConfig[item.compatibilityConfidence] ?? confidenceConfig.unknown;
          return (
            <div key={item.id} className="bg-white rounded-xl border border-slate-200 p-4">
              {/* Header */}
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800">{item.productName}</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {COMPONENT_LABELS[item.componentType] ?? item.componentType}
                    {' · '}{item.storeName}
                    {item.country ? ` · ${item.country}` : ''}
                    {item.city ? `, ${item.city}` : ''}
                  </p>
                </div>
                <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full border flex-shrink-0', cc.cls)}>
                  {cc.label}
                </span>
              </div>

              {/* Compatibility reason */}
              <p className="text-sm text-slate-600 mb-3">{item.compatibilityReason}</p>

              {/* Seller question */}
              {item.sellerQuestion && (
                <div className="rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 mb-3">
                  <p className="text-xs text-amber-800">
                    <span className="font-semibold">Ask the seller: </span>{item.sellerQuestion}
                  </p>
                </div>
              )}

              {/* Footer */}
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-3">
                  {item.price != null && (
                    <span className="text-base font-bold text-slate-900">
                      {item.currency ? `${item.currency} ` : ''}{item.price.toLocaleString()}
                    </span>
                  )}
                  <span className={cn('text-xs font-medium', conditionCls[item.condition] ?? 'text-slate-500')}>
                    {item.condition}
                  </span>
                  {item.availability && (
                    <span className="text-xs text-slate-400">{item.availability}</span>
                  )}
                </div>
                <a
                  href={item.productUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-semibold text-sky-600 hover:text-sky-700 underline underline-offset-2"
                >
                  Go to store
                </a>
              </div>

              <p className="text-xs text-slate-400 mt-2">
                {new Date(item.lastCheckedAt).toLocaleString()}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
