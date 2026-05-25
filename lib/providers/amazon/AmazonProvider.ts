import { makeNotConfiguredStatus } from '@/lib/types/providers';
import type { StoreSearchProvider } from '@/lib/providers/store/StoreSearchProvider';
import type { DeviceStoreSearchInput, StoreSearchResult } from '@/lib/types/product';

/**
 * Amazon provider placeholder.
 *
 * Amazon product data is only accessible via the Amazon Product Advertising API 5.0,
 * which requires an Amazon Associates account with qualifying sales activity.
 *
 * Public HTML scraping of Amazon is prohibited by their Terms of Service.
 * The GenericMetadataProvider may fetch publicly accessible page metadata
 * from an Amazon URL pasted by the user (single-page, not automated scraping).
 *
 * This provider returns not-configured until official PA API credentials are added.
 *
 * Required env vars:
 *   AMAZON_API_KEY       — PA API access key
 *   AMAZON_API_SECRET    — PA API secret key
 *   AMAZON_PARTNER_TAG   — Associates partner tag
 */
export class AmazonProvider implements StoreSearchProvider {
  name = 'Amazon Product Advertising API';

  isConfigured(): boolean {
    return !!(
      process.env.AMAZON_API_KEY &&
      process.env.AMAZON_API_SECRET &&
      process.env.AMAZON_PARTNER_TAG
    );
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
    // TODO: Implement Amazon PA API v5
    // https://webservices.amazon.com/paapi5/documentation/
    return {
      success: false,
      providerStatuses: [makeNotConfiguredStatus(this.name)],
      items: [],
      warnings: [],
      lastCheckedAt: now,
    };
  }
}
