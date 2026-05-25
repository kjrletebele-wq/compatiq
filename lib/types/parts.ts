import type { ComponentType } from './upgradeability';
import type { DeviceIdentity, DeviceSpecs } from './device';
import type { ProviderStatus } from './providers';

export interface PartListing {
  id: string;
  productName: string;
  componentType: ComponentType;
  storeName: string;
  price: number | null;
  currency: string | null;
  availability: string | null;
  condition: 'New' | 'Used' | 'Refurbished' | 'Unknown';
  country: string | null;
  city: string | null;
  productUrl: string;
  imageUrl?: string | null;
  compatibilityConfidence: 'high' | 'medium' | 'low' | 'unknown';
  compatibilityReason: string;
  missingConfirmation: string | null;
  sellerQuestion: string | null;
  sourceProvider: string;
  lastCheckedAt: string;
}

export interface PartsSearchInput {
  device: DeviceIdentity;
  componentType: ComponentType;
  specs?: DeviceSpecs | null;
  country?: string | null;
  city?: string | null;
}

export interface PartsSearchResult {
  success: boolean;
  providerStatuses: ProviderStatus[];
  items: PartListing[];
  warnings: string[];
  lastCheckedAt: string;
}

export type PartsSortOrder =
  | 'PriceLow'
  | 'PriceHigh'
  | 'BestCompatibility'
  | 'BestValue'
  | 'NearestLocation';

export interface PartsFilters {
  componentType?: ComponentType | null;
  store?: string | null;
  country?: string | null;
  city?: string | null;
  minPrice?: number | null;
  maxPrice?: number | null;
  compatibilityConfidence?: string | null;
  condition?: string | null;
  availability?: string | null;
}
