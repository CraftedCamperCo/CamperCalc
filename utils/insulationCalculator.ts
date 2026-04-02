import { ClimateType, InsulationSeason, WindowPlan } from '@/context/CamperContext';
import { calculateSurfaceAreas, VanVariant } from './vanDatabase';

export interface InsulationProduct {
  id: string;
  name: string;
  description: string;
  /** Area or quantity needed */
  quantityM2: number;
  /** Recommended thickness in mm (where applicable) */
  thicknessMm: number | null;
  /** Unit for display */
  unit: string;
  /** Rolls, sheets, or packs estimate */
  packEstimate: string;
  /** Application area */
  appliedTo: string;
}

export interface InsulationResult {
  vanLabel: string;
  surfaceAreas: ReturnType<typeof calculateSurfaceAreas>;
  climateLabel: string;
  products: InsulationProduct[];
  methodology: string;
}

type ClimateProfile = 'summer' | 'three-season' | 'winter';

function getClimateProfile(climates: ClimateType[]): ClimateProfile {
  if (climates.includes('Deep Winter')) return 'winter';
  if (climates.includes('Spring & Autumn')) return 'three-season';
  return 'summer';
}

const CLIMATE_LABELS: Record<ClimateProfile, string> = {
  summer: 'Summer / 2-Season',
  'three-season': '3-Season (Spring–Autumn)',
  winter: 'Winter / 4-Season (Arctic-rated)',
};

/**
 * Sound deadening coverage recommendation by climate:
 * selective panel treatment (not every panel) to reduce vibration transfer.
 */
const DEADENING_COVERAGE: Record<ClimateProfile, number> = {
  summer: 0.30,
  'three-season': 0.35,
  winter: 0.40,
};

const DODO_FLEECE_EVO_THICKNESS_MM = 50;

const CAVITY_QUANTITY_MULTIPLIER: Record<ClimateProfile, number> = {
  summer: 0.75,
  'three-season': 0.85,
  winter: 1.0,
};

const DODO_DEADN_PRO_PACK_M2 = 3.7; // Dodo Mat DEADN PRO Black
const DODO_DUO_ROLL_M2 = 2.5; // Dodo Mat DEADN DUO roll
const DODO_FLEECE_EVO_ROLL_M2 = 3.7; // Dodo Fleece EVO 50mm roll

export function calculateInsulation(
  variant: VanVariant,
  climates: ClimateType[],
  vanLabel: string,
  options?: {
    insulationSeason?: InsulationSeason;
    useVapourBarrier?: boolean;
    windowPlan?: WindowPlan;
  },
): InsulationResult {
  const areas = calculateSurfaceAreas(variant, options?.windowPlan);
  const profile: ClimateProfile = options?.insulationSeason === 'four-season'
    ? 'winter'
    : options?.insulationSeason === 'three-season'
      ? 'three-season'
      : getClimateProfile(climates);

  const deadenCoverage = DEADENING_COVERAGE[profile];
  const cavityQtyMultiplier = CAVITY_QUANTITY_MULTIPLIER[profile];

  // Sound deadening: selective panel coverage on ceiling + walls.
  const deadenArea = Math.round(areas.panelArea * deadenCoverage * 10) / 10;
  const deadenPacks = Math.ceil(deadenArea / DODO_DEADN_PRO_PACK_M2);

  // Cavity insulation (recycled bottle): cavity fill for roof/walls voids.
  const cavityArea = Math.round(areas.panelArea * cavityQtyMultiplier * 10) / 10;
  const bottleRolls = Math.ceil(cavityArea / DODO_FLEECE_EVO_ROLL_M2);

  // Floor: Dodo Duo roll with overlap/waste allowance.
  const floorArea = Math.round(areas.floor * 1.1 * 10) / 10;
  const floorRolls = Math.ceil(floorArea / DODO_DUO_ROLL_M2);

  const products: InsulationProduct[] = [
    {
      id: 'sound_deadening',
      name: 'Sound Deadening (Dodo Mat)',
      description: 'Self-adhesive butyl-based mats applied directly to bare metal panels. Reduces road noise and vibration, adds thermal mass.',
      quantityM2: deadenArea,
      thicknessMm: 2.5,
      unit: 'm²',
      packEstimate: `~${deadenPacks} pack${deadenPacks > 1 ? 's' : ''} (3.7m² each)`,
      appliedTo: 'Selective ceiling/wall body panels',
    },
    {
      id: 'recycled_bottle',
      name: 'Dodo Fleece EVO 50mm',
      description: 'Recycled PET fibre insulation quilt (DOD-FLEECE-EVO). Moisture-resistant, non-irritant, and designed to fill roof/wall cavities.',
      quantityM2: cavityArea,
      thicknessMm: DODO_FLEECE_EVO_THICKNESS_MM,
      unit: 'm²',
      packEstimate: `~${bottleRolls} rolls (3.7m² each)`,
      appliedTo: 'Ceiling & wall cavities',
    },
    {
      id: 'floor_duo',
      name: 'Dodo Mat DEADN DUO (Floor)',
      description: '2-in-1 deadening and insulating mat with pure butyl layer and closed-cell foam. Designed for selective floor coverage.',
      quantityM2: floorArea,
      thicknessMm: 4.5,
      unit: 'm²',
      packEstimate: `~${floorRolls} roll${floorRolls > 1 ? 's' : ''} (2.5m² each)`,
      appliedTo: 'Floor areas and wheel-arch adjacencies',
    },
  ];

  const methodology = `These estimates are calculated from the internal cargo dimensions of your ${vanLabel}. `
    + `Surface areas include ceiling (with ~8% added for curvature), both side walls, and rear doors — `
    + `minus selected window cutouts from your insulation settings. `
    + `\n\nSound deadening coverage is selective (${Math.round(deadenCoverage * 100)}% of panel area) for your ${CLIMATE_LABELS[profile]} target, `
    + `focused on larger vibration-prone panels rather than full coverage. `
    + `Cavity insulation uses Dodo Fleece EVO 50mm, with quantities scaled by ${cavityQtyMultiplier}× for season target. `
    + `Floor quantities use Dodo DEADN DUO roll coverage with a 10% overlap allowance. `
    + `\n\nWe recommend purchasing 10–15% extra material to account for cutting waste and fitment tolerances. `
    + `All figures are estimates based on industry-standard conversion factors and typical panel van layouts. `
    + `Actual quantities may vary depending on window count, wheel arch intrusion, and your specific interior layout.`;

  return {
    vanLabel,
    surfaceAreas: areas,
    climateLabel: CLIMATE_LABELS[profile],
    products,
    methodology,
  };
}
