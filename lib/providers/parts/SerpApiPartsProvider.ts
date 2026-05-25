import type { PartsProvider } from './PartsProvider';
import type { PartsSearchInput, PartsSearchResult, PartListing } from '@/lib/types/parts';
import type { ComponentType } from '@/lib/types/upgradeability';
import {
  makeNotConfiguredStatus, makeConnectedStatus, makeNoResultsStatus,
} from '@/lib/types/providers';
import {
  serpApiIsConfigured,
  serpApiShoppingSearch,
  serpApiSearch,
  countryToGl,
  bestProductUrl,
} from '@/lib/providers/search/SerpApiClient';
import type { SerpApiShoppingResult, SerpApiOrganicResult } from '@/lib/providers/search/SerpApiClient';
import { buildPartsQuerySet } from '@/lib/logic/partsSearchQueryBuilder';
import { generateId } from '@/lib/utils';

export class SerpApiPartsProvider implements PartsProvider {
  name = 'SerpApi Shopping';

  isConfigured(): boolean {
    return serpApiIsConfigured();
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

    const querySet = buildPartsQuerySet(
      input.componentType,
      input.device,
      input.specs ?? null,
      input.country ?? null,
    );
    const gl = countryToGl(input.country);

    try {
      // --- Phase 1: Google Shopping ---
      const shoppingData = await serpApiShoppingSearch({
        q: querySet.primaryQuery,
        gl,
        num: 20,
      });

      if (shoppingData.error) {
        throw new Error(shoppingData.error);
      }

      const shoppingResults = shoppingData.shopping_results ?? [];

      if (shoppingResults.length > 0) {
        const items = shoppingResults
          .map(r => normaliseShoppingItemToPart(
            r, input.componentType,
            input.device.brand ?? null,
            input.device.model ?? null,
            input.country ?? null,
            now,
          ))
          .filter((i): i is PartListing => i !== null);

        return {
          success: items.length > 0,
          providerStatuses: [makeConnectedStatus(this.name, `Found ${items.length} shopping results.`)],
          items,
          warnings: querySet.warnings,
          lastCheckedAt: now,
        };
      }

      // --- Phase 2: Organic fallback when Shopping returns nothing ---
      const organicData = await serpApiSearch({
        q: querySet.primaryQuery + ' buy',
        gl,
        num: 10,
      });

      if (organicData.error) {
        throw new Error(organicData.error);
      }

      const organicResults = organicData.organic_results ?? [];

      if (organicResults.length === 0) {
        return {
          success: false,
          providerStatuses: [makeNoResultsStatus(this.name)],
          items: [],
          warnings: querySet.warnings,
          lastCheckedAt: now,
        };
      }

      const organicItems = organicResults
        .map(r => normaliseOrganicResultToPart(
          r, input.componentType,
          input.device.brand ?? null,
          input.device.model ?? null,
          input.country ?? null,
          now,
        ))
        .filter((i): i is PartListing => i !== null);

      return {
        success: organicItems.length > 0,
        providerStatuses: [makeConnectedStatus(
          'SerpApi Google Search',
          `Shopping returned no results — found ${organicItems.length} organic results.`,
        )],
        items: organicItems,
        warnings: [
          ...querySet.warnings,
          'Results are from Google organic search, not shopping listings. Prices and availability may not be shown.',
        ],
        lastCheckedAt: now,
      };
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown SerpApi error';
      const isRateLimit = msg.includes('429') || msg.toLowerCase().includes('rate limit');
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

function normaliseShoppingItemToPart(
  item: SerpApiShoppingResult,
  componentType: ComponentType,
  brand: string | null,
  model: string | null,
  country: string | null,
  now: string,
): PartListing | null {
  const title = item.title?.trim();
  const url = bestProductUrl(item.link, item.product_link);
  if (!title || !url) return null;

  const price = item.extracted_price ?? null;
  const currency = detectCurrency(item.price ?? '');

  const { confidence, compatibilityReason, sellerQuestion } = scoreConfidence(title, brand, model);

  return {
    id: `serp-${generateId()}`,
    productName: title.slice(0, 200),
    componentType,
    storeName: item.source ?? 'Google Shopping',
    price,
    currency,
    availability: null,
    condition: 'Unknown',
    country: country ?? null,
    city: null,
    productUrl: url,
    imageUrl: item.thumbnail ?? null,
    compatibilityConfidence: confidence,
    compatibilityReason,
    missingConfirmation: confidence !== 'high' ? 'Verify compatibility with seller.' : null,
    sellerQuestion,
    sourceProvider: 'SerpApi Shopping',
    lastCheckedAt: now,
  };
}

function normaliseOrganicResultToPart(
  item: SerpApiOrganicResult,
  componentType: ComponentType,
  brand: string | null,
  model: string | null,
  country: string | null,
  now: string,
): PartListing | null {
  const title = item.title?.trim();
  const url = item.link;
  if (!title || !url) return null;

  // Skip non-retail organic results (forum posts, guides, etc.)
  const skipPatterns = /reddit|quora|forum|wiki|youtube|how.to|guide|tutorial/i;
  if (skipPatterns.test(url) || skipPatterns.test(title)) return null;

  const { confidence, compatibilityReason, sellerQuestion } = scoreConfidence(title, brand, model);

  const storeName = extractDomainLabel(url);

  return {
    id: `serp-organic-${generateId()}`,
    productName: title.slice(0, 200),
    componentType,
    storeName,
    price: null,
    currency: null,
    availability: null,
    condition: 'Unknown',
    country: country ?? null,
    city: null,
    productUrl: url,
    imageUrl: null,
    compatibilityConfidence: confidence === 'high' ? 'medium' : 'low', // organic = lower confidence cap
    compatibilityReason: compatibilityReason + ' (organic result — no price data)',
    missingConfirmation: 'Verify compatibility and price on the linked page.',
    sellerQuestion,
    sourceProvider: 'SerpApi Google Search',
    lastCheckedAt: now,
  };
}

function scoreConfidence(
  title: string,
  brand: string | null,
  model: string | null,
): { confidence: PartListing['compatibilityConfidence']; compatibilityReason: string; sellerQuestion: string | null } {
  const titleLower = title.toLowerCase();
  const brandMatch = brand && titleLower.includes(brand.toLowerCase());
  const modelMatch = model && titleLower.includes(model.toLowerCase());

  if (brandMatch && modelMatch) {
    return {
      confidence: 'high',
      compatibilityReason: `Title matches brand and model.`,
      sellerQuestion: null,
    };
  } else if (brandMatch || modelMatch) {
    return {
      confidence: 'medium',
      compatibilityReason: `Partial match. Verify full compatibility before purchasing.`,
      sellerQuestion: `Is this compatible with ${brand ?? ''} ${model ?? ''}?`,
    };
  } else {
    return {
      confidence: 'low',
      compatibilityReason: 'Generic search result — confirm brand and model compatibility before purchasing.',
      sellerQuestion: `Please confirm this is compatible with ${brand ?? 'this device'} ${model ?? ''}.`,
    };
  }
}

function extractDomainLabel(url: string): string {
  try {
    const host = new URL(url).hostname.replace(/^www\./, '');
    // Map known domains to friendly names
    const known: Record<string, string> = {
      'takealot.com': 'Takealot',
      'amazon.com': 'Amazon',
      'amazon.co.uk': 'Amazon UK',
      'ebay.com': 'eBay',
      'incredible.co.za': 'Incredible Connection',
      'evetech.co.za': 'Evetech',
      'wootware.co.za': 'Wootware',
      'istore.co.za': 'iStore',
      'geewiz.co.za': 'GeeWiz',
      'bestbuy.com': 'Best Buy',
      'newegg.com': 'Newegg',
    };
    return known[host] ?? host;
  } catch {
    return 'Web result';
  }
}

function detectCurrency(priceStr: string): string | null {
  if (!priceStr) return null;
  if (priceStr.startsWith('R') || priceStr.includes('ZAR')) return 'ZAR';
  if (priceStr.startsWith('£') || priceStr.includes('GBP')) return 'GBP';
  if (priceStr.startsWith('€') || priceStr.includes('EUR')) return 'EUR';
  if (priceStr.startsWith('A$') || priceStr.includes('AUD')) return 'AUD';
  if (priceStr.startsWith('$') || priceStr.includes('USD')) return 'USD';
  return null;
}
