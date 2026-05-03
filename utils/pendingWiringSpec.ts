import type { CamperState } from '@/context/CamperContext';
import { calculate } from '@/utils/calculator';
import { generateWiringSpec } from '@/utils/wiringRules';
import type { SystemConfig } from '@/utils/wiringTypes';

function toInverterVA(inverterSize: number, needs240v: boolean): SystemConfig['inverterVA'] {
  if (!needs240v) return 0;
  if (inverterSize === 1000) return 1600;
  if (inverterSize === 2000) return 2000;
  if (inverterSize === 3000) return 3000;
  return 0;
}

function toSolarWatts(recommendedSolarW: number): SystemConfig['solarWatts'] {
  if (recommendedSolarW <= 0) return 0;
  if (recommendedSolarW <= 200) return 200;
  if (recommendedSolarW <= 400) return 400;
  return 600;
}

function toDcDcAmps(dcDcChargerSize: number): SystemConfig['dcDcAmps'] {
  if (dcDcChargerSize <= 0) return 0;
  if (dcDcChargerSize <= 18) return 18;
  if (dcDcChargerSize <= 30) return 30;
  return 50;
}

export function buildPendingWiringSpec(camperState: CamperState): {
  wiringSpec: Record<string, unknown>;
  buildSummary: Record<string, unknown>;
} | null {
  try {
    const buildSpec = calculate(camperState);
    const selectedDcAppliances = Object.entries(camperState.selectedAppliances || {})
      .filter(([id, on]) => !!on && id.startsWith('dc_'))
      .map(([id]) => id);
    const customApplianceNames = (camperState.customAppliances || [])
      .filter((app) => app.voltage !== '240v')
      .map((app) => app.name);
    const hasLPG = camperState.cookFuel === 'Gas' || camperState.heatFuel === 'Gas' || camperState.waterFuel === 'Gas';
    const inverterVA = toInverterVA(buildSpec.inverterSize, camperState.needs240v);
    const solarWatts = toSolarWatts(buildSpec.recommendedSolarW);
    const dcDcAmps = toDcDcAmps(buildSpec.dcDcChargerSize);

    const config: SystemConfig = {
      batteryAh: buildSpec.recommendedBankAh,
      inverterVA,
      solarWatts,
      dcDcAmps,
      hasShore: camperState.needs240v ? camperState.wantsHookupCharging : false,
      hasLPG,
      cableRunLength: 'medium',
      useLynx: true,
      selectedDcAppliances,
      customApplianceNames,
    };

    const wiringSpec = generateWiringSpec(config);
    const buildSummary = {
      batteryAh: buildSpec.recommendedBankAh,
      inverterVA,
      mpptW: buildSpec.recommendedSolarW,
      dcDcA: buildSpec.dcDcChargerSize,
    };
    return { wiringSpec: wiringSpec as unknown as Record<string, unknown>, buildSummary };
  } catch {
    return null;
  }
}
