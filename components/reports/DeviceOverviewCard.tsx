import type { DeviceIdentity, DeviceSpecs } from '@/lib/types/device';
import type { StoreListing } from '@/lib/types/product';
import { cn } from '@/lib/utils';

interface DeviceOverviewCardProps {
  device: DeviceIdentity;
  specs?: DeviceSpecs | null;
  storeListing?: StoreListing | null;
}

function getSourceBadge(device: DeviceIdentity, specs: DeviceSpecs | null | undefined) {
  // Manual entry
  if (device.sourceProvider === 'manual') {
    return { label: 'Manual input', cls: 'bg-amber-50 text-amber-700 border-amber-200' };
  }
  // Link extraction with specs from page HTML
  if (device.sourceProvider === 'GenericMetadataProvider') {
    const hasSpecs = !!(specs?.cpu || specs?.ramGb);
    return hasSpecs
      ? { label: 'Link extracted — product page', cls: 'bg-sky-50 text-sky-700 border-sky-200' }
      : { label: 'Link extracted — metadata only', cls: 'bg-amber-50 text-amber-700 border-amber-200' };
  }
  // Live API provider
  if (device.confidence === 'high') {
    return { label: 'Live provider', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
  }
  // Partial provider data
  if (device.confidence === 'medium') {
    return { label: 'Partial source', cls: 'bg-sky-50 text-sky-700 border-sky-200' };
  }
  return { label: 'Source not connected', cls: 'bg-slate-100 text-slate-600 border-slate-200' };
}

export function DeviceOverviewCard({ device, specs, storeListing }: DeviceOverviewCardProps) {
  const badge = getSourceBadge(device, specs);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 px-6 py-5 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
            {device.category}
          </p>
          <h2 className="text-xl font-bold text-slate-900 mb-0.5">
            {device.deviceName ?? device.model ?? 'Unknown device'}
          </h2>
          {device.brand && (
            <p className="text-sm text-slate-500">
              {device.brand}{device.model && device.model !== device.deviceName ? ` · ${device.model}` : ''}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-1.5 items-start sm:items-end flex-shrink-0">
          <span className={cn('inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-full border', badge.cls)}>
            {badge.label}
          </span>
        </div>
      </div>

      {storeListing && (
        <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-600">
          {storeListing.storeName && (
            <span><span className="text-slate-400 text-xs uppercase font-semibold mr-1">Store</span>{storeListing.storeName}</span>
          )}
          {storeListing.price != null && (
            <span>
              <span className="text-slate-400 text-xs uppercase font-semibold mr-1">Price</span>
              {storeListing.currency ? `${storeListing.currency} ` : ''}{storeListing.price.toLocaleString()}
            </span>
          )}
          {storeListing.availability && (
            <span><span className="text-slate-400 text-xs uppercase font-semibold mr-1">Availability</span>{storeListing.availability}</span>
          )}
          {storeListing.country && (
            <span><span className="text-slate-400 text-xs uppercase font-semibold mr-1">Country</span>{storeListing.country}</span>
          )}
          {storeListing.lastCheckedAt && (
            <span className="text-slate-400 text-xs">Checked {new Date(storeListing.lastCheckedAt).toLocaleString()}</span>
          )}
        </div>
      )}

      {device.sourceUrl && (
        <div className="mt-3">
          <a
            href={device.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-sky-600 hover:text-sky-700 underline underline-offset-2"
          >
            View original listing →
          </a>
        </div>
      )}
    </div>
  );
}
