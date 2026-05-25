import { NextRequest, NextResponse } from 'next/server';
import {
  serpApiIsConfigured,
  serpApiShoppingSearch,
  serpApiSearch,
  countryToGl,
  bestProductUrl,
} from '@/lib/providers/search/SerpApiClient';

/**
 * POST /api/debug/test-serpapi-parts
 * Dev-only. Directly tests SerpApi Shopping + organic fallback.
 * Never logs or returns the API key.
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not available in production.' }, { status: 403 });
  }

  const body = await req.json() as { query?: string; country?: string };
  const query = typeof body.query === 'string' ? body.query.trim() : '';
  const country = typeof body.country === 'string' ? body.country.trim() : null;

  if (!query) {
    return NextResponse.json({ error: 'query is required.' }, { status: 400 });
  }

  const configured = serpApiIsConfigured();

  if (!configured) {
    return NextResponse.json({
      configured: false,
      providerStatus: 'not-configured',
      error: 'SERPAPI_API_KEY is not set in environment. Add it to .env.local and restart the dev server.',
      shoppingResultCount: 0,
      organicResultCount: 0,
      results: [],
    });
  }

  const gl = countryToGl(country);

  // ── Phase 1: Google Shopping ──────────────────────────────────────────────
  let shoppingResultCount = 0;
  let organicResultCount = 0;
  let providerStatus = 'unknown';
  let errorMessage: string | null = null;
  const results: Array<{
    title: string;
    store: string;
    price: string | null;
    url: string;
    source: string;
  }> = [];

  try {
    const shoppingData = await serpApiShoppingSearch({ q: query, gl, num: 10 });

    if (shoppingData.error) {
      throw new Error(`SerpApi Shopping error: ${shoppingData.error}`);
    }

    const shoppingItems = shoppingData.shopping_results ?? [];
    shoppingResultCount = shoppingItems.length;

    if (shoppingItems.length > 0) {
      providerStatus = 'connected';
      for (const item of shoppingItems.slice(0, 5)) {
        results.push({
          title: item.title ?? '(no title)',
          store: item.source ?? 'Google Shopping',
          price: item.price ?? null,
          url: bestProductUrl(item.link, item.product_link) ?? '(no url)',
          source: 'google_shopping',
        });
      }
    } else {
      // ── Phase 2: Organic fallback ────────────────────────────────────────
      const organicData = await serpApiSearch({ q: query + ' buy', gl, num: 10 });

      if (organicData.error) {
        throw new Error(`SerpApi organic error: ${organicData.error}`);
      }

      const organicItems = (organicData.organic_results ?? []).filter(r => {
        const skipPatterns = /reddit|quora|forum|wiki|youtube|how.to|guide|tutorial/i;
        return !skipPatterns.test(r.link) && !skipPatterns.test(r.title ?? '');
      });

      organicResultCount = organicItems.length;

      if (organicItems.length > 0) {
        providerStatus = 'connected-organic-fallback';
        for (const item of organicItems.slice(0, 5)) {
          results.push({
            title: item.title ?? '(no title)',
            store: extractDomain(item.link),
            price: null,
            url: item.link,
            source: 'google_organic',
          });
        }
      } else {
        providerStatus = 'no-results';
      }
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    const isRateLimit = msg.includes('429') || msg.toLowerCase().includes('rate limit');
    const isAuthError = msg.includes('401') || msg.includes('403') || msg.toLowerCase().includes('invalid api key');

    providerStatus = isRateLimit ? 'rate-limited' : isAuthError ? 'auth-failed' : 'failed';
    errorMessage = msg.replace(/api[_-]?key[^\s]*/gi, '[REDACTED]');
  }

  return NextResponse.json({
    configured: true,
    query,
    country: country ?? 'not specified',
    gl,
    providerStatus,
    shoppingResultCount,
    organicResultCount,
    resultCount: results.length,
    results,
    error: errorMessage,
  });
}

function extractDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return 'unknown';
  }
}
