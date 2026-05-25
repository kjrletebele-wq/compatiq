import type { StoreSearchProvider } from './StoreSearchProvider';
import type { DeviceStoreSearchInput, StoreSearchResult, StoreListing } from '@/lib/types/product';
import type { DeviceSpecs } from '@/lib/types/device';
import {
  makeNotConfiguredStatus, makeConnectedStatus, makeFailedStatus, makeNoResultsStatus,
} from '@/lib/types/providers';
import {
  serpApiIsConfigured, serpApiShoppingSearch, countryToGl, bestProductUrl,
} from '@/lib/providers/search/SerpApiClient';
import type { SerpApiShoppingResult } from '@/lib/providers/search/SerpApiClient';
import { generateId } from '@/lib/utils';

export class SerpApiStoreProvider implements StoreSearchProvider {
  name = 'SerpApi Shopping';

  isConfigured(): boolean {
    return serpApiIsConfigured();
  }

  async searchDevice(input: DeviceStoreSearchInput): Promise<StoreSearchResult> {
    const now = new Date().toISOString();

    if (!this.isConfigured()) {
      return {
        success: false,
        providerStatuses: [makeNotConfiguredStatus(this.name)],
        items: [],
        warnings: [],
        lastCheckedAt: now,
      };
    }

    try {
      const primaryQuery = buildDeviceQuery(input, 'primary');
      const gl = countryToGl(input.country);
      const data = await serpApiShoppingSearch({ q: primaryQuery, gl, num: 20 });

      if (data.error) throw new Error(data.error);

      let results = data.shopping_results ?? [];

      // If primary query yields no exact/likely results, try a fallback query
      if (results.length < 3) {
        const fallbackQuery = buildDeviceQuery(input, 'fallback');
        if (fallbackQuery !== primaryQuery) {
          const fallbackData = await serpApiShoppingSearch({ q: fallbackQuery, gl, num: 20 });
          if (!fallbackData.error) {
            results = [...results, ...(fallbackData.shopping_results ?? [])];
          }
        }
      }

      if (results.length === 0) {
        return {
          success: false,
          providerStatuses: [makeNoResultsStatus(this.name)],
          items: [],
          warnings: [],
          lastCheckedAt: now,
        };
      }

      const items = results
        .map(r => normaliseSerpItemToStore(r, input, now))
        .filter((i): i is StoreListing => i !== null);

      // Deduplicate by URL
      const seen = new Set<string>();
      const unique = items.filter(i => {
        if (seen.has(i.productUrl)) return false;
        seen.add(i.productUrl);
        return true;
      });

      return {
        success: unique.length > 0,
        providerStatuses: [makeConnectedStatus(this.name, `Found ${unique.length} relevant shopping results.`)],
        items: unique,
        warnings: [],
        lastCheckedAt: now,
      };
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown SerpApi error';
      const isRateLimit = msg.includes('429') || msg.toLowerCase().includes('rate limit');
      return {
        success: false,
        providerStatuses: [{
          providerName: this.name,
          connected: false,
          status: isRateLimit ? 'rate-limited' : 'failed',
          message: msg,
          lastCheckedAt: now,
        }],
        items: [],
        warnings: [],
        lastCheckedAt: now,
      };
    }
  }
}

// ─── Query building ───────────────────────────────────────────────────────────

function buildDeviceQuery(input: DeviceStoreSearchInput, mode: 'primary' | 'fallback'): string {
  const { device, specs } = input;
  const parts: string[] = [];

  // Brand + model without duplication
  if (device.brand && device.model) {
    const modelStartsWithBrand = device.model.toLowerCase().startsWith(device.brand.toLowerCase());
    if (modelStartsWithBrand) {
      parts.push(device.model);
    } else {
      parts.push(device.brand, device.model);
    }
  } else if (device.brand) {
    parts.push(device.brand);
  } else if (device.deviceName) {
    parts.push(device.deviceName.split(/\s+/).slice(0, 4).join(' '));
  }

  if (mode === 'primary') {
    // Primary: most specific — include full CPU family + number
    if (specs?.cpu) {
      const cpuFamilyM = specs.cpu.match(/\b(Ryzen\s+[3579]|Core\s+[Ui]\d|Core\s+Ultra\s+[579]|Celeron|Pentium)\b/i);
      const cpuNumM = specs.cpu.match(/\b(\d{4,5}[A-Z]{0,3})\b/i);
      if (cpuFamilyM) parts.push(cpuFamilyM[1]);
      if (cpuNumM) parts.push(cpuNumM[1]);
    }
    if (specs?.ramGb) parts.push(`${specs.ramGb}GB`);
    if (specs?.storageGb) {
      parts.push(specs.storageGb >= 1024 ? `${specs.storageGb / 1024}TB` : `${specs.storageGb}GB`);
      if (specs.storageType) parts.push(specs.storageType);
    }
  } else {
    // Fallback: brand + model + CPU number only
    if (specs?.cpu) {
      const cpuNumM = specs.cpu.match(/\b(\d{4,5}[A-Z]{0,3})\b/i);
      if (cpuNumM) parts.push(cpuNumM[1]);
    }
  }

  if (input.country) parts.push(input.country);
  return parts.join(' ');
}

