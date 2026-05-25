/**
 * NVD (National Vulnerability Database) provider.
 * Used for optional security/vulnerability advisory.
 * Searches known CVEs related to device CPUs, OS versions, firmware, or model names.
 *
 * Free tier: no API key required but rate-limited to 5 requests/30s.
 * Authenticated: requires NVD_API_KEY for higher rate limits.
 *
 * Only use for security advisory — not for specs, prices, or parts.
 */

import { makeNotConfiguredStatus, makeConnectedStatus, makeFailedStatus, makeNoResultsStatus } from '@/lib/types/providers';
import type { ProviderStatus } from '@/lib/types/providers';

export interface VulnerabilityResult {
  success: boolean;
  providerStatuses: ProviderStatus[];
  cveIds: string[];
  summary: string | null;
  lastCheckedAt: string;
}

export class NvdProvider {
  name = 'NVD (NIST)';

  isConfigured(): boolean {
    // NVD has a free unauthenticated tier — always available, but API key gives higher limits
    return true;
  }

  async searchVulnerabilities(query: string): Promise<VulnerabilityResult> {
    const now = new Date().toISOString();

    try {
      const apiKey = process.env.NVD_API_KEY;
      const headers: Record<string, string> = {};
      if (apiKey) headers['apiKey'] = apiKey;

      const params = new URLSearchParams({
        keywordSearch: query.slice(0, 200),
        resultsPerPage: '5',
      });

      const res = await fetch(`https://services.nvd.nist.gov/rest/json/cves/2.0?${params.toString()}`, {
        headers,
        signal: AbortSignal.timeout(10000),
      });

      if (!res.ok) {
        if (res.status === 429) {
          return {
            success: false,
            providerStatuses: [{
              providerName: this.name,
              connected: false,
              status: 'rate-limited',
              message: 'NVD rate limit reached. Add NVD_API_KEY for higher limits.',
              lastCheckedAt: now,
            }],
            cveIds: [],
            summary: null,
            lastCheckedAt: now,
          };
        }
        throw new Error(`NVD API: HTTP ${res.status}`);
      }

      const data = await res.json() as {
        vulnerabilities?: Array<{
          cve: {
            id: string;
            descriptions?: Array<{ lang: string; value: string }>;
          };
        }>;
        totalResults?: number;
      };

      const vulns = data.vulnerabilities ?? [];
      if (vulns.length === 0) {
        return {
          success: false,
          providerStatuses: [makeNoResultsStatus(this.name)],
          cveIds: [],
          summary: null,
          lastCheckedAt: now,
        };
      }

      const cveIds = vulns.map(v => v.cve.id);
      const firstDesc = vulns[0]?.cve?.descriptions?.find(d => d.lang === 'en')?.value ?? null;

      return {
        success: true,
        providerStatuses: [makeConnectedStatus(this.name, `Found ${data.totalResults ?? vulns.length} CVEs for "${query}".`)],
        cveIds,
        summary: firstDesc?.slice(0, 300) ?? null,
        lastCheckedAt: now,
      };
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown NVD error';
      return {
        success: false,
        providerStatuses: [makeFailedStatus(this.name, msg)],
        cveIds: [],
        summary: null,
        lastCheckedAt: now,
      };
    }
  }
}
