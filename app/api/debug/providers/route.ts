import { NextResponse } from 'next/server';

/**
 * GET /api/debug/providers
 *
 * Dev-only endpoint. Returns every registered provider with:
 *   - name, category, configured (boolean), missingEnvVars[]
 *
 * Returns 403 in production (NODE_ENV === 'production').
 */

interface ProviderDebugEntry {
  name: string;
  category: 'parts' | 'store' | 'reviews' | 'serial' | 'barcode' | 'security';
  configured: boolean;
  missingEnvVars: string[];
  envVarNote?: string;
}

const PROVIDER_REGISTRY: ProviderDebugEntry[] = [
  // ── Parts ──────────────────────────────────────────────────────────────────
  {
    name: 'eBay Browse API',
    category: 'parts',
    configured: !!(process.env.EBAY_CLIENT_ID && process.env.EBAY_CLIENT_SECRET),
    missingEnvVars: [
      ...(!process.env.EBAY_CLIENT_ID ? ['EBAY_CLIENT_ID'] : []),
      ...(!process.env.EBAY_CLIENT_SECRET ? ['EBAY_CLIENT_SECRET'] : []),
    ],
    envVarNote: 'Register at https://developer.ebay.com/ — free sandbox + production keys available.',
  },
  {
    name: 'SerpApi Shopping',
    category: 'parts',
    configured: !!process.env.SERPAPI_API_KEY,
    missingEnvVars: !process.env.SERPAPI_API_KEY ? ['SERPAPI_API_KEY'] : [],
    envVarNote: 'Register at https://serpapi.com/ — 100 free searches/month on free plan.',
  },
  {
    name: 'Best Buy',
    category: 'parts',
    configured: !!process.env.BESTBUY_API_KEY,
    missingEnvVars: !process.env.BESTBUY_API_KEY ? ['BESTBUY_API_KEY'] : [],
    envVarNote: 'US market only. Register at https://bestbuyapis.github.io/api-documentation/',
  },
  {
    name: 'Amazon PA API',
    category: 'parts',
    configured: !!(process.env.AMAZON_API_KEY && process.env.AMAZON_API_SECRET && process.env.AMAZON_PARTNER_TAG),
    missingEnvVars: [
      ...(!process.env.AMAZON_API_KEY ? ['AMAZON_API_KEY'] : []),
      ...(!process.env.AMAZON_API_SECRET ? ['AMAZON_API_SECRET'] : []),
      ...(!process.env.AMAZON_PARTNER_TAG ? ['AMAZON_PARTNER_TAG'] : []),
    ],
    envVarNote: 'Requires Amazon Associates account with qualifying sales activity.',
  },

  // ── Store ──────────────────────────────────────────────────────────────────
  {
    name: 'eBay Store Search',
    category: 'store',
    configured: !!(process.env.EBAY_CLIENT_ID && process.env.EBAY_CLIENT_SECRET),
    missingEnvVars: [
      ...(!process.env.EBAY_CLIENT_ID ? ['EBAY_CLIENT_ID'] : []),
      ...(!process.env.EBAY_CLIENT_SECRET ? ['EBAY_CLIENT_SECRET'] : []),
    ],
  },
  {
    name: 'SerpApi Store Search',
    category: 'store',
    configured: !!process.env.SERPAPI_API_KEY,
    missingEnvVars: !process.env.SERPAPI_API_KEY ? ['SERPAPI_API_KEY'] : [],
  },
  {
    name: 'Takealot',
    category: 'store',
    configured: !!process.env.TAKEALOT_API_KEY,
    missingEnvVars: !process.env.TAKEALOT_API_KEY ? ['TAKEALOT_API_KEY'] : [],
    envVarNote: 'No public API available — awaiting official data feed partnership.',
  },
  {
    name: 'Incredible Connection',
    category: 'store',
    configured: !!process.env.INCREDIBLE_CONNECTION_API_KEY,
    missingEnvVars: !process.env.INCREDIBLE_CONNECTION_API_KEY ? ['INCREDIBLE_CONNECTION_API_KEY'] : [],
    envVarNote: 'No public API available — awaiting official data feed partnership.',
  },
  {
    name: 'Evetech',
    category: 'store',
    configured: !!process.env.EVETECH_API_KEY,
    missingEnvVars: !process.env.EVETECH_API_KEY ? ['EVETECH_API_KEY'] : [],
  },
  {
    name: 'Wootware',
    category: 'store',
    configured: !!process.env.WOOTWARE_API_KEY,
    missingEnvVars: !process.env.WOOTWARE_API_KEY ? ['WOOTWARE_API_KEY'] : [],
  },
  {
    name: 'iStore',
    category: 'store',
    configured: !!process.env.ISTORE_API_KEY,
    missingEnvVars: !process.env.ISTORE_API_KEY ? ['ISTORE_API_KEY'] : [],
  },
  {
    name: 'Makro',
    category: 'store',
    configured: !!process.env.MAKRO_API_KEY,
    missingEnvVars: !process.env.MAKRO_API_KEY ? ['MAKRO_API_KEY'] : [],
  },
  {
    name: 'Computer Mania',
    category: 'store',
    configured: !!process.env.COMPUTER_MANIA_API_KEY,
    missingEnvVars: !process.env.COMPUTER_MANIA_API_KEY ? ['COMPUTER_MANIA_API_KEY'] : [],
  },
  {
    name: 'GeeWiz',
    category: 'store',
    configured: !!process.env.GEEWIZ_API_KEY,
    missingEnvVars: !process.env.GEEWIZ_API_KEY ? ['GEEWIZ_API_KEY'] : [],
  },

  // ── Reviews ────────────────────────────────────────────────────────────────
  {
    name: 'SerpApi Reviews',
    category: 'reviews',
    configured: !!process.env.SERPAPI_API_KEY,
    missingEnvVars: !process.env.SERPAPI_API_KEY ? ['SERPAPI_API_KEY'] : [],
  },

  // ── Serial Lookup ──────────────────────────────────────────────────────────
  {
    name: 'Dell Serial Lookup',
    category: 'serial',
    configured: !!(process.env.DELL_CLIENT_ID && process.env.DELL_CLIENT_SECRET),
    missingEnvVars: [
      ...(!process.env.DELL_CLIENT_ID ? ['DELL_CLIENT_ID'] : []),
      ...(!process.env.DELL_CLIENT_SECRET ? ['DELL_CLIENT_SECRET'] : []),
    ],
    envVarNote: 'Register at https://developer.dell.com/',
  },
  {
    name: 'HP Serial Lookup',
    category: 'serial',
    configured: !!process.env.HP_API_KEY,
    missingEnvVars: !process.env.HP_API_KEY ? ['HP_API_KEY'] : [],
    envVarNote: 'HP Developer Portal — requires business account approval.',
  },
  {
    name: 'Lenovo Serial Lookup',
    category: 'serial',
    configured: !!process.env.LENOVO_API_KEY,
    missingEnvVars: !process.env.LENOVO_API_KEY ? ['LENOVO_API_KEY'] : [],
  },
  {
    name: 'Apple Serial Lookup (GSX)',
    category: 'serial',
    configured: !!(process.env.APPLE_GSX_CERT && process.env.APPLE_GSX_KEY),
    missingEnvVars: [
      ...(!process.env.APPLE_GSX_CERT ? ['APPLE_GSX_CERT'] : []),
      ...(!process.env.APPLE_GSX_KEY ? ['APPLE_GSX_KEY'] : []),
    ],
    envVarNote: 'Requires Apple Authorised Service Provider agreement.',
  },
  {
    name: 'Samsung Serial Lookup',
    category: 'serial',
    configured: !!process.env.SAMSUNG_API_KEY,
    missingEnvVars: !process.env.SAMSUNG_API_KEY ? ['SAMSUNG_API_KEY'] : [],
  },
  {
    name: 'Asus Serial Lookup',
    category: 'serial',
    configured: !!process.env.ASUS_API_KEY,
    missingEnvVars: !process.env.ASUS_API_KEY ? ['ASUS_API_KEY'] : [],
  },
  {
    name: 'Acer Serial Lookup',
    category: 'serial',
    configured: !!process.env.ACER_API_KEY,
    missingEnvVars: !process.env.ACER_API_KEY ? ['ACER_API_KEY'] : [],
  },
  {
    name: 'Microsoft Surface Lookup',
    category: 'serial',
    configured: !!process.env.MICROSOFT_SURFACE_API_KEY,
    missingEnvVars: !process.env.MICROSOFT_SURFACE_API_KEY ? ['MICROSOFT_SURFACE_API_KEY'] : [],
  },

  // ── Barcode ────────────────────────────────────────────────────────────────
  {
    name: 'UPCItemDB',
    category: 'barcode',
    configured: !!process.env.UPCITEMDB_API_KEY,
    missingEnvVars: !process.env.UPCITEMDB_API_KEY ? ['UPCITEMDB_API_KEY'] : [],
    envVarNote: 'Limited free tier available at https://www.upcitemdb.com/',
  },
  {
    name: 'BarcodeLookup',
    category: 'barcode',
    configured: !!process.env.BARCODELOOKUP_API_KEY,
    missingEnvVars: !process.env.BARCODELOOKUP_API_KEY ? ['BARCODELOOKUP_API_KEY'] : [],
  },
  {
    name: 'EAN Search',
    category: 'barcode',
    configured: !!process.env.EAN_SEARCH_API_KEY,
    missingEnvVars: !process.env.EAN_SEARCH_API_KEY ? ['EAN_SEARCH_API_KEY'] : [],
  },
  {
    name: 'GoUPC',
    category: 'barcode',
    configured: !!process.env.GOUPC_API_KEY,
    missingEnvVars: !process.env.GOUPC_API_KEY ? ['GOUPC_API_KEY'] : [],
  },

  // ── Security ───────────────────────────────────────────────────────────────
  {
    name: 'NVD (CVE Lookup)',
    category: 'security',
    // NVD free tier works without key; key gives higher rate limits
    configured: true,
    missingEnvVars: [],
    envVarNote: process.env.NVD_API_KEY
      ? 'NVD_API_KEY is set — higher rate limits active.'
      : 'NVD_API_KEY not set — using free tier (rate-limited). Get a key at https://nvd.nist.gov/developers/request-an-api-key',
  },
];

