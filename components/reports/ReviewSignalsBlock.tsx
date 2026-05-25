import type { ReviewSignal } from '@/lib/types/reviews';
import { EmptyLiveSourceState } from '@/components/ui/EmptyLiveSourceState';
import { ExternalLink, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ReviewSignalsBlockProps {
  signals: ReviewSignal[];
  notConnected?: boolean;
}

const sentimentConfig = {
  positive: { cls: 'bg-emerald-50 border-emerald-200 text-emerald-800', label: 'Positive' },
  mixed:    { cls: 'bg-amber-50 border-amber-200 text-amber-800',       label: 'Mixed' },
  negative: { cls: 'bg-red-50 border-red-200 text-red-800',             label: 'Negative' },
  neutral:  { cls: 'bg-slate-50 border-slate-200 text-slate-700',       label: 'Neutral' },
};

export function ReviewSignalsBlock({ signals, notConnected }: ReviewSignalsBlockProps) {
  if (notConnected || !signals.length) {
    return (
      <EmptyLiveSourceState
        message="No reviews yet."
        subtitle="Once everything's set up, you'll see what real owners say — how the battery holds up, how fast it feels day to day, whether it's built to last, and more."
      />
    );
  }

  return (
    <div className="space-y-5">
      {signals.map((signal, i) => {
        const sentiment = sentimentConfig[signal.overallSentiment] ?? sentimentConfig.neutral;
        const confidenceLabel = signal.confidence === 'high' ? 'Lots of data'
          : signal.confidence === 'medium' ? 'Some data'
          : signal.confidence === 'demo' ? 'Sample data'
          : 'Limited data';

        const isNotExact = signal.noExactSignals === true;
        const isMixedCoverage = signal.matchCoverage === 'mixed';

        return (
          <div key={i} className="space-y-4">

            {/* No-exact-signals banner */}
            {isNotExact && (
              <div className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 flex items-start gap-2.5">
                <AlertTriangle className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-amber-800">We couldn&apos;t find reviews for this exact model</p>
                  <p className="text-xs text-amber-700 mt-0.5 leading-relaxed">
                    What you see below is based on people who reviewed similar versions. It gives you a rough idea of what to expect, but your exact model might be a little different — worth reading a few real reviews before you buy.
                  </p>
                </div>
              </div>
            )}

            {/* Mixed-coverage warning */}
            {isMixedCoverage && !isNotExact && (
              <div className="rounded-xl bg-sky-50 border border-sky-200 px-4 py-3 text-xs text-sky-800">
                <span className="font-semibold">Just so you know —</span> not all of these reviews are for this exact model. Some are, but some come from people with a similar version. Either way, it should give you a pretty good idea of what to expect.
              </div>
            )}

            {/* Header — sentiment + confidence + source */}
            <div className={cn('rounded-xl border px-4 py-3', isNotExact ? 'bg-slate-50 border-slate-200 text-slate-700' : sentiment.cls)}>
              <div className="flex items-start justify-between gap-2 mb-1.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-bold uppercase tracking-wider">
                    {isNotExact ? 'Reviews from similar models' : `${sentiment.label} overall`}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-white/60 border border-current/20 font-medium">
                    {confidenceLabel}
                  </span>
                  {signal.matchCoverage && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-white/60 border border-current/20 font-medium">
                      {signal.matchCoverage === 'exact' ? 'Exact match'
                        : signal.matchCoverage === 'family' ? 'Similar models'
                        : 'Mixed'}
                    </span>
                  )}
                </div>
                {signal.sourceUrl && (
                  <a
                    href={signal.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-shrink-0 flex items-center gap-1 text-xs underline underline-offset-2 opacity-70 hover:opacity-100"
                  >
                    View source <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
              <p className="text-xs leading-relaxed opacity-90">{signal.reviewSummary}</p>
            </div>

            {/* Only show praises/complaints when we have exact or mixed signals */}
            {(!isNotExact) && (signal.commonPraises.length > 0 || signal.commonComplaints.length > 0) && (
              <div className="grid sm:grid-cols-2 gap-3">
                {signal.commonPraises.length > 0 && (
                  <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3">
                    <p className="text-xs font-bold text-emerald-700 uppercase tracking-wider mb-2">What people love</p>
                    <ul className="space-y-1.5">
                      {signal.commonPraises.map((p, j) => (
                        <li key={j} className="text-sm text-emerald-900 flex items-start gap-2">
                          <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0" />
                          {p}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {signal.commonComplaints.length > 0 && (
                  <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3">
                    <p className="text-xs font-bold text-red-600 uppercase tracking-wider mb-2">What people dislike</p>
                    <ul className="space-y-1.5">
                      {signal.commonComplaints.map((c, j) => (
                        <li key={j} className="text-sm text-red-900 flex items-start gap-2">
                          <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-red-400 flex-shrink-0" />
                          {c}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Specific concern areas */}
            {[
              { label: 'Battery', items: signal.batteryConcerns },
              { label: 'Performance', items: signal.performanceConcerns },
              { label: 'Build quality', items: signal.buildQualityConcerns },
              { label: 'Reliability', items: signal.reliabilityConcerns },
            ].filter(g => g.items.length > 0).map(g => (
              <div key={g.label} className="rounded-xl bg-slate-50 border border-slate-200 px-4 py-3">
                <p className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                  {g.label}{isNotExact ? ' (similar models)' : ''}
                </p>
                <ul className="space-y-1.5">
                  {g.items.map((item, j) => (
                    <li key={j} className="text-sm text-slate-700 flex items-start gap-2">
                      <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-slate-400 flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}

            {/* Value for money */}
            {signal.valueForMoneyComments.length > 0 && (
              <div className="rounded-xl bg-sky-50 border border-sky-200 px-4 py-3">
                <p className="text-xs font-bold text-sky-700 uppercase tracking-wider mb-2">Value for money</p>
                <ul className="space-y-1.5">
                  {signal.valueForMoneyComments.map((c, j) => (
                    <li key={j} className="text-sm text-sky-900 flex items-start gap-2">
                      <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-sky-400 flex-shrink-0" />
                      {c}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <p className="text-xs text-slate-400 px-1">
              Pulled from web reviews · {new Date(signal.lastCheckedAt).toLocaleString()}
            </p>
          </div>
        );
      })}
    </div>
  );
}
