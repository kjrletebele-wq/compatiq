'use client';

import { useState } from 'react';
import type { ProviderStatus } from '@/lib/types/providers';
import { cn } from '@/lib/utils';

interface ProviderStatusPanelProps {
  statuses: ProviderStatus[];
  className?: string;
}

const statusConfig = {
  connected: { color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-200', dot: 'bg-emerald-500' },
  'not-configured': { color: 'text-slate-500', bg: 'bg-slate-50 border-slate-200', dot: 'bg-slate-300' },
  failed: { color: 'text-red-600', bg: 'bg-red-50 border-red-200', dot: 'bg-red-500' },
  'rate-limited': { color: 'text-amber-600', bg: 'bg-amber-50 border-amber-200', dot: 'bg-amber-500' },
  'no-results': { color: 'text-sky-600', bg: 'bg-sky-50 border-sky-200', dot: 'bg-sky-400' },
};

/** User-facing label for each status — avoids env-var / developer jargon in public UI. */
function statusLabel(status: string, message: string): string {
  switch (status) {
    case 'connected':    return message; // already user-friendly (counts etc.)
    case 'not-configured': return 'This source is not connected';
    case 'failed':       return 'Search temporarily failed';
    case 'rate-limited': return 'Rate limit reached — try again shortly';
    case 'no-results':   return 'No results from this source';
    default:             return message;
  }
}

export function ProviderStatusPanel({ statuses, className }: ProviderStatusPanelProps) {
  const [expanded, setExpanded] = useState(false);

  if (!statuses.length) return null;

  return (
    <div className={cn('text-xs', className)}>
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="text-slate-400 hover:text-slate-600 underline underline-offset-2 transition-colors"
      >
        {expanded ? 'Hide' : 'Show'} data source status ({statuses.length})
      </button>

      {expanded && (
        <div className="mt-2 space-y-1.5">
          {statuses.map((s, i) => {
            const cfg = statusConfig[s.status] ?? statusConfig['not-configured'];
            return (
              <div key={i} className={cn('flex items-start gap-2 rounded-lg border px-3 py-2', cfg.bg)}>
                <span className={cn('mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0', cfg.dot)} />
                <div>
                  <span className={cn('font-medium', cfg.color)}>{s.providerName}</span>
                  <span className="text-slate-500 ml-1">— {statusLabel(s.status, s.message)}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
