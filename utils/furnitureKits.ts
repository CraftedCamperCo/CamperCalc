/**
 * Furniture kit configuration, pricing, and van compatibility logic.
 */
import type { VanSelection } from '@/context/CamperContext';
import type { EggerDecor } from './eggerDecors';

// ── Types ──────────────────────────────────────────────────────────────────────

export type CountertopOption = 'solid-oak' | 'white-laminate';

export interface FurnitureKitConfig {
  cabinetDecor: EggerDecor | null;
  countertop: CountertopOption;
  sinkCutout: boolean;
  fridgeCutout: boolean;
}

export interface FurnitureKit {
  id: string;
  compatibleVans: { manufacturerId: string; model: string; wheelbase: string }[];
  basePrice: number;
  countertopPrices: Record<CountertopOption, number>;
  cutoutPrices: { sink: number; fridge: number };
  description: string;
  features: string[];
}

// ── Kit data ───────────────────────────────────────────────────────────────────

export const FURNITURE_KIT: FurnitureKit = {
  id: 'mwb-kitchen-v1',
  compatibleVans: [
    { manufacturerId: 'volkswagen', model: 'Crafter', wheelbase: 'MWB' },
    { manufacturerId: 'mercedes', model: 'Sprinter', wheelbase: 'MWB' },
  ],
  basePrice: 0,
  countertopPrices: { 'solid-oak': 0, 'white-laminate': 0 },
  cutoutPrices: { sink: 0, fridge: 0 },
  description:
    'CNC-cut birch ply furniture kit, precision-engineered for your van. ' +
    'Flat-packed and ready to assemble with included hardware. ' +
    'Choose from any Egger laminate finish for a fully bespoke look.',
  features: [
    'CNC-cut 18mm birch plywood construction',
    'Full kitchen run with overhead lockers',
    'Rear bed platform with under-bed garage',
    'Wardrobe unit with hanging rail',
    'Pre-drilled for standard sink & fridge cut-outs',
    'Assembly hardware & instructions included',
    'Choice of any Egger laminate finish',
  ],
};

// ── Countertop display data ────────────────────────────────────────────────────

export const COUNTERTOP_OPTIONS: { key: CountertopOption; label: string; hexColor: string }[] = [
  { key: 'solid-oak', label: 'Solid Oak', hexColor: '#C4A060' },
  { key: 'white-laminate', label: 'White Laminate', hexColor: '#F0EDE6' },
];

// ── Helpers ────────────────────────────────────────────────────────────────────

export function isVanFurnitureCompatible(van: VanSelection | null): boolean {
  if (!van) return false;
  return FURNITURE_KIT.compatibleVans.some(
    (v) =>
      v.manufacturerId === van.manufacturerId &&
      v.model === van.model &&
      v.wheelbase === van.wheelbase,
  );
}

export function calculateKitPrice(config: FurnitureKitConfig): number {
  let total = FURNITURE_KIT.basePrice;
  total += FURNITURE_KIT.countertopPrices[config.countertop];
  if (config.sinkCutout) total += FURNITURE_KIT.cutoutPrices.sink;
  if (config.fridgeCutout) total += FURNITURE_KIT.cutoutPrices.fridge;
  return total;
}

export const DEFAULT_FURNITURE_CONFIG: FurnitureKitConfig = {
  cabinetDecor: null,
  countertop: 'solid-oak',
  sinkCutout: false,
  fridgeCutout: false,
};
