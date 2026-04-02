import type { CableRunLength } from '../types';

// From Victron Wiring Unlimited, Chapter 4.1 - Cable selection table
// Max current (A) for voltage drop ≤ 0.259V (≈2.5% at 12V) at total cable length
// Total cable length = positive run + negative run

interface CableSizingEntry {
  gauge: number;
  maxAmp5m: number;
  maxAmp10m: number;
  maxAmp15m: number;
  maxAmp20m: number;
}

const CABLE_SIZING_TABLE: CableSizingEntry[] = [
  { gauge: 0.75, maxAmp5m: 2.3, maxAmp10m: 1.1, maxAmp15m: 0.8, maxAmp20m: 0.6 },
  { gauge: 1.5,  maxAmp5m: 4.5, maxAmp10m: 2.3, maxAmp15m: 1.5, maxAmp20m: 1.1 },
  { gauge: 2.5,  maxAmp5m: 7.5, maxAmp10m: 3.8, maxAmp15m: 2.5, maxAmp20m: 1.9 },
  { gauge: 4,    maxAmp5m: 12,  maxAmp10m: 6,   maxAmp15m: 4,   maxAmp20m: 3 },
  { gauge: 6,    maxAmp5m: 18,  maxAmp10m: 9,   maxAmp15m: 6,   maxAmp20m: 5 },
  { gauge: 10,   maxAmp5m: 30,  maxAmp10m: 15,  maxAmp15m: 10,  maxAmp20m: 8 },
  { gauge: 16,   maxAmp5m: 48,  maxAmp10m: 24,  maxAmp15m: 16,  maxAmp20m: 12 },
  { gauge: 25,   maxAmp5m: 75,  maxAmp10m: 38,  maxAmp15m: 25,  maxAmp20m: 19 },
  { gauge: 35,   maxAmp5m: 105, maxAmp10m: 53,  maxAmp15m: 35,  maxAmp20m: 26 },
  { gauge: 50,   maxAmp5m: 150, maxAmp10m: 75,  maxAmp15m: 50,  maxAmp20m: 38 },
  { gauge: 70,   maxAmp5m: 210, maxAmp10m: 105, maxAmp15m: 70,  maxAmp20m: 53 },
  { gauge: 95,   maxAmp5m: 285, maxAmp10m: 143, maxAmp15m: 95,  maxAmp20m: 71 },
  { gauge: 120,  maxAmp5m: 360, maxAmp10m: 180, maxAmp15m: 120, maxAmp20m: 90 },
];

function totalCableLengthForRun(runLength: CableRunLength): number {
  switch (runLength) {
    case 'short': return 4;   // 2m each way = 4m total
    case 'medium': return 8;  // 4m each way = 8m total
    case 'long': return 14;   // 7m each way = 14m total
  }
}

function maxAmpForGauge(gauge: number, totalLength: number): number {
  const entry = CABLE_SIZING_TABLE.find(e => e.gauge === gauge);
  if (!entry) return 0;

  if (totalLength <= 5) return entry.maxAmp5m;
  if (totalLength <= 10) {
    const ratio = (totalLength - 5) / 5;
    return entry.maxAmp5m - ratio * (entry.maxAmp5m - entry.maxAmp10m);
  }
  if (totalLength <= 15) {
    const ratio = (totalLength - 10) / 5;
    return entry.maxAmp10m - ratio * (entry.maxAmp10m - entry.maxAmp15m);
  }
  if (totalLength <= 20) {
    const ratio = (totalLength - 15) / 5;
    return entry.maxAmp15m - ratio * (entry.maxAmp15m - entry.maxAmp20m);
  }
  return entry.maxAmp20m * 0.75;
}

export function selectCableGauge(currentAmps: number, runLength: CableRunLength): number {
  const totalLength = totalCableLengthForRun(runLength);

  for (const entry of CABLE_SIZING_TABLE) {
    const maxAmp = maxAmpForGauge(entry.gauge, totalLength);
    if (maxAmp >= currentAmps) {
      return entry.gauge;
    }
  }
  return 120;
}

export function calculateVoltageDrop(
  currentAmps: number,
  cableGauge: number,
  lengthMetres: number,
): { voltageDrop: number; percentage: number } {
  // Copper resistivity: 1.7 × 10⁻⁸ Ω·m = 0.017 Ω·mm²/m
  const resistivityPerMetre = 0.017 / cableGauge; // Ω/m
  const totalResistance = resistivityPerMetre * lengthMetres * 2; // both legs
  const voltageDrop = currentAmps * totalResistance;
  return {
    voltageDrop: Math.round(voltageDrop * 1000) / 1000,
    percentage: Math.round((voltageDrop / 12.8) * 1000) / 10,
  };
}

export function estimateCableLength(runLength: CableRunLength): number {
  switch (runLength) {
    case 'short': return 1.5;
    case 'medium': return 3;
    case 'long': return 6;
  }
}
