/**
 * South African retailer provider stubs.
 * These return not-configured until official retailer API keys or feeds are added.
 * Do not scrape without permission.
 */

import { makeNotConfiguredStatus } from '@/lib/types/providers';
import type { StoreSearchProvider } from '@/lib/providers/store/StoreSearchProvider';
import type { DeviceStoreSearchInput, StoreSearchResult } from '@/lib/types/product';

function makeRetailerStub(name: string, envKey: string): StoreSearchProvider {
  return {
    name,
    isConfigured(): boolean {
      return !!process.env[envKey];
    },
    async searchDevice(input: DeviceStoreSearchInput): Promise<StoreSearchResult> {
      const now = new Date().toISOString();
      if (!this.isConfigured()) {
        return {
          success: false,
          providerStatuses: [makeNotConfiguredStatus(name)],
          items: [],
          warnings: [],
          lastCheckedAt: now,
        };
      }
      return {
        success: false,
        providerStatuses: [makeNotConfiguredStatus(name)],
        items: [],
        warnings: [`${name} integration not yet implemented.`],
        lastCheckedAt: now,
      };
    },
  };
}

export const TakealotProvider = makeRetailerStub('Takealot', 'TAKEALOT_API_KEY');
export const IncredibleConnectionProvider = makeRetailerStub('Incredible Connection', 'INCREDIBLE_CONNECTION_API_KEY');
export const EvetechProvider = makeRetailerStub('Evetech', 'EVETECH_API_KEY');
export const WootwareProvider = makeRetailerStub('Wootware', 'WOOTWARE_API_KEY');
export const IStoreProvider = makeRetailerStub('iStore', 'ISTORE_API_KEY');
export const MakroProvider = makeRetailerStub('Makro', 'MAKRO_API_KEY');
export const ComputerManiaProvider = makeRetailerStub('Computer Mania', 'COMPUTER_MANIA_API_KEY');
export const GeeWizProvider = makeRetailerStub('GeeWiz', 'GEEWIZ_API_KEY');
