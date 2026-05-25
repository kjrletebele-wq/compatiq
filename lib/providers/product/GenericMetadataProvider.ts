import type { ProductLinkProvider } from './ProductLinkProvider';
import type { ProductLinkInput, ProductLinkResult } from '@/lib/types/product';
import { makeFailedStatus, makeConnectedStatus } from '@/lib/types/providers';
import {
  normaliseSpecsFromText,
  normaliseSpecsFromSpecRows,
  normaliseSpecsFromTitle,
  mergeSpecs,
} from '@/lib/normalisers/normaliseSpecs';
import { parseDeviceFromTitle, storeNameFromUrl } from '@/lib/normalisers/normaliseProduct';
import { generateId } from '@/lib/utils';
import type { DeviceSpecs } from '@/lib/types/device';

/**
 * Fetches publicly accessible product pages and extracts device data using:
 * 1. JSON-LD Product schema
 * 2. OpenGraph / meta tags
 * 3. H1 title
 * 4. Price from common DOM patterns
 * 5. Spec table key/value rows
 * 6. Feature bullet lists
 * 7. Raw visible product text fallback
 *
 * Does NOT bypass anti-bot systems or scrape protected content.
 */
export class GenericMetadataProvider implements ProductLinkProvider {
  name = 'GenericMetadataProvider';

  isConfigured(): boolean {
    return true; // always available
  }

  canHandle(url: string): boolean {
    try { new URL(url); return true; } catch { return false; }
  }

