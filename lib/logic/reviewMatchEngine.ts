import type { DeviceIdentity, DeviceSpecs } from '@/lib/types/device';

export type ReviewMatchType = 'exactDevice' | 'sameModelFamily' | 'differentVariant' | 'unrelated';

/**
 * Tokens extracted from the target device for matching against review snippets.
 */
interface MatchTokens {
  brand: string;
  brandAliases: string[];    // e.g. ["iphone", "ipad"] for Apple
  series: string | null;     // e.g. "15s" or "14"
  cpuModel: string | null;   // e.g. "7520u"
  cpuFamily: string | null;  // e.g. "ryzen 5"
  isAmd: boolean;
  isIntel: boolean;
  ramGb: number | null;
  storageGb: number | null;
}

/** Brand → product-line aliases that appear in review snippets without the brand name */
const BRAND_ALIASES: Record<string, string[]> = {
  apple:   ['iphone', 'ipad', 'macbook', 'imac'],
  samsung: ['galaxy'],
  google:  ['pixel'],
};

function extractTokens(
  device: DeviceIdentity,
  specs?: DeviceSpecs | null,
): MatchTokens {
  const brand = (device.brand ?? '').toLowerCase().trim();
  const modelStr = ((device.model ?? device.deviceName ?? '')).toLowerCase();

  // Extract series: "15s", "ideapad 5", "aspire 5", etc.
  // Strip brand prefix first
  const modelWithoutBrand = modelStr.replace(new RegExp('^' + brand + '\\s*'), '').trim();
  // Pick the first token that looks like a series (alphanumeric, 2-8 chars)
  const seriesM = modelWithoutBrand.match(/\b(\d+\w{0,4})\b/);
  const series = seriesM?.[1] ?? null;

  const cpuStr = (specs?.cpu ?? '').toLowerCase();

  // CPU model number (e.g. "7520u", "1235u")
  const cpuModelM = cpuStr.match(/\b(\d{4,5}[a-z]{0,3})\b/);
  const cpuModel = cpuModelM?.[1] ?? null;

  // CPU family (e.g. "ryzen 5", "core i5")
  const cpuFamilyM = cpuStr.match(/\b(ryzen\s+[3579]|core\s+[ui]\d|core\s+ultra\s+[579])\b/);
  const cpuFamily = cpuFamilyM?.[1] ?? null;

  const isAmd = /ryzen|amd/.test(cpuStr);
  const isIntel = /intel|core\s+[ui]|core\s+ultra|n\d{3}/.test(cpuStr);

  const brandAliases = BRAND_ALIASES[brand] ?? [];

  return {
    brand,
    brandAliases,
    series,
    cpuModel,
    cpuFamily,
    isAmd,
    isIntel,
    ramGb: specs?.ramGb ?? null,
    storageGb: specs?.storageGb ?? null,
  };
}

/**
 * Classify a review snippet or search result title+snippet against the target device.
 *
 * Returns:
 * - exactDevice    — strong overlap: brand + series + CPU (model or family)
 * - sameModelFamily — brand + series match but CPU is missing or unclear
 * - differentVariant — brand + series match but a conflicting CPU/RAM/storage is present
 * - unrelated       — doesn't match the device at all, or is an accessory/generic article
 */
