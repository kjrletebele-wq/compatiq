/**
 * CompatIQ Data Freshness Layer
 *
 * Every data item carries freshness metadata so the UI can:
 * 1. Show users how fresh the data is
 * 2. Trigger background refresh jobs when data is stale
 * 3. Flag demo/mock data clearly
 *
 * In production: replace mock sources with real API providers.
 * Scheduled jobs (cron) should call refresh() on each provider.
 */

export type DataType =
  | 'device-specs'
  | 'parts-listing'
  | 'review-signal'
  | 'serial-lookup'
  | 'price-data';

export interface FreshnessRecord {
  sourceName: string;
  sourceUrl: string | null;
  dataType: DataType;
  lastUpdated: string;       // ISO 8601
  expiresAt: string | null;  // ISO 8601 — null = never expires (static mock)
  confidence: 'high' | 'medium' | 'low' | 'demo';
  isDemo: boolean;
}

/**
 * Standard freshness record for all demo/mock data.
 * This is what gets stamped on every item in the MVP.
 */
export const DEMO_FRESHNESS: FreshnessRecord = {
  sourceName: 'CompatIQ Demo Data',
  sourceUrl: null,
  dataType: 'device-specs',
  lastUpdated: new Date().toISOString(),
  expiresAt: null,
  confidence: 'demo',
  isDemo: true,
};

export function makeDemoFreshness(dataType: DataType): FreshnessRecord {
  return { ...DEMO_FRESHNESS, dataType };
}

/**
 * Human-readable freshness label for the UI.
 * In production, calculate from lastUpdated vs. now.
 */
export function freshnessLabel(record: FreshnessRecord): string {
  if (record.isDemo) return 'Demo / mock data — not from live sources';
  const updated = new Date(record.lastUpdated);
  const diffMs = Date.now() - updated.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);
  if (diffHours < 1) return 'Updated just now';
  if (diffHours < 24) return `Updated ${Math.floor(diffHours)}h ago`;
  const diffDays = diffHours / 24;
  if (diffDays < 7) return `Updated ${Math.floor(diffDays)}d ago`;
  return `Updated ${updated.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
}
