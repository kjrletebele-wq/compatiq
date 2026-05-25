import type { ReviewSearchInput, ReviewSearchResult } from '@/lib/types/reviews';

export interface ReviewProvider {
  name: string;
  isConfigured(): boolean;
  searchReviews(input: ReviewSearchInput): Promise<ReviewSearchResult>;
}
