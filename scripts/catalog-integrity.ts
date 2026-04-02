import { RECOMMENDATION_CRITICAL_LEGACY_IDS } from '@/data/catalogLegacyCompatibility';
import { APP_CATALOG } from '@/data/catalog';
import { VICTRON_CATALOG_BY_ID } from '@/data/victronCatalog';

function fail(msg: string): never {
  throw new Error(msg);
}

function assert(cond: boolean, msg: string) {
  if (!cond) fail(msg);
}

const ids = new Set<string>();
for (const p of APP_CATALOG) {
  assert(Boolean(p.id), 'Catalog item missing id');
  assert(Boolean(p.name), `Catalog item missing name: ${p.id}`);
  assert(Boolean(p.searchableText), `Catalog item missing searchableText: ${p.id}`);
  if (ids.has(p.id)) fail(`Duplicate catalog id: ${p.id}`);
  ids.add(p.id);
}

for (const id of RECOMMENDATION_CRITICAL_LEGACY_IDS) {
  assert(Boolean(VICTRON_CATALOG_BY_ID[id]), `Missing critical legacy product id: ${id}`);
}

const missingPrice = APP_CATALOG.filter((p) => (p.price.incVat ?? p.price.listPrice ?? 0) <= 0).length;
const missingManual = APP_CATALOG.filter((p) => !p.manualUrl).length;
const inStockCount = APP_CATALOG.filter((p) => p.stockStatus === 'in_stock').length;

console.log('Catalog integrity checks passed.');
console.log(`Catalog products: ${APP_CATALOG.length}`);
console.log(`In-stock products: ${inStockCount}`);
console.log(`Products with non-positive price: ${missingPrice}`);
console.log(`Products missing manual URL: ${missingManual}`);
