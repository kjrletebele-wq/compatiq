import type { SerialLookupProvider, SerialLookupInput, SerialLookupResult } from './SerialLookupProvider';
import { makeNotConfiguredStatus } from '@/lib/types/providers';
import { maskSerial } from '@/lib/security/maskSerial';

export class DellSerialProvider implements SerialLookupProvider {
  name = 'DellSerialProvider';

  isConfigured(): boolean {
    return !!(process.env.DELL_CLIENT_ID && process.env.DELL_CLIENT_SECRET);
  }

  canHandle(input: SerialLookupInput): boolean {
    return input.brand?.toLowerCase() === 'dell' || input.category === 'PC' || input.category === 'Laptop';
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
