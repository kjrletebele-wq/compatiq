/**
 * Manufacturer serial lookup provider stubs.
 * Never log or expose the serial number.
 * These return not-configured until official manufacturer API credentials are added.
 */

import type { SerialLookupProvider, SerialLookupInput, SerialLookupResult } from './SerialLookupProvider';
import { makeNotConfiguredStatus } from '@/lib/types/providers';
import { maskSerial } from '@/lib/security/maskSerial';

function makeManufacturerStub(
  providerName: string,
  envKeys: string[],
  brandMatch: string[]
): SerialLookupProvider {
  return {
    name: providerName,
    isConfigured(): boolean {
      return envKeys.every(k => !!process.env[k]);
    },
    canHandle(input: SerialLookupInput): boolean {
      const brand = (input.brand ?? '').toLowerCase();
      return brandMatch.some(b => brand === b || brand.startsWith(b));
    },
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
        providerStatuses: [makeNotConfiguredStatus(providerName)],
        warnings: [],
        lastCheckedAt: now,
      };
    },
  };
}

export const SamsungSerialProvider = makeManufacturerStub(
  'Samsung API',
  ['SAMSUNG_API_KEY'],
  ['samsung']
);

export const AsusSerialProvider = makeManufacturerStub(
  'Asus API',
  ['ASUS_API_KEY'],
  ['asus']
);

export const AcerSerialProvider = makeManufacturerStub(
  'Acer API',
  ['ACER_API_KEY'],
  ['acer']
);

export const MicrosoftSurfaceProvider = makeManufacturerStub(
  'Microsoft Surface API',
  ['MICROSOFT_SURFACE_API_KEY'],
  ['microsoft', 'surface']
);
