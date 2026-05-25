import type { PartsSearchInput, PartsSearchResult } from '@/lib/types/parts';

export interface PartsProvider {
  name: string;
  isConfigured(): boolean;
  searchParts(input: PartsSearchInput): Promise<PartsSearchResult>;
}
