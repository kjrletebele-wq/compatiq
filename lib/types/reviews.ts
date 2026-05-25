import type { DeviceIdentity, DeviceSpecs } from './device';
import type { ProviderStatus } from './providers';

export interface ReviewSearchInput {
  device: DeviceIdentity;
  specs?: DeviceSpecs | null;
}

export interface ReviewSignal {
  sourceName: string;
  sourceUrl?: string | null;
  overallSentiment: 'positive' | 'mixed' | 'negative' | 'neutral';
  reviewSummary: string;
  commonPraises: string[];
  commonComplaints: string[];
  batteryConcerns: string[];
  performanceConcerns: string[];
  buildQualityConcerns: string[];
  reliabilityConcerns: string[];
  valueForMoneyComments: string[];
  lastCheckedAt: string;
  confidence: 'high' | 'medium' | 'low' | 'demo';
  /** Whether signals are from exact model, same family, or a mix */
  matchCoverage?: 'exact' | 'family' | 'mixed';
  /** True when no exact-model snippets were found — signals are from general family reviews */
  noExactSignals?: boolean;
}

export interface ReviewSearchResult {
  success: boolean;
  providerStatuses: ProviderStatus[];
  signals: ReviewSignal[];
  warnings: string[];
  lastCheckedAt: string;
}
