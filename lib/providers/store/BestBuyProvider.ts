import type { StoreSearchProvider } from './StoreSearchProvider';
import type { DeviceStoreSearchInput, StoreSearchResult } from '@/lib/types/product';
import { makeNotConfiguredStatus } from '@/lib/types/providers';

export class BestBuyProvider implements StoreSearchProvider {
  name = 'Best Buy Products API';

  isConfigured(): boolean {
    return !!process.env.BESTBUY_API_KEY;
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
    // TODO: Implement Best Buy Products API v1
    // https://bestbuyapis.github.io/api-documentation/#products-api
    return {
      success: false,
      providerStatuses: [makeNotConfiguredStatus(this.name)],
      items: [],
      warnings: [],
      lastCheckedAt: now,
    };
  }
}
