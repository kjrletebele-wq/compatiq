import type { PurposeFitResult, SuitabilityRating } from '@/lib/types/advisory';
import { PURPOSE_LABELS } from '@/lib/types/device';
import { cn } from '@/lib/utils';

interface PurposeFitReportProps {
  result: PurposeFitResult;
}

const ratingConfig: Record<SuitabilityRating, { label: string; bar: string; badge: string; width: string }> = {
  StrongFit:            { label: 'Strong fit',             bar: 'bg-emerald-500', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200', width: 'w-full' },
  GoodFit:              { label: 'Good fit',               bar: 'bg-sky-500',     badge: 'bg-sky-50 text-sky-700 border-sky-200',             width: 'w-4/5' },
  UsableWithLimits:     { label: 'Usable with limits',     bar: 'bg-amber-500',   badge: 'bg-amber-50 text-amber-700 border-amber-200',       width: 'w-3/5' },
  NotIdeal:             { label: 'Not ideal',              bar: 'bg-orange-500',  badge: 'bg-orange-50 text-orange-700 border-orange-200',    width: 'w-2/5' },
  NotEnoughInformation: { label: 'Not enough information', bar: 'bg-slate-300',   badge: 'bg-slate-100 text-slate-600 border-slate-200',      width: 'w-1/4' },
};

export function PurposeFitReport({ result }: PurposeFitReportProps) {
  const cfg = ratingConfig[result.rating];

  return (
    <div className="space-y-5">
      {/* Suitability banner */}
      <div className="rounded-xl border border-slate-200 bg-slate-50 px-5 py-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold text-slate-700">
            {PURPOSE_LABELS[result.purpose]}
          </span>
          <span className={cn('text-xs font-semibold px-2.5 py-1 rounded-full border', cfg.badge)}>
            {cfg.label}
          </span>
        </div>
        {/* Progress bar */}
        <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden mb-3">
          <div className={cn('h-full rounded-full transition-all', cfg.bar, cfg.width)} />
        </div>
        <p className="text-sm text-slate-700 leading-relaxed">{result.explanation}</p>
      </div>

      {/* Works well / struggles */}
      {(result.shouldWorkWellWith.length > 0 || result.mayStruggleWith.length > 0) && (
        <div className="grid sm:grid-cols-2 gap-4">
          {result.shouldWorkWellWith.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wider mb-2">
                Should work well with
              </p>
              <div className="flex flex-wrap gap-1.5">
                {result.shouldWorkWellWith.map((app) => (
                  <span key={app} className="text-xs px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium">
                    {app}
                  </span>
                ))}
              </div>
            </div>
          )}
          {result.mayStruggleWith.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-red-600 uppercase tracking-wider mb-2">
                May struggle with
              </p>
              <div className="flex flex-wrap gap-1.5">
                {result.mayStruggleWith.map((app) => (
                  <span key={app} className="text-xs px-2.5 py-1 rounded-full bg-red-50 text-red-700 border border-red-200 font-medium">
                    {app}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Bottlenecks */}
      {result.bottlenecks.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-amber-700 uppercase tracking-wider mb-2">
            Likely bottlenecks
          </p>
          <ul className="space-y-1.5">
            {result.bottlenecks.map((b, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-amber-800">
                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0" />
                {b}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Minimum recommended specs */}
      {result.minimumRecommendedSpecs.length > 0 && (
        <div className="rounded-xl bg-slate-50 border border-slate-200 px-4 py-3">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
            Minimum recommended for this purpose
          </p>
          <ul className="space-y-1">
            {result.minimumRecommendedSpecs.map((spec, i) => (
              <li key={i} className="text-sm text-slate-600 flex items-center gap-2">
                <span className="w-1 h-1 rounded-full bg-slate-400 flex-shrink-0" />
                {spec}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Missing info */}
      {result.missingInformation.length > 0 && (
        <div className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-3">
          <p className="text-xs font-semibold text-amber-700 uppercase tracking-wider mb-1.5">
            Confidence reduced — missing specs
          </p>
          <div className="flex flex-wrap gap-1.5">
            {result.missingInformation.map((m) => (
              <span key={m} className="text-xs px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-medium">
                {m}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Confidence */}
      <p className="text-xs text-slate-400">
        Advisory confidence: <span className="font-semibold text-slate-600">{result.confidence}</span>
      </p>
    </div>
  );
}
