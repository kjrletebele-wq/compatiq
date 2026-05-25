import { Info } from 'lucide-react';

/**
 * Site-wide public beta notice. Rendered in the root layout above all content.
 * Kept minimal — one line, dark-toned so it does not compete with page content.
 */
export function BetaBanner() {
  return (
    <div className="w-full bg-sky-950/60 border-b border-sky-800/40">
      <div className="max-w-5xl mx-auto px-6 py-2 flex items-start gap-2">
        <Info className="h-3.5 w-3.5 text-sky-400 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-sky-300/80 leading-relaxed">
          <span className="font-semibold text-sky-300">Public beta.</span>{' '}
          Results are advisory and may be incomplete where stores block or limit product data.
          Always confirm important details with the seller or manufacturer.
        </p>
      </div>
    </div>
  );
}