// ─── Scoring ──────────────────────────────────────────────────────────────────

/**
 * Extract a product variant suffix that follows a model number.
 * Matches phone/consumer variant naming like "14 Pro", "S24 Ultra", "14 Pro Max".
 * Returns null when no such suffix exists (e.g. HP 15s, ThinkPad X1).
 */
function extractVariantSuffix(text: string): string | null {
  // Require digit before variant word to avoid matching "ProBook", "ThinkPad Pro" etc.
  const m = text.match(/\d+\s*(pro\s+max|pro\s+ultra|ultra\s+max|pro\+|\+|pro|plus|max|ultra|mini)\b/i);
  return m ? m[1].toLowerCase().trim() : null;
}

const KNOWN_BRANDS = ['hp', 'dell', 'lenovo', 'asus', 'acer', 'apple', 'samsung', 'microsoft', 'huawei', 'lg', 'toshiba', 'msi', 'razer', 'gigabyte'];

/** Product-line aliases: store listings may say "iPhone 14" without the brand "Apple" */
const BRAND_ALIASES: Record<string, string[]> = {
  apple:   ['iphone', 'ipad', 'macbook'],
  samsung: ['galaxy'],
  google:  ['pixel'],
};

/**
 * Hard filter: titles that are accessories, parts, review/forum/video content.
 * These should never appear in "Other stores" regardless of score.
 */
function isIrrelevantListing(title: string): boolean {
  return /\b(screen replacement|battery replacement|charger|adapter|keyboard replacement|hinge|palmrest|lcd panel|motherboard replacement|ram upgrade kit|bag|backpack|sleeve|case|cover|skin|screen protector|review\b|unboxing|youtube|reddit|quora|forum|wiki|blog|vs\s|compare|benchmark\s+article|buying guide)\b/i.test(title);
}

