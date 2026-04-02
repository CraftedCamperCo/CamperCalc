import { CamperState } from '../context/CamperContext';
import { getVanTankLitres } from './vanDatabase';

export interface ConsumptionBreakdown {
  base: number;
  party: number;
  heating: number;
  cooking: number;
  hotWater: number;
  appliances: number;
  custom: number;
}

export interface GenerationBreakdown {
  solar: number;
  alternator: number;
  shorePower: number;
}

export interface FogstarBattery {
  name: string;
  capacityAh: number;
  price: number;
  line: 'standard' | 'eco' | 'pro';
}

export interface BatteryRecommendation {
  name: string;
  capacityAh: number;
  quantity: number;
  totalAh: number;
  price: number;
  line: 'standard' | 'eco' | 'pro';
}

export interface AlternativeBatteries {
  eco: FogstarBattery | null;
  pro: FogstarBattery | null;
}

export const FOGSTAR_BATTERIES: Record<string, FogstarBattery[]> = {
  standard: [
    { name: 'Fogstar Drift 105Ah', capacityAh: 105, price: 288.16, line: 'standard' },
    { name: 'Fogstar Drift 230Ah', capacityAh: 230, price: 487.50, line: 'standard' },
    { name: 'Fogstar Drift 280Ah', capacityAh: 280, price: 533.33, line: 'standard' },
    { name: 'Fogstar Drift 300Ah', capacityAh: 300, price: 623.32, line: 'standard' },
    { name: 'Fogstar Drift 460Ah', capacityAh: 460, price: 766.67, line: 'standard' },
    { name: 'Fogstar Drift 608Ah', capacityAh: 608, price: 899.98, line: 'standard' },
  ],
  eco: [
    { name: 'Fogstar Drift ECO 100Ah', capacityAh: 100, price: 209.99, line: 'eco' },
    { name: 'Fogstar Drift ECO 314Ah', capacityAh: 314, price: 478.32, line: 'eco' },
    { name: 'Fogstar Drift ECO 460Ah', capacityAh: 460, price: 621.64, line: 'eco' },
    { name: 'Fogstar Drift ECO 628Ah', capacityAh: 628, price: 766.67, line: 'eco' },
  ],
  pro: [
    { name: 'Fogstar Drift PRO 230Ah', capacityAh: 230, price: 629.15, line: 'pro' },
    { name: 'Fogstar Drift PRO 280Ah', capacityAh: 280, price: 675.00, line: 'pro' },
    { name: 'Fogstar Drift PRO 300Ah', capacityAh: 300, price: 764.98, line: 'pro' },
    { name: 'Fogstar Drift PRO 460Ah', capacityAh: 460, price: 866.65, line: 'pro' },
  ],
};

function snapToFogstar(requiredAh: number): { battery: FogstarBattery; quantity: number } {
  const standard = FOGSTAR_BATTERIES.standard;
  const largest = standard[standard.length - 1];

  for (const bat of standard) {
    if (bat.capacityAh >= requiredAh) return { battery: bat, quantity: 1 };
  }

  const quantity = Math.ceil(requiredAh / largest.capacityAh);
  return { battery: largest, quantity };
}

function findAlternative(requiredAh: number, line: 'eco' | 'pro'): FogstarBattery | null {
  const range = FOGSTAR_BATTERIES[line];
  for (const bat of range) {
    if (bat.capacityAh >= requiredAh) return bat;
  }
  return range.length > 0 ? range[range.length - 1] : null;
}

export interface BuildSpec {
  dailyAh: number;
  netDailyAh: number;
  recommendedBankAh: number;
  calculatedAh: number;
  recommendedBattery: BatteryRecommendation;
  alternativeBatteries: AlternativeBatteries;
  batteryType: 'LiFePO4' | 'AGM';
  batteryVoltage: 12 | 24;
  solarPanelsNeeded: number;
  recommendedSolarW: number;
  inverterSize: 0 | 1000 | 2000 | 3000;
  dcDcChargerSize: number;
  dailyLPG: number;
  dailyDiesel: number;
  dieselTankPct: number | null;
  consumption: ConsumptionBreakdown;
  generation: GenerationBreakdown;
}

