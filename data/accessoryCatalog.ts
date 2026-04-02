import type { AccessoryItem, CableSpec, TerminalLugSpec } from '@/utils/wiringTypes';

export const CABLE_TABLE: CableSpec[] = [
  { gauge: 0.5, type: 'tri-rated', color: 'various', pricePerMetre: 0.30, maxCurrentRating5m: 3, maxCurrentRating10m: 1.5 },
  { gauge: 1.5, type: 'tri-rated', color: 'various', pricePerMetre: 0.50, maxCurrentRating5m: 5, maxCurrentRating10m: 2.3 },
  { gauge: 2.5, type: 'tri-rated', color: 'various', pricePerMetre: 0.70, maxCurrentRating5m: 8, maxCurrentRating10m: 3.8 },
  { gauge: 4, type: 'tri-rated', color: 'various', pricePerMetre: 1.00, maxCurrentRating5m: 12, maxCurrentRating10m: 6 },
  { gauge: 6, type: 'tri-rated', color: 'various', pricePerMetre: 1.50, maxCurrentRating5m: 18, maxCurrentRating10m: 9 },
  { gauge: 10, type: 'tri-rated', color: 'various', pricePerMetre: 2.50, maxCurrentRating5m: 30, maxCurrentRating10m: 15 },
  { gauge: 16, type: 'tri-rated', color: 'various', pricePerMetre: 3.80, maxCurrentRating5m: 48, maxCurrentRating10m: 24 },
  { gauge: 25, type: 'tri-rated', color: 'various', pricePerMetre: 5.50, maxCurrentRating5m: 75, maxCurrentRating10m: 38 },
  { gauge: 35, type: 'tri-rated', color: 'various', pricePerMetre: 7.50, maxCurrentRating5m: 105, maxCurrentRating10m: 53 },
  { gauge: 50, type: 'tri-rated', color: 'various', pricePerMetre: 10.00, maxCurrentRating5m: 150, maxCurrentRating10m: 75 },
  { gauge: 70, type: 'tri-rated', color: 'various', pricePerMetre: 14.00, maxCurrentRating5m: 210, maxCurrentRating10m: 105 },
  { gauge: 95, type: 'tri-rated', color: 'various', pricePerMetre: 19.00, maxCurrentRating5m: 285, maxCurrentRating10m: 143 },
];

export const SOLAR_CABLE: CableSpec = { gauge: 6, type: 'solar', color: 'black/red pair', pricePerMetre: 2.80, maxCurrentRating5m: 18, maxCurrentRating10m: 9 };
export const AC_CABLE_2_5: CableSpec = { gauge: 2.5, type: 'H07RN-F', color: '3-core (brown/blue/green-yellow)', pricePerMetre: 3.50, maxCurrentRating5m: 16, maxCurrentRating10m: 16 };
export const AC_CABLE_1_5: CableSpec = { gauge: 1.5, type: 'H07RN-F', color: '3-core (brown/blue/green-yellow)', pricePerMetre: 2.50, maxCurrentRating5m: 10, maxCurrentRating10m: 10 };
export const BONDING_CABLE: CableSpec = { gauge: 4, type: 'bonding', color: 'green/yellow', pricePerMetre: 1.20, maxCurrentRating5m: 12, maxCurrentRating10m: 6 };

