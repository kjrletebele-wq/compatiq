import type { DeviceCategory, DeviceIdentity, DeviceSpecs } from './device';
import type { ProviderStatus } from './providers';

export interface ProductLinkInput {
  url: string;
  country?: string | null;
  city?: string | null;
}

export interface ProductLinkResult {
  success: boolean;
  sourceType: 'live' | 'connected-provider' | 'not-connected' | 'manual-required';
  providerStatuses: ProviderStatus[];
  device: DeviceIdentity | null;
  specs: DeviceSpecs | null;
  storeListing: StoreListing | null;
  warnings: string[];
  lastCheckedAt: string;
}

export interface StoreListing {
  id: string;
  productName: string;
  storeName: string;
  price: number | null;
  currency: string | null;
  availability: string | null;
  country: string | null;
  city: string | null;
  productUrl: string;
  imageUrl?: string | null;
  matchConfidence: 'exact' | 'likely' | 'similar' | 'unknown';
  matchScore?: number;
  matchReasons?: string[];
  matchConflicts?: string[];
  sourceProvider: string;
  lastCheckedAt: string;
}

export interface DeviceStoreSearchInput {
  device: DeviceIdentity;
  specs?: DeviceSpecs | null;
  country?: string | null;
  city?: string | null;
}

export interface StoreSearchResult {
  success: boolean;
  providerStatuses: ProviderStatus[];
  items: StoreListing[];
  warnings: string[];
  lastCheckedAt: string;
}

export interface ManualDeviceInput {
  category: DeviceCategory;
  brand?: string;
  model?: string;
  deviceName?: string;
  price?: number | null;
  currency?: string | null;
  storeName?: string | null;
  country?: string | null;
  city?: string | null;
  specsText?: string | null;
}