function scoreDeviceMatch(
  title: string,
  device: DeviceStoreSearchInput['device'],
  specs: DeviceSpecs | null | undefined,
): { score: number; reasons: string[]; conflicts: string[] } {
  const t = title.toLowerCase();
  const reasons: string[] = [];
  const conflicts: string[] = [];
  let score = 0;

  // ── Brand — also match product-line aliases (e.g. "iPhone" for Apple) ────────
  const targetBrand = (device.brand ?? '').toLowerCase();
  const brandAliases = BRAND_ALIASES[targetBrand] ?? [];
  const hasBrand = targetBrand.length > 0 && (
    new RegExp(`\\b${targetBrand}\\b`).test(t) ||
    brandAliases.some(alias => new RegExp(`\\b${alias}\\b`).test(t))
  );
  if (hasBrand) {
    score += 25;
    reasons.push(`${device.brand}`);
  }

  // Brand conflict
  if (targetBrand) {
    const otherBrands = KNOWN_BRANDS.filter(b => b !== targetBrand);
    const conflictBrand = otherBrands.find(b => new RegExp(`\\b${b}\\b`).test(t));
    if (conflictBrand && !hasBrand) {
      score -= 50;
      conflicts.push(`Wrong brand: listing is ${conflictBrand.toUpperCase()}, target is ${device.brand}`);
    }
  }

  // ── Model / series ──────────────────────────────────────────────────────────
  if (device.model) {
    const modelLower = device.model.toLowerCase();
    const modelWithoutBrand = modelLower
      .replace(new RegExp('^' + (device.brand ?? '').toLowerCase() + '\\s*'), '')
      .trim();
    const modelPattern = new RegExp(`\\b${modelWithoutBrand.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`);
    if (modelWithoutBrand.length >= 2 && modelPattern.test(t)) {
      const modelIsSpecific = modelWithoutBrand.length >= 2 && /[a-z]/i.test(modelWithoutBrand);
      if (hasBrand || modelIsSpecific) {
        score += 20;
        reasons.push(`Series ${device.model}`);
      }
    }
  }

  // ── Variant suffix conflict ──────────────────────────────────────────────────
  // Detects mismatches like "iPhone 14 Pro" listed when target is "iPhone 14" (base).
  // extractVariantSuffix only matches suffixes that follow a digit, so "ProBook",
  // "ThinkPad" and "Core Ultra" are not affected.
  if (device.model) {
    const targetVariant = extractVariantSuffix(device.model.toLowerCase());
    const listingVariant = extractVariantSuffix(t);
    if (targetVariant !== listingVariant) {
      if (targetVariant === null && listingVariant !== null) {
        score -= 30;
        conflicts.push(`Variant conflict: listing is "${listingVariant}" variant, target is base model`);
      } else if (targetVariant !== null && listingVariant !== null && targetVariant !== listingVariant) {
        score -= 30;
        conflicts.push(`Variant conflict: listing is "${listingVariant}", target is "${targetVariant}"`);
      } else if (targetVariant !== null && listingVariant === null) {
        // Listing omits the variant name — softer penalty
        score -= 15;
        conflicts.push(`Variant mismatch: target is "${targetVariant}" variant but listing does not specify it`);
      }
    }
  }

  // ── CPU ──────────────────────────────────────────────────────────────────────
  if (specs?.cpu) {
    const cpuNum = specs.cpu.match(/\b(\d{4,5}[A-Z]{0,3})\b/i)?.[1]?.toLowerCase();
    const cpuFamilyM = specs.cpu.match(/\b(Ryzen\s+[3579]|Core\s+[Ui]\d|Core\s+Ultra\s+[579])\b/i);
    const cpuFamily = cpuFamilyM?.[1]?.toLowerCase();

    if (cpuNum && t.includes(cpuNum)) {
      score += 25;
      reasons.push(`CPU ${cpuNum.toUpperCase()}`);
    }
    if (cpuFamily && t.includes(cpuFamily)) {
      score += 15;
      if (!cpuNum || !t.includes(cpuNum ?? '')) reasons.push(`CPU family ${cpuFamily}`);
    }

    // CPU conflicts
    const targetIsAMD = /ryzen/i.test(specs.cpu);
    const targetIsIntel = /intel|core\s+[ui]|core\s+ultra/i.test(specs.cpu);

    if (targetIsAMD && /\b(intel|core\s+i[0-9]|n[12]\d{2})\b/i.test(t) && !/\bryzen\b/i.test(t)) {
      score -= 50;
      conflicts.push(`CPU conflict: listing has Intel, target is AMD Ryzen`);
    }
    if (targetIsIntel && /\bryzen\b/i.test(t) && !/\bintel\b/i.test(t)) {
      score -= 50;
      conflicts.push(`CPU conflict: listing has AMD Ryzen, target is Intel`);
    }

    // Ryzen tier conflict (e.g. target Ryzen 5, listing says Ryzen 3 or Ryzen 7)
    const targetTier = specs.cpu.match(/ryzen\s+([3579])/i)?.[1];
    if (targetTier) {
      const listingTier = t.match(/ryzen\s+([3579])/)?.[1];
      if (listingTier && listingTier !== targetTier) {
        score -= 40;
        conflicts.push(`CPU tier conflict: listing is Ryzen ${listingTier}, target is Ryzen ${targetTier}`);
      }
    }
  }

  // ── RAM ──────────────────────────────────────────────────────────────────────
  if (specs?.ramGb) {
    const ramPattern = new RegExp(`\\b${specs.ramGb}\\s*gb\\b`, 'i');
    if (ramPattern.test(t)) {
      score += 15;
      reasons.push(`${specs.ramGb}GB RAM`);
    } else {
      const otherRam = t.match(/\b(\d+)\s*gb\b/i);
      if (otherRam) {
        const val = parseInt(otherRam[1]);
        // Only penalise if it's clearly a RAM size (not storage)
        if (val <= 64 && val !== specs.ramGb) {
          score -= 30;
          conflicts.push(`RAM conflict: listing shows ${val}GB, target is ${specs.ramGb}GB`);
        }
      }
    }
  }

  // ── Storage ──────────────────────────────────────────────────────────────────
  if (specs?.storageGb) {
    const storageLabel = specs.storageGb >= 1024 ? `${specs.storageGb / 1024}tb` : `${specs.storageGb}gb`;
    if (t.includes(storageLabel)) {
      score += 10;
      reasons.push(`${storageLabel.toUpperCase()} storage`);
    } else {
      // Check for conflicting storage
      const stMatch = t.match(/\b(\d+)\s*(gb|tb)\s*(ssd|nvme|hdd|storage)?\b/i);
      if (stMatch) {
        const stGb = stMatch[2].toLowerCase() === 'tb' ? parseInt(stMatch[1]) * 1024 : parseInt(stMatch[1]);
        if (stGb >= 128 && Math.abs(stGb - specs.storageGb) > 32) {
          score -= 25;
          conflicts.push(`Storage conflict: listing shows ${stMatch[1]}${stMatch[2].toUpperCase()}, target is ${storageLabel.toUpperCase()}`);
        }
      }
    }
  }

  // ── SSD bonus ────────────────────────────────────────────────────────────────
  if (specs?.storageType === 'SSD' || specs?.storageType === 'NVMe') {
    if (/\b(ssd|nvme)\b/i.test(t)) {
      score += 5;
    }
  }

  return { score, reasons, conflicts };
}