export const TERMINAL_LUGS: TerminalLugSpec[] = [
  { cableSize: 1.5, studSize: 5, description: 'Red insulated crimp ring M5', crimpDie: 'Red ratchet', priceEach: 0.15 },
  { cableSize: 1.5, studSize: 6, description: 'Red insulated crimp ring M6', crimpDie: 'Red ratchet', priceEach: 0.15 },
  { cableSize: 2.5, studSize: 5, description: 'Blue insulated crimp ring M5', crimpDie: 'Blue ratchet', priceEach: 0.15 },
  { cableSize: 2.5, studSize: 6, description: 'Blue insulated crimp ring M6', crimpDie: 'Blue ratchet', priceEach: 0.15 },
  { cableSize: 6, studSize: 5, description: 'Yellow insulated crimp ring M5', crimpDie: 'Yellow ratchet', priceEach: 0.20 },
  { cableSize: 6, studSize: 6, description: 'Yellow insulated crimp ring M6', crimpDie: 'Yellow ratchet', priceEach: 0.20 },
  { cableSize: 6, studSize: 8, description: 'Yellow insulated crimp ring M8', crimpDie: 'Yellow ratchet', priceEach: 0.20 },
  { cableSize: 10, studSize: 5, description: 'Copper tube lug 10-5', crimpDie: '10mm² hydraulic', priceEach: 0.85 },
  { cableSize: 10, studSize: 6, description: 'Copper tube lug 10-6', crimpDie: '10mm² hydraulic', priceEach: 0.85 },
  { cableSize: 10, studSize: 8, description: 'Copper tube lug 10-8', crimpDie: '10mm² hydraulic', priceEach: 0.85 },
  { cableSize: 16, studSize: 5, description: 'Copper tube lug 16-5', crimpDie: '16mm² hydraulic', priceEach: 0.95 },
  { cableSize: 16, studSize: 6, description: 'Copper tube lug 16-6', crimpDie: '16mm² hydraulic', priceEach: 0.95 },
  { cableSize: 16, studSize: 8, description: 'Copper tube lug 16-8', crimpDie: '16mm² hydraulic', priceEach: 0.95 },
  { cableSize: 25, studSize: 8, description: 'Copper tube lug 25-8', crimpDie: '25mm² hydraulic', priceEach: 1.20 },
  { cableSize: 25, studSize: 10, description: 'Copper tube lug 25-10', crimpDie: '25mm² hydraulic', priceEach: 1.20 },
  { cableSize: 35, studSize: 8, description: 'Copper tube lug 35-8', crimpDie: '35mm² hydraulic', priceEach: 1.50 },
  { cableSize: 35, studSize: 10, description: 'Copper tube lug 35-10', crimpDie: '35mm² hydraulic', priceEach: 1.50 },
  { cableSize: 50, studSize: 8, description: 'Copper tube lug 50-8', crimpDie: '50mm² hydraulic', priceEach: 2.00 },
  { cableSize: 50, studSize: 10, description: 'Copper tube lug 50-10', crimpDie: '50mm² hydraulic', priceEach: 2.00 },
  { cableSize: 70, studSize: 8, description: 'Copper tube lug 70-8', crimpDie: '70mm² hydraulic', priceEach: 2.80 },
  { cableSize: 70, studSize: 10, description: 'Copper tube lug 70-10', crimpDie: '70mm² hydraulic', priceEach: 2.80 },
  { cableSize: 95, studSize: 10, description: 'Copper tube lug 95-10', crimpDie: '95mm² hydraulic', priceEach: 3.50 },
  { cableSize: 95, studSize: 12, description: 'Copper tube lug 95-12', crimpDie: '95mm² hydraulic', priceEach: 3.50 },
];

export function findLug(cableSize: number, studSize: number): TerminalLugSpec | undefined {
  return TERMINAL_LUGS.find(l => l.cableSize === cableSize && l.studSize === studSize);
}

export function studSizeForTerminal(terminalType: string): number {
  const map: Record<string, number> = { 'M4_screw': 4, 'M5_screw': 5, 'M6_bolt': 6, 'M8_bolt': 8, 'busbar_stud': 8 };
  return map[terminalType] ?? 8;
}

