import type {
  SystemConfig, SystemArchetype, WiringSpec,
  SelectedComponent, WireConnection, ActionItem,
  EarthingSpec, RegulationNote, WireColor, CableType, FuseType,
} from './wiringTypes';
import { VICTRON_CATALOG, findProduct } from '@/data/victronCatalog';
import { studSizeForTerminal } from '@/data/accessoryCatalog';
import { REGULATIONS, SAFETY_WARNINGS } from '@/data/regulations';
import { selectCableGauge, estimateCableLength } from '@/data/cableSizingTable';
import { generateShoppingList } from './shoppingList';
import { generateInstallationGuide } from './installationGuide';

export function determineArchetype(config: SystemConfig): SystemArchetype {
  if (config.inverterVA === 0) return config.solarWatts === 0 ? 'MINIMAL' : 'BASIC_OFFGRID';
  if (config.hasShore) return 'PREMIUM_SHORE';
  return 'PREMIUM_OFFGRID';
}

function selectBattery(ah: number): string { if (ah <= 105) return 'fogstar_105'; if (ah <= 230) return 'fogstar_230'; if (ah <= 280) return 'fogstar_280'; if (ah <= 300) return 'fogstar_300'; if (ah <= 460) return 'fogstar_460'; return 'fogstar_608'; }
function selectInverter(va: number, hasShore: boolean): string | null { if (va === 0) return null; if (hasShore || va >= 1600) { if (va <= 800) return 'mp_800'; if (va <= 1600) return 'mp_1600'; if (va <= 2000) return 'mp_2000'; return 'mp_3000'; } return va <= 800 ? 'phx_800' : 'phx_1200'; }
function selectMPPT(solarW: number): string | null { if (solarW === 0) return null; if (solarW <= 200) return 'mppt_75_15'; if (solarW <= 290) return 'mppt_100_20'; if (solarW <= 440) return 'mppt_100_30'; return 'mppt_150_35'; }
function selectDCDC(amps: number): string | null { if (amps === 0) return null; if (amps <= 18) return 'orion_18'; if (amps <= 30) return 'orion_30'; return 'orion_50'; }
function selectBatteryProtect(totalLoadAmps: number): string { return totalLoadAmps > 65 ? 'bp_100' : 'bp_65'; }
function maxCurrentForInverter(va: number): number { return Math.ceil(va / 12); }
function fuseForCurrent(amps: number): { rating: number; type: FuseType } {
  if (amps <= 30) return { rating: 30, type: 'blade' };
  const midi = [30, 40, 50, 60, 80, 100, 125, 150, 175, 200];
  for (const r of midi) { if (r >= amps * 1.25) return { rating: r, type: 'midi' }; }
  const mega = [100, 125, 150, 175, 200, 225, 250, 300, 400, 500];
  for (const r of mega) { if (r >= amps * 1.25) return { rating: r, type: 'mega' }; }
  return { rating: 500, type: 'mega' };
}