// ─── Item normalisation ───────────────────────────────────────────────────────

function normaliseSerpItemToStore(
  item: SerpApiShoppingResult,
  input: DeviceStoreSearchInput,
  now: string,
): StoreListing | null {
  const title = item.title?.trim();
  const url = bestProductUrl(item.link, item.product_link);
  if (!title || !url) return null;

  // Hard filter: accessories, review content, parts
  if (isIrrelevantListing(title)) return null;

  const price = item.extracted_price ?? null;
  const currency = detectCurrency(item.price ?? '');

  const { score, reasons, conflicts } = scoreDeviceMatch(title, input.device, input.specs);

  // Filter out anything with a negative score or below minimum threshold
  if (score < 10) return null;

  // Dynamic thresholds: when CPU specs aren't available (e.g. phones),
  // the max possible score is lower, so scale thresholds proportionally.
  const maxPossible = 45 + (input.specs?.cpu ? 40 : 0) + (input.specs?.ramGb ? 15 : 0) + (input.specs?.storageGb ? 15 : 0);
  const exactThreshold  = maxPossible >= 85 ? 85 : Math.round(maxPossible * 0.85);
  const likelyThreshold = maxPossible >= 65 ? 65 : Math.round(maxPossible * 0.70);
  const similarThreshold = maxPossible >= 35 ? 35 : Math.round(maxPossible * 0.45);

  let matchConfidence: StoreListing['matchConfidence'];
  if (score >= exactThreshold) matchConfidence = 'exact';
  else if (score >= likelyThreshold) matchConfidence = 'likely';
  else if (score >= similarThreshold) matchConfidence = 'similar';
  else matchConfidence = 'unknown';

  return {
    id: `serp-store-${generateId()}`,
    productName: title.slice(0, 200),
    storeName: item.source ?? 'Google Shopping',
    price,
    currency,
    availability: item.delivery ?? null,
    country: input.country ?? null,
    city: input.city ?? null,
    productUrl: url,
    imageUrl: item.thumbnail ?? null,
    matchConfidence,
    matchScore: score,
    matchReasons: reasons,
    matchConflicts: conflicts.length > 0 ? conflicts : undefined,
    sourceProvider: 'SerpApi Shopping',
    lastCheckedAt: now,
  };
}

function detectCurrency(priceStr: string): string | null {
  if (!priceStr) return null;
  if (priceStr.startsWith('R') || priceStr.includes('ZAR')) return 'ZAR';
  if (priceStr.startsWith('£') || priceStr.includes('GBP')) return 'GBP';
  if (priceStr.startsWith('€') || priceStr.includes('EUR')) return 'EUR';
  if (priceStr.startsWith('A$') || priceStr.includes('AUD')) return 'AUD';
  if (priceStr.startsWith('$') || priceStr.includes('USD')) return 'USD';
  return null;
}
