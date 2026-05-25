/**
 * Central CompatIQ Provider Registry
 *
 * Automatically calls all configured providers for each task type.
 * Merges, deduplicates, and ranks results.
 * Returns provider statuses for all attempted providers.
 */

import type { DeviceIdentity, DeviceSpecs } from '@/lib/types/device';
import type { ComponentType } from '@/lib/types/upgradeability';
import type { ProviderStatus } from '@/lib/types/providers';
import { makeNotConfiguredStatus } from '@/lib/types/providers';

import type { PartsSearchInput, PartsSearchResult } from '@/lib/types/parts';
import type { DeviceStoreSearchInput, StoreSearchResult } from '@/lib/types/product';
import type { ReviewSearchInput, ReviewSearchResult } from '@/lib/types/reviews';

// Parts providers
import type { PartsProvider } from '@/lib/providers/parts/PartsProvider';
import { EbayPartsProvider } from '@/lib/providers/parts/EbayPartsProvider';
import { SerpApiPartsProvider } from '@/lib/providers/parts/SerpApiPartsProvider';

// Store providers
import type { StoreSearchProvider } from '@/lib/providers/store/StoreSearchProvider';
import { EbayStoreProvider } from '@/lib/providers/store/EbayStoreProvider';
import { SerpApiStoreProvider } from '@/lib/providers/store/SerpApiStoreProvider';
import { BestBuyProvider } from '@/lib/providers/store/BestBuyProvider';
import {
  TakealotProvider,
  IncredibleConnectionProvider,
  EvetechProvider,
  WootwareProvider,
  IStoreProvider,
  MakroProvider,
  ComputerManiaProvider,
  GeeWizProvider,
} from '@/lib/providers/retailers/RetailerStubs';
import { AmazonProvider } from '@/lib/providers/amazon/AmazonProvider';

// Review providers
import type { ReviewProvider } from '@/lib/providers/reviews/ReviewProvider';
import { SerpApiReviewProvider } from '@/lib/providers/reviews/SerpApiReviewProvider';

// Merge logic
import {
  mergePartListings,
  rankPartListings,
  mergeStoreListings,
  rankStoreListings,
  mergeProviderStatuses,
} from '@/lib/logic/resultMergeEngine';

// ─── Registry definitions ────────────────────────────────────────────────────

const ALL_PARTS_PROVIDERS: PartsProvider[] = [
  new EbayPartsProvider(),
  new SerpApiPartsProvider(),
];

const ALL_STORE_PROVIDERS: StoreSearchProvider[] = [
  new EbayStoreProvider(),
  new SerpApiStoreProvider(),
  new BestBuyProvider(),
  TakealotProvider,
  IncredibleConnectionProvider,
  EvetechProvider,
  WootwareProvider,
  IStoreProvider,
  MakroProvider,
  ComputerManiaProvider,
  GeeWizProvider,
  new AmazonProvider(),
];

const ALL_REVIEW_PROVIDERS: ReviewProvider[] = [
  new SerpApiReviewProvider(),
];

// ─── Parts search — runs ALL configured providers ────────────────────────────

export async function searchPartsAllProviders(input: PartsSearchInput): Promise<PartsSearchResult> {
  const now = new Date().toISOString();
  const allStatuses: ProviderStatus[] = [];
  const allItems = [];
  const allWarnings: string[] = [];

  const runnable = ALL_PARTS_PROVIDERS.filter(p => p.isConfigured());
  const skipped = ALL_PARTS_PROVIDERS.filter(p => !p.isConfigured());

  // Show not-configured status for skipped providers
  for (const p of skipped) {
    allStatuses.push(makeNotConfiguredStatus(p.name));
  }

  if (runnable.length === 0) {
    return {
      success: false,
      providerStatuses: allStatuses,
      items: [],
      warnings: ['No live parts provider is configured. Add EBAY_CLIENT_ID/EBAY_CLIENT_SECRET or SERPAPI_API_KEY to enable live parts search.'],
      lastCheckedAt: now,
    };
  }

  // Run all configured providers in parallel
  const results = await Promise.allSettled(
    runnable.map(p => p.searchParts(input))
  );

  for (const settled of results) {
    if (settled.status === 'fulfilled') {
      const r = settled.value;
      allStatuses.push(...r.providerStatuses);
      allItems.push(...r.items);
      allWarnings.push(...r.warnings);
    } else {
      // Provider threw unexpectedly — log provider name, not sensitive data
      allWarnings.push(`A parts provider encountered an unexpected error.`);
    }
  }

  const merged = mergePartListings(allItems);
  const ranked = rankPartListings(merged);

  return {
    success: ranked.length > 0,
    providerStatuses: mergeProviderStatuses(allStatuses),
    items: ranked,
    warnings: allWarnings,
    lastCheckedAt: now,
  };
}

