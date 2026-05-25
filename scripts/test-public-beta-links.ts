/**
 * CompatIQ — Public Beta Link Test Script
 *
 * Tests POST /api/product/analyse-link for each URL in test-links/public-beta-links.json.
 * Requires the dev server to be running on localhost:3001 (or override via BASE_URL env var).
 *
 * Run:
 *   npx tsx scripts/test-public-beta-links.ts
 *
 * Outputs:
 *   reports/public-beta-link-test-report.json
 *   reports/public-beta-link-test-report.md
 *
 * Classification:
 *   PASS    = device identified with at least CPU or chipset + (RAM or storage)
 *   PARTIAL = device name/brand identified but key specs missing
 *   FAIL    = no device identity, manual fallback required
 */

import * as fs from 'fs';
import * as path from 'path';

const BASE_URL = process.env.BASE_URL ?? 'http://localhost:3001';
const LINKS_FILE = path.resolve(__dirname, '../test-links/public-beta-links.json');
const REPORT_DIR = path.resolve(__dirname, '../reports');
const REPORT_JSON = path.join(REPORT_DIR, 'public-beta-link-test-report.json');
const REPORT_MD = path.join(REPORT_DIR, 'public-beta-link-test-report.md');

interface TestLink {
  store: string;
  url: string;
  expectedCategory: string;
  expectedBrand: string;
  notes: string;
}

interface DeviceSpecs {
  cpu?: string | null;
  chipset?: string | null;
  ramGb?: number | null;
  storageGb?: number | null;
  display?: string | null;
  operatingSystem?: string | null;
  [key: string]: unknown;
}

interface DeviceIdentity {
  brand?: string | null;
  model?: string | null;
  deviceName?: string | null;
  category?: string | null;
  confidence?: string | null;
  sourceProvider?: string | null;
}

interface AnalyseLinkResult {
  success: boolean;
  sourceType?: string;
  device?: DeviceIdentity | null;
  specs?: DeviceSpecs | null;
  warnings?: string[];
}

interface TestResult {
  store: string;
  url: string;
  expectedCategory: string;
  expectedBrand: string;
  notes: string;
  success: boolean;
  extractionType: string;
  category: string | null;
  brand: string | null;
  modelOrDeviceName: string | null;
  cpu: string | null;
  ram: string | null;
  storage: string | null;
  display: string | null;
  os: string | null;
  missingFields: string[];
  warnings: string[];
  classification: 'PASS' | 'PARTIAL' | 'FAIL';
  error?: string;
  durationMs: number;
}

function classify(result: AnalyseLinkResult | null): 'PASS' | 'PARTIAL' | 'FAIL' {
  if (!result || !result.success) return 'FAIL';
  const { device, specs } = result;
  if (!device?.brand && !device?.deviceName && !device?.model) return 'FAIL';
  const hasCpu = !!(specs?.cpu || specs?.chipset);
  const hasMemory = !!(specs?.ramGb || specs?.storageGb);
  if (hasCpu && hasMemory) return 'PASS';
  return 'PARTIAL';
}

function getMissingFields(specs: DeviceSpecs | null | undefined): string[] {
  if (!specs) return ['cpu', 'ram', 'storage', 'display', 'os'];
  const missing: string[] = [];
  if (!specs.cpu && !specs.chipset) missing.push('cpu/chipset');
  if (!specs.ramGb) missing.push('ram');
  if (!specs.storageGb) missing.push('storage');
  if (!specs.display) missing.push('display');
  if (!specs.operatingSystem) missing.push('os');
  return missing;
}

async function testLink(link: TestLink): Promise<TestResult> {
  const start = Date.now();
  let raw: AnalyseLinkResult | null = null;
  let error: string | undefined;

  try {
    const res = await fetch(`${BASE_URL}/api/product/analyse-link`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: link.url }),
    });
    raw = (await res.json()) as AnalyseLinkResult;
  } catch (err) {
    error = err instanceof Error ? err.message : String(err);
  }

  const durationMs = Date.now() - start;
  const classification = error ? 'FAIL' : classify(raw);

  return {
    store: link.store,
    url: link.url,
    expectedCategory: link.expectedCategory,
    expectedBrand: link.expectedBrand,
    notes: link.notes,
    success: raw?.success ?? false,
    extractionType: raw?.sourceType ?? (error ? 'error' : 'unknown'),
    category: raw?.device?.category ?? null,
    brand: raw?.device?.brand ?? null,
    modelOrDeviceName: raw?.device?.deviceName ?? raw?.device?.model ?? null,
    cpu: raw?.specs?.cpu ?? raw?.specs?.chipset ?? null,
    ram: raw?.specs?.ramGb != null ? `${raw.specs.ramGb}GB` : null,
    storage: raw?.specs?.storageGb != null ? `${raw.specs.storageGb}GB` : null,
    display: raw?.specs?.display ?? null,
    os: raw?.specs?.operatingSystem ?? null,
    missingFields: getMissingFields(raw?.specs),
    warnings: raw?.warnings ?? [],
    classification,
    error,
    durationMs,
  };
}

