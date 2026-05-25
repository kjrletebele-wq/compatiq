import type { DeviceIdentity, DeviceSpecs } from '@/lib/types/device';
import type { UpgradeabilityRecord } from '@/lib/types/upgradeability';
import type { WarrantyInfo } from '@/lib/types/warranty';
import type { ProviderStatus } from '@/lib/types/providers';

export interface SerialLookupInput {
  serialNumber: string;
  category: import('@/lib/types/device').DeviceCategory;
  brand?: string | null;
  country?: string | null;
}

export interface SerialLookupResult {
  success: boolean;
  sourceType: 'live' | 'connected-provider' | 'not-connected' | 'manual-required';
  maskedSerial: string;
  device: DeviceIdentity | null;
  specs: DeviceSpecs | null;
  upgradeability: UpgradeabilityRecord[];
  warranty: WarrantyInfo | null;
  providerStatuses: ProviderStatus[];
  warnings: string[];
  lastCheckedAt: string;
}

export interface SerialLookupProvider {
  name: string;
  isConfigured(): boolean;
  canHandle(input: SerialLookupInput): boolean;
  lookupSerial(input: SerialLookupInput): Promise<SerialLookupResult>;
}