export const APPLIANCES = {
  dc_12v: [
    { id: 'dc_fridge', name: '50L Fridge/Freezer', watts: '60W', ah: 30 },
    { id: 'dc_fan', name: 'Roof Fan (Maxxair)', watts: '30W', ah: 5 },
    { id: 'dc_led', name: 'LED Lighting', watts: '4W', ah: 2 },
    { id: 'dc_usb', name: 'USB/12V Sockets', watts: '18W', ah: 3 },
    { id: 'dc_pump', name: 'Water Pump', watts: '15W', ah: 1 },
    { id: 'ac_laptop', name: 'Laptop Charger', watts: '80W', ah: 17 },
    { id: 'ac_starlink', name: 'Starlink Satellite', watts: '60W', ah: 30 },
  ],
  ac_240v: [
    { id: 'ac_aircon', name: 'Air Conditioner', watts: '700W', ah: 280 },
    { id: 'hp_coffee', name: 'Coffee Machine', watts: '1500W', ah: 15 },
    { id: 'hp_airfryer', name: 'Air Fryer', watts: '1500W', ah: 45 },
    { id: 'ac_microwave', name: 'Microwave', watts: '900W', ah: 9 },
    { id: 'hp_hairdryer', name: 'Hair Dryer', watts: '1200W', ah: 24 },
  ],
};

export function getDefaultHours(app: { watts: string; ah: number }): number {
  const w = parseInt(app.watts);
  if (w <= 0) return 0;
  return Math.round((app.ah * 12 / w) * 10) / 10;
}

const ALL_APPLIANCES = [...APPLIANCES.dc_12v, ...APPLIANCES.ac_240v];

