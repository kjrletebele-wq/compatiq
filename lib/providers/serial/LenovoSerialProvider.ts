import type { SerialLookupProvider, SerialLookupInput, SerialLookupResult } from './SerialLookupProvider';
import { makeNotConfiguredStatus } from '@/lib/types/providers';
import { maskSerial } from '@/lib/security/maskSerial';

export class LenovoSerialProvider implements SerialLookupProvider {
  name = 'LenovoSerialProvider';

  isConfigured(): boolean {
    return !!process.env.LENOVO_API_KEY;
  }

  canHandle(input: SerialLookupInput): boolean {
    return input.brand?.toLowerCase() === 'lenovo';
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
