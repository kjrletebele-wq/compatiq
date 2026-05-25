import type { ProductLinkProvider } from './ProductLinkProvider';
import { GenericMetadataProvider } from './GenericMetadataProvider';
import { EbayProductProvider } from './EbayProductProvider';
import type { ProductLinkInput, ProductLinkResult } from '@/lib/types/product';

const providers: ProductLinkProvider[] = [
  new EbayProductProvider(),
  new GenericMetadataProvider(), // last resort — always runs
];

export async function analyseProductLink(input: ProductLinkInput): Promise<ProductLinkResult> {
  const now = new Date().toISOString();
  const allStatuses = [];

  for (const provider of providers) {
    if (!provider.canHandle(input.url)) continue;
    const result = await provider.analyseLink(input);
    allStatuses.push(...result.providerStatuses);
    if (result.success) {
      return { ...result, providerStatuses: allStatuses };
    }
  }

  return {
    success: false,
    sourceType: 'manual-required',
    providerStatuses: allStatuses,
    device: null,
    specs: null,
    storeListing: null,
    warnings: ['No provider could analyse this link. Enter device details manually.'],
    lastCheckedAt: now,
  };
}
