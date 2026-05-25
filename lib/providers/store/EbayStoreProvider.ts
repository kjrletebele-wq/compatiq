import type { StoreSearchProvider } from './StoreSearchProvider';
import type { DeviceStoreSearchInput, StoreSearchResult, StoreListing } from '@/lib/types/product';
import { makeNotConfiguredStatus, makeConnectedStatus, makeFailedStatus, makeNoResultsStatus } from '@/lib/types/providers';
import { ebayIsConfigured } from '@/lib/providers/ebay/EbayAuth';
import { ebaySearch } from '@/lib/providers/ebay/EbayBrowseProvider';
import type { EbayItemSummary } from '@/lib/providers/ebay/EbayBrowseProvider';
import { generateId } from '@/lib/utils';

export class EbayStoreProvider implements StoreSearchProvider {
  name = 'eBay Browse API';

  isConfigured(): boolean {
    return ebayIsConfigured();
  }

  async searchDevice(input: DeviceStoreSearchInput): Promise<StoreSearchResult> {
    const now = new Date().toISOString();

    if (!this.isConfigured()) {
      return {
        success: false,
        providerStatuses: [makeNotConfiguredStatus(this.name)],
        items: [],
        warnings: [],
        lastCheckedAt: now,
      };
    }

    try {
      const query = buildDeviceQuery(input);
      const result = await ebaySearch({ query, limit: 20 });

      if (result.items.length === 0) {
        return {
          success: false,
          providerStatuses: [makeNoResultsStatus(this.name)],
          items: [],
          warnings: [],
          lastCheckedAt: now,
        };
      }

      const items = result.items
        .map(item => normaliseEbayItemToStore(item, input, now))
        .filter((i): i is StoreListing => i !== null);

      return {
        success: items.length > 0,
        providerStatuses: [makeConnectedStatus(this.name, `Found ${items.length} listings on eBay.`)],
        items,
        warnings: items.length < result.totalCount
          ? [`Showing ${items.length} of ${result.totalCount} eBay results.`]
          : [],
        lastCheckedAt: now,
      };
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown eBay error';
      const isRateLimit = msg.includes('429') || msg.toLowerCase().includes('rate');
      return {
        success: false,
        providerStatuses: [{
          providerName: this.name,
          connected: false,
          status: isRateLimit ? 'rate-limited' : 'failed',
          message: msg,
          lastCheckedAt: now,
        }],
        items: [],
        warnings: [],
        lastCheckedAt: now,
      };
    }
  }
}

function buildDeviceQuery(input: DeviceStoreSearchInput): string {
  const parts: string[] = [];
  if (input.device.brand) parts.push(input.device.brand);
  if (input.device.model) {
    parts.push(input.device.model);
  } else if (input.device.deviceName) {
    const words = input.device.deviceName.split(/\s+/).slice(0, 5).join(' ');
    parts.push(words);
  }
  return parts.join(' ');
}

function normaliseEbayItemToStore(
  item: EbayItemSummary,
  input: DeviceStoreSearchInput,
  now: string
): StoreListing | null {
  const title = item.title ?? '';
  const url = item.itemWebUrl;
  if (!title || !url) return null;

  const rawPrice = item.price?.value ? parseFloat(item.price.value) : null;
  const price = rawPrice !== null && !isNaN(rawPrice) ? rawPrice : null;
  const currency = item.price?.currency ?? null;

  const titleLower = title.toLowerCase();
  const brand = input.device.brand;
  const model = input.device.model;
  const brandMatch = brand && titleLower.includes(brand.toLowerCase());
  const modelMatch = model && titleLower.includes(model.toLowerCase());

  let matchConfidence: StoreListing['matchConfidence'];
  if (brandMatch && modelMatch) {
    matchConfidence = 'likely';
  } else if (brandMatch || modelMatch) {
    matchConfidence = 'similar';
  } else {
    matchConfidence = 'unknown';
  }

  return {
    id: `ebay-store-${item.itemId ?? generateId()}`,
    productName: title.slice(0, 200),
    storeName: 'eBay',
    price,
    currency,
    availability: 'See listing',
    country: item.itemLocation?.country ?? input.device.category === 'Laptop' ? (input.country ?? null) : null,
    city: item.itemLocation?.city ?? null,
    productUrl: url,
    imageUrl: item.image?.imageUrl ?? null,
    matchConfidence,
    sourceProvider: 'eBay Browse API',
    lastCheckedAt: now,
  };
}
