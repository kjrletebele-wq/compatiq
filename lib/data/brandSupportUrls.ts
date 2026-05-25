/**
 * Brand support / warranty lookup URLs.
 * Used as a fallback when serial number lookup fails — directs users to
 * their brand's official support page to find their device model.
 */

export interface BrandSupportInfo {
  /** Display name shown on the chip */
  name: string;
  /** Official support/warranty lookup URL */
  supportUrl: string;
  /** Short description of what the user enters on that page */
  lookupType: string;
}

/**
 * Keyed by lowercase brand alias → support info.
 * Multiple aliases can point to the same info (e.g. 'surface' → Microsoft).
 */
const BRAND_SUPPORT_MAP: Record<string, BrandSupportInfo> = {
  // ── PC / Laptop / Tablet ───────────────────────────────────────────────────
  hp: {
    name: 'HP',
    supportUrl: 'https://support.hp.com/za-en/check-warranty',
    lookupType: 'serial number or product number',
  },
  dell: {
    name: 'Dell',
    supportUrl: 'https://www.dell.com/support/contractservices/en-za',
    lookupType: 'Service Tag or Express Service Code',
  },
  lenovo: {
    name: 'Lenovo',
    supportUrl: 'https://pcsupport.lenovo.com/za/en/warranty-lookup',
    lookupType: 'serial number',
  },
  apple: {
    name: 'Apple',
    supportUrl: 'https://checkcoverage.apple.com/',
    lookupType: 'serial number',
  },
  asus: {
    name: 'ASUS',
    supportUrl: 'https://www.asus.com/za/support/warranty-status-inquiry/',
    lookupType: 'serial number',
  },
  acer: {
    name: 'Acer',
    supportUrl: 'https://www.acer.com/za-en/support/warranty/warranty-expiration-date',
    lookupType: 'serial number, SNID, or part number',
  },
  msi: {
    name: 'MSI',
    supportUrl: 'https://account.msi.com/en/services/warranty-book',
    lookupType: 'serial number',
  },
  microsoft: {
    name: 'Microsoft',
    supportUrl: 'https://support.microsoft.com/en-us/warranty',
    lookupType: 'Microsoft account or device serial',
  },
  surface: {
    name: 'Microsoft',
    supportUrl: 'https://support.microsoft.com/en-us/warranty',
    lookupType: 'Microsoft account or device serial',
  },
  razer: {
    name: 'Razer',
    supportUrl: 'https://mysupport.razer.com/app/warranty-support',
    lookupType: 'serial number',
  },
  gigabyte: {
    name: 'Gigabyte / AORUS',
    supportUrl: 'https://www.gigabyte.com/za/Support/Consumer/Warranty/Check',
    lookupType: 'serial number',
  },
  aorus: {
    name: 'Gigabyte / AORUS',
    supportUrl: 'https://www.gigabyte.com/za/Support/Consumer/Warranty/Check',
    lookupType: 'serial number',
  },
  lg: {
    name: 'LG',
    supportUrl: 'https://www.lg.com/za/support/product-support/product-registration/',
    lookupType: 'product model number',
  },
  tcl: {
    name: 'TCL',
    supportUrl: 'https://www.tcl.com/southafrica/en/warranty-registration',
    lookupType: 'model number or serial number',
  },
  toshiba: {
    name: 'Toshiba / Dynabook',
    supportUrl: 'https://aps2.toshiba-teg.com/warranty/en/',
    lookupType: 'serial number',
  },
  dynabook: {
    name: 'Toshiba / Dynabook',
    supportUrl: 'https://aps2.toshiba-teg.com/warranty/en/',
    lookupType: 'serial number',
  },
  sony: {
    name: 'Sony',
    supportUrl: 'https://www.sony.co.za/support/',
    lookupType: 'model number',
  },

  // ── Smartphones ───────────────────────────────────────────────────────────
  samsung: {
    name: 'Samsung',
    supportUrl: 'https://www.samsung.com/za/support/',
    lookupType: 'IMEI or model number',
  },
  google: {
    name: 'Google',
    supportUrl: 'https://support.google.com/pixelphone/answer/2905722',
    lookupType: 'IMEI or serial number',
  },
  pixel: {
    name: 'Google',
    supportUrl: 'https://support.google.com/pixelphone/answer/2905722',
    lookupType: 'IMEI or serial number',
  },
  huawei: {
    name: 'Huawei',
    supportUrl: 'https://consumer.huawei.com/za/support/',
    lookupType: 'serial number or IMEI',
  },
  xiaomi: {
    name: 'Xiaomi',
    supportUrl: 'https://www.mi.com/global/service/warranty',
    lookupType: 'IMEI or serial number',
  },
  mi: {
    name: 'Xiaomi',
    supportUrl: 'https://www.mi.com/global/service/warranty',
    lookupType: 'IMEI or serial number',
  },
  redmi: {
    name: 'Xiaomi',
    supportUrl: 'https://www.mi.com/global/service/warranty',
    lookupType: 'IMEI or serial number',
  },
  poco: {
    name: 'Xiaomi',
    supportUrl: 'https://www.mi.com/global/service/warranty',
    lookupType: 'IMEI or serial number',
  },
  oneplus: {
    name: 'OnePlus',
    supportUrl: 'https://www.oneplus.com/za/support',
    lookupType: 'IMEI or serial number',
  },
  oppo: {
    name: 'Oppo',
    supportUrl: 'https://www.oppo.com/za/support/',
    lookupType: 'IMEI or serial number',
  },
  realme: {
    name: 'Realme',
    supportUrl: 'https://www.realme.com/za/support',
    lookupType: 'IMEI or serial number',
  },
  motorola: {
    name: 'Motorola',
    supportUrl: 'https://motorola-global-portal.custhelp.com/app/product_warranty',
    lookupType: 'IMEI or serial number',
  },
  moto: {
    name: 'Motorola',
    supportUrl: 'https://motorola-global-portal.custhelp.com/app/product_warranty',
    lookupType: 'IMEI or serial number',
  },
  nokia: {
    name: 'Nokia',
    supportUrl: 'https://www.nokia.com/phones/en_int/support/warranty-check',
    lookupType: 'IMEI',
  },
};

/**
 * Find support info for a brand name.
 * Tries exact match first, then partial match (e.g. "Gigabyte AORUS" → gigabyte).
 */
export function getBrandSupport(brand: string | null | undefined): BrandSupportInfo | null {
  if (!brand) return null;
  const key = brand.toLowerCase().trim();

  // Exact match
  if (BRAND_SUPPORT_MAP[key]) return BRAND_SUPPORT_MAP[key];

  // Partial match — brand typed contains a key, or key contains brand typed
  for (const [k, v] of Object.entries(BRAND_SUPPORT_MAP)) {
    if (key.includes(k) || k.includes(key)) return v;
  }

  return null;
}

/**
 * Flat list of unique brands (deduplicated by supportUrl) for rendering
 * a brand picker grid. Sorted alphabetically by display name.
 */
export const ALL_BRAND_SUPPORT: BrandSupportInfo[] = Object.values(BRAND_SUPPORT_MAP)
  .filter((v, i, arr) => arr.findIndex(x => x.supportUrl === v.supportUrl) === i)
  .sort((a, b) => a.name.localeCompare(b.name));
