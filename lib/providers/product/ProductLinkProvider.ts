import type { ProductLinkInput, ProductLinkResult } from '@/lib/types/product';
import type { ProviderStatus } from '@/lib/types/providers';

export interface ProductLinkProvider {
  name: string;
  isConfigured(): boolean;
  canHandle(url: string): boolean;
  analyseLink(input: ProductLinkInput): Promise<ProductLinkResult>;
}
