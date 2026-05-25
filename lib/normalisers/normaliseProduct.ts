import type { DeviceIdentity, DeviceCategory, DeviceSpecs } from '@/lib/types/device';
import type { ManualDeviceInput } from '@/lib/types/product';
import { normaliseSpecsFromText, normaliseSpecsFromTitle, mergeSpecs } from './normaliseSpecs';
import { generateId } from '@/lib/utils';

const KNOWN_BRANDS = [
  'HP', 'Dell', 'Lenovo', 'Acer', 'Asus', 'Samsung', 'Apple', 'Microsoft',
  'MSI', 'Razer', 'Huawei', 'Toshiba', 'Sony', 'LG', 'Gigabyte',
  'Xiaomi', 'Oppo', 'OnePlus', 'Realme', 'Google', 'Motorola', 'Nokia',
];

/**
 * Parse brand, category, and a short model hint from a product title.
 */
export function parseDeviceFromTitle(title: string): {
  brand: string | null;
  category: DeviceCategory;
  model: string | null;
} {
  if (!title) return { brand: null, category: 'Laptop', model: null };

  const upper = title.toUpperCase();
  const lower = title.toLowerCase();

  // Brand detection
  let brand: string | null = null;
  for (const b of KNOWN_BRANDS) {
    if (upper.startsWith(b.toUpperCase()) || new RegExp(`\\b${b}\\b`, 'i').test(title)) {
      brand = b;
      break;
    }
  }
  // Infer brand from product type when brand name isn't explicitly in the title
  if (!brand) {
    if (/\biphone\b|\bipad\b|\bairpods?\b|\bapple\s+watch\b/i.test(title)) brand = 'Apple';
    else if (/\bgalaxy\b/i.test(title)) brand = 'Samsung';
    else if (/\bpixel\s+\d/i.test(title)) brand = 'Google';
  }

  // Category detection
  let category: DeviceCategory = 'Laptop';
  if (/\b(laptop|notebook|chromebook|macbook)\b/i.test(lower)) {
    category = 'Laptop';
  } else if (/\b(desktop|tower|all[- ]in[- ]one|aio|mini\s*pc|nuc)\b/i.test(lower)) {
    category = 'PC';
  } else if (/\b(phone|smartphone|mobile|android|iphone|galaxy\s+[a-z]|galaxy\s+s\d|pixel\s+\d|redmi|poco|dual[\s-]?sim|5000\s*mah)\b/i.test(lower)) {
    category = 'Smartphone';
  } else if (/\b(tablet|ipad)\b/i.test(lower)) {
    category = 'Laptop'; // treat tablets as Laptop for advisory
  }

  // Model extraction — the short model identifier after the brand.
  // e.g. "HP 15s", "Dell Inspiron 15 3000", "Lenovo IdeaPad 3", "iPhone 15 Pro Max"
  let model: string | null = null;
  if (brand) {
    // Start from right after the brand name in the title
    const brandIdx = title.toLowerCase().indexOf(brand.toLowerCase());
    const afterBrand = brandIdx >= 0
      ? title.slice(brandIdx + brand.length).trim()
      : title;

    // Primary: stop before CPU/spec keywords OR device-category words
    // Includes "." and "-" for sizes ("13.3") and form-factors ("2-in-1")
    const modelMatch = afterBrand.match(
      /^([\w\s\-\.]+?)(?:\s+(?:AMD|Intel|Apple|Qualcomm|Ryzen|Core|\d+GB|\d+TB|Windows|Android|FHD|QHD|UHD|HD|OLED|Laptop|Notebook|Phone|Smartphone|Desktop|PC)\b)/i
    );

    if (modelMatch) {
      let m = modelMatch[1].trim();
      // Strip leading category word that snuck in (e.g. "Laptop 15.6" → "15.6")
      m = m.replace(/^(laptop|notebook|phone|smartphone|tablet|pc|desktop)\s+/i, '').trim();
      // Strip trailing category word (e.g. "255 G10 15.6 Laptop" → "255 G10 15.6")
      m = m.replace(/\s+(laptop|notebook|phone|smartphone|tablet|pc|desktop)$/i, '').trim();
      // Reject: CPU brand name alone, plain category word, or bare decimal (just a screen size)
      const isBad = !m
        || /^(amd|intel|apple|qualcomm|samsung|mediatek|laptop|notebook|phone|smartphone|desktop|pc)$/i.test(m)
        || /^\d+\.?\d*$/.test(m);
      if (!isBad) model = m.slice(0, 60);

    } else {
      // No spec/category stop-keyword in title (common for phone titles: "iPhone 15 Pro Max")
      // Strip storage markers and colour names, take the remainder as model
      const stripped = afterBrand
        .replace(/\s+\d+\s*(?:GB|TB).*/i, '')
        .replace(/\s+\b(?:Black|White|Blue|Red|Green|Gold|Silver|Titanium|Navy|Purple|Pink|Midnight|Natural|Starlight|Graphite|Space\s+(?:Gray|Grey|Black)|Yellow|Orange|Coral|Sand|Violet|Lavender|Jade)\b.*/i, '')
        .trim();

      if (stripped && stripped.length > 0 && stripped.length <= 60) {
        const noCategory = stripped
          .replace(/^(laptop|notebook|phone|smartphone|tablet|pc|desktop)\s*/i, '').trim();
        const isBad = !noCategory
          || /^(amd|intel|apple|qualcomm|samsung|mediatek|laptop|notebook|phone|smartphone|desktop|pc)$/i.test(noCategory)
          || /^\d+\.?\d*$/.test(noCategory);
        if (!isBad) model = noCategory.slice(0, 60);
      } else {
        // Last resort: first meaningful word
        const firstWord = afterBrand.split(/\s+/)[0];
        if (firstWord && firstWord.length >= 2 && firstWord.length <= 15
          && !/^(amd|intel|apple|qualcomm|samsung|mediatek|laptop|notebook|phone|smartphone|desktop|pc)$/i.test(firstWord)) {
          model = firstWord;
        }
      }
    }
  }

  return { brand, category, model };
}

