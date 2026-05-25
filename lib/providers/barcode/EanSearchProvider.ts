import { makeNotConfiguredStatus } from '@/lib/types/providers';
import type { BarcodeInput, BarcodeResult } from './UPCItemDbProvider';

export class EanSearchProvider {
  name = 'EAN Search';

  isConfigured(): boolean {
    return !!process.env.EAN_SEARCH_API_KEY;
  }

  async lookup(input: BarcodeInput): Promise<BarcodeResult> {
    const now = new Date().toISOString();
    if (!this.isConfigured()) {
      return {
        success: false,
        providerStatuses: [makeNotConfiguredStatus(this.name)],
        productName: null,
        brand: null,
        description: null,
        imageUrl: null,
        lastCheckedAt: now,
      };
    }
    // TODO: https://www.ean-search.org/
    return {
      success: false,
      providerStatuses: [makeNotConfiguredStatus(this.name)],
      productName: null,
      brand: null,
      description: null,
      imageUrl: null,
      lastCheckedAt: now,
    };
  }
}
