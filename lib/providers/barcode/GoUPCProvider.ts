import { makeNotConfiguredStatus } from '@/lib/types/providers';
import type { BarcodeInput, BarcodeResult } from './UPCItemDbProvider';

export class GoUPCProvider {
  name = 'Go-UPC';

  isConfigured(): boolean {
    return !!process.env.GOUPC_API_KEY;
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
    // TODO: https://go-upc.com/api
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
