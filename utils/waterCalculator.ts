import { CamperState } from '../context/CamperContext';

export interface WaterFixture {
  id: string;
  name: string;
  defaultLitres: number;
  minLitres: number;
  maxLitres: number;
  step: number;
  unit: string;
  isPerPerson: boolean;
  goesToGrey: boolean;
  description: string;
}

export const WATER_FIXTURES: WaterFixture[] = [
  { id: 'kitchen_tap', name: 'Kitchen Sink', defaultLitres: 12, minLitres: 5, maxLitres: 25, step: 1, unit: 'L/person/day', isPerPerson: true, goesToGrey: true, description: 'Washing up, rinsing — restricted 4L/min tap' },
  { id: 'indoor_shower', name: 'Indoor Shower', defaultLitres: 24, minLitres: 10, maxLitres: 50, step: 2, unit: 'L/shower', isPerPerson: true, goesToGrey: true, description: 'Low-flow 6L/min head, ~4 min average' },
  { id: 'outdoor_shower', name: 'Outdoor Shower', defaultLitres: 8, minLitres: 3, maxLitres: 20, step: 1, unit: 'L/use', isPerPerson: false, goesToGrey: false, description: 'Cold rinse for gear, pets, and quick wash-offs' },
  { id: 'drinking_cooking', name: 'Drinking & Cooking', defaultLitres: 3, minLitres: 1, maxLitres: 6, step: 0.5, unit: 'L/person/day', isPerPerson: true, goesToGrey: false, description: 'Drinking water, boiling, food prep' },
  { id: 'cassette_toilet', name: 'Cassette Toilet', defaultLitres: 0.75, minLitres: 0.5, maxLitres: 2, step: 0.25, unit: 'L/person/day', isPerPerson: true, goesToGrey: false, description: '~5 flushes/day at 0.15L each' },
  { id: 'outdoor_rinse', name: 'Outdoor Rinse', defaultLitres: 10, minLitres: 5, maxLitres: 20, step: 1, unit: 'L/use', isPerPerson: false, goesToGrey: false, description: 'Beach rinse, muddy boots, gear wash' },
  { id: 'washing_machine', name: 'Compact Washing Machine', defaultLitres: 30, minLitres: 15, maxLitres: 50, step: 5, unit: 'L/cycle', isPerPerson: false, goesToGrey: true, description: 'Campervan compact washer — one cycle every 2-3 days' },
  { id: 'pet_bowl', name: 'Pet Water Bowl', defaultLitres: 1.5, minLitres: 0.5, maxLitres: 4, step: 0.5, unit: 'L/day', isPerPerson: false, goesToGrey: false, description: 'Fresh water for your travel companion' },
];

const STANDARD_TANKS = [40, 60, 80, 100, 120, 150, 200];

function roundUpToTank(litres: number): number {
  for (const size of STANDARD_TANKS) {
    if (size >= litres) return size;
  }
  return STANDARD_TANKS[STANDARD_TANKS.length - 1];
}

function getPartyMultiplier(party: CamperState['party']): number {
  switch (party) {
    case 'Solo': return 1;
    case 'Couple': return 2;
    case 'Family': return 3.5;
    case 'Group / Friends': return 4;
  }
}

export interface WaterBreakdownItem {
  id: string;
  label: string;
  litres: number;
}

export interface WaterSpec {
  dailyLitres: number;
  freshTankRecommended: number;
  greyTankRecommended: number;
  breakdown: WaterBreakdownItem[];
}

export function calculateWater(state: CamperState): WaterSpec {
  const {
    party, climates, destinations, showerType, showerFrequency,
    selectedWaterFixtures, fixtureOverrides, daysOffGrid,
  } = state;

  const people = getPartyMultiplier(party);
  const isSummer = climates.includes('Summer');
  const isCoastal = destinations.includes('Coastal & Beach');

  let showerMultiplier = 1;
  if (showerFrequency === 'every2') showerMultiplier = 0.5;
  else if (showerFrequency === 'every3') showerMultiplier = 0.33;

  const breakdown: WaterBreakdownItem[] = [];
  let totalDaily = 0;
  let greyDaily = 0;

  for (const fixture of WATER_FIXTURES) {
    // Shower fixtures are auto-managed by showerType selection
    if (fixture.id === 'indoor_shower') { if (showerType !== 'indoor') continue; }
    else if (fixture.id === 'outdoor_shower') { if (showerType !== 'outdoor') continue; }
    else { if (!selectedWaterFixtures[fixture.id]) continue; }

    const baseLitres = fixtureOverrides[fixture.id] ?? fixture.defaultLitres;
    let litres = baseLitres;

    if (fixture.isPerPerson) {
      litres *= people;
    }

    if (fixture.id === 'indoor_shower') {
      litres *= showerMultiplier;
      if (isSummer) litres *= 1.2;
    }

    // Outdoor shower: 1 use per day default, scaled for coastal
    if (fixture.id === 'outdoor_shower' && isCoastal) {
      litres *= 1.3;
    }

    if (fixture.id === 'drinking_cooking' && isSummer) {
      litres *= 1.3;
    }

    if (fixture.id === 'outdoor_rinse' && isCoastal) {
      litres *= 1.5;
    }

    if (fixture.id === 'washing_machine') {
      litres = litres / 2.5;
    }

    litres = Math.round(litres * 10) / 10;
    totalDaily += litres;
    if (fixture.goesToGrey) greyDaily += litres;

    breakdown.push({ id: fixture.id, label: fixture.name, litres });
  }

  totalDaily = Math.round(totalDaily * 10) / 10;
  greyDaily = Math.round(greyDaily * 10) / 10;

  const freshNeeded = totalDaily * daysOffGrid;
  const greyNeeded = greyDaily * daysOffGrid;

  return {
    dailyLitres: totalDaily,
    freshTankRecommended: roundUpToTank(freshNeeded),
    greyTankRecommended: roundUpToTank(greyNeeded),
    breakdown,
  };
}
