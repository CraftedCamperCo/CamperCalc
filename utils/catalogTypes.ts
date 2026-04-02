export type CatalogMode = 'shop' | 'repository';

export type CatalogTier = 'budget' | 'premium' | 'unknown';

export type CatalogStockStatus =
  | 'in_stock'
  | 'out_of_stock'
  | 'preorder'
  | 'discontinued'
  | 'unknown';

export interface CatalogPrice {
  incVat?: number;
  exVat?: number;
  vatRate?: number;
  listPrice?: number;
  discountPct?: number;
  currency: 'GBP';
}

export interface CatalogProduct {
  id: string;
  sku?: string;
  legacyId?: string;
  name: string;
  shortDescription?: string;
  longDescription?: string;
  brand?: string;
  category: string;
  subcategory?: string;
  tags: string[];
  tier: CatalogTier;
  stockStatus: CatalogStockStatus;
  stockLabel?: string;
  leadTime?: string;
  weightKg?: number;
  imageUrl?: string;
  manualUrl?: string;
  price: CatalogPrice;
  searchableText: string;
  source: 'legacy' | 'supplier_sheet1' | 'supplier_sheet2';
  compatibility: {
    recommendationEligible: boolean;
    systemRoles: string[];
  };
}

export interface CatalogImportReport {
  sourcePath: string;
  generatedAtIso: string;
  counts: {
    products: number;
    missingImages: number;
    missingManualUrls: number;
    duplicateSkus: number;
    invalidPrices: number;
    uncategorized: number;
  };
  duplicateSkuValues: string[];
  invalidPriceRows: Array<{ row: number; sku?: string; name?: string; rawPrice?: string }>;
}
