import type { CatalogProduct } from '@/utils/catalogTypes';
import type { VictronProduct } from '@/utils/wiringTypes';

export function catalogToCartProduct(p: CatalogProduct): VictronProduct {
  const id = p.legacyId ?? p.id;
  return {
    id,
    name: p.name,
    model: p.sku ?? p.shortDescription ?? 'CATALOG',
    category: mapToLegacyCategory(p.category),
    voltage: 12,
    specs: {
      stockStatus: p.stockLabel ?? p.stockStatus,
      imageUrl: p.imageUrl ?? '',
      tier: p.tier,
      source: p.source,
      leadTime: p.leadTime ?? '',
      brand: p.brand ?? '',
    },
    connections: [],
    setupActions: p.longDescription ? [p.longDescription] : [],
    manualUrl: p.manualUrl ?? 'https://www.batteriesandsolar.co.uk/shop',
    estimatedPrice: Number(p.price.incVat ?? p.price.listPrice ?? 0),
  };
}

function mapToLegacyCategory(category: string): VictronProduct['category'] {
  switch (category) {
    case 'batteries':
      return 'battery';
    case 'water':
      return 'water';
    case 'insulation':
      return 'insulation';
    case 'electrical':
      return 'appliance';
    case 'solar':
      return 'mppt';
    default:
      return 'appliance';
  }
}
