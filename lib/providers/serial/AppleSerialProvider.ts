import type { SerialLookupProvider, SerialLookupInput, SerialLookupResult } from './SerialLookupProvider';
import { makeNotConfiguredStatus } from '@/lib/types/providers';
import { maskSerial } from '@/lib/security/maskSerial';

export class AppleSerialProvider implements SerialLookupProvider {
  name = 'AppleSerialProvider';

  isConfigured(): boolean {
    return !!(process.env.APPLE_GSX_CERT && process.env.APPLE_GSX_KEY);
  }

  canHandle(input: SerialLookupInput): boolean {
    return input.brand?.toLowerCase() === 'apple';
  }

  async lookupSerial(input: SerialLookupInput): Promise<SerialLookupResult> {
    const now = new Date().toISOString();
    return {
      success: false,
      sourceType: 'not-connected',
      maskedSerial: maskSerial(input.serialNumber),
      device: null,
      specs: null,
      upgradeability: [],
      warranty: null,
      providerStatuses: [makeNotConfiguredStatus(this.name)],
      warnings: [],
      lastCheckedAt: now,
    };
  }
}
