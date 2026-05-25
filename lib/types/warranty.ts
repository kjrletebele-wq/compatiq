export interface WarrantyInfo {
  status: 'active' | 'expired' | 'unknown';
  expiryDate?: string | null;
  coverageDescription?: string | null;
  supportUrl?: string | null;
  sourceProvider: string | null;
  lastCheckedAt: string;
}
