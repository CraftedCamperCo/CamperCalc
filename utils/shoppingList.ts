import type { WiringSpec, ShoppingListItem, SystemConfig } from './wiringTypes';
import { CABLE_TABLE, TERMINAL_LUGS, findLug, ACCESSORIES, fusePriceByType, SOLAR_CABLE, AC_CABLE_2_5, BONDING_CABLE } from '@/data/accessoryCatalog';

export function generateShoppingList(spec: WiringSpec, config: SystemConfig): ShoppingListItem[] {
  const items: ShoppingListItem[] = [];

  for (const comp of spec.components) {
    items.push({ category: 'Core Components', name: comp.product.name, description: `${comp.product.model} — ${comp.role}`, quantity: comp.quantity, unit: 'unit', estimatedPrice: comp.product.estimatedPrice * comp.quantity, productUrl: comp.product.manualUrl });
  }

  const cableTotals = new Map<string, { gauge: number; type: string; color: string; length: number; pricePerM: number }>();
  for (const wire of spec.connections) {
    const key = `${wire.cableGauge}_${wire.cableType}_${wire.cableColor}`;
    const existing = cableTotals.get(key);
    if (existing) { existing.length += wire.length; } else {
      const cableSpec = wire.cableType === 'solar' ? SOLAR_CABLE : wire.cableType === 'H07RN-F' ? AC_CABLE_2_5 : wire.cableType === 'bonding' ? BONDING_CABLE : CABLE_TABLE.find(c => c.gauge === wire.cableGauge);
      cableTotals.set(key, { gauge: wire.cableGauge, type: wire.cableType, color: wire.cableColor, length: wire.length, pricePerM: cableSpec?.pricePerMetre ?? 3 });
    }
  }
  for (const [, cable] of cableTotals) {
    const lengthWithMargin = Math.ceil(cable.length * 1.15);
    const colorLabel = cable.color === 'green_yellow' ? 'Green/Yellow' : cable.color.charAt(0).toUpperCase() + cable.color.slice(1);
    items.push({ category: 'Cable', name: `${cable.gauge}mm² ${cable.type} cable (${colorLabel})`, description: `${cable.type === 'H07RN-F' ? '3-core rubber flex' : cable.type === 'solar' ? 'Victron solar cable' : cable.type === 'bonding' ? 'Tri-rated bonding' : 'Tri-rated single core'}`, quantity: lengthWithMargin, unit: 'metres', estimatedPrice: lengthWithMargin * cable.pricePerM });
  }

  const lugCounts = new Map<string, { spec: typeof TERMINAL_LUGS[0]; count: number }>();
  for (const wire of spec.connections) {
    for (const lug of [wire.terminalLugFrom, wire.terminalLugTo]) {
      if (!lug) continue;
      const key = `${lug.cableSize}-${lug.studSize}`;
      const existing = lugCounts.get(key);
      const lugSpec = findLug(lug.cableSize, lug.studSize);
      if (existing) { existing.count++; } else if (lugSpec) { lugCounts.set(key, { spec: lugSpec, count: 1 }); }
    }
  }
  for (const [, lug] of lugCounts) {
    items.push({ category: 'Terminal Lugs', name: lug.spec.description, description: `${lug.spec.cableSize}mm² cable, M${lug.spec.studSize} stud — crimp with ${lug.spec.crimpDie}`, quantity: lug.count, unit: 'pcs', estimatedPrice: lug.count * lug.spec.priceEach });
  }

  const fuseCounts = new Map<string, { type: string; rating: number; count: number }>();
  for (const wire of spec.connections) {
    if (wire.fuseRating && wire.fuseType) {
      const key = `${wire.fuseType}_${wire.fuseRating}`;
      const existing = fuseCounts.get(key);
      if (existing) { existing.count++; } else { fuseCounts.set(key, { type: wire.fuseType, rating: wire.fuseRating, count: 1 }); }
    }
  }
  for (const [, fuse] of fuseCounts) {
    items.push({ category: 'Fuses & Protection', name: `${fuse.rating}A ${fuse.type.toUpperCase()} fuse`, description: `${fuse.type === 'blade' ? 'Standard blade' : fuse.type === 'midi' ? 'MIDI/AMI slow-blow' : fuse.type === 'mega' ? 'MEGA slow-blow' : 'Glass'} fuse, ${fuse.rating}A`, quantity: fuse.count + 1, unit: 'pcs', estimatedPrice: (fuse.count + 1) * fusePriceByType(fuse.type, fuse.rating) });
  }

  const needsMidi = [...fuseCounts.values()].some(f => f.type === 'midi');
  const needsMega = [...fuseCounts.values()].some(f => f.type === 'mega');
  if (needsMidi) { const h = ACCESSORIES.find(a => a.id === 'midi_holder')!; const c = [...fuseCounts.values()].filter(f => f.type === 'midi').reduce((s, f) => s + f.count, 0); items.push({ category: 'Fuses & Protection', name: h.name, description: h.description, quantity: c, unit: 'pcs', estimatedPrice: c * h.estimatedPrice }); }
  if (needsMega && !spec.components.some(c => c.product.id === 'lynx_dist')) { const h = ACCESSORIES.find(a => a.id === 'mega_holder')!; const c = [...fuseCounts.values()].filter(f => f.type === 'mega').reduce((s, f) => s + f.count, 0); items.push({ category: 'Fuses & Protection', name: h.name, description: h.description, quantity: c, unit: 'pcs', estimatedPrice: c * h.estimatedPrice }); }

  const fb = ACCESSORIES.find(a => a.id === 'blade_block')!;
  items.push({ category: 'Fuses & Protection', name: fb.name, description: fb.description, quantity: 1, unit: 'unit', estimatedPrice: fb.estimatedPrice });

  const bi = ACCESSORIES.find(a => a.id === 'bat_isolator')!;
  items.push({ category: 'Isolators & Switches', name: bi.name, description: bi.description, quantity: 1, unit: 'unit', estimatedPrice: bi.estimatedPrice });
  if (config.solarWatts > 0) { const pv = ACCESSORIES.find(a => a.id === 'pv_disconnect')!; items.push({ category: 'Isolators & Switches', name: pv.name, description: pv.description, quantity: 1, unit: 'unit', estimatedPrice: pv.estimatedPrice }); }

  if (config.hasShore) {
    for (const id of ['cu_ac_in', 'cu_ac_out', 'transfer_switch'] as const) { const a = ACCESSORIES.find(x => x.id === id)!; items.push({ category: 'Enclosures & Distribution', name: a.name, description: a.description, quantity: 1, unit: 'unit', estimatedPrice: a.estimatedPrice }); }
  }

  const eb = ACCESSORIES.find(a => a.id === 'earth_bar')!;
  items.push({ category: 'Earthing & Bonding', name: eb.name, description: eb.description, quantity: config.hasShore ? 2 : 1, unit: 'pcs', estimatedPrice: eb.estimatedPrice * (config.hasShore ? 2 : 1) });
  const sl = ACCESSORIES.find(a => a.id === 'safety_label')!;
  items.push({ category: 'Earthing & Bonding', name: sl.name, description: sl.description, quantity: 3, unit: 'pcs', estimatedPrice: sl.estimatedPrice * 3 });
  if (config.hasShore) { const ps = ACCESSORIES.find(a => a.id === 'pdu_sticker')!; items.push({ category: 'Earthing & Bonding', name: ps.name, description: ps.description, quantity: 1, unit: 'unit', estimatedPrice: ps.estimatedPrice }); }

  const totalLugs = [...lugCounts.values()].reduce((s, l) => s + l.count, 0);
  const largeLugs = [...lugCounts.values()].filter(l => l.spec.cableSize >= 25).reduce((s, l) => s + l.count, 0);
  const smallLugs = totalLugs - largeLugs;
  if (smallLugs > 0) { const hs = ACCESSORIES.find(a => a.id === 'heat_shrink_small')!; items.push({ category: 'Consumables', name: hs.name, description: hs.description, quantity: smallLugs, unit: 'pcs', estimatedPrice: smallLugs * hs.estimatedPrice }); }
  if (largeLugs > 0) { const hs = ACCESSORIES.find(a => a.id === 'heat_shrink_large')!; items.push({ category: 'Consumables', name: hs.name, description: hs.description, quantity: largeLugs, unit: 'pcs', estimatedPrice: largeLugs * hs.estimatedPrice }); }
  for (const id of ['cloth_tape', 'cable_ties', 'p_clips', 'insulated_covers'] as const) { const a = ACCESSORIES.find(x => x.id === id)!; const q = id === 'p_clips' ? 20 : 1; items.push({ category: 'Consumables', name: a.name, description: a.description, quantity: q, unit: a.unit, estimatedPrice: a.estimatedPrice * q }); }
  if (config.solarWatts > 0) { const g = ACCESSORIES.find(a => a.id === 'roof_gland')!; items.push({ category: 'Consumables', name: g.name, description: g.description, quantity: 1, unit: 'unit', estimatedPrice: g.estimatedPrice }); }
  if (config.hasShore) { const c = ACCESSORIES.find(a => a.id === 'conduit_20mm')!; items.push({ category: 'Consumables', name: c.name, description: c.description, quantity: 10, unit: 'metres', estimatedPrice: c.estimatedPrice * 10 }); const g = ACCESSORIES.find(a => a.id === 'wiska_gland')!; items.push({ category: 'Consumables', name: g.name, description: g.description, quantity: 8, unit: 'pcs', estimatedPrice: g.estimatedPrice * 8 }); }

  for (const id of ['tool_hydraulic_crimp', 'tool_ratchet_crimp', 'tool_wire_strippers', 'tool_torque_wrench', 'tool_multimeter', 'tool_heat_gun'] as const) { const t = ACCESSORIES.find(a => a.id === id)!; items.push({ category: 'Tools Required', name: t.name, description: t.description, quantity: 1, unit: 'each', estimatedPrice: t.estimatedPrice }); }

  return items;
}
