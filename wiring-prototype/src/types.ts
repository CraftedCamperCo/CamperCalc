// ── System Configuration (inputs) ──

export type CableRunLength = 'short' | 'medium' | 'long';

export interface SystemConfig {
  batteryAh: number;
  inverterVA: 0 | 800 | 1600 | 2000 | 3000;
  solarWatts: 0 | 200 | 400 | 600;
  dcDcAmps: 0 | 18 | 30 | 50;
  hasShore: boolean;
  cableRunLength: CableRunLength;
  useLynx: boolean;
}

// ── System Archetypes ──

export type SystemArchetype =
  | 'MINIMAL'
  | 'BASIC_OFFGRID'
  | 'STANDARD_OFFGRID'
  | 'STANDARD_SHORE'
  | 'PREMIUM_OFFGRID'
  | 'PREMIUM_SHORE';

// ── Victron Product Catalog ──

export type ProductCategory =
  | 'battery'
  | 'inverterCharger'
  | 'inverter'
  | 'mppt'
  | 'dcdc'
  | 'distributor'
  | 'monitor'
  | 'protect'
  | 'charger';

export interface ConnectionPoint {
  id: string;
  label: string;
  terminalType: 'M8_bolt' | 'M6_bolt' | 'M5_screw' | 'M4_screw' | 'MC4' | 'spring' | 'busbar_stud';
  maxCableSize: number;
  torqueNm?: number;
  position: 'top' | 'bottom' | 'left' | 'right';
}

export interface VictronProduct {
  id: string;
  name: string;
  model: string;
  category: ProductCategory;
  voltage: number;
  specs: Record<string, number | string | boolean>;
  connections: ConnectionPoint[];
  setupActions: string[];
  manualUrl: string;
  estimatedPrice: number;
}

// ── Accessory Catalog ──

export type CableType = 'tri-rated' | 'H07RN-F' | 'solar' | 'bonding';

export interface CableSpec {
  gauge: number;
  type: CableType;
  color: string;
  pricePerMetre: number;
  maxCurrentRating5m: number;
  maxCurrentRating10m: number;
}

export interface TerminalLugSpec {
  cableSize: number;
  studSize: number;
  description: string;
  crimpDie: string;
  priceEach: number;
}

export type FuseType = 'blade' | 'midi' | 'mega' | 'glass' | 'mcb';

export interface FuseSpec {
  type: FuseType;
  rating: number;
  voltage: number;
  description: string;
  priceEach: number;
}

export interface AccessoryItem {
  id: string;
  name: string;
  category: 'cable' | 'lug' | 'fuse' | 'fuseHolder' | 'isolator' | 'consumerUnit' | 'transferSwitch' | 'earthing' | 'consumable' | 'tool';
  description: string;
  estimatedPrice: number;
  unit: string;
}

// ── Wiring Specification (rule engine output) ──

export type WireColor = 'red' | 'black' | 'green_yellow' | 'blue' | 'brown' | 'grey';

export interface WireConnection {
  id: string;
  from: { componentId: string; connectionId: string };
  to: { componentId: string; connectionId: string };
  cableGauge: number;
  cableType: CableType;
  cableColor: WireColor;
  length: number;
  fuseRating?: number;
  fuseType?: FuseType;
  terminalLugFrom?: { cableSize: number; studSize: number };
  terminalLugTo?: { cableSize: number; studSize: number };
  torqueFrom?: number;
  torqueTo?: number;
  label: string;
}

export interface SelectedComponent {
  product: VictronProduct;
  quantity: number;
  role: string;
}

export interface RegulationNote {
  id: string;
  standard: string;
  clause: string;
  text: string;
  appliesTo: string[];
}

export interface ActionItem {
  id: string;
  componentId: string;
  text: string;
  priority: 'critical' | 'important' | 'info';
}

export interface SafetyWarning {
  id: string;
  text: string;
  severity: 'danger' | 'warning' | 'caution';
}

export interface EarthingSpec {
  chassisGroundCable: number;
  bondingCable: number;
  connections: {
    from: string;
    to: string;
    cableSize: number;
    label: string;
  }[];
  hasLPG: boolean;
}

export interface InstallStep {
  stepNumber: number;
  title: string;
  instructions: string[];
  cableSpecs?: string[];
  torqueValues?: string[];
  regulations?: string[];
  warnings?: string[];
}

export interface ShoppingListItem {
  category: string;
  name: string;
  description: string;
  quantity: number;
  unit: string;
  estimatedPrice: number;
  productUrl?: string;
  imageUrl?: string;
}

export interface WiringSpec {
  archetype: SystemArchetype;
  components: SelectedComponent[];
  connections: WireConnection[];
  regulations: RegulationNote[];
  actions: ActionItem[];
  safetyWarnings: SafetyWarning[];
  earthingSpec: EarthingSpec;
  shoppingList: ShoppingListItem[];
  installationSteps: InstallStep[];
}

// ── Schematic Layout ──

export interface ComponentPlacement {
  componentId: string;
  x: number;
  y: number;
  width: number;
  height: number;
  svgType: string;
  label: string;
}

export interface WireRoute {
  connectionId: string;
  points: { x: number; y: number }[];
  color: string;
  strokeWidth: number;
}

export interface AnnotationPlacement {
  id: string;
  type: 'regulation' | 'action' | 'safety' | 'label';
  x: number;
  y: number;
  width: number;
  text: string;
}

export interface SchematicLayout {
  archetype: SystemArchetype;
  width: number;
  height: number;
  components: ComponentPlacement[];
  wires: WireRoute[];
  annotations: AnnotationPlacement[];
}
