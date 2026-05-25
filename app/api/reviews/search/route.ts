import { NextRequest, NextResponse } from 'next/server';
import { searchReviewsAllProviders } from '@/lib/providers/core/ProviderRegistry';
import type { ReviewSearchInput } from '@/lib/types/reviews';
import { checkRateLimit, getCallerIp } from '@/lib/security/rateLimiter';

// 20 requests per minute
const RATE_LIMIT_MAX = 20;
const RATE_LIMIT_WINDOW_MS = 60_000;

export async function POST(req: NextRequest) {
  const ip = getCallerIp(req);
  const rl = checkRateLimit(ip, 'reviews-search', RATE_LIMIT_MAX, RATE_LIMIT_WINDOW_MS);
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
    const body = await req.json() as ReviewSearchInput;

    if (!body.device) {
      return NextResponse.json(
        { error: 'device is required' },
        { status: 400 }
      );
    }

    const input: ReviewSearchInput = {
      device: body.device,
      specs: body.specs ?? null,
    };

    const result = await searchReviewsAllProviders(input);
    return NextResponse.json(result);
  } catch (err) {
    console.error('[reviews/search] Error:', err instanceof Error ? err.message : 'unknown');
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
