import type { WindowPlan } from '@/context/CamperContext';
export interface VanVariant {
  wheelbase: 'SWB' | 'MWB' | 'LWB' | 'XLWB';
  roofHeight?: 'Low' | 'Mid' | 'High';
  /** Internal cargo length in mm */
  lengthMm: number;
  /** Internal cargo width in mm */
  widthMm: number;
  /** Internal cargo height in mm */
  heightMm: number;
}

export interface VanModel {
  name: string;
  /** Factory fuel tank capacity in litres */
  fuelTankLitres?: number;
  variants: VanVariant[];
}

export interface Manufacturer {
  id: string;
  name: string;
  models: VanModel[];
}

export const VAN_DATABASE: Manufacturer[] = [
  {
    id: 'volkswagen',
    name: 'Volkswagen',
    models: [
      {
        name: 'Transporter T6.1',
        fuelTankLitres: 70,
        variants: [
          { wheelbase: 'SWB', lengthMm: 2450, widthMm: 1700, heightMm: 1410 },
          { wheelbase: 'LWB', lengthMm: 2975, widthMm: 1700, heightMm: 1410 },
        ],
      },
      {
        name: 'Transporter T5',
        fuelTankLitres: 70,
        variants: [
          { wheelbase: 'SWB', lengthMm: 2400, widthMm: 1692, heightMm: 1410 },
          { wheelbase: 'LWB', lengthMm: 2950, widthMm: 1692, heightMm: 1410 },
        ],
      },
      {
        name: 'Crafter',
        fuelTankLitres: 75,
        variants: [
          { wheelbase: 'MWB', roofHeight: 'High', lengthMm: 3450, widthMm: 1832, heightMm: 1861 },
          { wheelbase: 'LWB', roofHeight: 'High', lengthMm: 4300, widthMm: 1832, heightMm: 1861 },
          { wheelbase: 'XLWB', roofHeight: 'High', lengthMm: 4855, widthMm: 1832, heightMm: 2080 },
        ],
      },
      {
        name: 'Caddy Maxi',
        fuelTankLitres: 55,
        variants: [
          { wheelbase: 'LWB', lengthMm: 2150, widthMm: 1550, heightMm: 1260 },
        ],
      },
    ],
  },
  {
    id: 'ford',
    name: 'Ford',
    models: [
      {
        name: 'Transit Custom',
        fuelTankLitres: 70,
        variants: [
          { wheelbase: 'SWB', lengthMm: 2555, widthMm: 1784, heightMm: 1406 },
          { wheelbase: 'LWB', lengthMm: 2920, widthMm: 1784, heightMm: 1406 },
        ],
      },
      {
        name: 'Transit',
        fuelTankLitres: 80,
        variants: [
          { wheelbase: 'SWB', roofHeight: 'Mid', lengthMm: 3300, widthMm: 1784, heightMm: 1786 },
          { wheelbase: 'LWB', roofHeight: 'Mid', lengthMm: 3750, widthMm: 1784, heightMm: 1786 },
          { wheelbase: 'LWB', roofHeight: 'High', lengthMm: 3750, widthMm: 1784, heightMm: 2020 },
          { wheelbase: 'XLWB', roofHeight: 'High', lengthMm: 4217, widthMm: 1784, heightMm: 2020 },
        ],
      },
      {
        name: 'Transit Connect',
        fuelTankLitres: 56,
        variants: [
          { wheelbase: 'SWB', lengthMm: 1786, widthMm: 1544, heightMm: 1269 },
          { wheelbase: 'LWB', lengthMm: 2153, widthMm: 1544, heightMm: 1269 },
        ],
      },
    ],
  },
  {
    id: 'mercedes',
    name: 'Mercedes-Benz',
    models: [
      {
        name: 'Sprinter',
        fuelTankLitres: 71,
        variants: [
          { wheelbase: 'SWB', roofHeight: 'High', lengthMm: 3272, widthMm: 1787, heightMm: 1940 },
          { wheelbase: 'MWB', roofHeight: 'High', lengthMm: 3684, widthMm: 1787, heightMm: 1940 },
          { wheelbase: 'LWB', roofHeight: 'High', lengthMm: 4319, widthMm: 1787, heightMm: 1940 },
          { wheelbase: 'XLWB', roofHeight: 'High', lengthMm: 4709, widthMm: 1787, heightMm: 2100 },
        ],
      },
      {
        name: 'Vito',
        fuelTankLitres: 57,
        variants: [
          { wheelbase: 'SWB', lengthMm: 2586, widthMm: 1685, heightMm: 1391 },
          { wheelbase: 'LWB', lengthMm: 2931, widthMm: 1685, heightMm: 1391 },
          { wheelbase: 'XLWB', lengthMm: 3461, widthMm: 1685, heightMm: 1391 },
        ],
      },
    ],
  },
  {
    id: 'fiat',
    name: 'Fiat',
    models: [
      {
        name: 'Ducato',
        fuelTankLitres: 90,
        variants: [
          { wheelbase: 'SWB', roofHeight: 'Mid', lengthMm: 2670, widthMm: 1870, heightMm: 1662 },
          { wheelbase: 'MWB', roofHeight: 'Mid', lengthMm: 3120, widthMm: 1870, heightMm: 1662 },
          { wheelbase: 'LWB', roofHeight: 'High', lengthMm: 3540, widthMm: 1870, heightMm: 1932 },
          { wheelbase: 'XLWB', roofHeight: 'High', lengthMm: 4035, widthMm: 1870, heightMm: 1932 },
        ],
      },
      {
        name: 'Talento',
        fuelTankLitres: 70,
        variants: [
          { wheelbase: 'SWB', lengthMm: 2537, widthMm: 1662, heightMm: 1387 },
          { wheelbase: 'LWB', lengthMm: 2937, widthMm: 1662, heightMm: 1387 },
        ],
      },
    ],
  },
  {
    id: 'man',
    name: 'MAN',
    models: [
      {
        name: 'TGE',
        fuelTankLitres: 75,
        variants: [
          { wheelbase: 'MWB', roofHeight: 'High', lengthMm: 3450, widthMm: 1832, heightMm: 1861 },
          { wheelbase: 'LWB', roofHeight: 'High', lengthMm: 4300, widthMm: 1832, heightMm: 1861 },
          { wheelbase: 'XLWB', roofHeight: 'High', lengthMm: 4855, widthMm: 1832, heightMm: 2080 },
        ],
      },
    ],
  },
  {
    id: 'peugeot',
    name: 'Peugeot',
    models: [
      {
        name: 'Boxer',
        fuelTankLitres: 90,
        variants: [
          { wheelbase: 'SWB', roofHeight: 'Mid', lengthMm: 2670, widthMm: 1870, heightMm: 1662 },
          { wheelbase: 'MWB', roofHeight: 'Mid', lengthMm: 3120, widthMm: 1870, heightMm: 1662 },
          { wheelbase: 'LWB', roofHeight: 'High', lengthMm: 3540, widthMm: 1870, heightMm: 1932 },
          { wheelbase: 'XLWB', roofHeight: 'High', lengthMm: 4035, widthMm: 1870, heightMm: 1932 },
        ],
      },
      {
        name: 'Expert',
        fuelTankLitres: 70,
        variants: [
          { wheelbase: 'SWB', lengthMm: 2162, widthMm: 1628, heightMm: 1397 },
          { wheelbase: 'LWB', lengthMm: 2512, widthMm: 1628, heightMm: 1397 },
        ],
      },
    ],
  },
  {
    id: 'citroen',
    name: 'Citroën',
    models: [
      {
        name: 'Relay',
        fuelTankLitres: 90,
        variants: [
          { wheelbase: 'SWB', roofHeight: 'Mid', lengthMm: 2670, widthMm: 1870, heightMm: 1662 },
          { wheelbase: 'MWB', roofHeight: 'Mid', lengthMm: 3120, widthMm: 1870, heightMm: 1662 },
          { wheelbase: 'LWB', roofHeight: 'High', lengthMm: 3540, widthMm: 1870, heightMm: 1932 },
          { wheelbase: 'XLWB', roofHeight: 'High', lengthMm: 4035, widthMm: 1870, heightMm: 1932 },
        ],
      },
      {
        name: 'Dispatch',
        fuelTankLitres: 70,
        variants: [
          { wheelbase: 'SWB', lengthMm: 2162, widthMm: 1628, heightMm: 1397 },
          { wheelbase: 'LWB', lengthMm: 2512, widthMm: 1628, heightMm: 1397 },
        ],
      },
    ],
  },
  {
    id: 'renault',
    name: 'Renault',
    models: [
      {
        name: 'Master',
        fuelTankLitres: 80,
        variants: [
          { wheelbase: 'SWB', roofHeight: 'Mid', lengthMm: 2583, widthMm: 1765, heightMm: 1700 },
          { wheelbase: 'MWB', roofHeight: 'High', lengthMm: 3083, widthMm: 1765, heightMm: 1894 },
          { wheelbase: 'LWB', roofHeight: 'High', lengthMm: 3733, widthMm: 1765, heightMm: 1894 },
        ],
      },
      {
        name: 'Trafic',
        fuelTankLitres: 70,
        variants: [
          { wheelbase: 'SWB', lengthMm: 2537, widthMm: 1662, heightMm: 1387 },
          { wheelbase: 'LWB', lengthMm: 2937, widthMm: 1662, heightMm: 1387 },
        ],
      },
    ],
  },
  {
    id: 'vauxhall',
    name: 'Vauxhall',
    models: [
      {
        name: 'Movano',
        fuelTankLitres: 80,
        variants: [
          { wheelbase: 'SWB', roofHeight: 'Mid', lengthMm: 2583, widthMm: 1765, heightMm: 1700 },
          { wheelbase: 'MWB', roofHeight: 'High', lengthMm: 3083, widthMm: 1765, heightMm: 1894 },
          { wheelbase: 'LWB', roofHeight: 'High', lengthMm: 3733, widthMm: 1765, heightMm: 1894 },
        ],
      },
      {
        name: 'Vivaro',
        fuelTankLitres: 70,
        variants: [
          { wheelbase: 'SWB', lengthMm: 2162, widthMm: 1628, heightMm: 1397 },
          { wheelbase: 'LWB', lengthMm: 2512, widthMm: 1628, heightMm: 1397 },
        ],
      },
    ],
  },
  {
    id: 'iveco',
    name: 'Iveco',
    models: [
      {
        name: 'Daily',
        fuelTankLitres: 70,
        variants: [
          { wheelbase: 'SWB', roofHeight: 'Mid', lengthMm: 3000, widthMm: 1800, heightMm: 1730 },
          { wheelbase: 'MWB', roofHeight: 'High', lengthMm: 3640, widthMm: 1800, heightMm: 1900 },
          { wheelbase: 'LWB', roofHeight: 'High', lengthMm: 4660, widthMm: 1800, heightMm: 1900 },
        ],
      },
    ],
  },
  {
    id: 'toyota',
    name: 'Toyota',
    models: [
      {
        name: 'Proace',
        fuelTankLitres: 70,
        variants: [
          { wheelbase: 'SWB', lengthMm: 2162, widthMm: 1628, heightMm: 1397 },
          { wheelbase: 'LWB', lengthMm: 2512, widthMm: 1628, heightMm: 1397 },
        ],
      },
      {
        name: 'Proace City',
        fuelTankLitres: 50,
        variants: [
          { wheelbase: 'SWB', lengthMm: 1817, widthMm: 1500, heightMm: 1189 },
          { wheelbase: 'LWB', lengthMm: 2167, widthMm: 1500, heightMm: 1189 },
        ],
      },
    ],
  },
];

