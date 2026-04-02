import { LEGACY_ID_TO_SUPPLIER_SKU } from '@/data/catalogLegacyCompatibility';
import { GENERATED_CATALOG_PRODUCTS, GENERATED_CATALOG_REPORT } from '@/data/generated/catalog.generated';
import { VICTRON_CATALOG } from '@/data/victronCatalog';
import type { CatalogImportReport, CatalogProduct, CatalogStockStatus } from '@/utils/catalogTypes';
import type { VictronProduct } from '@/utils/wiringTypes';

function mapLegacyToCatalog(product: VictronProduct): CatalogProduct {
  const stockLabel = typeof product.specs.stockStatus === 'string' ? product.specs.stockStatus : 'Unknown';
  const normalizedStock = normalizeStock(stockLabel);
  const sku = LEGACY_ID_TO_SUPPLIER_SKU[product.id];
  const tags = [
    String(product.category),
    String(product.model ?? ''),
    String(product.specs.tier ?? 'unknown'),
  ].filter(Boolean);
  return {
    id: `legacy_${product.id}`,
    legacyId: product.id,
    sku,
    name: product.name,
    shortDescription: String(product.model ?? ''),
    longDescription: product.setupActions.join(' | '),
    brand: inferBrand(product.name),
    category: mapCategory(product.category),
    subcategory: String(product.category),
    tags,
    tier: product.specs.tier === 'budget' ? 'budget' : product.specs.tier === 'premium' ? 'premium' : 'unknown',
    stockStatus: normalizedStock,
    stockLabel,
    leadTime: undefined,
    weightKg: typeof product.specs.weight === 'number' ? Number(product.specs.weight) : undefined,
    imageUrl: typeof product.specs.imageUrl === 'string' ? product.specs.imageUrl : undefined,
    manualUrl: product.manualUrl,
    price: {
      incVat: Number(product.estimatedPrice),
      currency: 'GBP',
    },
    searchableText: [product.name, product.model, product.category, ...tags].join(' ').toLowerCase(),
    source: 'legacy',
    compatibility: {
      recommendationEligible: true,
      systemRoles: [String(product.category)],
    },
  };
}

function inferBrand(name: string): string {
  if (/fogstar/i.test(name)) return 'Fogstar';
  if (/victron/i.test(name) || /orion|multiplus|lynx|smartsolar|bluesolar|smartshunt/i.test(name)) return 'Victron';
  if (/dodo/i.test(name)) return 'Dodo';
  return 'Crafted';
}

function mapCategory(category: string): string {
  if (category === 'battery') return 'batteries';
  if (category === 'water') return 'water';
  if (category === 'insulation' || category === 'insulationAccessory') return 'insulation';
  if (category === 'appliance') return 'appliances';
  return 'electrical';
}

function normalizeStock(raw: string): CatalogStockStatus {
  const v = raw.toLowerCase();
  if (v.includes('in stock') || v === 'is') return 'in_stock';
  if (v.includes('out') || v === 'oos') return 'out_of_stock';
  if (v.includes('pre') || v.includes('due')) return 'preorder';
  return 'unknown';
}

const legacyCatalog = VICTRON_CATALOG.map(mapLegacyToCatalog);

const mergedByKey = new Map<string, CatalogProduct>();
for (const p of legacyCatalog) {
  const key = p.legacyId ? `legacy:${p.legacyId}` : `catalog:${p.id}`;
  mergedByKey.set(key, p);
}
for (const p of GENERATED_CATALOG_PRODUCTS) {
  const key = p.sku ? `sku:${p.sku}` : `catalog:${p.id}`;
  if (!mergedByKey.has(key)) mergedByKey.set(key, p);
}

export const APP_CATALOG: CatalogProduct[] = Array.from(mergedByKey.values());

export const APP_CATALOG_BY_ID: Record<string, CatalogProduct> = Object.fromEntries(
  APP_CATALOG.map((p) => [p.id, p]),
);

export const APP_CATALOG_BY_LEGACY_ID: Record<string, CatalogProduct> = Object.fromEntries(
  APP_CATALOG.filter((p) => !!p.legacyId).map((p) => [p.legacyId as string, p]),
);

export const CATALOG_IMPORT_REPORT: CatalogImportReport = GENERATED_CATALOG_REPORT;

export function filterCatalogByCategory(category: string): CatalogProduct[] {
  return APP_CATALOG.filter((p) => p.category === category);
}
