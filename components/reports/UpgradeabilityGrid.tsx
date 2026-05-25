'use client';

import { useRouter } from 'next/navigation';
import type { UpgradeabilityRecord, UpgradeabilityStatus } from '@/lib/types/upgradeability';
import { COMPONENT_LABELS } from '@/lib/types/upgradeability';
import type { DeviceIdentity } from '@/lib/types/device';
import { cn } from '@/lib/utils';

interface UpgradeabilityGridProps {
  records: UpgradeabilityRecord[];
  device: DeviceIdentity;
}

const statusConfig: Record<UpgradeabilityStatus, { label: string; cls: string; dot: string }> = {
  Upgradeable:    { label: 'Upgradeable',     cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
  Replaceable:    { label: 'Replaceable',     cls: 'bg-sky-50 text-sky-700 border-sky-200',             dot: 'bg-sky-500' },
  NotUpgradeable: { label: 'Not upgradeable', cls: 'bg-red-50 text-red-700 border-red-200',             dot: 'bg-red-500' },
  Unknown:        { label: 'Unknown',         cls: 'bg-slate-100 text-slate-600 border-slate-200',      dot: 'bg-slate-400' },
};

const confidenceCls: Record<string, string> = {
  high:            'text-emerald-600',
  medium:          'text-amber-600',
  low:             'text-orange-600',
  'not-connected': 'text-slate-400',
};

export function UpgradeabilityGrid({ records, device }: UpgradeabilityGridProps) {
  const router = useRouter();

  function handleFindParts(record: UpgradeabilityRecord) {
    // Store device context in sessionStorage so parts page can show device name
    // No serial or sensitive data stored
    try {
      sessionStorage.setItem('compatiq_parts_device', JSON.stringify({
        deviceName: device.deviceName ?? device.model ?? null,
        brand: device.brand,
        model: device.model,
        category: device.category,
        componentType: record.componentType,
        componentLabel: COMPONENT_LABELS[record.componentType] ?? record.componentType,
      }));
    } catch {
      // sessionStorage may be unavailable in some contexts — ignore
    }

    const params = new URLSearchParams({
      componentType: record.componentType,
      category: device.category,
    });
    if (device.brand) params.set('brand', device.brand);
    if (device.model) params.set('model', device.model);
    if (device.deviceName && device.deviceName !== device.model) {
      params.set('deviceName', device.deviceName.slice(0, 120));
    }

    router.push(`/parts?${params.toString()}`);
  }

  return (
    <div className="grid sm:grid-cols-2 gap-3">
      {records.map((record) => {
        const cfg = statusConfig[record.status];
        return (
          <div
            key={record.componentType}
            className="rounded-xl border border-slate-200 bg-white p-4"
          >
            <div className="flex items-start justify-between gap-2 mb-2">
              <span className="text-sm font-semibold text-slate-800">
                {COMPONENT_LABELS[record.componentType] ?? record.componentType}
              </span>
              <span className={cn('text-xs font-semibold px-2 py-0.5 rounded-full border flex-shrink-0', cfg.cls)}>
                {cfg.label}
              </span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed mb-3">{record.explanation}</p>
            <div className="flex items-center justify-between">
              <span className={cn('text-xs font-medium capitalize', confidenceCls[record.confidence] ?? 'text-slate-400')}>
                Confidence: {record.confidence}
              </span>
              <button
                type="button"
                onClick={() => handleFindParts(record)}
                className="text-xs font-semibold text-sky-600 hover:text-sky-700 underline underline-offset-2 transition-colors"
              >
                Find parts →
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
