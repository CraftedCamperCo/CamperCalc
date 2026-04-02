import type {
  SystemConfig, SystemArchetype, WiringSpec,
  SelectedComponent, WireConnection, ActionItem,
  EarthingSpec, RegulationNote, WireColor, CableType, FuseType,
} from '../types';
import { VICTRON_CATALOG, findProduct } from '../data/victronCatalog';
import { studSizeForTerminal } from '../data/accessoryCatalog';
import { REGULATIONS, SAFETY_WARNINGS } from '../data/regulations';
import { selectCableGauge, estimateCableLength } from '../data/cableSizingTable';
import { generateShoppingList } from './shoppingList';
import { generateInstallationGuide } from './installationGuide';

export function determineArchetype(config: SystemConfig): SystemArchetype {
  if (config.inverterVA === 0) {
    return config.solarWatts === 0 ? 'MINIMAL' : 'BASIC_OFFGRID';
  }
  if (config.inverterVA <= 1200 && !config.hasShore) {
    return 'STANDARD_OFFGRID';
  }
  if (config.hasShore) {
    return config.useLynx ? 'PREMIUM_SHORE' : 'STANDARD_SHORE';
  }
  return config.useLynx ? 'PREMIUM_OFFGRID' : 'STANDARD_OFFGRID';
}

function selectBattery(ah: number): string {
  if (ah <= 120) return 'bat_100';
  if (ah <= 250) return 'bat_200';
  return 'bat_330';
}

function selectInverter(va: number, hasShore: boolean): string | null {
  if (va === 0) return null;
  if (hasShore || va >= 1600) {
    if (va <= 800) return 'mp_800';
    if (va <= 1600) return 'mp_1600';
    if (va <= 2000) return 'mp_2000';
    return 'mp_3000';
  }
  return va <= 800 ? 'phx_800' : 'phx_1200';
}

function selectMPPT(solarW: number): string | null {
  if (solarW === 0) return null;
  if (solarW <= 200) return 'mppt_75_15';
  if (solarW <= 290) return 'mppt_100_20';
  if (solarW <= 440) return 'mppt_100_30';
  return 'mppt_150_35';
}

function selectDCDC(amps: number): string | null {
  if (amps === 0) return null;
  if (amps <= 18) return 'orion_18';
  if (amps <= 30) return 'orion_30';
  return 'orion_50';
}

function selectBatteryProtect(totalLoadAmps: number): string {
  return totalLoadAmps > 65 ? 'bp_100' : 'bp_65';
}

function maxCurrentForInverter(va: number): number {
  return Math.ceil(va / 12);
}

