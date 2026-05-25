import { NextRequest, NextResponse } from 'next/server';
import { evaluatePurposeFit } from '@/lib/logic/purposeFitEngine';
import { generateUpgradeability } from '@/lib/logic/upgradeabilityEngine';
import { getMissingInformation } from '@/lib/logic/missingInformationEngine';
import { detectConflicts } from '@/lib/logic/conflictDetectionEngine';
import type { AdvisoryRequest, AdvisoryResult } from '@/lib/types/advisory';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as AdvisoryRequest;

    if (!body.device || !body.purpose) {
      return NextResponse.json(
        { error: 'device and purpose are required' },
        { status: 400 }
      );
    }

    const purposeFit = evaluatePurposeFit(body.specs ?? null, body.purpose, body.device.category);
    const upgradeability = generateUpgradeability(body.device.category, body.specs ?? null);
    const missingInformation = getMissingInformation(body.device.category, body.specs ?? null);

    // Conflict warnings from extracted data
    const conflictWarnings = detectConflicts(body.specs ?? null, body.specs?.rawText ?? '');

    const result: AdvisoryResult & {
      upgradeability: typeof upgradeability;
      conflictWarnings: string[];
    } = {
      purposeFit,
      upgradeability,
      missingInformation,
      conflictWarnings,
      confidence: purposeFit.confidence,
      generatedAt: new Date().toISOString(),
    };

    return NextResponse.json(result);
  } catch (err) {
    console.error('[advisory] Error:', err instanceof Error ? err.message : 'unknown');
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