function renderMd(results: TestResult[]): string {
  const pass = results.filter(r => r.classification === 'PASS').length;
  const partial = results.filter(r => r.classification === 'PARTIAL').length;
  const fail = results.filter(r => r.classification === 'FAIL').length;
  const total = results.length;
  const date = new Date().toISOString().split('T')[0];

  const lines: string[] = [
    `# CompatIQ — Public Beta Link Test Report`,
    `Generated: ${date}`,
    ``,
    `## Summary`,
    ``,
    `| Total | PASS | PARTIAL | FAIL |`,
    `|-------|------|---------|------|`,
    `| ${total} | ${pass} | ${partial} | ${fail} |`,
    ``,
    `## Results`,
    ``,
  ];

  for (const r of results) {
    const badge = r.classification === 'PASS' ? '✅ PASS'
      : r.classification === 'PARTIAL' ? '⚠️ PARTIAL' : '❌ FAIL';
    lines.push(`### ${r.store} — ${badge}`);
    lines.push(`- **URL:** ${r.url}`);
    lines.push(`- **Expected:** ${r.expectedCategory} / ${r.expectedBrand}`);
    lines.push(`- **Got:** ${r.category ?? '—'} / ${r.brand ?? '—'} / ${r.modelOrDeviceName ?? '—'}`);
    lines.push(`- **CPU:** ${r.cpu ?? '—'}`);
    lines.push(`- **RAM:** ${r.ram ?? '—'} | **Storage:** ${r.storage ?? '—'}`);
    lines.push(`- **Display:** ${r.display ?? '—'} | **OS:** ${r.os ?? '—'}`);
    if (r.missingFields.length) lines.push(`- **Missing:** ${r.missingFields.join(', ')}`);
    if (r.warnings.length) lines.push(`- **Warnings:** ${r.warnings.join('; ')}`);
    if (r.error) lines.push(`- **Error:** ${r.error}`);
    lines.push(`- **Extraction type:** ${r.extractionType} | **Time:** ${r.durationMs}ms`);
    lines.push(`- **Notes:** ${r.notes}`);
    lines.push('');
  }

  lines.push(`## Classification criteria`);
  lines.push('');
  lines.push('- **PASS** = device identity found with CPU/chipset + RAM or storage');
  lines.push('- **PARTIAL** = device name/brand identified but key specs missing');
  lines.push('- **FAIL** = no device identity, manual fallback required');

  return lines.join('\n');
}

async function main() {
  console.log(`\nCompatIQ Public Beta Link Test`);
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`Links file: ${LINKS_FILE}\n`);

  if (!fs.existsSync(LINKS_FILE)) {
    console.error(`ERROR: ${LINKS_FILE} not found.`);
    process.exit(1);
  }

  const links: TestLink[] = JSON.parse(fs.readFileSync(LINKS_FILE, 'utf-8'));
  console.log(`Testing ${links.length} links...\n`);

  const results: TestResult[] = [];
  for (const link of links) {
    process.stdout.write(`  ${link.store.padEnd(22)} `);
    const result = await testLink(link);
    results.push(result);
    const badge = result.classification === 'PASS' ? '✅ PASS'
      : result.classification === 'PARTIAL' ? '⚠  PARTIAL' : '❌ FAIL';
    console.log(`${badge}  (${result.durationMs}ms)  ${result.modelOrDeviceName ?? result.error ?? 'no device'}`);
    // Delay between requests to avoid rate limiting ourselves
    await new Promise(r => setTimeout(r, 500));
  }

  // Write outputs
  if (!fs.existsSync(REPORT_DIR)) fs.mkdirSync(REPORT_DIR, { recursive: true });
  fs.writeFileSync(REPORT_JSON, JSON.stringify(results, null, 2));
  fs.writeFileSync(REPORT_MD, renderMd(results));

  const pass = results.filter(r => r.classification === 'PASS').length;
  const partial = results.filter(r => r.classification === 'PARTIAL').length;
  const fail = results.filter(r => r.classification === 'FAIL').length;

  console.log(`\n─────────────────────────────────────────────`);
  console.log(`  PASS: ${pass}  PARTIAL: ${partial}  FAIL: ${fail}  (of ${results.length})`);
  console.log(`  Report: ${REPORT_MD}`);
  console.log(`─────────────────────────────────────────────\n`);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