function fuseForCurrent(amps: number): { rating: number; type: FuseType } {
  if (amps <= 30) return { rating: 30, type: 'blade' };
  const midiRatings = [30, 40, 50, 60, 80, 100, 125, 150, 175, 200];
  for (const r of midiRatings) {
    if (r >= amps * 1.25) return { rating: r, type: 'midi' };
  }
  const megaRatings = [100, 125, 150, 175, 200, 225, 250, 300, 400, 500];
  for (const r of megaRatings) {
    if (r >= amps * 1.25) return { rating: r, type: 'mega' };
  }
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

  // ── Select components ──
  const batteryId = selectBattery(config.batteryAh);
  const battery = findProduct(batteryId)!;
  components.push({ product: battery, quantity: 1, role: 'Leisure Battery' });

  components.push({ product: findProduct('smartshunt_500')!, quantity: 1, role: 'Battery Monitor' });

  const inverterId = selectInverter(config.inverterVA, config.hasShore);
  const inverter = inverterId ? findProduct(inverterId) : null;
  if (inverter) {
    components.push({ product: inverter, quantity: 1, role: inverter.category === 'inverterCharger' ? 'Inverter/Charger' : 'Inverter' });
  }

  const mpptId = selectMPPT(config.solarWatts);
  const mppt = mpptId ? findProduct(mpptId) : null;
  if (mppt) {
    components.push({ product: mppt, quantity: 1, role: 'Solar Charge Controller' });
  }

  const dcdcId = selectDCDC(config.dcDcAmps);
  const dcdc = dcdcId ? findProduct(dcdcId) : null;
  if (dcdc) {
    components.push({ product: dcdc, quantity: 1, role: 'DC-DC Charger' });
  }

  const useLynx = config.useLynx && (archetype === 'PREMIUM_SHORE' || archetype === 'PREMIUM_OFFGRID');
  if (useLynx) {
    components.push({ product: findProduct('lynx_dist')!, quantity: 1, role: 'DC Distribution' });
    components.push({ product: findProduct('lynx_power_in')!, quantity: 1, role: 'Battery Connection' });
  }

  const loadAmps = config.dcDcAmps + (mppt ? Number(mppt.specs.maxChargeAmps) : 0);
  const bp = findProduct(selectBatteryProtect(loadAmps))!;
  components.push({ product: bp, quantity: 1, role: 'Load Disconnect Protection' });

  const needsStandaloneCharger = config.hasShore && inverter?.category === 'inverter';
  if (needsStandaloneCharger) {
    components.push({ product: findProduct('bluesmart_12_30')!, quantity: 1, role: 'Mains Battery Charger' });
  }

  // ── Helper: create a wire connection ──
  function addWire(opts: {
    from: { componentId: string; connectionId: string };
    to: { componentId: string; connectionId: string };
    currentAmps: number;
    color: WireColor;
    label: string;
    cableType?: CableType;
    fuseRating?: number;
    fuseType?: FuseType;
    overrideGauge?: number;
  }): WireConnection {
    const gauge = opts.overrideGauge ?? selectCableGauge(opts.currentAmps, config.cableRunLength);
    const fromProduct = findProduct(opts.from.componentId) ?? VICTRON_CATALOG[0];
    const toProduct = findProduct(opts.to.componentId) ?? VICTRON_CATALOG[0];
    const fromConn = fromProduct?.connections.find(c => c.id === opts.from.connectionId);
    const toConn = toProduct?.connections.find(c => c.id === opts.to.connectionId);

    const wire: WireConnection = {
      id: nextId(),
      from: opts.from,
      to: opts.to,
      cableGauge: gauge,
      cableType: opts.cableType ?? 'tri-rated',
      cableColor: opts.color,
      length: cableLen,
      fuseRating: opts.fuseRating,
      fuseType: opts.fuseType,
      terminalLugFrom: fromConn ? { cableSize: gauge, studSize: studSizeForTerminal(fromConn.terminalType) } : undefined,
      terminalLugTo: toConn ? { cableSize: gauge, studSize: studSizeForTerminal(toConn.terminalType) } : undefined,
      torqueFrom: fromConn?.torqueNm,
      torqueTo: toConn?.torqueNm,
      label: opts.label,
    };
    connections.push(wire);
    return wire;
  }

  // ── DC Wiring ──

  const distTarget = useLynx ? 'lynx_power_in' : batteryId;
  const distBusPos = useLynx ? 'BUS_POS' : 'BAT_POS';
  const distBusNeg = useLynx ? 'BUS_NEG' : 'BAT_NEG';

  // Battery → SmartShunt (negative side)
  const mainBatteryCurrent = config.inverterVA > 0 ? maxCurrentForInverter(config.inverterVA) : 30;
  const mainGauge = selectCableGauge(mainBatteryCurrent, config.cableRunLength);

  addWire({
    from: { componentId: batteryId, connectionId: 'BAT_NEG' },
    to: { componentId: 'smartshunt_500', connectionId: 'BAT_NEG' },
    currentAmps: mainBatteryCurrent,
    color: 'black',
    label: 'Battery (-) to SmartShunt',
    overrideGauge: mainGauge,
  });

  // SmartShunt → Distribution negative
  addWire({
    from: { componentId: 'smartshunt_500', connectionId: 'SYS_NEG' },
    to: { componentId: distTarget, connectionId: distBusNeg },
    currentAmps: mainBatteryCurrent,
    color: 'black',
    label: 'SmartShunt to System Negative',
    overrideGauge: mainGauge,
  });

  // Battery positive → Distribution (with main fuse)
  const mainFuse = fuseForCurrent(mainBatteryCurrent);
  addWire({
    from: { componentId: batteryId, connectionId: 'BAT_POS' },
    to: { componentId: distTarget, connectionId: distBusPos },
    currentAmps: mainBatteryCurrent,
    color: 'red',
    label: 'Battery (+) to Distribution',
    overrideGauge: mainGauge,
    fuseRating: mainFuse.rating,
    fuseType: mainFuse.type,
  });

  // SmartShunt AUX → Battery positive
  addWire({
    from: { componentId: 'smartshunt_500', connectionId: 'AUX' },
    to: { componentId: batteryId, connectionId: 'BAT_POS' },
    currentAmps: 1,
    color: 'red',
    label: 'SmartShunt AUX (VBAT+)',
    overrideGauge: 1.5,
    fuseRating: 1,
    fuseType: 'glass',
  });

  // Lynx Power In → Lynx Distributor (if using Lynx)
  if (useLynx) {
    addWire({
      from: { componentId: 'lynx_power_in', connectionId: 'BUS_POS' },
      to: { componentId: 'lynx_dist', connectionId: 'BUS_POS' },
      currentAmps: mainBatteryCurrent,
      color: 'red',
      label: 'Lynx Power In → Lynx Distributor (+)',
      overrideGauge: mainGauge,
    });
    addWire({
      from: { componentId: 'lynx_power_in', connectionId: 'BUS_NEG' },
      to: { componentId: 'lynx_dist', connectionId: 'BUS_NEG' },
      currentAmps: mainBatteryCurrent,
      color: 'black',
      label: 'Lynx Power In → Lynx Distributor (-)',
      overrideGauge: mainGauge,
    });
  }

  const lynxDistId = useLynx ? 'lynx_dist' : distTarget;

  // ── Inverter DC connections ──
  if (inverter) {
    const invCurrent = maxCurrentForInverter(config.inverterVA);
    const invGauge = selectCableGauge(invCurrent, config.cableRunLength);
    const invFuse = useLynx ? undefined : fuseForCurrent(invCurrent);

    addWire({
      from: { componentId: lynxDistId, connectionId: useLynx ? 'FUSE_1' : distBusPos },
      to: { componentId: inverterId!, connectionId: 'DC_POS' },
      currentAmps: invCurrent,
      color: 'red',
      label: `Inverter DC (+) — ${invGauge}mm²`,
      overrideGauge: invGauge,
      fuseRating: invFuse?.rating,
      fuseType: invFuse?.type,
    });
    addWire({
      from: { componentId: lynxDistId, connectionId: useLynx ? 'BUS_NEG' : distBusNeg },
      to: { componentId: inverterId!, connectionId: 'DC_NEG' },
      currentAmps: invCurrent,
      color: 'black',
      label: `Inverter DC (-)`,
      overrideGauge: invGauge,
    });

    inverter.setupActions.forEach((action, i) => {
      actions.push({ id: `act_inv_${i}`, componentId: inverterId!, text: action, priority: 'critical' });
    });
  }

  // ── MPPT connections ──
  if (mppt && mpptId) {
    const mpptAmps = Number(mppt.specs.maxChargeAmps);
    const mpptGauge = selectCableGauge(mpptAmps, config.cableRunLength);
    const mpptFuse = useLynx ? undefined : fuseForCurrent(mpptAmps);

    addWire({
      from: { componentId: lynxDistId, connectionId: useLynx ? 'FUSE_2' : distBusPos },
      to: { componentId: mpptId, connectionId: 'BAT_POS' },
      currentAmps: mpptAmps,
      color: 'red',
      label: 'MPPT → Battery (+)',
      overrideGauge: mpptGauge,
      fuseRating: mpptFuse?.rating,
      fuseType: mpptFuse?.type,
    });
    addWire({
      from: { componentId: lynxDistId, connectionId: useLynx ? 'BUS_NEG' : distBusNeg },
      to: { componentId: mpptId, connectionId: 'BAT_NEG' },
      currentAmps: mpptAmps,
      color: 'black',
      label: 'MPPT → Battery (-)',
      overrideGauge: mpptGauge,
    });

    // Solar PV → MPPT
    const pvAmps = Math.ceil(config.solarWatts / 18); // Vmp ≈ 18V typical
    addWire({
      from: { componentId: 'solar_panels', connectionId: 'PV_POS' },
      to: { componentId: mpptId, connectionId: 'PV_POS' },
      currentAmps: pvAmps,
      color: 'red',
      label: 'Solar PV (+)',
      cableType: 'solar',
      overrideGauge: 6,
    });
    addWire({
      from: { componentId: 'solar_panels', connectionId: 'PV_NEG' },
      to: { componentId: mpptId, connectionId: 'PV_NEG' },
      currentAmps: pvAmps,
      color: 'black',
      label: 'Solar PV (-)',
      cableType: 'solar',
      overrideGauge: 6,
    });

    if (mppt.connections.find(c => c.id === 'CHASSIS_GND')) {
      addWire({
        from: { componentId: mpptId, connectionId: 'CHASSIS_GND' },
        to: { componentId: 'chassis', connectionId: 'GND' },
        currentAmps: 5,
        color: 'green_yellow',
        label: 'MPPT Casing Ground',
        overrideGauge: 10,
      });
    }

    mppt.setupActions.forEach((action, i) => {
      actions.push({ id: `act_mppt_${i}`, componentId: mpptId!, text: action, priority: 'critical' });
    });
  }

  // ── DC-DC Charger connections ──
  if (dcdc && dcdcId) {
    const dcdcAmps = config.dcDcAmps;
    const dcdcGauge = selectCableGauge(dcdcAmps, config.cableRunLength);
    const dcdcFuse = fuseForCurrent(dcdcAmps);

    // Starter battery → DC-DC input
    addWire({
      from: { componentId: 'starter_battery', connectionId: 'POS' },
      to: { componentId: dcdcId, connectionId: 'IN_POS' },
      currentAmps: dcdcAmps,
      color: 'red',
      label: 'Starter Battery → DC-DC (+)',
      overrideGauge: dcdcGauge,
      fuseRating: dcdcFuse.rating,
      fuseType: dcdcFuse.type,
    });
    addWire({
      from: { componentId: 'starter_battery', connectionId: 'NEG' },
      to: { componentId: dcdcId, connectionId: 'IN_NEG' },
      currentAmps: dcdcAmps,
      color: 'black',
      label: 'Starter Battery → DC-DC (-)',
      overrideGauge: dcdcGauge,
    });

    // DC-DC output → Distribution
    const dcdcOutFuse = useLynx ? undefined : fuseForCurrent(dcdcAmps);
    addWire({
      from: { componentId: dcdcId, connectionId: 'OUT_POS' },
      to: { componentId: lynxDistId, connectionId: useLynx ? 'FUSE_3' : distBusPos },
      currentAmps: dcdcAmps,
      color: 'red',
      label: 'DC-DC → Battery (+)',
      overrideGauge: dcdcGauge,
      fuseRating: dcdcOutFuse?.rating,
      fuseType: dcdcOutFuse?.type,
    });
    addWire({
      from: { componentId: dcdcId, connectionId: 'OUT_NEG' },
      to: { componentId: lynxDistId, connectionId: useLynx ? 'BUS_NEG' : distBusNeg },
      currentAmps: dcdcAmps,
      color: 'black',
      label: 'DC-DC → Battery (-)',
      overrideGauge: dcdcGauge,
    });

    dcdc.setupActions.forEach((action, i) => {
      actions.push({ id: `act_dcdc_${i}`, componentId: dcdcId!, text: action, priority: 'critical' });
    });
  }

  // ── Battery Protect → DC Load Fuse Block ──
  addWire({
    from: { componentId: lynxDistId, connectionId: useLynx ? 'FUSE_4' : distBusPos },
    to: { componentId: bp.id, connectionId: 'IN' },
    currentAmps: loadAmps || 30,
    color: 'red',
    label: 'Distribution → Battery Protect',
    fuseRating: useLynx ? undefined : fuseForCurrent(loadAmps || 30).rating,
    fuseType: useLynx ? undefined : fuseForCurrent(loadAmps || 30).type,
  });
  addWire({
    from: { componentId: bp.id, connectionId: 'OUT' },
    to: { componentId: 'fuse_block', connectionId: 'POS_IN' },
    currentAmps: loadAmps || 30,
    color: 'red',
    label: 'Battery Protect → Fuse Block',
  });
  addWire({
    from: { componentId: lynxDistId, connectionId: useLynx ? 'BUS_NEG' : distBusNeg },
    to: { componentId: 'fuse_block', connectionId: 'NEG_BUS' },
    currentAmps: loadAmps || 30,
    color: 'black',
    label: 'Negative Bus → Fuse Block',
    overrideGauge: 16,
  });

  bp.setupActions.forEach((action, i) => {
    actions.push({ id: `act_bp_${i}`, componentId: bp.id, text: action, priority: 'important' });
  });

  // ── AC Wiring (if shore power / inverter-charger) ──
  if (config.hasShore && inverter?.category === 'inverterCharger') {
    // Shore → Transfer Switch → AC-In CU → MultiPlus AC-In
    addWire({
      from: { componentId: 'shore_inlet', connectionId: 'AC_OUT' },
      to: { componentId: 'transfer_switch', connectionId: 'INPUT_1' },
      currentAmps: 16,
      color: 'brown',
      label: 'Shore Power → Transfer Switch',
      cableType: 'H07RN-F',
      overrideGauge: 2.5,
    });
    addWire({
      from: { componentId: 'transfer_switch', connectionId: 'OUTPUT' },
      to: { componentId: 'cu_ac_in', connectionId: 'MAIN_IN' },
      currentAmps: 16,
      color: 'brown',
      label: 'Transfer Switch → AC-In Consumer Unit',
      cableType: 'H07RN-F',
      overrideGauge: 2.5,
    });
    addWire({
      from: { componentId: 'cu_ac_in', connectionId: 'MCB_OUT' },
      to: { componentId: inverterId!, connectionId: 'AC_IN_L' },
      currentAmps: 16,
      color: 'brown',
      label: 'AC-In CU → MultiPlus AC-In',
      cableType: 'H07RN-F',
      overrideGauge: 2.5,
    });

    // MultiPlus AC-Out → AC-Out Consumer Unit → AC Loads
    addWire({
      from: { componentId: inverterId!, connectionId: 'AC_OUT_L' },
      to: { componentId: 'cu_ac_out', connectionId: 'MAIN_IN' },
      currentAmps: 16,
      color: 'brown',
      label: 'MultiPlus AC-Out → AC-Out Consumer Unit',
      cableType: 'H07RN-F',
      overrideGauge: 2.5,
    });

    // Inverter AC-Out also goes into transfer switch
    addWire({
      from: { componentId: inverterId!, connectionId: 'AC_OUT_L' },
      to: { componentId: 'transfer_switch', connectionId: 'INPUT_2' },
      currentAmps: 16,
      color: 'brown',
      label: 'MultiPlus AC-Out → Transfer Switch',
      cableType: 'H07RN-F',
      overrideGauge: 1.5,
    });
  }

  // Inverter chassis ground
  if (inverter && inverter.connections.find(c => c.id === 'CHASSIS_GND')) {
    addWire({
      from: { componentId: inverterId!, connectionId: 'CHASSIS_GND' },
      to: { componentId: 'chassis', connectionId: 'GND' },
      currentAmps: 5,
      color: 'green_yellow',
      label: 'Inverter Casing Ground to Negative Busbar',
      cableType: 'bonding',
      overrideGauge: useLynx ? 35 : 16,
    });
  }

  // ── Earthing Specification ──
  const earthingSpec: EarthingSpec = {
    chassisGroundCable: 35,
    bondingCable: 4,
    connections: [
      { from: 'Negative Busbar', to: 'Vehicle Chassis', cableSize: 35, label: 'Main chassis earth bond' },
      { from: 'Vehicle Chassis', to: 'AC Consumer Unit Earth Bar', cableSize: 4, label: 'Chassis to CU earth bond' },
    ],
    hasLPG: false,
  };

  if (inverter?.category === 'inverterCharger') {
    earthingSpec.connections.push(
      { from: 'MultiPlus Casing Ground', to: 'Negative Busbar', cableSize: useLynx ? 35 : 16, label: 'Inverter casing earth' },
    );
  }

  // ── Collect applicable regulations ──
  const componentTypes = new Set<string>();
  componentTypes.add('system');
  componentTypes.add('battery');
  componentTypes.add('cable');
  if (inverter) componentTypes.add('inverterCharger');
  if (mppt) componentTypes.add('solar');
  if (config.hasShore) { componentTypes.add('ac'); componentTypes.add('ac_cable'); componentTypes.add('consumerUnit'); componentTypes.add('enclosure'); }
  componentTypes.add('fuseHolder');
  componentTypes.add('fuse');
  componentTypes.add('dcLoads');
  componentTypes.add('earthing');
  componentTypes.add('isolator');
  if (mppt) componentTypes.add('pv_disconnect');

  const regulations: RegulationNote[] = REGULATIONS.filter(
    r => r.appliesTo.some(t => componentTypes.has(t)),
  );

  // ── Build setup actions for all components ──
  const shunt = findProduct('smartshunt_500')!;
  shunt.setupActions.forEach((action, i) => {
    actions.push({ id: `act_shunt_${i}`, componentId: 'smartshunt_500', text: action, priority: 'important' });
  });

  // ── Build the full spec ──
  const spec: WiringSpec = {
    archetype,
    components,
    connections,
    regulations,
    actions,
    safetyWarnings: SAFETY_WARNINGS,
    earthingSpec,
    shoppingList: [],
    installationSteps: [],
  };

  spec.shoppingList = generateShoppingList(spec, config);
  spec.installationSteps = generateInstallationGuide(spec, config);

  return spec;
}
