import { NextRequest, NextResponse } from 'next/server';
import { lookupSerialNumber } from '@/lib/providers/serial/SerialProviderRegistry';
import type { SerialLookupInput } from '@/lib/providers/serial/SerialLookupProvider';
import { checkRateLimit, getCallerIp } from '@/lib/security/rateLimiter';

// SECURITY: Serial number is NEVER logged, NEVER placed in a URL,
// and is masked immediately in the response.

// 10 requests per minute — same as analyse-link (serial APIs are expensive)
const RATE_LIMIT_MAX = 10;
const RATE_LIMIT_WINDOW_MS = 60_000;

export async function POST(req: NextRequest) {
  const ip = getCallerIp(req);
  const rl = checkRateLimit(ip, 'serial-lookup', RATE_LIMIT_MAX, RATE_LIMIT_WINDOW_MS);
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
    const body = await req.json() as {
      serialNumber?: string;
      category?: string;
      brand?: string | null;
      country?: string | null;
    };

    if (!body.serialNumber || typeof body.serialNumber !== 'string') {
      return NextResponse.json(
        { error: 'serialNumber is required' },
        { status: 400 }
      );
    }

    const validCategories = ['PC', 'Laptop', 'Smartphone'];
    if (!body.category || !validCategories.includes(body.category)) {
      return NextResponse.json(
        { error: 'category must be PC, Laptop, or Smartphone' },
        { status: 400 }
      );
    }

    const input: SerialLookupInput = {
      serialNumber: body.serialNumber.trim(),
      category: body.category as 'PC' | 'Laptop' | 'Smartphone',
      brand: body.brand ?? null,
      country: body.country ?? null,
    };

    const result = await lookupSerialNumber(input);

    // Return result — serial is already masked inside the registry
    return NextResponse.json(result);
  } catch {
    // NEVER log the serial number
    console.error('[serial-lookup] Error processing request');
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
