#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import xlsx from 'xlsx';

const projectRoot = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const sourcePath = process.argv[2] || '/Users/danandrews/Downloads/Crafted Campers.xlsx';
const outFile = path.join(projectRoot, 'data/generated/catalog.generated.ts');
const reportMd = path.join(projectRoot, 'docs/catalog/CATALOG_IMPORT_REPORT.md');

const workbook = xlsx.readFile(sourcePath);
const sheet1 = workbook.Sheets.Sheet1;
if (!sheet1) {
  throw new Error('Sheet1 not found in workbook.');
}

const rows = xlsx.utils.sheet_to_json(sheet1, { defval: '' });

function normalizeStock(raw) {
  const v = String(raw || '').trim().toLowerCase();
  if (v === 'is' || v.includes('in stock')) return 'in_stock';
  if (v === 'oos' || v.includes('out')) return 'out_of_stock';
  if (v.includes('pre') || v.includes('due')) return 'preorder';
  if (v.includes('disc')) return 'discontinued';
  return 'unknown';
}

function inferTier(name) {
  const n = String(name || '').toLowerCase();
  if (n.includes('eco') || n.includes('budget')) return 'budget';
  if (n.includes('premium') || n.includes('drift')) return 'premium';
  return 'unknown';
}

function inferCategory(name, description) {
  const text = `${name} ${description}`.toLowerCase();
  if (text.includes('battery')) return 'batteries';
  if (text.includes('solar') || text.includes('mppt')) return 'solar';
  if (text.includes('water') || text.includes('tank') || text.includes('pump')) return 'water';
  if (text.includes('insulation') || text.includes('dodo') || text.includes('thermo')) return 'insulation';
  if (text.includes('inverter') || text.includes('orion') || text.includes('victron') || text.includes('fuse')) return 'electrical';
  if (text.includes('fridge') || text.includes('fan') || text.includes('heater')) return 'appliances';
  return 'misc';
}

function inferBrand(name) {
  const n = String(name || '').toLowerCase();
  if (n.includes('fogstar')) return 'Fogstar';
  if (n.includes('victron') || n.includes('multiplus') || n.includes('orion') || n.includes('lynx')) return 'Victron';
  if (n.includes('dodo')) return 'Dodo';
  return 'Supplier';
}

const duplicateSkuSet = new Set();
const seenSku = new Set();
const invalidPriceRows = [];
let missingImages = 0;
let missingManualUrls = 0;
let uncategorized = 0;

const products = rows
  .map((row, index) => {
    const sku = String(row['SKU / Product Code'] || '').trim();
    const name = String(row['Full Product Name'] || '').trim();
    if (!sku && !name) return null;
    if (sku) {
      if (seenSku.has(sku)) duplicateSkuSet.add(sku);
      seenSku.add(sku);
    }

    const shortDescription = String(row['Short Description'] || '').trim();
    const stockRaw = String(row['Stock Status'] || '').trim();
    const category = inferCategory(name, shortDescription);
    if (category === 'misc') uncategorized += 1;

    const incVat = Number(row['Price inc. VAT']);
    const exVat = Number(row['Price ex. VAT']);
    const vatRate = Number(row['VAT Rate']);
    const validPrice = Number.isFinite(incVat) || Number.isFinite(exVat);
    if (!validPrice) {
      invalidPriceRows.push({ row: index + 2, sku, name, rawPrice: String(row['Price inc. VAT']) });
    }

    const imageUrl = String(row['Image URL'] || '').trim();
    const manualUrl = String(row['Manual URL'] || '').trim();
    if (!imageUrl) missingImages += 1;
    if (!manualUrl) missingManualUrls += 1;

    return {
      id: `supplier_${sku || `row_${index + 2}`}`,
      sku: sku || undefined,
      name,
      shortDescription: shortDescription || undefined,
      longDescription: shortDescription || undefined,
      brand: inferBrand(name),
      category,
      subcategory: String(row['Category'] || '').trim() || undefined,
      tags: [category, inferTier(name), inferBrand(name).toLowerCase()].filter(Boolean),
      tier: inferTier(name),
      stockStatus: normalizeStock(stockRaw),
      stockLabel: stockRaw || undefined,
      leadTime: String(row['Lead Time'] || '').trim() || undefined,
      weightKg: Number.isFinite(Number(row['Weight (Kg)'])) ? Number(row['Weight (Kg)']) : undefined,
      imageUrl: imageUrl || undefined,
      manualUrl: manualUrl || undefined,
      price: {
        incVat: Number.isFinite(incVat) ? incVat : undefined,
        exVat: Number.isFinite(exVat) ? exVat : undefined,
        vatRate: Number.isFinite(vatRate) ? vatRate : undefined,
        currency: 'GBP',
      },
      searchableText: `${name} ${shortDescription} ${sku} ${category}`.toLowerCase(),
      source: 'supplier_sheet1',
      compatibility: {
        recommendationEligible: false,
        systemRoles: [category],
      },
    };
  })
  .filter(Boolean);

const report = {
  sourcePath,
  generatedAtIso: new Date().toISOString(),
  counts: {
    products: products.length,
    missingImages,
    missingManualUrls,
    duplicateSkus: duplicateSkuSet.size,
    invalidPrices: invalidPriceRows.length,
    uncategorized,
  },
  duplicateSkuValues: Array.from(duplicateSkuSet),
  invalidPriceRows,
};

const outputTs = `import type { CatalogImportReport, CatalogProduct } from '@/utils/catalogTypes';

/**
 * Auto-generated by scripts/import-catalog.mjs.
 * Source: ${sourcePath}
 */
export const GENERATED_CATALOG_PRODUCTS: CatalogProduct[] = ${JSON.stringify(products, null, 2)};

export const GENERATED_CATALOG_REPORT: CatalogImportReport = ${JSON.stringify(report, null, 2)};
`;

fs.mkdirSync(path.dirname(outFile), { recursive: true });
fs.writeFileSync(outFile, outputTs, 'utf8');

const reportText = `# Catalog Import Report

- Source: \`${sourcePath}\`
- Generated: \`${report.generatedAtIso}\`
- Products imported: **${report.counts.products}**
- Missing images: **${report.counts.missingImages}**
- Missing manual URLs: **${report.counts.missingManualUrls}**
- Duplicate SKUs: **${report.counts.duplicateSkus}**
- Invalid prices: **${report.counts.invalidPrices}**
- Uncategorized products: **${report.counts.uncategorized}**

## Duplicate SKUs
${report.duplicateSkuValues.length ? report.duplicateSkuValues.map((sku) => `- ${sku}`).join('\n') : '- None'}

## Invalid Price Rows
${report.invalidPriceRows.length ? report.invalidPriceRows.map((r) => `- row ${r.row} | sku=${r.sku || 'n/a'} | ${r.name || 'n/a'} | raw=${r.rawPrice || 'n/a'}`).join('\n') : '- None'}
`;
fs.writeFileSync(reportMd, reportText, 'utf8');

console.log(`Generated ${outFile}`);
console.log(`Generated ${reportMd}`);
