import type { ProductLinkProvider } from './ProductLinkProvider';
import type { ProductLinkInput, ProductLinkResult } from '@/lib/types/product';
import { makeNotConfiguredStatus } from '@/lib/types/providers';

export class EbayProductProvider implements ProductLinkProvider {
  name = 'EbayProductProvider';

  isConfigured(): boolean {
    return !!(process.env.EBAY_CLIENT_ID && process.env.EBAY_CLIENT_SECRET);
  }

  canHandle(url: string): boolean {
    return url.includes('ebay.');
  }

  async analyseLink(input: ProductLinkInput): Promise<ProductLinkResult> {
    const now = new Date().toISOString();
    if (!this.isConfigured()) {
      return {
        success: false,
        sourceType: 'not-connected',
        providerStatuses: [makeNotConfiguredStatus(this.name)],
        device: null,
        specs: null,
        storeListing: null,
        warnings: [],
        lastCheckedAt: now,
      };
    }
    // TODO: Implement eBay Browse API integration
    return {
      success: false,
      sourceType: 'not-connected',
      providerStatuses: [makeNotConfiguredStatus(this.name)],
      device: null,
      specs: null,
      storeListing: null,
      warnings: ['eBay product integration not yet implemented.'],
      lastCheckedAt: now,
    };
  }
}
