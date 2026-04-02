import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

export type UsageType = 'Weekend Trips' | 'Extended Breaks' | 'Full-Time Living' | 'Festival Goer';
export type ClimateType = 'Summer' | 'Spring & Autumn' | 'Deep Winter';
export type DestinationType = 'Mountains & Highlands' | 'Coastal & Beach' | 'Forest & Lakes' | 'European Road Trip' | 'Off-Grid & Remote' | 'Ski Holiday';
export type PartyType = 'Solo' | 'Couple' | 'Family' | 'Group / Friends';
export type FuelType = 'Gas' | 'Electric' | 'Diesel' | 'None';
export type ShowerType = 'indoor' | 'outdoor' | 'none';
export type ShowerFrequency = 'daily' | 'every2' | 'every3';
export type InsulationSeason = 'three-season' | 'four-season';
export type BuildTier = 'budget' | 'premium';

export interface WindowPlan {
  slidingDoorWindow: boolean;
  cabSideWindows: boolean;
  rearWindows: boolean;
}

export interface CustomAppliance {
  id: string;
  name: string;
  watts: number;
  hoursPerDay: number;
  voltage?: '12v' | '240v';
}

export type ExperienceLevel = 'first-timer' | 'experienced' | 'seasoned' | null;

export interface VanSelection {
  manufacturerId: string;
  manufacturerName: string;
  model: string;
  wheelbase: string;
  roofHeight?: string;
}

export interface CamperState {
  experienceLevel: ExperienceLevel;

  // Van
  van: VanSelection | null;

  // Screen 1 — Profile
  usage: UsageType;
  climates: ClimateType[];
  destinations: DestinationType[];
  party: PartyType;
  hasPets: boolean;
  hasChildren: boolean;
  worksFromVan: boolean;
  daysOffGrid: number;
  showerType: ShowerType;
  showerFrequency: ShowerFrequency;

  // Screen 2 — Systems
  needs240v: boolean;
  wantsHookupCharging: boolean;
  fridgeLitres: number;
  cookFuel: FuelType;
  heatFuel: FuelType;
  waterFuel: FuelType;
  solarWatts: number;
  driveHours: number;
  dcDcSize: number;
  selectedAppliances: Record<string, boolean>;
  applianceHoursOverrides: Record<string, number>;
  customAppliances: CustomAppliance[];

  // Screen — Water
  waterEnabled: boolean;
  selectedWaterFixtures: Record<string, boolean>;
  fixtureOverrides: Record<string, number>;

  // Build tier
  buildTier: BuildTier;

  // Insulation overrides (optional user adjustments in m²)
  insulationEnabled: boolean;
  insulationOverrides: Record<string, number>;
  useVapourBarrier: boolean;
  insulationSeason: InsulationSeason;
  windowPlan: WindowPlan;
}

interface CamperContextValue {
  state: CamperState;
  set: <K extends keyof CamperState>(key: K, value: CamperState[K]) => void;
}

export const CAMPER_DEFAULTS: CamperState = {
  experienceLevel: null,
  van: null,
  usage: 'Extended Breaks',
  climates: ['Spring & Autumn'],
  destinations: ['Coastal & Beach'],
  party: 'Couple',
  hasPets: false,
  hasChildren: false,
  worksFromVan: false,
  daysOffGrid: 3,
  showerType: 'indoor',
  showerFrequency: 'every2',
  needs240v: false,
  wantsHookupCharging: false,
  fridgeLitres: 50,
  cookFuel: 'Gas',
  heatFuel: 'Diesel',
  waterFuel: 'Diesel',
  solarWatts: 0,
  driveHours: 0,
  dcDcSize: 30,
  selectedAppliances: {},
  applianceHoursOverrides: {},
  customAppliances: [],
  buildTier: 'premium',
  waterEnabled: true,
  selectedWaterFixtures: { kitchen_tap: true, drinking_cooking: true },
  fixtureOverrides: {},
  insulationEnabled: true,
  insulationOverrides: {},
  useVapourBarrier: true,
  insulationSeason: 'three-season',
  windowPlan: {
    slidingDoorWindow: false,
    cabSideWindows: false,
    rearWindows: false,
  },
};

const CamperContext = createContext<CamperContextValue>({
  state: CAMPER_DEFAULTS,
  set: () => {},
});

interface CamperProviderProps {
  children: React.ReactNode;
  projectState?: any;
  onStateChange?: (state: CamperState) => void;
}

export function CamperProvider({ children, projectState, onStateChange }: CamperProviderProps) {
  const initial = projectState && typeof projectState === 'object' && Object.keys(projectState).length > 0
    ? { ...CAMPER_DEFAULTS, ...projectState }
    : CAMPER_DEFAULTS;

  const [state, setState] = useState<CamperState>(initial);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isFirstRender = useRef(true);

  const set = useCallback(<K extends keyof CamperState>(key: K, value: CamperState[K]) => {
    setState(prev => ({ ...prev, [key]: value }));
  }, []);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (!onStateChange) return;

    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      onStateChange(state);
    }, 2000);

    return () => { if (saveTimer.current) clearTimeout(saveTimer.current); };
  }, [state, onStateChange]);

  const value = useMemo(() => ({ state, set }), [state, set]);

  return (
    <CamperContext.Provider value={value}>
      {children}
    </CamperContext.Provider>
  );
}

export function useCamper() {
  return useContext(CamperContext);
}