export async function GET(): Promise<NextResponse> {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Debug endpoint not available in production.' }, { status: 403 });
  }

  const configured = PROVIDER_REGISTRY.filter(p => p.configured);
  const notConfigured = PROVIDER_REGISTRY.filter(p => !p.configured);

  const byCategory = PROVIDER_REGISTRY.reduce<Record<string, ProviderDebugEntry[]>>((acc, p) => {
    if (!acc[p.category]) acc[p.category] = [];
    acc[p.category].push(p);
    return acc;
  }, {});

  return NextResponse.json({
    summary: {
      total: PROVIDER_REGISTRY.length,
      configured: configured.length,
      notConfigured: notConfigured.length,
    },
    quickStart: [
      'Copy .env.example to .env.local',
      'Set SERPAPI_API_KEY (serpapi.com — 100 free/month) to enable parts and store search immediately',
      'Set EBAY_CLIENT_ID + EBAY_CLIENT_SECRET (developer.ebay.com — free) for eBay listings',
      'Restart the dev server after editing .env.local',
      'Re-fetch this endpoint to confirm which providers are now configured',
    ],
    byCategory,
    notConfiguredEnvVars: notConfigured
      .filter(p => p.missingEnvVars.length > 0)
      .flatMap(p => p.missingEnvVars)
      .filter((v, i, a) => a.indexOf(v) === i) // deduplicate
      .sort(),
  });
}
