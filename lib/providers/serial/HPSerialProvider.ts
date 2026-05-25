import type { SerialLookupProvider, SerialLookupInput, SerialLookupResult } from './SerialLookupProvider';
import { makeNotConfiguredStatus } from '@/lib/types/providers';
import { maskSerial } from '@/lib/security/maskSerial';

export class HPSerialProvider implements SerialLookupProvider {
  name = 'HPSerialProvider';

  isConfigured(): boolean {
    return !!process.env.HP_API_KEY;
  }

  canHandle(input: SerialLookupInput): boolean {
    return input.brand?.toLowerCase() === 'hp' || input.brand?.toLowerCase() === 'hewlett-packard';
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
