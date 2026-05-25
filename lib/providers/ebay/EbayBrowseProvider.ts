/**
 * eBay Browse API — item_summary/search
 * Used for device and parts searches.
 * Returns raw eBay item summaries, normalised by callers.
 */

import { getEbayAppToken, getEbayMarketplaceId } from './EbayAuth';

export interface EbayItemSummary {
  itemId: string;
  title: string;
  price?: { value: string; currency: string };
  condition?: string;
  itemWebUrl?: string;
  image?: { imageUrl: string };
  seller?: { username: string };
  shippingOptions?: Array<{ shippingCost?: { value: string; currency: string } }>;
  itemLocation?: { country: string; city?: string };
  categories?: Array<{ categoryId: string; categoryName: string }>;
}

export interface EbaySearchOptions {
  query: string;
  limit?: number;
  offset?: number;
  filterCondition?: 'NEW' | 'USED' | 'UNSPECIFIED';
  categoryId?: string;
}

export interface EbaySearchResult {
  items: EbayItemSummary[];
  totalCount: number;
}

export async function ebaySearch(options: EbaySearchOptions): Promise<EbaySearchResult> {
  const token = await getEbayAppToken();
  const marketplaceId = getEbayMarketplaceId();

  const params = new URLSearchParams({
    q: options.query,
    limit: String(options.limit ?? 20),
    offset: String(options.offset ?? 0),
  });

  if (options.filterCondition) {
    params.set('filter', `conditionIds:${conditionToId(options.filterCondition)}`);
  }

  if (options.categoryId) {
    params.set('category_ids', options.categoryId);
  }

  const url = `https://api.ebay.com/buy/browse/v1/item_summary/search?${params.toString()}`;

  const res = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'X-EBAY-C-MARKETPLACE-ID': marketplaceId,
      'X-EBAY-C-ENDUSERCTX': 'contextualLocation=country=ZA',
      'Content-Type': 'application/json',
    },
    signal: AbortSignal.timeout(10000),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => 'unknown');
    throw new Error(`eBay Browse API error: HTTP ${res.status} — ${text.slice(0, 300)}`);
  }

  const data = await res.json() as {
    total?: number;
    itemSummaries?: EbayItemSummary[];
  };

  return {
    items: data.itemSummaries ?? [],
    totalCount: data.total ?? 0,
  };
}

function conditionToId(cond: string): string {
  if (cond === 'NEW') return '1000';
  if (cond === 'USED') return '3000';
  return '0';
}
