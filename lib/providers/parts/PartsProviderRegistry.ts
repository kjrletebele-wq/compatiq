import type { PartsProvider } from './PartsProvider';
import { EbayPartsProvider } from './EbayPartsProvider';
import type { PartsSearchInput, PartsSearchResult } from '@/lib/types/parts';
import { makeNotConfiguredStatus } from '@/lib/types/providers';

const providers: PartsProvider[] = [
  new EbayPartsProvider(),
];

export async function searchParts(input: PartsSearchInput): Promise<PartsSearchResult> {
  const now = new Date().toISOString();
  const allStatuses = [];

  for (const provider of providers) {
    if (!provider.isConfigured()) {
      allStatuses.push(makeNotConfiguredStatus(provider.name));
      continue;
    }
    const result = await provider.searchParts(input);
    allStatuses.push(...result.providerStatuses);
    if (result.success && result.items.length > 0) {
      return { ...result, providerStatuses: allStatuses };
    }
  }

  return {
    success: false,
    providerStatuses: allStatuses.length ? allStatuses : [makeNotConfiguredStatus('PartsProviderRegistry')],
    items: [],
    warnings: ['No live parts source is connected yet.'],
    lastCheckedAt: now,
  };
}
