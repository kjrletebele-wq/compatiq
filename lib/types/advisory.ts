import type { Purpose } from './device';

export type SuitabilityRating =
  | 'StrongFit'
  | 'GoodFit'
  | 'UsableWithLimits'
  | 'NotIdeal'
  | 'NotEnoughInformation';

export const SUITABILITY_LABELS: Record<SuitabilityRating, string> = {
  StrongFit: 'Strong fit',
  GoodFit: 'Good fit',
  UsableWithLimits: 'Usable with limits',
  NotIdeal: 'Not ideal',
  NotEnoughInformation: 'Not enough information',
};

export interface PurposeFitResult {
  purpose: Purpose;
  rating: SuitabilityRating;
  explanation: string;
  shouldWorkWellWith: string[];
  mayStruggleWith: string[];
  bottlenecks: string[];
  minimumRecommendedSpecs: string[];
  missingInformation: string[];
  confidence: 'high' | 'medium' | 'low';
}

export interface AdvisoryRequest {
  device: import('./device').DeviceIdentity;
  specs: import('./device').DeviceSpecs | null;
  purpose: Purpose;
}

export interface AdvisoryResult {
  purposeFit: PurposeFitResult;
  missingInformation: string[];
  confidence: 'high' | 'medium' | 'low';
  generatedAt: string;
}
