export interface SupplierProduct {
  id: string;
  name: string;
  category: 'battery' | 'inverter' | 'mppt' | 'dcdc' | 'shunt' | 'distributor' | 'fuse_block' | 'isolator' | 'cable' | 'accessory';
  supplierUrl: string;
  supplierPrice: number;
  craftedPrice: number;
  imageUrl?: string;
  specs?: Record<string, string | number>;
}

const SUPPLIER_BASE = 'https://www.batteriesandsolar.co.uk';
const DISCOUNT = 0.05;

function crafted(price: number): number {
  return Math.round(price * (1 - DISCOUNT) * 100) / 100;
}

export const SUPPLIER_CATALOG: SupplierProduct[] = [
  // Batteries — Fogstar Drift Standard
  { id: 'fogstar-105', name: 'Fogstar Drift 105Ah', category: 'battery', supplierUrl: `${SUPPLIER_BASE}/products/fogstar-drift-105ah`, supplierPrice: 288.16, craftedPrice: crafted(288.16), specs: { capacityAh: 105, voltage: 12 } },
  { id: 'fogstar-230', name: 'Fogstar Drift 230Ah', category: 'battery', supplierUrl: `${SUPPLIER_BASE}/products/fogstar-drift-230ah`, supplierPrice: 487.50, craftedPrice: crafted(487.50), specs: { capacityAh: 230, voltage: 12 } },
  { id: 'fogstar-280', name: 'Fogstar Drift 280Ah', category: 'battery', supplierUrl: `${SUPPLIER_BASE}/products/fogstar-drift-280ah`, supplierPrice: 533.33, craftedPrice: crafted(533.33), specs: { capacityAh: 280, voltage: 12 } },
  { id: 'fogstar-300', name: 'Fogstar Drift 300Ah', category: 'battery', supplierUrl: `${SUPPLIER_BASE}/products/fogstar-drift-300ah`, supplierPrice: 623.32, craftedPrice: crafted(623.32), specs: { capacityAh: 300, voltage: 12 } },
  { id: 'fogstar-460', name: 'Fogstar Drift 460Ah', category: 'battery', supplierUrl: `${SUPPLIER_BASE}/products/fogstar-drift-460ah`, supplierPrice: 766.67, craftedPrice: crafted(766.67), specs: { capacityAh: 460, voltage: 12 } },
  { id: 'fogstar-608', name: 'Fogstar Drift 608Ah', category: 'battery', supplierUrl: `${SUPPLIER_BASE}/products/fogstar-drift-608ah`, supplierPrice: 899.98, craftedPrice: crafted(899.98), specs: { capacityAh: 608, voltage: 12 } },

  // Inverter/Charger — Victron MultiPlus
  { id: 'multiplus-12-800', name: 'Victron MultiPlus 12/800/35', category: 'inverter', supplierUrl: `${SUPPLIER_BASE}/products/victron-multiplus-12-800-35`, supplierPrice: 499.00, craftedPrice: crafted(499.00), specs: { watts: 800, amps: 35 } },
  { id: 'multiplus-12-1600', name: 'Victron MultiPlus 12/1600/70', category: 'inverter', supplierUrl: `${SUPPLIER_BASE}/products/victron-multiplus-12-1600-70`, supplierPrice: 799.00, craftedPrice: crafted(799.00), specs: { watts: 1600, amps: 70 } },
  { id: 'multiplus-12-2000', name: 'Victron MultiPlus 12/2000/80', category: 'inverter', supplierUrl: `${SUPPLIER_BASE}/products/victron-multiplus-12-2000-80`, supplierPrice: 1099.00, craftedPrice: crafted(1099.00), specs: { watts: 2000, amps: 80 } },
  { id: 'multiplus-12-3000', name: 'Victron MultiPlus 12/3000/120', category: 'inverter', supplierUrl: `${SUPPLIER_BASE}/products/victron-multiplus-12-3000-120`, supplierPrice: 1499.00, craftedPrice: crafted(1499.00), specs: { watts: 3000, amps: 120 } },

  // MPPT Solar Charge Controllers — Victron SmartSolar
  { id: 'mppt-75-15', name: 'Victron SmartSolar MPPT 75/15', category: 'mppt', supplierUrl: `${SUPPLIER_BASE}/products/victron-smartsolar-mppt-75-15`, supplierPrice: 109.00, craftedPrice: crafted(109.00), specs: { amps: 15, maxPv: 220 } },
  { id: 'mppt-100-20', name: 'Victron SmartSolar MPPT 100/20', category: 'mppt', supplierUrl: `${SUPPLIER_BASE}/products/victron-smartsolar-mppt-100-20`, supplierPrice: 139.00, craftedPrice: crafted(139.00), specs: { amps: 20, maxPv: 290 } },
  { id: 'mppt-100-30', name: 'Victron SmartSolar MPPT 100/30', category: 'mppt', supplierUrl: `${SUPPLIER_BASE}/products/victron-smartsolar-mppt-100-30`, supplierPrice: 179.00, craftedPrice: crafted(179.00), specs: { amps: 30, maxPv: 440 } },
  { id: 'mppt-100-50', name: 'Victron SmartSolar MPPT 100/50', category: 'mppt', supplierUrl: `${SUPPLIER_BASE}/products/victron-smartsolar-mppt-100-50`, supplierPrice: 269.00, craftedPrice: crafted(269.00), specs: { amps: 50, maxPv: 700 } },

  // DC-DC Chargers — Victron Orion-Tr Smart
  { id: 'orion-12-12-18', name: 'Victron Orion-Tr Smart 12/12-18A', category: 'dcdc', supplierUrl: `${SUPPLIER_BASE}/products/victron-orion-tr-smart-12-12-18`, supplierPrice: 149.00, craftedPrice: crafted(149.00), specs: { amps: 18 } },
  { id: 'orion-12-12-30', name: 'Victron Orion-Tr Smart 12/12-30A', category: 'dcdc', supplierUrl: `${SUPPLIER_BASE}/products/victron-orion-tr-smart-12-12-30`, supplierPrice: 199.00, craftedPrice: crafted(199.00), specs: { amps: 30 } },

  // Battery Monitor
  { id: 'smartshunt-500', name: 'Victron SmartShunt 500A/50mV', category: 'shunt', supplierUrl: `${SUPPLIER_BASE}/products/victron-smartshunt-500a-50mv`, supplierPrice: 79.00, craftedPrice: crafted(79.00) },

  // Lynx Distributor
  { id: 'lynx-distributor', name: 'Victron Lynx Distributor', category: 'distributor', supplierUrl: `${SUPPLIER_BASE}/products/victron-lynx-distributor`, supplierPrice: 109.00, craftedPrice: crafted(109.00) },

  // Blue Sea Fuse Block
  { id: 'bluesea-st-12', name: 'Blue Sea ST Blade Fuse Block 12-Circuit', category: 'fuse_block', supplierUrl: `${SUPPLIER_BASE}/products/blue-sea-st-blade-fuse-block-12`, supplierPrice: 69.00, craftedPrice: crafted(69.00) },

  // Battery Isolator
  { id: 'battery-isolator', name: 'Battery Isolator Switch 300A', category: 'isolator', supplierUrl: `${SUPPLIER_BASE}/products/battery-isolator-300a`, supplierPrice: 29.00, craftedPrice: crafted(29.00) },

  // Cables
  { id: 'cable-16mm', name: '16mm² Battery Cable (per metre)', category: 'cable', supplierUrl: `${SUPPLIER_BASE}/products/16mm-battery-cable`, supplierPrice: 5.50, craftedPrice: crafted(5.50) },
  { id: 'cable-25mm', name: '25mm² Battery Cable (per metre)', category: 'cable', supplierUrl: `${SUPPLIER_BASE}/products/25mm-battery-cable`, supplierPrice: 7.50, craftedPrice: crafted(7.50) },
  { id: 'cable-35mm', name: '35mm² Battery Cable (per metre)', category: 'cable', supplierUrl: `${SUPPLIER_BASE}/products/35mm-battery-cable`, supplierPrice: 9.50, craftedPrice: crafted(9.50) },
  { id: 'cable-50mm', name: '50mm² Battery Cable (per metre)', category: 'cable', supplierUrl: `${SUPPLIER_BASE}/products/50mm-battery-cable`, supplierPrice: 12.00, craftedPrice: crafted(12.00) },
  { id: 'cable-70mm', name: '70mm² Battery Cable (per metre)', category: 'cable', supplierUrl: `${SUPPLIER_BASE}/products/70mm-battery-cable`, supplierPrice: 16.00, craftedPrice: crafted(16.00) },

  // Accessories
  { id: 'terminal-lugs-kit', name: 'Copper Terminal Lug Kit (assorted)', category: 'accessory', supplierUrl: `${SUPPLIER_BASE}/products/copper-terminal-lug-kit`, supplierPrice: 24.00, craftedPrice: crafted(24.00) },
  { id: 'heat-shrink-kit', name: 'Marine Grade Heat Shrink Kit', category: 'accessory', supplierUrl: `${SUPPLIER_BASE}/products/heat-shrink-kit`, supplierPrice: 18.00, craftedPrice: crafted(18.00) },
  { id: 'mega-fuse-200', name: 'Mega Fuse 200A + Holder', category: 'accessory', supplierUrl: `${SUPPLIER_BASE}/products/mega-fuse-200a`, supplierPrice: 12.50, craftedPrice: crafted(12.50) },
  { id: 'midi-fuse-60', name: 'MIDI Fuse 60A + Holder', category: 'accessory', supplierUrl: `${SUPPLIER_BASE}/products/midi-fuse-60a`, supplierPrice: 8.50, craftedPrice: crafted(8.50) },
  { id: 'anl-fuse-holder', name: 'ANL Fuse Holder + 300A Fuse', category: 'accessory', supplierUrl: `${SUPPLIER_BASE}/products/anl-fuse-300a`, supplierPrice: 15.00, craftedPrice: crafted(15.00) },
  { id: 'rcd-consumer-unit', name: 'Compact RCD Consumer Unit', category: 'accessory', supplierUrl: `${SUPPLIER_BASE}/products/compact-rcd-consumer-unit`, supplierPrice: 45.00, craftedPrice: crafted(45.00) },
];