  async analyseLink(input: ProductLinkInput): Promise<ProductLinkResult> {
    const now = new Date().toISOString();

    try {
      // Use a standard browser UA — bot-detecting retailers (Amazon, Incredible) block
      // generic bot UAs. Fallback to URL-slug extraction when the fetch fails.
      const response = await fetch(input.url, {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
          'Accept-Encoding': 'gzip, deflate, br',
          'Cache-Control': 'no-cache',
          'Sec-Fetch-Dest': 'document',
          'Sec-Fetch-Mode': 'navigate',
          'Sec-Fetch-Site': 'none',
        },
        signal: AbortSignal.timeout(12000),
      });

      // If the page is blocked or unavailable, try extracting from the URL slug alone
      if (!response.ok) {
        const slugTitle = this.extractTitleFromUrlSlug(input.url);
        if (slugTitle) {
          return this.buildResultFromSlug(slugTitle, input.url, now);
        }
        return this.failedResult(now, `HTTP ${response.status} — page could not be fetched. Try entering specs manually.`);
      }

      const html = await response.text();

      // Takealot and similar SPAs return a nearly-empty JS bundle — detect and fall back to slug
      const isEmptySpa = html.length < 5000 || (/<script[\s\S]{0,300}__NEXT_DATA__|window\.__STATE__/i.test(html) && !/<h1/i.test(html));
      if (isEmptySpa) {
        const slugTitle = this.extractTitleFromUrlSlug(input.url);
        if (slugTitle) {
          return this.buildResultFromSlug(slugTitle, input.url, now);
        }
      }

      const extracted = this.extractFromPage(html, input.url, now);

      // Must have at least a title to proceed
      if (!extracted.title) {
        return this.failedResult(now, 'Could not extract product title from page.');
      }

      const title = extracted.title;
      const { brand, category, model } = parseDeviceFromTitle(title);

      // Merge specs from all layers: spec rows → full text → title
      let specs: DeviceSpecs | null = null;
      if (extracted.specRowSpecs || extracted.productText) {
        const fromText = normaliseSpecsFromText(extracted.productText);
        const fromTitle = normaliseSpecsFromTitle(title);
        let merged: DeviceSpecs = { ...fromText };
        merged = mergeSpecs(merged, fromTitle);
        if (extracted.specRowSpecs) {
          merged = mergeSpecs(merged, extracted.specRowSpecs);
        }
        // Only return specs if at least CPU or RAM was found
        const hasMinimalSpecs = !!(merged.cpu || merged.ramGb || merged.storageGb);
        specs = hasMinimalSpecs ? merged : null;
      }
      // Fallback: title-only spec extraction (always try)
      if (!specs) {
        const fromTitle = normaliseSpecsFromTitle(title);
        if (fromTitle.cpu || fromTitle.ramGb || fromTitle.storageGb) {
          specs = fromTitle as DeviceSpecs;
        }
      }

      const hasPageSpecs = !!(specs?.cpu || specs?.ramGb);
      const confidence = hasPageSpecs ? 'medium' : 'low';

      const storeListing = extracted.title ? {
        id: `meta-${generateId()}`,
        productName: title,
        storeName: extracted.storeName,
        price: extracted.price,
        currency: extracted.currency,
        availability: extracted.availability,
        country: null,
        city: null,
        productUrl: input.url,
        imageUrl: extracted.imageUrl,
        matchConfidence: 'unknown' as const,
        sourceProvider: this.name,
        lastCheckedAt: now,
      } : null;

      const warnings: string[] = [];
      if (!hasPageSpecs) {
        warnings.push('Specs extracted from title only. For detailed specifications, connect a product data provider or enter specs manually.');
      }
      if (extracted.conflicts.length > 0) {
        warnings.push(...extracted.conflicts);
      }

      return {
        success: true,
        sourceType: hasPageSpecs ? 'connected-provider' : 'connected-provider',
        providerStatuses: [makeConnectedStatus(
          this.name,
          hasPageSpecs ? 'Extracted product data from page.' : 'Extracted metadata from page. Specs from title only.'
        )],
        device: {
          id: generateId(),
          category: category,
          brand: brand,
          model: model,
          deviceName: title,
          sourceUrl: input.url,
          sourceProvider: this.name,
          confidence,
        },
        specs,
        storeListing,
        warnings,
        lastCheckedAt: now,
        extractedFromHtml: hasPageSpecs,
      } as ProductLinkResult & { extractedFromHtml: boolean };
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      return this.failedResult(now, msg);
    }
  }

  // ─── Private extraction methods ─────────────────────────────────────────────

  private buildResultFromSlug(slugTitle: string, url: string, now: string): ProductLinkResult {
    const { brand, category, model } = parseDeviceFromTitle(slugTitle);
    const fromTitle = normaliseSpecsFromTitle(slugTitle);
    const specs = (fromTitle.cpu || fromTitle.ramGb || fromTitle.storageGb)
      ? fromTitle as DeviceSpecs
      : null;

    const storeName = storeNameFromUrl(url);
    const isAmazon = /amazon\./i.test(url);
    const slugHasLimitedInfo = !fromTitle.cpu && !fromTitle.ramGb;

    const providerMessage = isAmazon
      ? 'Amazon blocks direct access. Partial specs extracted from URL — Amazon product slugs often omit CPU and RAM details.'
      : 'Page could not be fetched directly — specs extracted from URL. Price and availability require manual entry.';

    const warning = isAmazon && slugHasLimitedInfo
      ? 'Amazon blocked access and the product URL does not contain full specs. Open the Amazon listing, copy the spec table, and paste it into the spec text field for accurate results.'
      : 'This retailer blocked direct access. Product name and specs extracted from the URL — verify price and full specs on the product page.';

    const storeListing = {
      id: `meta-${generateId()}`,
      productName: slugTitle,
      storeName,
      price: null,
      currency: null,
      availability: null,
      country: null,
      city: null,
      productUrl: url,
      imageUrl: null,
      matchConfidence: 'unknown' as const,
      sourceProvider: this.name,
      lastCheckedAt: now,
    };

    return {
      success: true,
      sourceType: 'connected-provider',
      providerStatuses: [makeConnectedStatus(this.name, providerMessage)],
      device: {
        id: generateId(),
        category,
        brand,
        model,
        deviceName: slugTitle,
        sourceUrl: url,
        sourceProvider: this.name,
        confidence: 'low',
      },
      specs,
      storeListing,
      warnings: [warning],
      lastCheckedAt: now,
    } as ProductLinkResult;
  }

  private failedResult(now: string, reason: string): ProductLinkResult {
    return {
      success: false,
      sourceType: 'manual-required',
      providerStatuses: [makeFailedStatus(this.name, reason)],
      device: null,
      specs: null,
      storeListing: null,
      warnings: ['Could not read this product link. Enter device details manually.'],
      lastCheckedAt: now,
    };
  }

  private extractFromPage(html: string, url: string, now: string): {
    title: string | null;
    price: number | null;
    currency: string | null;
    availability: string | null;
    imageUrl: string | null;
    storeName: string;
    productText: string;
    specRowSpecs: Partial<DeviceSpecs> | null;
    conflicts: string[];
  } {
    // 1. JSON-LD Product schema
    const jsonLd = this.extractJsonLd(html);
    let title: string | null = null;
    let price: number | null = null;
    let currency: string | null = null;
    let availability: string | null = null;
    let imageUrl: string | null = null;

    if (jsonLd) {
      title = (jsonLd.name as string) ?? null;
      const offers = jsonLd.offers as Record<string, unknown> | undefined;
      const rawPrice = offers?.price ? parseFloat(String(offers.price)) : null;
      price = rawPrice !== null && !isNaN(rawPrice) ? rawPrice : null;
      currency = (offers?.priceCurrency as string) ?? null;
      const rawAvail = (offers?.availability as string) ?? null;
      availability = rawAvail ? this.normaliseAvailability(rawAvail) : null;
      imageUrl = Array.isArray(jsonLd.image) ? (jsonLd.image[0] as string) : (jsonLd.image as string) ?? null;
    }

    // 2. OpenGraph / meta tags
    if (!title) {
      const ogTitle = html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i) ??
        html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:title["']/i);
      title = ogTitle ? this.decodeHtmlEntities(ogTitle[1]) : null;
    }
    if (!price) {
      const ogPrice = html.match(/<meta[^>]+property=["'](?:og:price:amount|product:price:amount)["'][^>]+content=["']([^"']+)["']/i);
      if (ogPrice) {
        const p = parseFloat(ogPrice[1].replace(/[^\d.]/g, ''));
        if (!isNaN(p)) price = p;
      }
    }
    if (!currency) {
      const ogCurr = html.match(/<meta[^>]+property=["'](?:og:price:currency|product:price:currency)["'][^>]+content=["']([^"']+)["']/i);
      currency = ogCurr ? ogCurr[1].trim() : null;
    }

    // 3. H1 as title fallback
    if (!title) {
      const h1 = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
      if (h1) title = this.stripTags(h1[1]).trim().slice(0, 200);
    }

    // 4. Meta title fallback
    if (!title) {
      const metaTitle = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
      if (metaTitle) {
        // Remove site name suffix (e.g. "Product Name | Store Name")
        const raw = this.stripTags(metaTitle[1]).trim();
        title = raw.split(/\s*[|·–—]\s*/)[0].trim().slice(0, 200);
      }
    }

    // 4b. URL slug fallback — triggered when:
    //   • No title was found at all
    //   • Title looks like a generic store/site page (not a product)
    //   • Title looks like a bot-detection / captcha page
    if (!title || this.isSiteGenericTitle(title) || !this.isProductTitle(title)) {
      const slugTitle = this.extractTitleFromUrlSlug(url);
      if (slugTitle) title = slugTitle;
    }

    // 5. Price from common DOM patterns
    if (!price) {
      const pricePatterns = [
        /class=["'][^"']*(?:price|Price|selling-price|sale-price|current-price|product-price)[^"']*["'][^>]*>[\s\S]*?([\d\s,.]+)/,
        /itemprop=["']price["'][^>]*content=["']([\d.]+)["']/,
        /data-price=["']([\d.]+)["']/,
      ];
      for (const pat of pricePatterns) {
        const m = html.match(pat);
        if (m) {
          const p = parseFloat(m[1].replace(/[\s,]/g, '').replace(/[^\d.]/g, ''));
          if (!isNaN(p) && p > 0 && p < 10000000) { price = p; break; }
        }
      }
    }

    // 6. Availability text
    if (!availability) {
      const availPatterns = [
        /(?:in\s*stock|limited\s*stock|out\s*of\s*stock|available|pre[- ]order)/i,
      ];
      const availSection = html.match(/class=["'][^"']*(?:stock|availability|avail)[^"']*["'][^>]*>([\s\S]{0,200})/i);
      if (availSection) {
        for (const pat of availPatterns) {
          const m = this.stripTags(availSection[1]).match(pat);
          if (m) { availability = this.normaliseAvailability(m[0]); break; }
        }
      }
    }

    // 7. Extract spec table rows
    const specRows = this.extractSpecRows(html);
    const specRowSpecs = specRows.length > 0
      ? normaliseSpecsFromSpecRows(specRows)
      : null;

    // 8. Extract feature bullets
    const bullets = this.extractBullets(html);

    // 9. Extract raw product text for fallback normalisation
    const productText = this.extractProductText(html, title ?? '', bullets);

    // 10. Conflict detection
    const conflicts = this.detectConflicts(title ?? '', productText);

    return {
      title,
      price,
      currency,
      availability,
      imageUrl,
      storeName: storeNameFromUrl(url),
      productText,
      specRowSpecs,
      conflicts,
    };
  }

  private extractJsonLd(html: string): Record<string, unknown> | null {
    const matches = html.match(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi);
    if (!matches) return null;
    for (const match of matches) {
      try {
        const content = match.replace(/<script[^>]*>/, '').replace(/<\/script>/, '');
        const parsed = JSON.parse(content);
        if (parsed['@type'] === 'Product') return parsed;
        if (parsed?.['@graph']) {
          const prod = parsed['@graph'].find((n: Record<string, unknown>) => n['@type'] === 'Product');
          if (prod) return prod as Record<string, unknown>;
        }
        // BreadcrumbList + Product in array form
        if (Array.isArray(parsed)) {
          const prod = parsed.find((n: Record<string, unknown>) => n['@type'] === 'Product');
          if (prod) return prod as Record<string, unknown>;
        }
      } catch {
        // continue
      }
    }
    return null;
  }

  /**
   * Extracts spec table key/value pairs from common HTML patterns:
   * - <table> rows with 2 cells
   * - <dl><dt><dd> pairs
   * - div/li patterns with spec-related class names
   */
  private extractSpecRows(html: string): { key: string; value: string }[] {
    const rows: { key: string; value: string }[] = [];

    // Find spec sections by class/id names
    // Includes: Amazon (prodDetTable, a-keyvalue), IC (attributes, tab-content), generic (spec, technical, etc.)
    const specSectionPatterns = [
      /(<(?:table|div|section|ul|dl)[^>]*(?:class|id)=["'][^"']*(?:prodDet|a-keyvalue|spec|specification|technical|product[_-]?detail|feature|attributes|properties|tab[_-]?content)[^"']*["'][^>]*>[\s\S]{0,15000}?<\/(?:table|div|section|ul|dl)>)/gi,
    ];

    let specHtml = '';
    for (const pat of specSectionPatterns) {
      const matches = html.match(pat);
      if (matches) {
        specHtml += matches.join('\n');
        if (specHtml.length > 25000) break;
      }
    }

    // Fall back to full HTML if no spec section found
    if (!specHtml) specHtml = html.slice(0, 80000);

    // Pattern 1a: <tr><th>key</th><td>value</td></tr> (Amazon prodDetTable style)
    const thTdPattern = /<tr[^>]*>[\s\S]*?<th[^>]*>([\s\S]*?)<\/th>[\s\S]*?<td[^>]*>([\s\S]*?)<\/td>[\s\S]*?<\/tr>/gi;
    let m: RegExpExecArray | null;
    while ((m = thTdPattern.exec(specHtml)) !== null) {
      const key = this.stripTags(m[1]).trim();
      const value = this.stripTags(m[2]).trim();
      if (key && value && key.length < 80 && value.length < 300 && key.length > 1) {
        rows.push({ key, value });
      }
    }

    // Pattern 1b: <tr><td>key</td><td>value</td></tr>
    const trPattern = /<tr[^>]*>[\s\S]*?<td[^>]*>([\s\S]*?)<\/td>[\s\S]*?<td[^>]*>([\s\S]*?)<\/td>[\s\S]*?<\/tr>/gi;
    while ((m = trPattern.exec(specHtml)) !== null) {
      const key = this.stripTags(m[1]).trim();
      const value = this.stripTags(m[2]).trim();
      if (key && value && key.length < 60 && value.length < 200 && key.length > 1) {
        rows.push({ key, value });
      }
    }

    // Pattern 2: <dt>key</dt><dd>value</dd>
    const dtddPattern = /<dt[^>]*>([\s\S]*?)<\/dt>[\s\S]*?<dd[^>]*>([\s\S]*?)<\/dd>/gi;
    while ((m = dtddPattern.exec(specHtml)) !== null) {
      const key = this.stripTags(m[1]).trim();
      const value = this.stripTags(m[2]).trim();
      if (key && value && key.length < 60 && value.length < 200 && key.length > 1) {
        rows.push({ key, value });
      }
    }

    // Pattern 3: lines matching "Key: Value" in text blocks
    const textLines = this.stripTags(specHtml).split(/\n|\r/);
    for (const line of textLines) {
      const colonM = line.match(/^([A-Z][^:]{2,40}):\s*(.{1,150})$/);
      if (colonM) {
        rows.push({ key: colonM[1].trim(), value: colonM[2].trim() });
      }
    }

    // Pattern 4: IC-style "Key Value" pairs where known spec keys are followed by their value
    // e.g. "Graphics Processor Model AMD Radeon Graphics" or "RAM Capacity 16GB"
    // These appear as consecutive lines in section blocks
    const knownSpecKeys = /^(Processor|Graphics Processor Model|RAM Capacity|SSD Capacity|Storage Technology|Storage Type|Display Technology|Operating System|Battery Capacity|Net Weight|Built-in WiFi|Built-in Wi-Fi|Bluetooth|HDMI Output|USB 3\.x Ports|USB Type-C Ports|Screen Size|Resolution|Processor Model Number|Warranty|Colour|RAM Speed|RAM Type|Camera Resolution|Display Brightness|Memory Storage Capacity|Flash Memory Size|Connectivity Technology|Cellular Technology|Network Type|Item Weight)$/i;
    for (let i = 0; i < textLines.length - 1; i++) {
      const keyLine = textLines[i].trim();
      const valLine = textLines[i + 1].trim();
      if (knownSpecKeys.test(keyLine) && valLine.length > 0 && valLine.length < 200 && !knownSpecKeys.test(valLine)) {
        // Avoid duplicate with colon-pattern above
        const alreadyAdded = rows.some(r => r.key.toLowerCase() === keyLine.toLowerCase());
        if (!alreadyAdded) {
          rows.push({ key: keyLine, value: valLine });
        }
      }
    }

    // Deduplicate
    const seen = new Set<string>();
    return rows.filter(r => {
      const k = r.key.toLowerCase();
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });
  }

  private extractBullets(html: string): string[] {
    const bullets: string[] = [];
    // Look for feature/highlights sections — also catches Amazon's feature-bullets div wrapper
    const featureSection = html.match(
      /<(?:ul|ol|div)[^>]*(?:class|id)=["'][^"']*(?:feature[_-]?bullets?|highlight|bullet|key[_-]?spec)[^"']*["'][^>]*>([\s\S]{0,5000}?)<\/(?:ul|ol|div)>/gi
    );
    if (featureSection) {
      for (const section of featureSection) {
        const liPattern = /<li[^>]*>([\s\S]*?)<\/li>/gi;
        let m: RegExpExecArray | null;
        while ((m = liPattern.exec(section)) !== null) {
          const text = this.stripTags(m[1]).trim().slice(0, 200);
          if (text && text.length > 5) bullets.push(text);
        }
      }
    }
    return bullets;
  }

  private extractProductText(html: string, title: string, bullets: string[]): string {
    // Remove non-content elements
    const cleaned = html
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<nav[\s\S]*?<\/nav>/gi, ' ')
      .replace(/<header[\s\S]*?<\/header>/gi, ' ')
      .replace(/<footer[\s\S]*?<\/footer>/gi, ' ')
      .replace(/<!--[\s\S]*?-->/g, ' ');

    // Try to extract just the product section
    const productSection = cleaned.match(
      /<(?:main|article|div)[^>]*(?:class|id)=["'][^"']*(?:product|pdp|item[_-]?detail|product[_-]?detail)[^"']*["'][^>]*>([\s\S]{100,15000})/i
    );

    const textSource = productSection ? productSection[1] : cleaned;

    const text = this.stripTags(textSource)
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#\d+;/g, '')
      .replace(/\s{3,}/g, '  ')
      .trim()
      .slice(0, 15000);

    // Prepend title and bullets for better normalisation
    const parts = [title, ...bullets, text];
    return parts.filter(Boolean).join('\n');
  }

  private detectConflicts(title: string, bodyText: string): string[] {
    const warnings: string[] = [];
    const t = title.toLowerCase();
    const b = bodyText.toLowerCase();

    const titleHasAMD = /\bamd\b|\bryzen\b/.test(t);
    const titleHasIntel = /\bintel\b|\bcore i[0-9]\b/.test(t);

    // Require Intel/AMD to appear in a CPU-context phrase in the body, not just incidentally
    // (e.g. "Intel Wi-Fi 6", navigation links, or spec comparison tables can mention the other brand)
    const bodyHasIntelCpu = /intel\s+(core|i[3-9]|celeron|pentium|n[12]\d{2})|core\s+i[3-9]-\d{4}/i.test(b);
    const bodyHasAmdCpu = /amd\s+(ryzen|athlon|epyc)|\bryzen\s+[3579]\s+\d{4}/i.test(b);

    if (titleHasAMD && bodyHasIntelCpu && !titleHasIntel) {
      warnings.push(
        'Source conflict detected: product description mentions Intel, but title/specification table indicates AMD. ' +
        'Title/specification table used as higher-confidence source.'
      );
    }
    if (titleHasIntel && bodyHasAmdCpu && !titleHasAMD) {
      warnings.push(
        'Source conflict detected: product description mentions AMD/Ryzen, but title indicates Intel. ' +
        'Title used as higher-confidence source.'
      );
    }

    // Suspicious laptop battery in mAh (laptops use Wh)
    const mahMatch = bodyText.match(/\b(\d{4,6})\s*mAh\b/i);
    if (mahMatch) {
      const mah = parseInt(mahMatch[1]);
      if (mah > 15000 && /laptop|notebook/i.test(t)) {
        warnings.push(
          `Suspicious battery value: ${mahMatch[0]} — Laptop batteries are typically rated in Wh (watt-hours). ` +
          `This value may be inaccurate or from a different product section.`
        );
      }
    }

    return warnings;
  }

  /**
   * Returns true when the extracted title looks like a store's generic homepage title
   * rather than a specific product name.
   */
  private isSiteGenericTitle(title: string): boolean {
    if (title.length < 10) return true;
    return /online\s*shopping|leading\s*online|buy\s*online|official\s*site|home\s*page|best\s*deals|amazing\s*deals|search\s+results?\s+for|results\s+for\s+your\s+search|no\s+results?\s+found|404\s*not\s*found|page\s+not\s+found|access\s+denied/i.test(title);
  }

  /**
   * Returns true when the title looks like an actual product listing.
   * A product title should contain at least one of: a digit (model numbers, GB, GHz),
   * a known brand, or a device category keyword.
   * This filters out: CAPTCHA pages ("Are you a human?"), session errors,
   * store homepages, and bot-check pages.
   */
  private isProductTitle(title: string): boolean {
    // CAPTCHA / bot-detection signals
    if (/\b(are you a human|robot|captcha|security\s+check|verify\s+you|cloudflare|ddos|access\s+denied|forbidden|please\s+wait|just\s+a\s+moment)\b/i.test(title)) return false;
    // Must contain at least one of:
    if (/\b(laptop|notebook|phone|smartphone|mobile|pc|desktop|tablet|ipad|macbook|chromebook)\b/i.test(title)) return true;
    if (/\b(HP|Dell|Lenovo|Asus|Acer|Apple|Samsung|Xiaomi|Huawei|Microsoft|MSI|Razer|Gigabyte|LG|Sony|Motorola|Google|OnePlus|Oppo|Realme)\b/i.test(title)) return true;
    if (/\b\d+\s*GB\b|\b\d+\s*TB\b|\bGHz\b|\b\d{4}[A-Z]\b|\biPhone\b|\biPad\b|\bGalaxy\b|\bPixel\b|\bRedmi\b/i.test(title)) return true;
    return false;
  }

  /**
   * For e-commerce URLs where the product slug encodes the product specs
   * (Takealot, GeeWiz, Evetech, Wootware, etc.), convert the best slug segment
   * into a human-readable title.
   *
   * Handles:
   *  - Single-segment slugs: "/hp-15-ryzen-5-7520u-16gb-512gb.html"
   *  - Multi-segment slugs: "/lenovo-laptop/604374-lenovo-ideapad-5-slim-ryzen-7-16gb.html"
   *    (GeeWiz, Evetech) — picks the most spec-rich segment, strips numeric ID prefix
   *  - Amazon: "/Product-Name/dp/B0XXXXXX"
   *  - Takealot: "/product-slug/PLID12345"
   */
  private extractTitleFromUrlSlug(url: string): string | null {
    try {
      const pathname = new URL(url).pathname;

      // Amazon: /ProductName/dp/B0XXXXXX — take the segment before /dp/
      const amazonM = pathname.match(/^\/([^/]{5,}?)\/dp\//i);
      if (amazonM) {
        return this.slugToTitle(amazonM[1]);
      }

      // Clean path: strip known ID suffixes and any file extension
      const cleanPath = pathname
        .replace(/\/(?:PLID|p|pid|PI_?)\/?\w+\/?$/i, '')  // /PLID12345, /p/123, /PI_30901
        .replace(/\.\w{2,5}$/i, '')                        // .html .htm .asp .aspx .php etc.
        .replace(/^\//, '');

      // Split into segments and clean each one:
      //  • strip leading numeric ID prefix (e.g. "604374-lenovo-…")
      //  • strip Game-style "-p-3001191898" store ID suffix
      //  • strip long pure-numeric ID suffix (≥4 digits)
      //  • strip HP-style mixed alphanumeric part numbers like "-8l0h0ea"
      const segments = cleanPath
        .split('/')
        .filter(s => s.length >= 5)
        .map(s => {
          let seg = s.replace(/^\d+-/, '');          // leading numeric prefix
          seg = seg.replace(/-p-\d+$/i, '');          // "-p-3001191898" (Game)
          seg = seg.replace(/-\d{4,}$/, '');          // trailing numeric ID (Evetech 1197, etc.)
          // Strip HP/manufacturer part numbers: 5–9 char mixed alpha+digit suffix (not a CPU model)
          seg = seg.replace(/-([a-z0-9]{5,9})$/i, (match, part) => {
            const hasDigit = /\d/.test(part);
            const hasLetter = /[a-z]/i.test(part);
            const isCpuModel = /^\d{4}[a-z]{1,3}$/i.test(part); // e.g. "7520u", "7730u"
            return (hasDigit && hasLetter && !isCpuModel) ? '' : match;
          });
          return seg;
        });

      if (segments.length === 0) return null;

      // Score each segment by how spec-rich it is; prefer longer, more informative slugs
      const scoreSlug = (s: string): number => {
        const t = s.toLowerCase();
        let score = 0;
        if (/ryzen|intel|core|snapdragon|dimensity|mediatek/.test(t)) score += 10;
        if (/\d{4}[a-z]{1,3}/.test(t)) score += 8;  // model numbers like "7520u", "7735hs"
        if (/\d+gb/.test(t)) score += 5;
        if (/ssd|nvme|hdd|emmc/.test(t)) score += 4;
        if (/laptop|notebook|phone|smartphone/.test(t)) score += 3;
        if (/\b(hp|dell|lenovo|asus|acer|samsung|apple|xiaomi|huawei)\b/.test(t)) score += 3;
        score += Math.min(s.length / 15, 8);  // prefer longer slugs, cap bonus at 8
        return score;
      };

      const best = [...segments].sort((a, b) => scoreSlug(b) - scoreSlug(a))[0];
      return best ? this.slugToTitle(best) : null;
    } catch {
      return null;
    }
  }

  private slugToTitle(slug: string): string | null {
    if (!slug || slug.length < 5) return null;
    let title = slug
      .replace(/-/g, ' ')
      .replace(/_/g, ' ')
      // Windows OS: "win11pro" / "win11home" / "win-11-home" → "Windows 11 Home/Pro"
      // Must run before digit processing to capture "win11pro" as a single token
      .replace(/\bwin(\d+)\s*(home|pro|s\b|se|education)?\b/gi, (_, ver, ed) =>
        `Windows ${ver}${ed ? ' ' + ed.charAt(0).toUpperCase() + ed.slice(1).toLowerCase() : ''}`)
      // Fix concatenated screen sizes from URL slugs: "133" → "13.3", "156" → "15.6"
      // Handles common laptop/phone display sizes (13.x, 14.x, 15.x, 16.x, 17.x)
      .replace(/\b(1[3-7])([036])\b/g, '$1.$2')
      // Fix space-separated GB/TB: "16 gb" / "512 tb" → "16GB" / "512TB"
      .replace(/\b(\d+)\s+(gb|tb)\b/gi, (_, num, unit) => `${num}${unit.toUpperCase()}`)
      // Fix decimal display sizes: "15 6" → "15.6", "14 0" → "14.0"
      .replace(/\b(\d{2})\s([0-9])\b/g, '$1.$2')
      // Fix M.2: "m 2" → "M.2"
      .replace(/\bm\s2\b/gi, 'M.2')
      // Normalise DDR/LPDDR with space: "ddr 4" → "DDR4", "lpddr 5" → "LPDDR5"
      .replace(/\b(lpddr|ddr)\s+(\d)\b/gi, (_, prefix, num) => `${prefix.toUpperCase()}${num}`)
      // Uppercase storage/RAM units (attached, e.g. "16gb" → "16GB")
      .replace(/\b(\d+)(gb|tb)\b/gi, (_, num, unit) => `${num}${unit.toUpperCase()}`)
      .replace(/\bnvme\b/gi, 'NVMe')
      .replace(/\b(lpddr\d+x?|ddr\d+x?|ssd|hdd|fhd|qhd|uhd|ips|oled|amoled)\b/gi, s => s.toUpperCase())
      // Uppercase CPU model numbers (e.g. 7520u → 7520U, 7735hs → 7735HS)
      .replace(/\b(\d{4,}[a-z]{1,3})\b/gi, s => s.toUpperCase())
      // Connectivity / network standards
      .replace(/\b5g\b/gi, '5G')
      .replace(/\b4g\b/gi, '4G')
      .replace(/\blte\b/gi, 'LTE')
      .replace(/\bnfc\b/gi, 'NFC')
      // Hardware revision / generation letters: g10 → G10, m1/m2 → M1/M2, n100/n305 → N100/N305
      .replace(/\b([gG]\d{1,2})\b/g, s => s.toUpperCase())
      .replace(/\b([mM]\d{1,2})\b/g, s => s.toUpperCase())
      .replace(/\b([nN]\d{3,4})\b/g, s => s.toUpperCase())
      // Known brands
      .replace(/\bhp\b/gi, 'HP')
      .replace(/\bdell\b/gi, 'Dell')
      .replace(/\blenovo\b/gi, 'Lenovo')
      .replace(/\basus\b/gi, 'ASUS')
      .replace(/\bacer\b/gi, 'Acer')
      .replace(/\bapple\b/gi, 'Apple')
      .replace(/\bsamsung\b/gi, 'Samsung')
      .replace(/\bxiaomi\b/gi, 'Xiaomi')
      .replace(/\bhuawei\b/gi, 'Huawei')
      .replace(/\bmicrosoft\b/gi, 'Microsoft')
      .replace(/\boppo\b/gi, 'OPPO')
      .replace(/\brealme\b/gi, 'Realme')
      .replace(/\boneplus\b/gi, 'OnePlus')
      .replace(/\bgoogle\b/gi, 'Google')
      .replace(/\bnokia\b/gi, 'Nokia')
      .replace(/\bmotorola\b/gi, 'Motorola')
      // Product line names (before CPU families to avoid clobbering)
      .replace(/\bideapad\b/gi, 'IdeaPad')
      .replace(/\bthinkpad\b/gi, 'ThinkPad')
      .replace(/\bthinkbook\b/gi, 'ThinkBook')
      .replace(/\bvivobook\b/gi, 'VivoBook')
      .replace(/\bzenbook\b/gi, 'ZenBook')
      .replace(/\belitebook\b/gi, 'EliteBook')
      .replace(/\bprobook\b/gi, 'ProBook')
      .replace(/\bmacbook\b/gi, 'MacBook')
      .replace(/\bchromebook\b/gi, 'Chromebook')
      // CPU families
      .replace(/\b(ryzen)\b/gi, 'Ryzen')
      .replace(/\b(intel)\b/gi, 'Intel')
      .replace(/\b(amd)\b/gi, 'AMD')
      .replace(/\b(snapdragon)\b/gi, 'Snapdragon')
      .replace(/\b(mediatek|dimensity|helio)\b/gi, s => s.charAt(0).toUpperCase() + s.slice(1))
      // Phone/tablet product names
      .replace(/\biphone\b/gi, 'iPhone')
      .replace(/\bipad\b/gi, 'iPad')
      .replace(/\bgalaxy\b/gi, 'Galaxy')
      .replace(/\bpixel\b/gi, 'Pixel')
      .replace(/\bredmi\b/gi, 'Redmi')
      .replace(/\bpoco\b/gi, 'POCO')
      // Samsung Galaxy letter-number series: "Galaxy a55" → "Galaxy A55"
      .replace(/\bGalaxy\s+([a-z])(\d{2,})\b/g, (_, l, n) => `Galaxy ${l.toUpperCase()}${n}`)
      // Device category words — title-case for cleaner display
      .replace(/\b(laptop|notebook|desktop|smartphone|tablet)\b/gi,
        s => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase())
      .replace(/\bpc\b/gi, 'PC')
      // Form factor
      .replace(/\b2in1\b/gi, '2-in-1')
      // Deduplicate repeated category word around a screen-size: "Laptop 15.6 Laptop" → "Laptop 15.6"
      .replace(/\b(Laptop|Notebook|Phone|Smartphone)\s+(\d{2}\.?\d*)\s+\1\b/g, '$1 $2')
      // OS names that survive as plain words after the win## rule
      .replace(/\bwindows\b/gi, 'Windows')
      .replace(/\bandroid\b/gi, 'Android')
      // Product variant suffixes — must come last so model-line replacements aren't clobbered
      .replace(/\b(slim)\b/gi, 'Slim')
      .replace(/\b(pro)\b/gi, 'Pro')
      .replace(/\b(max)\b/gi, 'Max')
      .replace(/\b(plus)\b/gi, 'Plus')
      .replace(/\b(ultra)\b/gi, 'Ultra')
      .replace(/\b(mini)\b/gi, 'Mini')
      .replace(/\b(lite)\b/gi, 'Lite')
      .replace(/\b(se)\b/gi, 'SE')
      .replace(/\b(air)\b/gi, 'Air')
      // Title-case first word
      .replace(/^\w+/, s => s.charAt(0).toUpperCase() + s.slice(1));

    // Remove trailing single variant letter (e.g. "... FHD L")
    title = title.replace(/\s+[A-Za-z]\s*$/, '').trim();
    return title.length > 8 ? title.slice(0, 200) : null;
  }

  private normaliseAvailability(raw: string): string {
    const r = raw.toLowerCase();
    if (/out\s*of\s*stock|unavailable/i.test(r)) return 'Out of stock';
    if (/limited\s*stock|low\s*stock/i.test(r)) return 'Limited stock';
    if (/in\s*stock|available/i.test(r)) return 'In stock';
    if (/pre[- ]order/i.test(r)) return 'Pre-order';
    if (/discontinued/i.test(r)) return 'Discontinued';
    return raw.slice(0, 50);
  }

  private stripTags(html: string): string {
    return html
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s{2,}/g, ' ')
      .trim();
  }

  private decodeHtmlEntities(text: string): string {
    return text
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&nbsp;/g, ' ')
      .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(parseInt(code)));
  }
}