export function getManufacturer(id: string): Manufacturer | undefined {
  return VAN_DATABASE.find(m => m.id === id);
}

/**
 * Match DVLA model string to our van model. DVLA returns e.g. "CRAFTER", "TRANSPORTER", "SPRINTER 313".
 * Picks the best matching model so Crafter regs map to Crafter, not Transporter.
 */
export function matchModelFromDvla(dvlaModel: string | undefined, models: VanModel[]): VanModel | undefined {
  if (!models.length) return undefined;
  if (!dvlaModel?.trim()) return models[0];
  const q = dvlaModel.toLowerCase().trim();
  // Sort by name length descending so "Transit Custom" matches before "Transit"
  const sorted = [...models].sort((a, b) => b.name.length - a.name.length);
  for (const m of sorted) {
    const name = m.name.toLowerCase();
    const baseName = name.split(/\s+/)[0];
    if (q.includes(name) || name.includes(q)) return m;
    if (q.includes(baseName) || baseName.includes(q)) return m;
  }
  return models[0];
}

export function getModel(manufacturerId: string, modelName: string): VanModel | undefined {
  return getManufacturer(manufacturerId)?.models.find(m => m.name === modelName);
}

export function getVariant(manufacturerId: string, modelName: string, wheelbase: string, roofHeight?: string): VanVariant | undefined {
  const model = getModel(manufacturerId, modelName);
  if (!model) return undefined;
  return model.variants.find(v =>
    v.wheelbase === wheelbase && (!roofHeight || v.roofHeight === roofHeight)
  );
}

