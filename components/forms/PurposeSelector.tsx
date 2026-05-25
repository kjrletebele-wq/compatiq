'use client';

import { useState } from 'react';
import { ArrowRight, Loader2 } from 'lucide-react';
import type { Purpose } from '@/lib/types/device';
import { PURPOSE_LABELS } from '@/lib/types/device';
import { cn } from '@/lib/utils';

interface PurposeSelectorProps {
  onSubmit: (purpose: Purpose) => void;
  loading?: boolean;
}

const PURPOSE_GROUPS: { label: string; keys: Purpose[] }[] = [
  {
    label: 'Work & productivity',
    keys: ['PersonalUse', 'School', 'OfficeAdmin', 'WorkBusiness', 'AccountingFinance'],
  },
  {
    label: 'Technical & creative',
    keys: ['ProgrammingCoding', 'GraphicDesign', 'VideoEditing', 'EngineeringCAD', 'ThreeDDesignBlender', 'ContentCreation', 'PhotographyMobileContent'],
  },
  {
    label: 'Other',
    keys: ['Gaming', 'HeavyMultitasking'],
  },
];

export function PurposeSelector({ onSubmit, loading }: PurposeSelectorProps) {
  const [selected, setSelected] = useState<Purpose | null>(null);

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-base font-bold text-slate-800 mb-1">What will you use this device for?</h2>
        <p className="text-sm text-slate-500">Select your primary use case.</p>
      </div>

      <div className="space-y-4">
        {PURPOSE_GROUPS.map((group) => (
          <div key={group.label}>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              {group.label}
            </p>
            <div className="flex flex-wrap gap-2">
              {group.keys.map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setSelected(key)}
                  className={cn(
                    'px-3.5 py-1.5 rounded-full text-sm border transition-all font-medium',
                    selected === key
                      ? 'bg-sky-500 border-sky-500 text-white shadow-sm'
                      : 'bg-white border-slate-200 text-slate-600 hover:border-sky-300 hover:bg-sky-50'
                  )}
                >
                  {PURPOSE_LABELS[key]}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {selected && (
        <button
          type="button"
          onClick={() => onSubmit(selected)}
          disabled={loading}
          className={cn(
            'inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold transition-colors',
            'bg-sky-500 hover:bg-sky-400 text-white shadow-lg shadow-sky-500/20',
            'disabled:opacity-50 disabled:cursor-not-allowed'
          )}
        >
          {loading ? (
            <><Loader2 className="h-4 w-4 animate-spin" /> Generating advisory…</>
          ) : (
            <>Generate advisory <ArrowRight className="h-4 w-4" /></>
          )}
        </button>
      )}
    </div>
  );
}
