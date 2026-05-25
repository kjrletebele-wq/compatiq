import type { ReviewProvider } from './ReviewProvider';
import type { ReviewSearchInput, ReviewSearchResult } from '@/lib/types/reviews';
import { makeNotConfiguredStatus } from '@/lib/types/providers';

const providers: ReviewProvider[] = [];

export async function searchReviews(input: ReviewSearchInput): Promise<ReviewSearchResult> {
  const now = new Date().toISOString();
  const allStatuses = [];

  for (const provider of providers) {
    if (!provider.isConfigured()) {
      allStatuses.push(makeNotConfiguredStatus(provider.name));
      continue;
    }
    const result = await provider.searchReviews(input);
    allStatuses.push(...result.providerStatuses);
    if (result.success && result.signals.length > 0) {
      return { ...result, providerStatuses: allStatuses };
    }
  }

  return {
    success: false,
    providerStatuses: allStatuses.length ? allStatuses : [makeNotConfiguredStatus('ReviewProviderRegistry')],
    signals: [],
    warnings: ['No verified review source is connected yet.'],
    lastCheckedAt: now,
  };
}
