import { NextRequest, NextResponse } from 'next/server';
import { analyseProductLink } from '@/lib/providers/product/ProviderRegistry';
import type { ProductLinkInput } from '@/lib/types/product';
import { checkRateLimit, getCallerIp } from '@/lib/security/rateLimiter';

// 10 requests per minute — most expensive route (fetches external URLs)
const RATE_LIMIT_MAX = 10;
const RATE_LIMIT_WINDOW_MS = 60_000;

export async function POST(req: NextRequest) {
  const ip = getCallerIp(req);
  const rl = checkRateLimit(ip, 'analyse-link', RATE_LIMIT_MAX, RATE_LIMIT_WINDOW_MS);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: 'Too many requests. Please wait a moment and try again.' },
      {
        status: 429,
        headers: {
          'Retry-After': String(Math.ceil(rl.resetInMs / 1000)),
          'X-RateLimit-Remaining': '0',
        },
      }
    );
  }

  try {
    const body = await req.json() as ProductLinkInput;

    if (!body.url || typeof body.url !== 'string') {
      return NextResponse.json(
        { error: 'url is required' },
        { status: 400 }
      );
    }

    let parsedUrl: URL;
    try {
      parsedUrl = new URL(body.url);
    } catch {
      return NextResponse.json(
        { error: 'Invalid URL format' },
        { status: 400 }
      );
    }

    const input: ProductLinkInput = {
      url: parsedUrl.toString(),
      country: body.country ?? null,
      city: body.city ?? null,
    };

    const result = await analyseProductLink(input);
    return NextResponse.json(result);
  } catch (err) {
    console.error('[analyse-link] Error:', err instanceof Error ? err.message : 'unknown');
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