/**
 * Extract store name from a URL domain.
 * e.g. "www.incredible.co.za" → "Incredible Connection"
 */
export function storeNameFromUrl(url: string): string {
  try {
    const hostname = new URL(url).hostname.replace(/^www\./, '');
    const domainMap: Record<string, string> = {
      'incredible.co.za': 'Incredible Connection',
      'takealot.com': 'Takealot',
      'amazon.com': 'Amazon',
      'amazon.co.uk': 'Amazon UK',
      'ebay.com': 'eBay',
      'ebay.co.uk': 'eBay UK',
      'currys.co.uk': 'Currys',
      'pcworld.com': 'PC World',
      'bestbuy.com': 'Best Buy',
      'hpdirect.com': 'HP Direct',
      'dell.com': 'Dell Direct',
      'lenovo.com': 'Lenovo Direct',
      'apple.com': 'Apple Store',
      'wootware.co.za': 'Wootware',
      'evetech.co.za': 'Evetech',
      'cyberport.de': 'Cyberport',
      'onedayonly.co.za': 'OneDayOnly',
      'bash.com': 'Bash',
      'samsung.com': 'Samsung',
      'amazon.co.za': 'Amazon SA',
      'pricecheck.co.za': 'PriceCheck',
      'loot.co.za': 'Loot',
      'game.co.za': 'Game',
      'makro.co.za': 'Makro',
      'hi.co.za': 'Hi',
      'hificorp.co.za': 'HiFi Corp',
      'geewiz.co.za': 'GeeWiz',
      'istore.co.za': 'iStore',
      'vodacom.co.za': 'Vodacom',
      'cellucity.co.za': 'Cellucity',
      'mtncl.co.za': 'MTN',
      'mtn.co.za': 'MTN',
      'telkom.co.za': 'Telkom',
      'pnpfreshmarket.co.za': 'Pick n Pay',
      'checkers.co.za': 'Checkers',
      'jasonl.co.za': 'Jason Electronics',
    };
    if (domainMap[hostname]) return domainMap[hostname];
    // Fallback: title-case the domain root
    const root = hostname.split('.')[0];
    return root.charAt(0).toUpperCase() + root.slice(1);
  } catch {
    return 'Online store';
  }
}

export function normaliseManualInput(input: ManualDeviceInput): {
  device: DeviceIdentity;
  specs: DeviceSpecs | null;
} {
  // Build a combined text from all available name/spec fields
  const nameParts = [input.deviceName, input.model, input.brand].filter(Boolean).join(' ');

  // Start with specs from pasted text if available
  let specs: DeviceSpecs | null = input.specsText
    ? normaliseSpecsFromText(input.specsText)
    : null;

  // Also try extracting from device name / model (catches "HP 15 Ryzen 5 7520U 16GB 512GB SSD")
  if (nameParts) {
    const fromName = normaliseSpecsFromTitle(nameParts);
    if (fromName.cpu || fromName.ramGb || fromName.storageGb) {
      if (specs) {
        // Merge name-derived specs under text-derived specs (text wins for non-null values)
        specs = mergeSpecs(fromName as DeviceSpecs, specs);
      } else {
        specs = fromName as DeviceSpecs;
      }
    }
  }

  const hasSpecs = !!(specs?.cpu || specs?.ramGb || specs?.storageGb);

  const device: DeviceIdentity = {
    id: generateId(),
    category: input.category,
    brand: input.brand ?? null,
    model: input.model ?? null,
    deviceName: input.deviceName ?? input.model ?? null,
    sourceProvider: 'manual',
    confidence: hasSpecs ? 'low' : 'unknown',
  };

  return { device, specs: hasSpecs ? specs : null };
}
