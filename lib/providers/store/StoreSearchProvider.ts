import type { DeviceStoreSearchInput, StoreSearchResult } from '@/lib/types/product';

export interface StoreSearchProvider {
  name: string;
  isConfigured(): boolean;
  searchDevice(input: DeviceStoreSearchInput): Promise<StoreSearchResult>;
}