export function variantLabel(v: VanVariant): string {
  if (v.roofHeight) return `${v.wheelbase} — ${v.roofHeight} Roof`;
  return v.wheelbase;
}

/** Returns the fuel tank size in litres for the selected van, or null if unknown */
export function getVanTankLitres(van: { manufacturerId: string; model: string } | null): number | null {
  if (!van) return null;
  const model = getModel(van.manufacturerId, van.model);
  return model?.fuelTankLitres ?? null;
}

/** Approximate internal surface areas in m² for insulation calculation */
export function calculateSurfaceAreas(v: VanVariant, windowPlan?: WindowPlan) {
  const l = v.lengthMm / 1000;
  const w = v.widthMm / 1000;
  const h = v.heightMm / 1000;

  const floor = l * w;
  const ceiling = l * w * 1.08; // ~8% extra for curvature
  const sideWalls = 2 * l * h;
  const rearDoors = w * h;
  const slidingDoor = 1.0 * h; // ~1m wide sliding door cutout
  // Window area removed from insulatable wall surface.
  // These are intentionally conservative averages and can be tuned later.
  const slidingDoorWindowArea = windowPlan?.slidingDoorWindow ? 0.75 : 0;
  const cabSideWindowsArea = windowPlan?.cabSideWindows ? 1.2 : 0;
  const rearWindowsArea = windowPlan?.rearWindows ? 0.9 : 0;
  const windows = slidingDoorWindowArea + cabSideWindowsArea + rearWindowsArea;

  const totalWallArea = sideWalls + rearDoors - slidingDoor - windows;
  const totalInsulableArea = ceiling + totalWallArea + floor;

  return {
    floor: Math.round(floor * 100) / 100,
    ceiling: Math.round(ceiling * 100) / 100,
    walls: Math.round(totalWallArea * 100) / 100,
    total: Math.round(totalInsulableArea * 100) / 100,
    panelArea: Math.round((ceiling + totalWallArea) * 100) / 100,
    volumeM3: Math.round(l * w * h * 100) / 100,
  };
}
