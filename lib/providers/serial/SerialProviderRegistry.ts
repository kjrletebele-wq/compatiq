import type { SerialLookupProvider, SerialLookupInput, SerialLookupResult } from './SerialLookupProvider';
import { DellSerialProvider } from './DellSerialProvider';
import { HPSerialProvider } from './HPSerialProvider';
import { LenovoSerialProvider } from './LenovoSerialProvider';
import { AppleSerialProvider } from './AppleSerialProvider';
import {
  SamsungSerialProvider,
  AsusSerialProvider,
  AcerSerialProvider,
  MicrosoftSurfaceProvider,
} from './ManufacturerStubs';
import { maskSerial } from '@/lib/security/maskSerial';
import { makeNotConfiguredStatus } from '@/lib/types/providers';

const providers: SerialLookupProvider[] = [
  new AppleSerialProvider(),
  new DellSerialProvider(),
  new HPSerialProvider(),
  new LenovoSerialProvider(),
  SamsungSerialProvider,
  AsusSerialProvider,
  AcerSerialProvider,
  MicrosoftSurfaceProvider,
];

export async function lookupSerialNumber(input: SerialLookupInput): Promise<SerialLookupResult> {
  const now = new Date().toISOString();
  const masked = maskSerial(input.serialNumber);
  const allStatuses = [];

  for (const provider of providers) {
    if (!provider.canHandle(input)) {
      // Don't show skipped providers in status — too noisy
      continue;
    }
    if (!provider.isConfigured()) {
      allStatuses.push(makeNotConfiguredStatus(provider.name));
      continue;
    }
    const result = await provider.lookupSerial(input);
    allStatuses.push(...result.providerStatuses);
    if (result.success) {
      return { ...result, maskedSerial: masked, providerStatuses: allStatuses };
    }
  }

  // If no provider matched brand, show all relevant providers as not-configured
  if (allStatuses.length === 0) {
    for (const provider of providers) {
      allStatuses.push(makeNotConfiguredStatus(provider.name));
    }
  }

  return {
    success: false,
    sourceType: 'not-connected',
    maskedSerial: masked,
    device: null,
    specs: null,
    upgradeability: [],
    warranty: null,
    providerStatuses: allStatuses.length ? allStatuses : [makeNotConfiguredStatus('SerialProviderRegistry')],
    warnings: ['Live serial lookup is not connected yet. Enter device details manually to continue.'],
    lastCheckedAt: now,
  };
}