export function calculate(state: CamperState): BuildSpec {
  const {
    usage, climates, destinations, party,
    hasPets, hasChildren, worksFromVan, daysOffGrid,
    showerType, showerFrequency,
    cookFuel, heatFuel, waterFuel,
    solarWatts, driveHours, dcDcSize, wantsHookupCharging,
    selectedAppliances, applianceHoursOverrides, customAppliances,
  } = state;

  let base = 20;
  if (usage === 'Full-Time Living') base += 20;
  else if (usage === 'Extended Breaks') base += 10;
  else if (usage === 'Festival Goer') base += 14;

  const isSkiHoliday = destinations.includes('Ski Holiday');
  if (climates.includes('Deep Winter') || isSkiHoliday) base += 15;
  else if (climates.includes('Spring & Autumn')) base += 5;

  let partyAh = 0;
  if (party === 'Couple') partyAh = 10;
  else if (party === 'Family') partyAh = 25;
  else if (party === 'Group / Friends') partyAh = 40;

  if (hasPets) partyAh += 5;
  if (hasChildren) partyAh += 10;
  if (worksFromVan) partyAh += 20;

  let dailyLPG = 0;
  let dailyDiesel = 0;

  let cooking = 0;
  if (cookFuel === 'Electric') cooking = 90;
  if (cookFuel === 'Gas') dailyLPG += 0.4;

  let heating = 0;
  if (heatFuel === 'Electric') heating = 150;
  if (heatFuel === 'Gas') { heating = 12; dailyLPG += 1.2; }
  if (heatFuel === 'Diesel') { heating = 12; dailyDiesel += 1.5; }
  if (isSkiHoliday) heating += 12;

  // Hot water draw scales with shower type and frequency.
  // Indoor shower: full draw, modulated by frequency.
  // Outdoor / none: kitchen hot water only (~25% of full draw).
  let hwScale = 0.25;
  if (showerType === 'indoor') {
    hwScale = showerFrequency === 'daily' ? 1
            : showerFrequency === 'every2' ? 0.7
            : 0.5;
  }

  let hotWater = 0;
  if (waterFuel === 'Electric') { hotWater = Math.round(70 * hwScale); }
  if (waterFuel === 'Gas')    { hotWater = Math.round(4 * hwScale); dailyLPG += +(0.5 * hwScale).toFixed(2); }
  if (waterFuel === 'Diesel') { hotWater = Math.round(4 * hwScale); dailyDiesel += +(0.6 * hwScale).toFixed(2); }

  const fridgeScale = (state.fridgeLitres ?? 50) / 50;

  let appliances = 0;
  ALL_APPLIANCES.forEach(app => {
    if (selectedAppliances[app.id]) {
      const overrideHours = applianceHoursOverrides[app.id];
      let ah: number;
      if (overrideHours !== undefined) {
        const watts = parseInt(app.watts);
        ah = (watts * overrideHours) / 12;
      } else {
        ah = app.ah;
      }
      if (app.id === 'dc_fridge') ah *= fridgeScale;
      appliances += ah;
    }
  });

  let custom = 0;
  let custom12v = 0;
  let custom240v = 0;
  customAppliances.forEach(app => {
    const ah = (app.watts * app.hoursPerDay) / 12;
    custom += ah;
    if (app.voltage === '240v') custom240v += ah;
    else custom12v += ah;
  });

  const rawDailyAh = base + partyAh + cooking + heating + hotWater + appliances + custom;
  const dailyAh = rawDailyAh * 0.95;

  let solarMultiplier = 2.5;
  if (climates.includes('Summer')) solarMultiplier = 4;
  if (climates.includes('Deep Winter') || isSkiHoliday) solarMultiplier = 1;
  const hasForest = destinations.includes('Forest & Lakes');
  if (hasForest) solarMultiplier = Math.max(1, solarMultiplier - 0.5);
  if (usage === 'Festival Goer') solarMultiplier = Math.max(1, solarMultiplier - 0.5);

  const solar = (solarWatts * solarMultiplier) / 12;
  const alternatorDriveFactor = usage === 'Festival Goer' ? 0.35 : 1;
  const alternator = driveHours * (dcDcSize || 0) * alternatorDriveFactor;
  // Hook-up charging offset. "Days off-grid" already captures time away from hookup,
  // so we apply a modest daily shore contribution only when hookup is enabled.
  const shorePower = wantsHookupCharging ? Math.max(20, Math.round(dailyAh * 0.35)) : 0;

  const netDailyAh = Math.max(0, dailyAh - (solar + alternator + shorePower));

  // Overnight buffer: energy needed when solar isn't generating (~60% of daily load)
  const overnightBuffer = dailyAh * 0.6;
  // Storage required: overnight buffer + accumulated deficit over off-grid days
  const storageNeeded = overnightBuffer + netDailyAh * Math.max(1, daysOffGrid);
  // 20% safety margin, 80Ah minimum
  const recommendedBankAh = Math.max(Math.ceil(storageNeeded * 1.2), 80);

  const calculatedAh = recommendedBankAh;
  const { battery: fogstarBattery, quantity: fogstarQty } = snapToFogstar(recommendedBankAh);
  const fogstarTotalAh = fogstarBattery.capacityAh * fogstarQty;

  const batteryType: 'LiFePO4' | 'AGM' = recommendedBankAh > 80 ? 'LiFePO4' : 'AGM';
  const batteryVoltage: 12 | 24 = fogstarTotalAh > 300 ? 24 : 12;

  const solarNeeded = Math.max(0, netDailyAh * 12 / (solarMultiplier || 1));
  const solarPanelsNeeded = Math.ceil(solarNeeded / 200);
  const recommendedSolarW = solarPanelsNeeded * 200;

  let inverterSize: 0 | 1000 | 2000 | 3000 = 0;
  if (state.needs240v) {
    const acLoadAh = APPLIANCES.ac_240v.reduce((sum, app) => {
      if (!selectedAppliances[app.id]) return sum;
      const oh = applianceHoursOverrides[app.id];
      return sum + (oh !== undefined ? (parseInt(app.watts) * oh) / 12 : app.ah);
    }, 0);
    if (acLoadAh + custom240v > 150) inverterSize = 3000;
    else if (acLoadAh + custom240v > 50) inverterSize = 2000;
    else inverterSize = 1000;
  }

  const recommendedBattery: BatteryRecommendation = {
    name: fogstarBattery.name,
    capacityAh: fogstarBattery.capacityAh,
    quantity: fogstarQty,
    totalAh: fogstarTotalAh,
    price: fogstarBattery.price,
    line: 'standard',
  };

  const alternativeBatteries: AlternativeBatteries = {
    eco: findAlternative(recommendedBankAh, 'eco'),
    pro: findAlternative(recommendedBankAh, 'pro'),
  };

  return {
    dailyAh: Math.round(dailyAh),
    netDailyAh: Math.round(netDailyAh),
    recommendedBankAh: fogstarTotalAh,
    calculatedAh,
    recommendedBattery,
    alternativeBatteries,
    batteryType,
    batteryVoltage,
    solarPanelsNeeded,
    recommendedSolarW,
    inverterSize,
    dcDcChargerSize: dcDcSize,
    dailyLPG: Math.round(dailyLPG * 10) / 10,
    dailyDiesel: Math.round(dailyDiesel * 10) / 10,
    dieselTankPct: (() => {
      const roundedDiesel = Math.round(dailyDiesel * 10) / 10;
      if (roundedDiesel <= 0) return null;
      const tank = getVanTankLitres(state.van);
      if (!tank) return null;
      return Math.round((roundedDiesel * daysOffGrid) / tank * 100);
    })(),
    consumption: { base, party: partyAh, heating, cooking, hotWater, appliances: Math.round(appliances), custom: Math.round(custom12v + custom240v) },
    generation: { solar: Math.round(solar), alternator: Math.round(alternator), shorePower: Math.round(shorePower) },
  };
}
