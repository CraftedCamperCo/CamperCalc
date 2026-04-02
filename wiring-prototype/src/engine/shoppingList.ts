import type { WiringSpec, ShoppingListItem, SystemConfig } from '../types';
import { CABLE_TABLE, TERMINAL_LUGS, findLug, ACCESSORIES, fusePriceByType, SOLAR_CABLE, AC_CABLE_2_5, BONDING_CABLE } from '../data/accessoryCatalog';

const PRODUCT_IMAGE_MAP: Record<string, string> = {
  battery: '/assets/third-party/fogstar-drift-230ah.png',
  inverterCharger: '/assets/victron/multiplus-2000.png',
  inverter: '/assets/victron/multiplus-2000.png',
  mppt: '/assets/victron/mppt-100-30.png',
  dcdc: '/assets/victron/orion-tr-smart-30.png',
  distributor: '/assets/victron/lynx-distributor.png',
  monitor: '/assets/victron/smartshunt-500a.png',
  protect: '/assets/victron/battery-protect-65a.png',
  charger: '/assets/victron/multiplus-2000.png',
};

export function generateShoppingList(spec: WiringSpec, config: SystemConfig): ShoppingListItem[] {
  const items: ShoppingListItem[] = [];

  // ── Section 1: Core Victron Components ──
  for (const comp of spec.components) {
    items.push({
      category: 'Core Components',
      name: comp.product.name,
      description: `${comp.product.model} — ${comp.role}`,
      quantity: comp.quantity,
      unit: 'unit',
      estimatedPrice: comp.product.estimatedPrice * comp.quantity,
      productUrl: comp.product.manualUrl,
      imageUrl: PRODUCT_IMAGE_MAP[comp.product.category],
    });
  }

  // ── Section 2: Cable ──
  const cableTotals = new Map<string, { gauge: number; type: string; color: string; length: number; pricePerM: number }>();

  for (const wire of spec.connections) {
    const key = `${wire.cableGauge}_${wire.cableType}_${wire.cableColor}`;
    const existing = cableTotals.get(key);
    if (existing) {
      existing.length += wire.length;
    } else {
      const cableSpec = wire.cableType === 'solar' ? SOLAR_CABLE
        : wire.cableType === 'H07RN-F' ? AC_CABLE_2_5
        : wire.cableType === 'bonding' ? BONDING_CABLE
        : CABLE_TABLE.find(c => c.gauge === wire.cableGauge);
      cableTotals.set(key, {
        gauge: wire.cableGauge,
        type: wire.cableType,
        color: wire.cableColor,
        length: wire.length,
        pricePerM: cableSpec?.pricePerMetre ?? 3,
      });
    }
  }

  for (const [, cable] of cableTotals) {
    const lengthWithMargin = Math.ceil(cable.length * 1.15); // 15% margin
    const colorLabel = cable.color === 'green_yellow' ? 'Green/Yellow' : cable.color.charAt(0).toUpperCase() + cable.color.slice(1);
    items.push({
      category: 'Cable',
      name: `${cable.gauge}mm² ${cable.type} cable (${colorLabel})`,
      description: `${cable.type === 'H07RN-F' ? '3-core rubber flex' : cable.type === 'solar' ? 'Victron solar cable' : cable.type === 'bonding' ? 'Tri-rated bonding' : 'Tri-rated single core'}`,
      quantity: lengthWithMargin,
      unit: 'metres',
      estimatedPrice: lengthWithMargin * cable.pricePerM,
    });
  }

  // ── Section 3: Terminal Lugs ──
  const lugCounts = new Map<string, { spec: typeof TERMINAL_LUGS[0]; count: number }>();

  for (const wire of spec.connections) {
    for (const lug of [wire.terminalLugFrom, wire.terminalLugTo]) {
      if (!lug) continue;
      const key = `${lug.cableSize}-${lug.studSize}`;
      const existing = lugCounts.get(key);
      const lugSpec = findLug(lug.cableSize, lug.studSize);
      if (existing) {
        existing.count++;
      } else if (lugSpec) {
        lugCounts.set(key, { spec: lugSpec, count: 1 });
      }
    }
  }

  for (const [, lug] of lugCounts) {
    items.push({
      category: 'Terminal Lugs',
      name: lug.spec.description,
      description: `${lug.spec.cableSize}mm² cable, M${lug.spec.studSize} stud — crimp with ${lug.spec.crimpDie}`,
      quantity: lug.count,
      unit: 'pcs',
      estimatedPrice: lug.count * lug.spec.priceEach,
    });
  }

  // ── Section 4: Fuses & Protection ──
  const fuseCounts = new Map<string, { type: string; rating: number; count: number }>();

  for (const wire of spec.connections) {
    if (wire.fuseRating && wire.fuseType) {
      const key = `${wire.fuseType}_${wire.fuseRating}`;
      const existing = fuseCounts.get(key);
      if (existing) {
        existing.count++;
      } else {
        fuseCounts.set(key, { type: wire.fuseType, rating: wire.fuseRating, count: 1 });
      }
    }
  }

  for (const [, fuse] of fuseCounts) {
    items.push({
      category: 'Fuses & Protection',
      name: `${fuse.rating}A ${fuse.type.toUpperCase()} fuse`,
      description: `${fuse.type === 'blade' ? 'Standard blade' : fuse.type === 'midi' ? 'MIDI/AMI slow-blow' : fuse.type === 'mega' ? 'MEGA slow-blow' : 'Glass'} fuse, ${fuse.rating}A`,
      quantity: fuse.count + 1, // +1 spare
      unit: 'pcs',
      estimatedPrice: (fuse.count + 1) * fusePriceByType(fuse.type, fuse.rating),
    });
  }

  // Fuse holders
  const needsMidi = [...fuseCounts.values()].some(f => f.type === 'midi');
  const needsMega = [...fuseCounts.values()].some(f => f.type === 'mega');
  const midiCount = [...fuseCounts.values()].filter(f => f.type === 'midi').reduce((sum, f) => sum + f.count, 0);
  const megaCount = [...fuseCounts.values()].filter(f => f.type === 'mega').reduce((sum, f) => sum + f.count, 0);

  if (needsMidi) {
    const holder = ACCESSORIES.find(a => a.id === 'midi_holder')!;
    items.push({
      category: 'Fuses & Protection',
      name: holder.name,
      description: holder.description,
      quantity: midiCount,
      unit: 'pcs',
      estimatedPrice: midiCount * holder.estimatedPrice,
    });
  }
  if (needsMega && !spec.components.some(c => c.product.id === 'lynx_dist')) {
    const holder = ACCESSORIES.find(a => a.id === 'mega_holder')!;
    items.push({
      category: 'Fuses & Protection',
      name: holder.name,
      description: holder.description,
      quantity: megaCount,
      unit: 'pcs',
      estimatedPrice: megaCount * holder.estimatedPrice,
    });
  }

  // DC fuse block
  const fuseBlock = ACCESSORIES.find(a => a.id === 'blade_block')!;
  items.push({
    category: 'Fuses & Protection',
    name: fuseBlock.name,
    description: fuseBlock.description,
    quantity: 1,
    unit: 'unit',
    estimatedPrice: fuseBlock.estimatedPrice,
  });

  // ── Section 5: Isolators & Switches ──
  const batIsolator = ACCESSORIES.find(a => a.id === 'bat_isolator')!;
  items.push({
    category: 'Isolators & Switches',
    name: batIsolator.name,
    description: batIsolator.description,
    quantity: 1,
    unit: 'unit',
    estimatedPrice: batIsolator.estimatedPrice,
  });

  if (config.solarWatts > 0) {
    const pvDisc = ACCESSORIES.find(a => a.id === 'pv_disconnect')!;
    items.push({
      category: 'Isolators & Switches',
      name: pvDisc.name,
      description: pvDisc.description,
      quantity: 1,
      unit: 'unit',
      estimatedPrice: pvDisc.estimatedPrice,
    });
  }

  // ── Section 6: AC Enclosures (if shore power) ──
  if (config.hasShore) {
    for (const id of ['cu_ac_in', 'cu_ac_out', 'transfer_switch'] as const) {
      const acc = ACCESSORIES.find(a => a.id === id)!;
      items.push({
        category: 'Enclosures & Distribution',
        name: acc.name,
        description: acc.description,
        quantity: 1,
        unit: 'unit',
        estimatedPrice: acc.estimatedPrice,
      });
    }
  }

  // ── Section 7: Earthing & Bonding ──
  const earthBar = ACCESSORIES.find(a => a.id === 'earth_bar')!;
  items.push({
    category: 'Earthing & Bonding',
    name: earthBar.name,
    description: earthBar.description,
    quantity: config.hasShore ? 2 : 1,
    unit: 'pcs',
    estimatedPrice: earthBar.estimatedPrice * (config.hasShore ? 2 : 1),
  });

  const safetyLabel = ACCESSORIES.find(a => a.id === 'safety_label')!;
  items.push({
    category: 'Earthing & Bonding',
    name: safetyLabel.name,
    description: safetyLabel.description,
    quantity: 3,
    unit: 'pcs',
    estimatedPrice: safetyLabel.estimatedPrice * 3,
  });

  if (config.hasShore) {
    const pduSticker = ACCESSORIES.find(a => a.id === 'pdu_sticker')!;
    items.push({
      category: 'Earthing & Bonding',
      name: pduSticker.name,
      description: pduSticker.description,
      quantity: 1,
      unit: 'unit',
      estimatedPrice: pduSticker.estimatedPrice,
    });
  }

  // ── Section 8: Consumables ──
  const totalLugs = [...lugCounts.values()].reduce((sum, l) => sum + l.count, 0);
  const largeLugs = [...lugCounts.values()].filter(l => l.spec.cableSize >= 25).reduce((sum, l) => sum + l.count, 0);
  const smallLugs = totalLugs - largeLugs;

  if (smallLugs > 0) {
    const hs = ACCESSORIES.find(a => a.id === 'heat_shrink_small')!;
    items.push({ category: 'Consumables', name: hs.name, description: hs.description, quantity: smallLugs, unit: 'pcs', estimatedPrice: smallLugs * hs.estimatedPrice });
  }
  if (largeLugs > 0) {
    const hs = ACCESSORIES.find(a => a.id === 'heat_shrink_large')!;
    items.push({ category: 'Consumables', name: hs.name, description: hs.description, quantity: largeLugs, unit: 'pcs', estimatedPrice: largeLugs * hs.estimatedPrice });
  }

  for (const id of ['cloth_tape', 'cable_ties', 'p_clips', 'insulated_covers'] as const) {
    const acc = ACCESSORIES.find(a => a.id === id)!;
    const qty = id === 'p_clips' ? 20 : id === 'insulated_covers' ? 1 : 1;
    items.push({ category: 'Consumables', name: acc.name, description: acc.description, quantity: qty, unit: acc.unit, estimatedPrice: acc.estimatedPrice * qty });
  }

  if (config.solarWatts > 0) {
    const gland = ACCESSORIES.find(a => a.id === 'roof_gland')!;
    items.push({ category: 'Consumables', name: gland.name, description: gland.description, quantity: 1, unit: 'unit', estimatedPrice: gland.estimatedPrice });
  }

  if (config.hasShore) {
    const conduit = ACCESSORIES.find(a => a.id === 'conduit_20mm')!;
    items.push({ category: 'Consumables', name: conduit.name, description: conduit.description, quantity: 10, unit: 'metres', estimatedPrice: conduit.estimatedPrice * 10 });

    const gland = ACCESSORIES.find(a => a.id === 'wiska_gland')!;
    items.push({ category: 'Consumables', name: gland.name, description: gland.description, quantity: 8, unit: 'pcs', estimatedPrice: gland.estimatedPrice * 8 });
  }

  // ── Section 9: Tools Required ──
  for (const id of ['tool_hydraulic_crimp', 'tool_ratchet_crimp', 'tool_wire_strippers', 'tool_torque_wrench', 'tool_multimeter', 'tool_heat_gun'] as const) {
    const tool = ACCESSORIES.find(a => a.id === id)!;
    items.push({
      category: 'Tools Required',
      name: tool.name,
      description: tool.description,
      quantity: 1,
      unit: 'each',
      estimatedPrice: tool.estimatedPrice,
    });
  }

  return items;
}
