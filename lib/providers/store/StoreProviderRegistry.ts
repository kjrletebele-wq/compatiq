import type { StoreSearchProvider } from './StoreSearchProvider';
import { EbayStoreProvider } from './EbayStoreProvider';
import type { DeviceStoreSearchInput, StoreSearchResult } from '@/lib/types/product';
import { makeNotConfiguredStatus } from '@/lib/types/providers';

const providers: StoreSearchProvider[] = [
  new EbayStoreProvider(),
];

export async function searchDeviceInStores(input: DeviceStoreSearchInput): Promise<StoreSearchResult> {
  const now = new Date().toISOString();
  const allStatuses = [];

  for (const provider of providers) {
    if (!provider.isConfigured()) {
      allStatuses.push(makeNotConfiguredStatus(provider.name));
      continue;
    }
    const result = await provider.searchDevice(input);
    allStatuses.push(...result.providerStatuses);
    if (result.success && result.items.length > 0) {
      return { ...result, providerStatuses: allStatuses };
    }
  }

  return {
    success: false,
    providerStatuses: allStatuses.length ? allStatuses : [makeNotConfiguredStatus('StoreProviderRegistry')],
    items: [],
    warnings: ['No live store source is connected yet.'],
    lastCheckedAt: now,
  };
}
