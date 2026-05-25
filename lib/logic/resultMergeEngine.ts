/**
 * Merge, deduplicate, and rank results from multiple providers.
 */

import type { StoreListing } from '@/lib/types/product';
import type { PartListing } from '@/lib/types/parts';
import type { ProviderStatus } from '@/lib/types/providers';

// ─── Store listing deduplication ────────────────────────────────────────────

function normUrl(url: string): string {
  try {
    const u = new URL(url);
    // Google Shopping redirect URLs are unique per product (their query params ARE the product identity).
    // Stripping query params collapses all Shopping results to "www.google.com/search" — keep full URL.
    if (u.hostname.endsWith('google.com') || u.hostname.endsWith('google.co.za')) {
      return url.toLowerCase().slice(0, 300);
    }
    // For real product pages, strip tracking/UTM params — hostname + pathname is enough to dedup
    return `${u.hostname}${u.pathname}`.toLowerCase().replace(/\/+$/, '');
  } catch {
    return url.toLowerCase().slice(0, 100);
  }
}

function titleKey(title: string): string {
  return title.toLowerCase().replace(/[^\w\s]/g, '').replace(/\s+/g, ' ').trim().slice(0, 80);
}

/**
 * Merge store listings from multiple providers:
 * - Deduplicate by URL, then by (title + store + price)
 * - Keep highest-confidence match
 */
export function mergeStoreListings(allItems: StoreListing[]): StoreListing[] {
  const seenUrl = new Set<string>();
  const seenTitleStore = new Map<string, StoreListing>();

  const deduped: StoreListing[] = [];

  for (const item of allItems) {
    const urlKey = normUrl(item.productUrl);
    if (seenUrl.has(urlKey)) continue;
    seenUrl.add(urlKey);

    const tsKey = `${titleKey(item.productName)}|${item.storeName.toLowerCase()}`;
    const existing = seenTitleStore.get(tsKey);
    if (existing) {
      // Keep the one with higher confidence
      const confOrder = { exact: 0, likely: 1, similar: 2, unknown: 3 };
      if ((confOrder[item.matchConfidence] ?? 3) < (confOrder[existing.matchConfidence] ?? 3)) {
        // Replace in deduped
        const idx = deduped.indexOf(existing);
        if (idx >= 0) deduped[idx] = item;
        seenTitleStore.set(tsKey, item);
      }
      continue;
    }

    seenTitleStore.set(tsKey, item);
    deduped.push(item);
  }

  return deduped;
}

/**
 * Rank store listings:
 * 1. Exact/likely match first
 * 2. Price available before no price
 * 3. Country match
 */
export function rankStoreListings(
  items: StoreListing[],
  preferredCountry?: string | null
): StoreListing[] {
  const confScore = { exact: 0, likely: 1, similar: 2, unknown: 3 };

  return [...items].sort((a, b) => {
    const aConf = confScore[a.matchConfidence] ?? 3;
    const bConf = confScore[b.matchConfidence] ?? 3;
    if (aConf !== bConf) return aConf - bConf;

    // Country preference
    if (preferredCountry) {
      const aMatch = a.country?.toLowerCase().includes(preferredCountry.toLowerCase()) ? 0 : 1;
      const bMatch = b.country?.toLowerCase().includes(preferredCountry.toLowerCase()) ? 0 : 1;
      if (aMatch !== bMatch) return aMatch - bMatch;
    }

    // Price available
    const aPrice = a.price !== null ? 0 : 1;
    const bPrice = b.price !== null ? 0 : 1;
    if (aPrice !== bPrice) return aPrice - bPrice;

    // Cheapest first
    if (a.price !== null && b.price !== null) return a.price - b.price;

    return 0;
  });
}

// ─── Parts deduplication ─────────────────────────────────────────────────────

/**
 * Merge part listings from multiple providers:
 * - Deduplicate by URL, then by (title + store)
 * - Keep highest compatibility confidence
 */
export function mergePartListings(allItems: PartListing[]): PartListing[] {
  const seenUrl = new Set<string>();
  const seenTitleStore = new Map<string, PartListing>();
  const deduped: PartListing[] = [];

  for (const item of allItems) {
    const urlKey = normUrl(item.productUrl);
    if (seenUrl.has(urlKey)) continue;
    seenUrl.add(urlKey);

    const tsKey = `${titleKey(item.productName)}|${item.storeName.toLowerCase()}`;
    const existing = seenTitleStore.get(tsKey);
    if (existing) {
      const confOrder = { high: 0, medium: 1, low: 2, unknown: 3 };
      if ((confOrder[item.compatibilityConfidence] ?? 3) < (confOrder[existing.compatibilityConfidence] ?? 3)) {
        const idx = deduped.indexOf(existing);
        if (idx >= 0) deduped[idx] = item;
        seenTitleStore.set(tsKey, item);
      }
      continue;
    }

    seenTitleStore.set(tsKey, item);
    deduped.push(item);
  }

  return deduped;
}

/**
 * Rank part listings:
 * 1. Compatibility confidence (high → medium → low → unknown)
 * 2. New condition before used
 * 3. Price available
 * 4. Cheapest
 */
export function rankPartListings(items: PartListing[]): PartListing[] {
  const confScore = { high: 0, medium: 1, low: 2, unknown: 3 };
  const condScore: Record<string, number> = { New: 0, Refurbished: 1, Used: 2, Unknown: 3 };

  return [...items].sort((a, b) => {
    const aC = confScore[a.compatibilityConfidence] ?? 3;
    const bC = confScore[b.compatibilityConfidence] ?? 3;
    if (aC !== bC) return aC - bC;

    const aCond = condScore[a.condition] ?? 3;
    const bCond = condScore[b.condition] ?? 3;
    if (aCond !== bCond) return aCond - bCond;

    const aP = a.price !== null ? 0 : 1;
    const bP = b.price !== null ? 0 : 1;
    if (aP !== bP) return aP - bP;

    if (a.price !== null && b.price !== null) return a.price - b.price;

    return 0;
  });
}

// ─── Provider status merging ─────────────────────────────────────────────────

/**
 * Merge provider statuses, deduplicating by provider name (last write wins).
 */
export function mergeProviderStatuses(allStatuses: ProviderStatus[]): ProviderStatus[] {
  const map = new Map<string, ProviderStatus>();
  for (const s of allStatuses) {
    map.set(s.providerName, s);
  }
  return Array.from(map.values());
}
