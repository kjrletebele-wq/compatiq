/**
 * SerpApi shared client.
 * https://serpapi.com/search-api
 */

export interface SerpApiShoppingResult {
  position: number;
  title: string;
  link?: string;
  product_link?: string;
  price?: string;
  extracted_price?: number;
  source?: string;
  rating?: number;
  reviews?: number;
  delivery?: string;
  thumbnail?: string;
}

export interface SerpApiOrganicResult {
  position: number;
  title: string;
  link: string;
  snippet?: string;
  displayed_link?: string;
}

export interface SerpApiShoppingResponse {
  shopping_results?: SerpApiShoppingResult[];
  error?: string;
}

export interface SerpApiSearchResponse {
  organic_results?: SerpApiOrganicResult[];
  error?: string;
}

export function serpApiIsConfigured(): boolean {
  return !!process.env.SERPAPI_API_KEY;
}

export async function serpApiShoppingSearch(params: {
  q: string;
  gl?: string;
  hl?: string;
  num?: number;
}): Promise<SerpApiShoppingResponse> {
  const apiKey = process.env.SERPAPI_API_KEY;
  if (!apiKey) throw new Error('SERPAPI_API_KEY not configured.');

  const search = new URLSearchParams({
    engine: 'google_shopping',
    api_key: apiKey,
    q: params.q,
    gl: params.gl ?? 'us',
    hl: params.hl ?? 'en',
    num: String(params.num ?? 20),
  });

  const res = await fetch(`https://serpapi.com/search?${search.toString()}`, {
    signal: AbortSignal.timeout(12000),
  });

  if (!res.ok) {
    throw new Error(`SerpApi Shopping: HTTP ${res.status}`);
  }

  return res.json() as Promise<SerpApiShoppingResponse>;
}

export async function serpApiSearch(params: {
  q: string;
  gl?: string;
  hl?: string;
  num?: number;
}): Promise<SerpApiSearchResponse> {
  const apiKey = process.env.SERPAPI_API_KEY;
  if (!apiKey) throw new Error('SERPAPI_API_KEY not configured.');

  const search = new URLSearchParams({
    engine: 'google',
    api_key: apiKey,
    q: params.q,
    gl: params.gl ?? 'us',
    hl: params.hl ?? 'en',
    num: String(params.num ?? 10),
  });

  const res = await fetch(`https://serpapi.com/search?${search.toString()}`, {
    signal: AbortSignal.timeout(12000),
  });

  if (!res.ok) {
    throw new Error(`SerpApi Search: HTTP ${res.status}`);
  }

  return res.json() as Promise<SerpApiSearchResponse>;
}

/**
 * Pick the best product URL from a SerpApi Shopping result.
 * Google Shopping returns two URLs per result:
 *   - link         → Google's click-tracking redirect (google.com/aclk?...)
 *   - product_link → The merchant's actual product page
 * We always prefer the direct merchant URL so users skip the Google redirect.
 */
export function bestProductUrl(link?: string, productLink?: string): string | null {
  const isGoogleUrl = (u: string) =>
    /^https?:\/\/(?:www\.)?google\./i.test(u) ||
    u.includes('google.com/aclk') ||
    u.includes('google.co.za/aclk');

  // Prefer whichever URL is NOT a Google redirect
  if (productLink && !isGoogleUrl(productLink)) return productLink;
  if (link && !isGoogleUrl(link)) return link;
  // Both are Google URLs (rare) — fall back to product_link as it's closer to the merchant
  return productLink ?? link ?? null;
}

/**
 * Map country name to ISO 3166-1 alpha-2 gl param for SerpApi.
 */
export function countryToGl(country: string | null | undefined): string {
  if (!country) return 'us';
  const c = country.toLowerCase();
  if (c.includes('south africa') || c.includes('za')) return 'za';
  if (c.includes('united kingdom') || c.includes('uk')) return 'gb';
  if (c.includes('australia') || c.includes('au')) return 'au';
  if (c.includes('canada') || c.includes('ca')) return 'ca';
  if (c.includes('germany') || c.includes('de')) return 'de';
  if (c.includes('france') || c.includes('fr')) return 'fr';
  if (c.includes('nigeria') || c.includes('ng')) return 'ng';
  if (c.includes('kenya') || c.includes('ke')) return 'ke';
  return 'us';
}
