import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

/**
 * POST /api/debug/save-env-key
 *
 * Dev-only. Writes SERPAPI_API_KEY into .env.local.
 * - Never logs the key value.
 * - Never returns the key value.
 * - Returns 403 in production.
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'Not available in production.' },
      { status: 403 },
    );
  }

  let body: { key?: unknown };
  try {
    body = await req.json() as { key?: unknown };
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const key = typeof body.key === 'string' ? body.key.trim() : '';
  if (!key) {
    return NextResponse.json({ error: 'Key must be a non-empty string.' }, { status: 400 });
  }

  const envPath = path.join(process.cwd(), '.env.local');

  let existing = '';
  try {
    existing = fs.readFileSync(envPath, 'utf-8');
  } catch {
    existing = '';
  }

  // Replace existing SERPAPI_API_KEY line or append it
  const lines = existing.split('\n');
  let replaced = false;
  const updated = lines.map(line => {
    if (line.startsWith('SERPAPI_API_KEY=')) {
      replaced = true;
      return `SERPAPI_API_KEY=${key}`;
    }
    return line;
  });
  if (!replaced) {
    updated.push(`SERPAPI_API_KEY=${key}`);
  }

  // Write back — never echo the key into logs
  fs.writeFileSync(envPath, updated.join('\n'), 'utf-8');

  return NextResponse.json({
    saved: true,
    message: 'Key saved locally. Restart the dev server, then test Find Parts again.',
  });
}