export const ACCESSORIES: AccessoryItem[] = [
  { id: 'midi_holder', name: 'MIDI Fuse Holder', category: 'fuseHolder', description: 'Inline MIDI/AMI fuse holder with cover', estimatedPrice: 6.50, unit: 'each' },
  { id: 'mega_holder', name: 'MEGA Fuse Holder', category: 'fuseHolder', description: 'Inline MEGA fuse holder with cover', estimatedPrice: 12.00, unit: 'each' },
  { id: 'blade_block', name: 'Blue Sea ST Blade Fuse Block (5026)', category: 'fuseHolder', description: '12-way blade fuse block with negative bus and cover', estimatedPrice: 55.00, unit: 'each' },
  { id: 'bat_isolator', name: 'Blue Sea m-Series Battery Switch (6006)', category: 'isolator', description: 'Battery isolator switch rated to 300A continuous', estimatedPrice: 32.00, unit: 'each' },
  { id: 'pv_disconnect', name: 'ZBENY PV Switch-Disconnector', category: 'isolator', description: 'DC PV isolator switch compliant with BS 1648-1:2018 4.4.2', estimatedPrice: 22.00, unit: 'each' },
  { id: 'cu_ac_in', name: 'AC-In Consumer Unit (Metal)', category: 'consumerUnit', description: 'Metal enclosure with DIN rail, Type A 30mA RCD, 1x16A DP MCB, 1x10A DP MCB', estimatedPrice: 85.00, unit: 'each' },
  { id: 'cu_ac_out', name: 'AC-Out Consumer Unit (Metal)', category: 'consumerUnit', description: 'Metal enclosure with DIN rail, Type A 30mA RCD, DP Type B MCBs for final circuits', estimatedPrice: 85.00, unit: 'each' },
  { id: 'transfer_switch', name: 'Sterling 16A 3-Position Transfer Switch', category: 'transferSwitch', description: 'Manual changeover switch for shore/inverter AC supply', estimatedPrice: 45.00, unit: 'each' },
  { id: 'earth_bar', name: 'Earth Bar (Copper)', category: 'earthing', description: 'Copper earth terminal bar for consumer unit', estimatedPrice: 8.00, unit: 'each' },
  { id: 'bonding_clamp', name: 'Bonding Clamp (8mm pipe)', category: 'earthing', description: 'Earth bonding clamp for LPG copper pipes', estimatedPrice: 4.50, unit: 'each' },
  { id: 'safety_label', name: '"Safety Electrical Connection: Do Not Remove" Label', category: 'earthing', description: 'Self-adhesive safety label for earth connections', estimatedPrice: 0.50, unit: 'each' },
  { id: 'pdu_sticker', name: 'PDU Sticker', category: 'earthing', description: 'Particulars of Distribution Unit sticker for near consumer unit', estimatedPrice: 1.50, unit: 'each' },
  { id: 'heat_shrink_small', name: 'Heat Shrink (small assortment)', category: 'consumable', description: 'Adhesive-lined heat shrink for insulated crimp terminals', estimatedPrice: 0.25, unit: 'each' },
  { id: 'heat_shrink_large', name: 'Heat Shrink (large, 25-70mm²)', category: 'consumable', description: 'Adhesive-lined heat shrink for large cable lugs', estimatedPrice: 0.80, unit: 'each' },
  { id: 'cloth_tape', name: 'Cloth Tape (19mm)', category: 'consumable', description: 'Self-adhesive cloth tape for cable identification and bundling', estimatedPrice: 4.50, unit: 'roll' },
  { id: 'cable_ties', name: 'Cable Ties (assorted)', category: 'consumable', description: 'Nylon cable ties for cable management', estimatedPrice: 5.00, unit: 'pack' },
  { id: 'p_clips', name: 'P-Clips (assorted)', category: 'consumable', description: 'Rubber-lined P-clips for cable support (250mm horizontal / 400mm vertical spacing)', estimatedPrice: 0.30, unit: 'each' },
  { id: 'wiska_gland', name: 'WISKA Cable Gland', category: 'consumable', description: 'IP-rated cable gland for cable entry to enclosures', estimatedPrice: 2.50, unit: 'each' },
  { id: 'conduit_20mm', name: 'Flexible Conduit (20mm)', category: 'consumable', description: '20mm flexible conduit for AC cable protection', estimatedPrice: 1.80, unit: 'metre' },
  { id: 'roof_gland', name: 'Roof Entry Cable Gland', category: 'consumable', description: 'Waterproof dual-cable roof entry gland for solar cables', estimatedPrice: 12.00, unit: 'each' },
  { id: 'insulated_covers', name: 'Battery Terminal Insulated Covers', category: 'consumable', description: 'Insulated covers for battery terminal protection (BS 7671 A721.55.3.3)', estimatedPrice: 3.50, unit: 'pair' },
  { id: 'tool_hydraulic_crimp', name: 'Hydraulic Crimping Tool (10-95mm²)', category: 'tool', description: 'Professional hydraulic crimper for large cable lugs', estimatedPrice: 45.00, unit: 'each' },
  { id: 'tool_ratchet_crimp', name: 'Ratchet Crimping Tool (insulated terminals)', category: 'tool', description: 'Professional ratchet crimper for insulated crimp terminals', estimatedPrice: 25.00, unit: 'each' },
  { id: 'tool_wire_strippers', name: 'Wire Strippers (0.5-6mm²)', category: 'tool', description: 'Automatic wire strippers', estimatedPrice: 15.00, unit: 'each' },
  { id: 'tool_torque_wrench', name: 'Torque Screwdriver/Wrench Set', category: 'tool', description: 'Adjustable torque tool for terminal connections', estimatedPrice: 35.00, unit: 'each' },
  { id: 'tool_multimeter', name: 'Digital Multimeter', category: 'tool', description: 'For voltage, continuity and RCD testing', estimatedPrice: 30.00, unit: 'each' },
  { id: 'tool_heat_gun', name: 'Heat Gun', category: 'tool', description: 'For applying adhesive-lined heat shrink', estimatedPrice: 20.00, unit: 'each' },
];

export const FUSE_INVENTORY = {
  blade: [5, 10, 15, 20, 25, 30],
  midi: [30, 40, 50, 60, 80, 100, 125, 150, 175, 200],
  mega: [100, 125, 150, 175, 200, 225, 250, 300, 400, 500],
};

export function fusePriceByType(type: string, rating: number): number {
  if (type === 'blade') return 0.50;
  if (type === 'midi') return rating <= 100 ? 3.50 : 5.00;
  if (type === 'mega') return rating <= 200 ? 6.00 : 8.00;
  return 2.00;
}