// ─── Store search — runs ALL configured providers ────────────────────────────

export async function searchDeviceAllProviders(input: DeviceStoreSearchInput): Promise<StoreSearchResult> {
  const now = new Date().toISOString();
  const allStatuses: ProviderStatus[] = [];
  const allItems = [];
  const allWarnings: string[] = [];

  const runnable = ALL_STORE_PROVIDERS.filter(p => p.isConfigured());
  const skipped = ALL_STORE_PROVIDERS.filter(p => !p.isConfigured());

  for (const p of skipped) {
    allStatuses.push(makeNotConfiguredStatus(p.name));
  }

  if (runnable.length === 0) {
    return {
      success: false,
      providerStatuses: allStatuses,
      items: [],
      warnings: ['No live store provider is configured. Add EBAY_CLIENT_ID or SERPAPI_API_KEY to enable store search.'],
      lastCheckedAt: now,
    };
  }

  const results = await Promise.allSettled(
    runnable.map(p => p.searchDevice(input))
  );

  for (const settled of results) {
    if (settled.status === 'fulfilled') {
      const r = settled.value;
      allStatuses.push(...r.providerStatuses);
      allItems.push(...r.items);
      allWarnings.push(...r.warnings);
    } else {
      allWarnings.push(`A store provider encountered an unexpected error.`);
    }
  }

  const merged = mergeStoreListings(allItems);
  const ranked = rankStoreListings(merged, input.country ?? null);

  return {
    success: ranked.length > 0,
    providerStatuses: mergeProviderStatuses(allStatuses),
    items: ranked,
    warnings: allWarnings,
    lastCheckedAt: now,
  };
}

// ─── Reviews — runs ALL configured providers ─────────────────────────────────

export async function searchReviewsAllProviders(input: ReviewSearchInput): Promise<ReviewSearchResult> {
  const now = new Date().toISOString();
  const allStatuses: ProviderStatus[] = [];
  const allSignals = [];
  const allWarnings: string[] = [];

  const runnable = ALL_REVIEW_PROVIDERS.filter(p => p.isConfigured());
  const skipped = ALL_REVIEW_PROVIDERS.filter(p => !p.isConfigured());

  for (const p of skipped) {
    allStatuses.push(makeNotConfiguredStatus(p.name));
  }

  if (runnable.length === 0) {
    return {
      success: false,
      providerStatuses: allStatuses,
      signals: [],
      warnings: ['No live review provider is configured. Add SERPAPI_API_KEY to enable review signals.'],
      lastCheckedAt: now,
    };
  }

  const results = await Promise.allSettled(
    runnable.map(p => p.searchReviews(input))
  );

  for (const settled of results) {
    if (settled.status === 'fulfilled') {
      const r = settled.value;
      allStatuses.push(...r.providerStatuses);
      allSignals.push(...r.signals);
      allWarnings.push(...r.warnings);
    }
  }

  return {
    success: allSignals.length > 0,
    providerStatuses: mergeProviderStatuses(allStatuses),
    signals: allSignals,
    warnings: allWarnings,
    lastCheckedAt: now,
  };
}

// ─── Provider status summary ─────────────────────────────────────────────────

export function getAllProviderStatuses(): ProviderStatus[] {
  const now = new Date().toISOString();
  const all: Array<{ name: string; configured: boolean }> = [
    ...ALL_PARTS_PROVIDERS.map(p => ({ name: p.name, configured: p.isConfigured() })),
    ...ALL_STORE_PROVIDERS.map(p => ({ name: p.name, configured: p.isConfigured() })),
    ...ALL_REVIEW_PROVIDERS.map(p => ({ name: p.name, configured: p.isConfigured() })),
  ];

  // Deduplicate by name
  const seen = new Set<string>();
  return all
    .filter(p => { if (seen.has(p.name)) return false; seen.add(p.name); return true; })
    .map(p => ({
      providerName: p.name,
      connected: p.configured,
      status: p.configured ? 'connected' : 'not-configured',
      message: p.configured ? `${p.name} is configured and ready.` : `${p.name} is not configured. Add required environment variables.`,
      lastCheckedAt: now,
    } as ProviderStatus));
}