export function generateWiringSpec(config: SystemConfig): WiringSpec {
  const archetype = determineArchetype(config);
  const cableLen = estimateCableLength(config.cableRunLength);
  const components: SelectedComponent[] = [];
  const connections: WireConnection[] = [];
  const actions: ActionItem[] = [];
  let connId = 0;
  const nextId = () => `wire_${++connId}`;

  const batteryId = selectBattery(config.batteryAh);
  const battery = findProduct(batteryId)!;
  const batteryCapacity = Number(battery.specs?.capacityAh ?? config.batteryAh);
  const batteryQty = batteryCapacity > 0 ? Math.max(1, Math.ceil(config.batteryAh / batteryCapacity)) : 1;
  components.push({ product: battery, quantity: batteryQty, role: batteryQty > 1 ? `Leisure Battery (×${batteryQty} in parallel)` : 'Leisure Battery' });
  components.push({ product: findProduct('smartshunt_500')!, quantity: 1, role: 'Battery Monitor' });

  const inverterId = selectInverter(config.inverterVA, config.hasShore);
  const inverter = inverterId ? findProduct(inverterId) : null;
  if (inverter) components.push({ product: inverter, quantity: 1, role: inverter.category === 'inverterCharger' ? 'Inverter/Charger' : 'Inverter' });

  const mpptId = selectMPPT(config.solarWatts);
  const mppt = mpptId ? findProduct(mpptId) : null;
  if (mppt) components.push({ product: mppt, quantity: 1, role: 'Solar Charge Controller' });

  const dcdcId = selectDCDC(config.dcDcAmps);
  const dcdc = dcdcId ? findProduct(dcdcId) : null;
  if (dcdc) components.push({ product: dcdc, quantity: 1, role: 'DC-DC Charger' });

  // Lynx is mandatory for all schematic builds (busbar fallback removed).
  const useLynx = true;
  components.push({ product: findProduct('lynx_dist')!, quantity: 1, role: 'DC Distribution' });
  components.push({ product: findProduct('lynx_power_in')!, quantity: 1, role: 'Battery Connection' });

  const loadAmps = config.dcDcAmps + (mppt ? Number(mppt.specs.maxChargeAmps) : 0);
  const bp = findProduct(selectBatteryProtect(loadAmps))!;
  components.push({ product: bp, quantity: 1, role: 'Load Disconnect Protection' });

  if (config.hasShore && inverter?.category === 'inverter') components.push({ product: findProduct('bluesmart_12_30')!, quantity: 1, role: 'Mains Battery Charger' });

  function addWire(opts: { from: { componentId: string; connectionId: string }; to: { componentId: string; connectionId: string }; currentAmps: number; color: WireColor; label: string; cableType?: CableType; fuseRating?: number; fuseType?: FuseType; overrideGauge?: number }): WireConnection {
    const gauge = opts.overrideGauge ?? selectCableGauge(opts.currentAmps, config.cableRunLength);
    const fromProduct = findProduct(opts.from.componentId) ?? VICTRON_CATALOG[0];
    const toProduct = findProduct(opts.to.componentId) ?? VICTRON_CATALOG[0];
    const fromConn = fromProduct?.connections.find(c => c.id === opts.from.connectionId);
    const toConn = toProduct?.connections.find(c => c.id === opts.to.connectionId);
    const wire: WireConnection = { id: nextId(), from: opts.from, to: opts.to, cableGauge: gauge, cableType: opts.cableType ?? 'tri-rated', cableColor: opts.color, length: cableLen, fuseRating: opts.fuseRating, fuseType: opts.fuseType, terminalLugFrom: fromConn ? { cableSize: gauge, studSize: studSizeForTerminal(fromConn.terminalType) } : undefined, terminalLugTo: toConn ? { cableSize: gauge, studSize: studSizeForTerminal(toConn.terminalType) } : undefined, torqueFrom: fromConn?.torqueNm, torqueTo: toConn?.torqueNm, label: opts.label };
    connections.push(wire);
    return wire;
  }

  const distTarget = useLynx ? 'lynx_power_in' : batteryId;
  const distBusPos = useLynx ? 'BUS_POS' : 'BAT_POS';
  const distBusNeg = useLynx ? 'BUS_NEG' : 'BAT_NEG';
  const mainBatteryCurrent = config.inverterVA > 0 ? maxCurrentForInverter(config.inverterVA) : 30;
  const mainGauge = selectCableGauge(mainBatteryCurrent, config.cableRunLength);

  addWire({ from: { componentId: batteryId, connectionId: 'BAT_NEG' }, to: { componentId: 'smartshunt_500', connectionId: 'BAT_NEG' }, currentAmps: mainBatteryCurrent, color: 'black', label: 'Battery (-) to SmartShunt', overrideGauge: mainGauge });
  addWire({ from: { componentId: 'smartshunt_500', connectionId: 'SYS_NEG' }, to: { componentId: distTarget, connectionId: distBusNeg }, currentAmps: mainBatteryCurrent, color: 'black', label: 'SmartShunt to System Negative', overrideGauge: mainGauge });
  const mainFuse = fuseForCurrent(mainBatteryCurrent);
  addWire({ from: { componentId: batteryId, connectionId: 'BAT_POS' }, to: { componentId: 'midi_fuse_holder', connectionId: 'IN' }, currentAmps: mainBatteryCurrent, color: 'red', label: `Battery (+) → MIDI Fuse (${mainFuse.rating}A)`, overrideGauge: mainGauge, fuseRating: mainFuse.rating, fuseType: mainFuse.type });
  addWire({ from: { componentId: 'midi_fuse_holder', connectionId: 'OUT' }, to: { componentId: distTarget, connectionId: distBusPos }, currentAmps: mainBatteryCurrent, color: 'red', label: 'MIDI Fuse → Distribution (+)', overrideGauge: mainGauge });
  addWire({ from: { componentId: 'smartshunt_500', connectionId: 'AUX' }, to: { componentId: batteryId, connectionId: 'BAT_POS' }, currentAmps: 1, color: 'red', label: 'SmartShunt AUX (VBAT+)', overrideGauge: 1.5, fuseRating: 1, fuseType: 'glass' });

  if (useLynx) {
    addWire({ from: { componentId: 'lynx_power_in', connectionId: 'BUS_POS' }, to: { componentId: 'lynx_dist', connectionId: 'BUS_POS' }, currentAmps: mainBatteryCurrent, color: 'red', label: 'Lynx Power In → Lynx Distributor (+)', overrideGauge: mainGauge });
    addWire({ from: { componentId: 'lynx_power_in', connectionId: 'BUS_NEG' }, to: { componentId: 'lynx_dist', connectionId: 'BUS_NEG' }, currentAmps: mainBatteryCurrent, color: 'black', label: 'Lynx Power In → Lynx Distributor (-)', overrideGauge: mainGauge });
  }

  const lynxDistId = useLynx ? 'lynx_dist' : distTarget;

  if (inverter && inverterId) {
    const invCurrent = maxCurrentForInverter(config.inverterVA);
    const invGauge = selectCableGauge(invCurrent, config.cableRunLength);
    const invFuse = useLynx ? undefined : fuseForCurrent(invCurrent);
    addWire({ from: { componentId: lynxDistId, connectionId: useLynx ? 'FUSE_1' : distBusPos }, to: { componentId: inverterId, connectionId: 'DC_POS' }, currentAmps: invCurrent, color: 'red', label: `Inverter DC (+) — ${invGauge}mm²`, overrideGauge: invGauge, fuseRating: invFuse?.rating, fuseType: invFuse?.type });
    addWire({ from: { componentId: lynxDistId, connectionId: useLynx ? 'BUS_NEG' : distBusNeg }, to: { componentId: inverterId, connectionId: 'DC_NEG' }, currentAmps: invCurrent, color: 'black', label: 'Inverter DC (-)', overrideGauge: invGauge });
    inverter.setupActions.forEach((action, i) => { actions.push({ id: `act_inv_${i}`, componentId: inverterId!, text: action, priority: 'critical' }); });
  }

  if (mppt && mpptId) {
    const mpptAmps = Number(mppt.specs.maxChargeAmps);
    const mpptGauge = selectCableGauge(mpptAmps, config.cableRunLength);
    const mpptFuse = useLynx ? undefined : fuseForCurrent(mpptAmps);
    addWire({ from: { componentId: lynxDistId, connectionId: useLynx ? 'FUSE_2' : distBusPos }, to: { componentId: mpptId, connectionId: 'BAT_POS' }, currentAmps: mpptAmps, color: 'red', label: 'MPPT → Battery (+)', overrideGauge: mpptGauge, fuseRating: mpptFuse?.rating, fuseType: mpptFuse?.type });
    addWire({ from: { componentId: lynxDistId, connectionId: useLynx ? 'BUS_NEG' : distBusNeg }, to: { componentId: mpptId, connectionId: 'BAT_NEG' }, currentAmps: mpptAmps, color: 'black', label: 'MPPT → Battery (-)', overrideGauge: mpptGauge });
    addWire({ from: { componentId: 'solar_panels', connectionId: 'PV_POS' }, to: { componentId: 'pv_disconnect', connectionId: 'IN_POS' }, currentAmps: Math.ceil(config.solarWatts / 18), color: 'red', label: 'Solar PV (+) → PV Disconnect', cableType: 'solar', overrideGauge: 6 });
    addWire({ from: { componentId: 'solar_panels', connectionId: 'PV_NEG' }, to: { componentId: 'pv_disconnect', connectionId: 'IN_NEG' }, currentAmps: Math.ceil(config.solarWatts / 18), color: 'black', label: 'Solar PV (-) → PV Disconnect', cableType: 'solar', overrideGauge: 6 });
    addWire({ from: { componentId: 'pv_disconnect', connectionId: 'OUT_POS' }, to: { componentId: mpptId, connectionId: 'PV_POS' }, currentAmps: Math.ceil(config.solarWatts / 18), color: 'red', label: 'PV Disconnect → MPPT PV (+)', cableType: 'solar', overrideGauge: 6 });
    addWire({ from: { componentId: 'pv_disconnect', connectionId: 'OUT_NEG' }, to: { componentId: mpptId, connectionId: 'PV_NEG' }, currentAmps: Math.ceil(config.solarWatts / 18), color: 'black', label: 'PV Disconnect → MPPT PV (-)', cableType: 'solar', overrideGauge: 6 });
    if (mppt.connections.find(c => c.id === 'CHASSIS_GND')) addWire({ from: { componentId: mpptId, connectionId: 'CHASSIS_GND' }, to: { componentId: 'chassis', connectionId: 'GND' }, currentAmps: 5, color: 'green_yellow', label: 'MPPT Casing Ground', overrideGauge: 10 });
    mppt.setupActions.forEach((action, i) => { actions.push({ id: `act_mppt_${i}`, componentId: mpptId!, text: action, priority: 'critical' }); });
  }

  if (dcdc && dcdcId) {
    const dcdcAmps = config.dcDcAmps;
    const dcdcGauge = selectCableGauge(dcdcAmps, config.cableRunLength);
    const dcdcFuse = fuseForCurrent(dcdcAmps);
    addWire({ from: { componentId: 'starter_battery', connectionId: 'POS' }, to: { componentId: dcdcId, connectionId: 'IN_POS' }, currentAmps: dcdcAmps, color: 'red', label: 'Starter Battery → DC-DC (+)', overrideGauge: dcdcGauge, fuseRating: dcdcFuse.rating, fuseType: dcdcFuse.type });
    addWire({ from: { componentId: 'starter_battery', connectionId: 'NEG' }, to: { componentId: dcdcId, connectionId: 'IN_NEG' }, currentAmps: dcdcAmps, color: 'black', label: 'Starter Battery → DC-DC (-)', overrideGauge: dcdcGauge });
    const dcdcOutFuse = useLynx ? undefined : fuseForCurrent(dcdcAmps);
    addWire({ from: { componentId: dcdcId, connectionId: 'OUT_POS' }, to: { componentId: lynxDistId, connectionId: useLynx ? 'FUSE_3' : distBusPos }, currentAmps: dcdcAmps, color: 'red', label: 'DC-DC → Battery (+)', overrideGauge: dcdcGauge, fuseRating: dcdcOutFuse?.rating, fuseType: dcdcOutFuse?.type });
    addWire({ from: { componentId: dcdcId, connectionId: 'OUT_NEG' }, to: { componentId: lynxDistId, connectionId: useLynx ? 'BUS_NEG' : distBusNeg }, currentAmps: dcdcAmps, color: 'black', label: 'DC-DC → Battery (-)', overrideGauge: dcdcGauge });
    dcdc.setupActions.forEach((action, i) => { actions.push({ id: `act_dcdc_${i}`, componentId: dcdcId!, text: action, priority: 'critical' }); });
  }

  addWire({ from: { componentId: lynxDistId, connectionId: useLynx ? 'FUSE_4' : distBusPos }, to: { componentId: bp.id, connectionId: 'IN' }, currentAmps: loadAmps || 30, color: 'red', label: 'Distribution → Battery Protect', fuseRating: useLynx ? undefined : fuseForCurrent(loadAmps || 30).rating, fuseType: useLynx ? undefined : fuseForCurrent(loadAmps || 30).type });
  addWire({ from: { componentId: bp.id, connectionId: 'OUT' }, to: { componentId: 'fuse_block', connectionId: 'POS_IN' }, currentAmps: loadAmps || 30, color: 'red', label: 'Battery Protect → Fuse Block' });
  addWire({ from: { componentId: lynxDistId, connectionId: useLynx ? 'BUS_NEG' : distBusNeg }, to: { componentId: 'fuse_block', connectionId: 'NEG_BUS' }, currentAmps: loadAmps || 30, color: 'black', label: 'Negative Bus → Fuse Block', overrideGauge: 16 });
  bp.setupActions.forEach((action, i) => { actions.push({ id: `act_bp_${i}`, componentId: bp.id, text: action, priority: 'important' }); });

  // Dynamic fuse block circuits based on selected DC appliances
  const DC_APPLIANCE_FUSE_MAP: Record<string, { label: string; amps: number }> = {
    dc_fridge: { label: 'Fridge/Freezer', amps: 10 },
    dc_fan: { label: 'Roof Fan', amps: 5 },
    dc_led: { label: 'LED Lighting', amps: 5 },
    dc_usb: { label: 'USB/12V Sockets', amps: 5 },
    dc_pump: { label: 'Water Pump', amps: 5 },
    ac_laptop: { label: 'Laptop Charger', amps: 10 },
    ac_starlink: { label: 'Starlink', amps: 10 },
  };
  const dcAppliances = config.selectedDcAppliances || [];
  let circuitIdx = 0;
  for (const appId of dcAppliances) {
    const fuseDef = DC_APPLIANCE_FUSE_MAP[appId];
    if (!fuseDef) continue;
    circuitIdx++;
    addWire({
      from: { componentId: 'fuse_block', connectionId: `CIRCUIT_${circuitIdx}` },
      to: { componentId: `dc_load_${appId}`, connectionId: 'POS' },
      currentAmps: fuseDef.amps,
      color: 'red',
      label: `Fuse Block → ${fuseDef.label} (+)`,
      overrideGauge: fuseDef.amps > 8 ? 2.5 : 1.5,
      fuseRating: fuseDef.amps <= 5 ? 5 : fuseDef.amps <= 10 ? 10 : 15,
      fuseType: 'blade',
    });
    addWire({
      from: { componentId: `dc_load_${appId}`, connectionId: 'NEG' },
      to: { componentId: 'fuse_block', connectionId: 'NEG_BUS' },
      currentAmps: fuseDef.amps,
      color: 'black',
      label: `${fuseDef.label} (-) → Negative Bus`,
      overrideGauge: fuseDef.amps > 8 ? 2.5 : 1.5,
    });
  }
  const customNames = config.customApplianceNames || [];
  for (const name of customNames) {
    circuitIdx++;
    addWire({
      from: { componentId: 'fuse_block', connectionId: `CIRCUIT_${circuitIdx}` },
      to: { componentId: `dc_load_custom_${circuitIdx}`, connectionId: 'POS' },
      currentAmps: 10,
      color: 'red',
      label: `Fuse Block → ${name} (+)`,
      overrideGauge: 2.5,
      fuseRating: 10,
      fuseType: 'blade',
    });
    addWire({
      from: { componentId: `dc_load_custom_${circuitIdx}`, connectionId: 'NEG' },
      to: { componentId: 'fuse_block', connectionId: 'NEG_BUS' },
      currentAmps: 10,
      color: 'black',
      label: `${name} (-) → Negative Bus`,
      overrideGauge: 2.5,
    });
  }

  if (config.hasShore && inverter?.category === 'inverterCharger') {
    addWire({ from: { componentId: 'shore_inlet', connectionId: 'AC_OUT' }, to: { componentId: 'transfer_switch', connectionId: 'INPUT_1' }, currentAmps: 16, color: 'brown', label: 'Shore Power → Transfer Switch', cableType: 'H07RN-F', overrideGauge: 2.5 });
    addWire({ from: { componentId: 'transfer_switch', connectionId: 'OUTPUT' }, to: { componentId: 'cu_ac_in', connectionId: 'MAIN_IN' }, currentAmps: 16, color: 'brown', label: 'Transfer Switch → AC-In Consumer Unit', cableType: 'H07RN-F', overrideGauge: 2.5 });
    addWire({ from: { componentId: 'cu_ac_in', connectionId: 'MCB_OUT' }, to: { componentId: inverterId!, connectionId: 'AC_IN_L' }, currentAmps: 16, color: 'brown', label: 'AC-In CU → MultiPlus AC-In', cableType: 'H07RN-F', overrideGauge: 2.5 });
    addWire({ from: { componentId: inverterId!, connectionId: 'AC_OUT_L' }, to: { componentId: 'cu_ac_out', connectionId: 'MAIN_IN' }, currentAmps: 16, color: 'brown', label: 'MultiPlus AC-Out → AC-Out Consumer Unit', cableType: 'H07RN-F', overrideGauge: 2.5 });
    addWire({ from: { componentId: inverterId!, connectionId: 'AC_OUT_L' }, to: { componentId: 'transfer_switch', connectionId: 'INPUT_2' }, currentAmps: 16, color: 'brown', label: 'MultiPlus AC-Out → Transfer Switch', cableType: 'H07RN-F', overrideGauge: 1.5 });
  }

  if (inverter && inverter.connections.find(c => c.id === 'CHASSIS_GND')) {
    addWire({ from: { componentId: inverterId!, connectionId: 'CHASSIS_GND' }, to: { componentId: 'chassis', connectionId: 'GND' }, currentAmps: 5, color: 'green_yellow', label: 'Inverter Casing Ground to Negative Busbar', cableType: 'bonding', overrideGauge: useLynx ? 35 : 16 });
  }

  // LPG gas earthing — BS EN 1949:2020 requires bonding of metallic gas pipework
  const earthingSpec: EarthingSpec = { chassisGroundCable: 35, bondingCable: 4, connections: [{ from: 'Negative Busbar', to: 'Vehicle Chassis', cableSize: 35, label: 'Main chassis earth bond' }, { from: 'Vehicle Chassis', to: 'AC Consumer Unit Earth Bar', cableSize: 4, label: 'Chassis to CU earth bond' }], hasLPG: config.hasLPG };
  if (inverter?.category === 'inverterCharger') earthingSpec.connections.push({ from: 'MultiPlus Casing Ground', to: 'Negative Busbar', cableSize: useLynx ? 35 : 16, label: 'Inverter casing earth' });
  if (config.hasLPG) {
    earthingSpec.connections.push({ from: 'LPG Pipework', to: 'Vehicle Chassis', cableSize: 4, label: 'LPG gas pipe earth bond (BS EN 1949)' });
    addWire({ from: { componentId: 'lpg_regulator', connectionId: 'EARTH' }, to: { componentId: 'chassis', connectionId: 'GND' }, currentAmps: 5, color: 'green_yellow', label: 'LPG Pipe Earth Bond', cableType: 'bonding', overrideGauge: 4 });
  }

  const componentTypes = new Set<string>(['system', 'battery', 'cable']);
  if (inverter) componentTypes.add('inverterCharger');
  if (mppt) componentTypes.add('solar');
  if (config.hasShore) { componentTypes.add('ac'); componentTypes.add('ac_cable'); componentTypes.add('consumerUnit'); componentTypes.add('enclosure'); }
  componentTypes.add('fuseHolder'); componentTypes.add('fuse'); componentTypes.add('dcLoads'); componentTypes.add('earthing'); componentTypes.add('isolator');
  if (mppt) componentTypes.add('pv_disconnect');

  const regulations: RegulationNote[] = REGULATIONS.filter(r => r.appliesTo.some(t => componentTypes.has(t)));

  const shunt = findProduct('smartshunt_500')!;
  shunt.setupActions.forEach((action, i) => { actions.push({ id: `act_shunt_${i}`, componentId: 'smartshunt_500', text: action, priority: 'important' }); });

  const spec: WiringSpec = { archetype, components, connections, regulations, actions, safetyWarnings: SAFETY_WARNINGS, earthingSpec, shoppingList: [], installationSteps: [] };
  spec.shoppingList = generateShoppingList(spec, config);
  spec.installationSteps = generateInstallationGuide(spec, config);
  return spec;
}
