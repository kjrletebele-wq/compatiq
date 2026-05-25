import type { PartsProvider } from './PartsProvider';
import type { PartsSearchInput, PartsSearchResult, PartListing } from '@/lib/types/parts';
import type { ComponentType } from '@/lib/types/upgradeability';
import { makeNotConfiguredStatus, makeConnectedStatus, makeNoResultsStatus } from '@/lib/types/providers';
import { ebayIsConfigured } from '@/lib/providers/ebay/EbayAuth';
import { ebaySearch } from '@/lib/providers/ebay/EbayBrowseProvider';
import type { EbayItemSummary } from '@/lib/providers/ebay/EbayBrowseProvider';
import { buildPartsQuerySet } from '@/lib/logic/partsSearchQueryBuilder';
import { generateId } from '@/lib/utils';

export class EbayPartsProvider implements PartsProvider {
  name = 'eBay Browse API';

  isConfigured(): boolean {
    return ebayIsConfigured();
  }

  async searchParts(input: PartsSearchInput): Promise<PartsSearchResult> {
    const now = new Date().toISOString();

    if (!this.isConfigured()) {
      return {
        success: false,
        providerStatuses: [makeNotConfiguredStatus(this.name)],
        items: [],
        warnings: [],
        lastCheckedAt: now,
      };
    }

    try {
      const querySet = buildPartsQuerySet(
        input.componentType,
        input.device,
        input.specs ?? null,
        input.country ?? null,
      );
      const result = await ebaySearch({ query: querySet.primaryQuery, limit: 20 });

      if (result.items.length === 0) {
        return {
          success: false,
          providerStatuses: [makeNoResultsStatus(this.name)],
          items: [],
          warnings: [],
          lastCheckedAt: now,
        };
      }

      const items = result.items
        .map(item => normaliseEbayItemToPart(item, input.componentType, input.device.brand ?? null, input.device.model ?? null, now))
        .filter((i): i is PartListing => i !== null);

      const warnings = [
        ...querySet.warnings,
        ...(items.length < result.totalCount
          ? [`Showing ${items.length} of ${result.totalCount} eBay results.`]
          : []),
      ];

      return {
        success: items.length > 0,
        providerStatuses: [makeConnectedStatus(this.name, `Found ${items.length} results on eBay.`)],
        items,
        warnings,
        lastCheckedAt: now,
      };
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown eBay error';
      const isRateLimit = msg.includes('429') || msg.toLowerCase().includes('rate');
      return {
        success: false,
        providerStatuses: [{
          providerName: this.name,
          connected: false,
          status: isRateLimit ? 'rate-limited' : 'failed',
          message: msg,
          lastCheckedAt: now,
        }],
        items: [],
        warnings: [],
        lastCheckedAt: now,
      };
    }
  }
}

function normaliseEbayItemToPart(
  item: EbayItemSummary,
  componentType: ComponentType,
  brand: string | null,
  model: string | null,
  now: string
): PartListing | null {
  const title = item.title ?? '';
  const url = item.itemWebUrl;
  if (!title || !url) return null;

  const rawPrice = item.price?.value ? parseFloat(item.price.value) : null;
  const price = rawPrice !== null && !isNaN(rawPrice) ? rawPrice : null;
  const currency = item.price?.currency ?? null;

  const condition = normaliseCondition(item.condition);

  // Compatibility confidence based on title matching
  const titleLower = title.toLowerCase();
  const brandMatch = brand && titleLower.includes(brand.toLowerCase());
  const modelMatch = model && titleLower.includes(model.toLowerCase());

  let confidence: PartListing['compatibilityConfidence'];
  let compatibilityReason: string;
  let sellerQuestion: string | null = null;

  if (brandMatch && modelMatch) {
    confidence = 'high';
    compatibilityReason = `Title matches brand (${brand}) and model (${model}).`;
  } else if (brandMatch || modelMatch) {
    confidence = 'medium';
    compatibilityReason = `Title matches ${brandMatch ? `brand (${brand})` : `model (${model})`}. Verify full compatibility before purchasing.`;
    sellerQuestion = `Is this compatible with ${brand ?? ''} ${model ?? ''}? Please confirm before ordering.`;
  } else {
    confidence = 'low';
    compatibilityReason = 'Generic search result. Verify brand and model compatibility before purchasing.';
    sellerQuestion = `Is this compatible with ${brand ?? 'this device'} ${model ?? ''}?`;
  }

  return {
    id: `ebay-${item.itemId ?? generateId()}`,
    productName: title.slice(0, 200),
    componentType,
    storeName: 'eBay',
    price,
    currency,
    availability: 'See listing',
    condition,
    country: item.itemLocation?.country ?? null,
    city: item.itemLocation?.city ?? null,
    productUrl: url,
    imageUrl: item.image?.imageUrl ?? null,
    compatibilityConfidence: confidence,
    compatibilityReason,
    missingConfirmation: confidence !== 'high'
      ? 'Verify exact model compatibility with seller before purchasing.'
      : null,
    sellerQuestion,
    sourceProvider: 'eBay Browse API',
    lastCheckedAt: now,
  };
}

function normaliseCondition(raw?: string): PartListing['condition'] {
  if (!raw) return 'Unknown';
  const r = raw.toLowerCase();
  if (r.includes('new')) return 'New';
  if (r.includes('refurb') || r.includes('renewed') || r.includes('seller refurb')) return 'Refurbished';
  if (r.includes('used') || r.includes('pre-owned') || r.includes('good') || r.includes('acceptable')) return 'Used';
  return 'Unknown';
}