export function classifyReviewResult(
  text: string,
  device: DeviceIdentity,
  specs?: DeviceSpecs | null,
): ReviewMatchType {
  const t = text.toLowerCase();
  const tokens = extractTokens(device, specs);

  // ── Hard unrelated signals ───────────────────────────────────────────────────
  // Accessories, replacement parts, non-review content
  if (/\b(screen replacement|battery replacement|charger replacement|keyboard replacement|backpack|laptop bag|case|cover|sleeve|skin)\b/i.test(t)) {
    return 'unrelated';
  }
  // YouTube, Reddit, forums, blogs without device mention
  if (/\b(youtube\.com|reddit\.com|quora\.com|forum\.|blog\.|wiki\.)\b/i.test(t) && !tokens.brand) {
    return 'unrelated';
  }

  // ── Brand check — also accept product-line aliases (e.g. "iphone" for Apple) ─
  const brandPresent = tokens.brand.length > 0 && (
    t.includes(tokens.brand) ||
    tokens.brandAliases.some(alias => new RegExp(`\\b${alias}\\b`).test(t))
  );
  if (!brandPresent) return 'unrelated';

  // ── Series check ────────────────────────────────────────────────────────────
  const seriesPresent = tokens.series
    ? new RegExp(`\\b${tokens.series.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`).test(t)
    : false;

  // ── CPU model number match ───────────────────────────────────────────────────
  const cpuModelPresent = tokens.cpuModel ? t.includes(tokens.cpuModel) : false;

  // ── CPU family match ─────────────────────────────────────────────────────────
  const cpuFamilyPresent = tokens.cpuFamily ? t.includes(tokens.cpuFamily) : false;

  // ── Phone/chipless exact match: storage as differentiator ────────────────────
  // When no CPU model/family is extractable (e.g. Apple A-series, phone chips),
  // storage capacity in the snippet acts as the exact-match signal.
  let storageExact = false;
  if (!tokens.cpuModel && !tokens.cpuFamily && tokens.storageGb) {
    const stLabel = tokens.storageGb >= 1024 ? `${tokens.storageGb / 1024}tb` : `${tokens.storageGb}gb`;
    if (t.includes(stLabel)) storageExact = true;
  }

  // ── CPU conflicts ────────────────────────────────────────────────────────────
  const snippetHasIntel = /\b(intel|core\s+i[0-9]|n\d{3})\b/i.test(t);
  const snippetHasAmd = /\b(ryzen|amd)\b/i.test(t);
  const cpuConflict =
    (tokens.isAmd && snippetHasIntel && !snippetHasAmd) ||
    (tokens.isIntel && snippetHasAmd && !snippetHasIntel);

  // ── Ryzen tier conflict ──────────────────────────────────────────────────────
  // e.g. target is Ryzen 5 but snippet is Ryzen 3 or Ryzen 7
  let cpuTierConflict = false;
  if (tokens.cpuFamily) {
    const targetTier = tokens.cpuFamily.match(/ryzen\s+([3579])/)?.[1];
    if (targetTier) {
      const snippetTier = t.match(/ryzen\s+([3579])/)?.[1];
      if (snippetTier && snippetTier !== targetTier) cpuTierConflict = true;
    }
  }

  // ── RAM conflict ─────────────────────────────────────────────────────────────
  let ramConflict = false;
  if (tokens.ramGb) {
    const ramM = t.match(/\b(\d+)\s*gb\s*(ram|memory)\b/i);
    if (ramM) {
      const snippetRam = parseInt(ramM[1]);
      if (snippetRam !== tokens.ramGb && snippetRam > 0) ramConflict = true;
    }
  }

  // ── Storage conflict ─────────────────────────────────────────────────────────
  let storageConflict = false;
  if (tokens.storageGb) {
    const stM = t.match(/\b(\d+)\s*gb\s*(ssd|nvme|hdd|storage)\b/i);
    if (stM) {
      const snippetGb = parseInt(stM[1]);
      if (snippetGb !== tokens.storageGb && snippetGb > 0 && Math.abs(snippetGb - tokens.storageGb) > 32) {
        storageConflict = true;
      }
    }
  }

  // ── Classification ───────────────────────────────────────────────────────────
  if (cpuConflict || cpuTierConflict) return 'differentVariant';

  if (seriesPresent) {
    if (cpuModelPresent || cpuFamilyPresent || storageExact) {
      // Exact: right brand + series + CPU (or right storage for phone/chipless devices)
      if (!ramConflict && !storageConflict) return 'exactDevice';
      // Series + CPU/storage but wrong RAM/storage → same family (config variant)
      return 'sameModelFamily';
    }
    // Right brand + series, CPU missing or unclear
    if (ramConflict || storageConflict) return 'differentVariant';
    return 'sameModelFamily';
  }

  // Brand present but no series match
  if (cpuModelPresent) return 'sameModelFamily'; // specific CPU match is meaningful

  return 'unrelated';
}

/**
 * Build a focused device query string for review searches.
 * Uses brand + series + CPU number for maximum specificity.
 */
export function buildReviewDeviceQuery(
  device: DeviceIdentity,
  specs?: DeviceSpecs | null,
): string {
  const parts: string[] = [];

  if (device.brand) parts.push(device.brand);

  // Series from model (strip leading brand)
  if (device.model) {
    const modelLower = device.model.toLowerCase();
    const brandLower = (device.brand ?? '').toLowerCase();
    const modelWithoutBrand = modelLower.startsWith(brandLower)
      ? device.model.slice(device.brand!.length).trim()
      : device.model;
    if (modelWithoutBrand) parts.push(modelWithoutBrand);
  }

  // Add CPU number for specificity
  if (specs?.cpu) {
    const cpuNumM = specs.cpu.match(/\b(\d{4,5}[A-Z]{0,3})\b/i);
    if (cpuNumM) {
      parts.push(cpuNumM[1]);
    } else {
      // Fall back to family name
      const familyM = specs.cpu.match(/\b(Ryzen\s+[3579]|Core\s+[Ui]\d)\b/i);
      if (familyM) parts.push(familyM[1]);
    }
  }

  return parts.join(' ').slice(0, 70);
}