export function getProductById(id: string): SupplierProduct | undefined {
  return SUPPLIER_CATALOG.find(p => p.id === id);
}

export function getProductsByCategory(category: SupplierProduct['category']): SupplierProduct[] {
  return SUPPLIER_CATALOG.filter(p => p.category === category);
}

export function buildShoppingList(spec: {
  recommendedBankAh: number;
  inverterSize: number;
  recommendedSolarW: number;
  dcDcChargerSize: number;
  batteryVoltage: number;
}): { items: SupplierProduct[]; totalRRP: number; totalCrafted: number; savings: number } {
  const items: SupplierProduct[] = [];

  const batteries = getProductsByCategory('battery');
  const bat = batteries.find(b => b.specs?.capacityAh && (b.specs.capacityAh as number) >= spec.recommendedBankAh) || batteries[batteries.length - 1];
  if (bat) items.push(bat);

  if (spec.inverterSize > 0) {
    const inverters = getProductsByCategory('inverter');
    const inv = inverters.find(i => i.specs?.watts && (i.specs.watts as number) >= spec.inverterSize) || inverters[inverters.length - 1];
    if (inv) items.push(inv);
  }

  if (spec.recommendedSolarW > 0) {
    const mppts = getProductsByCategory('mppt');
    const requiredAmps = Math.ceil(spec.recommendedSolarW / 18);
    const mppt = mppts.find(m => m.specs?.amps && (m.specs.amps as number) >= requiredAmps) || mppts[mppts.length - 1];
    if (mppt) items.push(mppt);
  }

  if (spec.dcDcChargerSize > 0) {
    const dcdcs = getProductsByCategory('dcdc');
    const dcdc = dcdcs.find(d => d.specs?.amps && (d.specs.amps as number) >= spec.dcDcChargerSize) || dcdcs[dcdcs.length - 1];
    if (dcdc) items.push(dcdc);
  }

  const shunt = getProductById('smartshunt-500');
  if (shunt) items.push(shunt);

  const dist = getProductById('lynx-distributor');
  if (dist) items.push(dist);

  const fuse = getProductById('bluesea-st-12');
  if (fuse) items.push(fuse);

  const iso = getProductById('battery-isolator');
  if (iso) items.push(iso);

  items.push(
    ...['terminal-lugs-kit', 'heat-shrink-kit', 'mega-fuse-200', 'anl-fuse-holder', 'rcd-consumer-unit']
      .map(getProductById)
      .filter((p): p is SupplierProduct => !!p)
  );

  const cableId = spec.recommendedBankAh > 300 ? 'cable-70mm' : spec.recommendedBankAh > 200 ? 'cable-50mm' : 'cable-35mm';
  const cable = getProductById(cableId);
  if (cable) items.push({ ...cable, supplierPrice: cable.supplierPrice * 5, craftedPrice: cable.craftedPrice * 5, name: `${cable.name} × 5m` });

  const totalRRP = items.reduce((sum, i) => sum + i.supplierPrice, 0);
  const totalCrafted = items.reduce((sum, i) => sum + i.craftedPrice, 0);
  const savings = Math.round((totalRRP - totalCrafted) * 100) / 100;

  return { items, totalRRP: Math.round(totalRRP * 100) / 100, totalCrafted: Math.round(totalCrafted * 100) / 100, savings };
}
