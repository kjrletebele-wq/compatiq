import { makeNotConfiguredStatus } from '@/lib/types/providers';
import type { ProviderStatus } from '@/lib/types/providers';

export interface BarcodeInput {
  barcode?: string;
  keyword?: string;
}

export interface BarcodeResult {
  success: boolean;
  providerStatuses: ProviderStatus[];
  productName: string | null;
  brand: string | null;
  description: string | null;
  imageUrl: string | null;
  lastCheckedAt: string;
}

export class UPCItemDbProvider {
  name = 'UPCitemdb';

  isConfigured(): boolean {
    return !!process.env.UPCITEMDB_API_KEY;
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
    // TODO: Implement UPCitemdb API lookup
    // https://www.upcitemdb.com/api/explorer#!/lookup/get_trial_lookup
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
