/**
 * Full wiring schematic renderer for React Native.
 * Ported from wiring-prototype/src/components/SchematicRenderer.tsx
 * Uses actual Victron/Fogstar product images via react-native-svg.
 *
 * Canvas: 2400 × 1200 (1600 if hasShore).
 * Intended to be rendered inside a zoomable ScrollView.
 */
import React from 'react';
import Svg, { G, Rect, Line, Text as SvgText } from 'react-native-svg';
import type { WiringSpec, SystemConfig, WireConnection } from '@/utils/wiringTypes';
import {
  BatterySVG, SmartShuntSVG, IsolatorSVG, LynxDistributorSVG,
  InverterSVG, MPPTSVG, DCDCChargerSVG, BatteryProtectSVG,
  SolarPanelSVG, StarterBatterySVG, FuseBlockSVG, GroundSymbolSVG,
  ConsumerUnitSVG,
  BATTERY_CONN, SHUNT_CONN, ISOLATOR_CONN, LYNX_DIST_CONN,
  INVERTER_CONN, MPPT_CONN, DCDC_CONN, BP_CONN,
  SOLAR_CONN, STARTER_CONN, FUSEBLOCK_CONN, GROUND_CONN, CU_CONN,
} from './WiringComponents';
import { WireSVG, RegulationBox, ActionBox } from './WiringHelpers';

interface Pt { x: number; y: number }
function pt(base: Pt, offset: Pt): Pt { return { x: base.x + offset.x, y: base.y + offset.y }; }
function findW(cs: WireConnection[], ...kw: string[]) {
  return cs.find(w => kw.every(k => w.label.toLowerCase().includes(k.toLowerCase())));
}
function dLug(g?: number, o: 'left' | 'right' | 'up' | 'down' = 'right') {
  if (!g || g < 6) return undefined;
  const s: Record<number, number> = { 6: 5, 10: 6, 16: 6, 25: 8, 35: 8, 50: 8, 70: 8, 95: 10 };
  return { label: `${g}-${s[g] ?? 8}`, orientation: o };
}

const WC = { red: '#C0392B', blk: '#333', gn: '#27AE60', brn: '#8B4513', blu: '#3498DB' };

interface Props { spec: WiringSpec; config: SystemConfig; renderWidth?: number; renderHeight?: number }

export default function SchematicRenderer({ spec, config, renderWidth, renderHeight }: Props) {
  const hasInv = spec.components.some(c => c.product.category === 'inverterCharger' || c.product.category === 'inverter');
  const hasMP = spec.components.some(c => c.product.category === 'inverterCharger');
  const hasMPPT = config.solarWatts > 0;
  const hasDC = config.dcDcAmps > 0;
  const hasLynx = spec.components.some(c => c.product.id === 'lynx_dist');
  const hasShore = config.hasShore && hasMP;

  const bat = spec.components.find(c => c.product.category === 'battery')?.product;
  const invC = spec.components.find(c => c.product.category === 'inverterCharger' || c.product.category === 'inverter');
  const mpptC = spec.components.find(c => c.product.category === 'mppt');
  const dcdcC = spec.components.find(c => c.product.category === 'dcdc');
  const bpC = spec.components.find(c => c.product.category === 'protect');

  const W = 2400;
  const H = hasShore ? 1600 : 1200;

  const p = {
    starter:   { x: 340,  y: 100 },
    dcdc:      { x: 310,  y: 270 },
    solar:     { x: 1200, y: 80  },
    mppt:      { x: 1220, y: 230 },
    battery:   { x: 250,  y: 500 },
    shunt:     { x: 520,  y: 580 },
    isolator:  { x: 730,  y: 570 },
    lynxDist:  { x: 920,  y: 490 },
    inverter:  { x: 1440, y: 490 },
    bp:        { x: 1050, y: 800 },
    fuseBlock: { x: 1280, y: 770 },
    ground:    { x: 850,  y: 950 },
    cuIn:      { x: 1780, y: 490 },
    cuOut:     { x: 1780, y: 770 },
  };

  const UP = { aux: 400, dcPos: 420, batPos: 440, invPos: 450, mpptPos: 460, bpUp: 470 };
  const LO = { gndBond: 690, shuntNeg: 700, dcdcNeg: 710, fbNeg: 720, invNeg: 730, mpptNeg: 740, bpLo: 750, invGnd: 755 };
  const AY = { acIn: 685, acOut: 710 };

  const cn = spec.connections;
  const mW = findW(cn, 'battery', 'distribution') ?? findW(cn, 'battery', 'bus');
  const iW = findW(cn, 'inverter', 'dc');
  const mBW = findW(cn, 'mppt', 'battery');
  const mPW = findW(cn, 'solar', 'mppt') ?? findW(cn, 'pv');
  const dIW = findW(cn, 'starter', 'dc-dc');
  const dOW = findW(cn, 'dc-dc', 'battery') ?? findW(cn, 'dc-dc', 'distribution');
  const bW = findW(cn, 'protect') ?? findW(cn, 'battery protect');
  const gW = findW(cn, 'chassis') ?? findW(cn, 'ground');

  const mG = mW?.cableGauge ?? 70;
  const iG = iW?.cableGauge ?? 50;
  const mpG = mBW?.cableGauge ?? 10;
  const diG = dIW?.cableGauge ?? 10;
  const doG = dOW?.cableGauge ?? 10;
  const bG = bW?.cableGauge ?? 16;

  const fL = [
    hasInv ? (mG >= 50 ? '175A' : '100A') : '',
    hasMPPT ? `${Math.ceil((Number(mpptC?.product.specs.maxChargeAmps) || 30) * 1.25)}A` : '',
    hasDC ? `${Math.ceil(config.dcDcAmps * 1.25)}A` : '',
    `${Math.ceil(((bpC?.product.specs.maxCurrent as number) || 65) * 1.25)}A`,
  ];
  const fA = [hasInv ? 'Inverter' : '', hasMPPT ? 'MPPT' : '', hasDC ? 'DC-DC' : '', '12V Loads'];

  return (
    <Svg width={renderWidth ?? W} height={renderHeight ?? H} viewBox={`0 0 ${W} ${H}`}>

      {/* ── Background ── */}
      <Rect x={0} y={0} width={W} height={H} fill="#F8F9FA" />

      {/* ── Title Bar ── */}
      <Rect x={0} y={0} width={W} height={60} fill="#1A1A1A" />
      <SvgText x={24} y={24} fontSize={16} fill="#D9A05B" fontWeight="bold">CRAFTED CAMPER CO.</SvgText>
      <SvgText x={24} y={46} fontSize={11} fill="#fff">Wiring Schematic — {spec.archetype.replace(/_/g, ' ')}</SvgText>
      <SvgText x={W - 24} y={24} fontSize={10} fill="#888" textAnchor="end">
        {bat?.name} | {invC?.product.name ?? 'No Inverter'} | {config.solarWatts}W Solar | {config.dcDcAmps}A DC-DC
      </SvgText>
      <SvgText x={W - 24} y={46} fontSize={9} fill="#D9A05B" textAnchor="end">
        Recommended: {config.batteryAh}Ah | Cable: {config.cableRunLength === 'short' ? '0-2m' : config.cableRunLength === 'medium' ? '2-5m' : '5-10m'}
      </SvgText>
      <Line x1={0} y1={60} x2={W} y2={60} stroke="#D9A05B" strokeWidth={2} />

      {/* ── Components ── */}
      <BatterySVG x={p.battery.x} y={p.battery.y}
        label={bat?.name?.split(' ').slice(-2).join(' ') ?? 'Battery'}
        capacity={`${config.batteryAh}Ah`} />
      <SmartShuntSVG x={p.shunt.x} y={p.shunt.y} />
      <IsolatorSVG x={p.isolator.x} y={p.isolator.y} label="BAT ISO" />

      {hasLynx ? (
        <LynxDistributorSVG x={p.lynxDist.x} y={p.lynxDist.y} fuseLabels={fL} fuseAssignments={fA} />
      ) : (
        <G x={p.lynxDist.x} y={p.lynxDist.y}>
          <Rect x={0} y={0} width={300} height={50} rx={6} fill="#1A1A1A" stroke="#C0392B" strokeWidth={2} />
          <SvgText x={150} y={30} fontSize={10} fill="#fff" textAnchor="middle" fontWeight="bold">BUSBAR</SvgText>
        </G>
      )}

      {hasInv && invC && (
        <InverterSVG x={p.inverter.x} y={p.inverter.y}
          label={invC.product.name.split(' ').slice(0, 2).join(' ')}
          model={`${invC.product.name} ${config.inverterVA}VA`}
          isCharger={hasMP} />
      )}

      {hasMPPT && mpptC && (
        <>
          <MPPTSVG x={p.mppt.x} y={p.mppt.y}
            label={mpptC.product.name.split(' ').slice(1).join(' ')}
            model={`SmartSolar ${config.solarWatts}W`} />
          <SolarPanelSVG x={p.solar.x} y={p.solar.y}
            watts={config.solarWatts}
            panelCount={Math.ceil(config.solarWatts / 200)} />
        </>
      )}

      {hasDC && dcdcC && (
        <>
          <DCDCChargerSVG x={p.dcdc.x} y={p.dcdc.y}
            label={dcdcC.product.name.split(' ').slice(0, 3).join(' ')}
            model={`Orion ${config.dcDcAmps}A`} />
          <StarterBatterySVG x={p.starter.x} y={p.starter.y} />
        </>
      )}

      {bpC && <BatteryProtectSVG x={p.bp.x} y={p.bp.y} amps={bpC.product.specs.maxCurrent as number} />}
      <FuseBlockSVG x={p.fuseBlock.x} y={p.fuseBlock.y} />
      <GroundSymbolSVG x={p.ground.x} y={p.ground.y} label="VEHICLE CHASSIS" />

      {hasShore && (
        <>
          <ConsumerUnitSVG x={p.cuIn.x} y={p.cuIn.y} label="AC-In Consumer Unit" type="ac_in" />
          <ConsumerUnitSVG x={p.cuOut.x} y={p.cuOut.y} label="AC-Out Consumer Unit" type="ac_out" />
          <G x={p.cuIn.x + 80} y={p.cuIn.y - 30}>
            <Rect x={-55} y={-14} width={110} height={28} rx={4} fill="rgba(52,152,219,0.15)" stroke="#3498DB" strokeWidth={1} />
            <SvgText x={0} y={5} fontSize={10} fill="#3498DB" textAnchor="middle" fontWeight="bold">SHORE POWER</SvgText>
          </G>
        </>
      )}

      {/* ── Example Appliances ── */}
      <G x={p.fuseBlock.x - 40} y={p.fuseBlock.y + 195}>
        <Line x1={90} y1={-13} x2={90} y2={0} stroke="#D9A05B" strokeWidth={1.5} />
        {[
          { icon: '💡', label: 'LED Lights' },
          { icon: '🔌', label: 'USB' },
          { icon: '💧', label: 'Water Pump' },
          { icon: '❄️', label: '12V Fridge' },
        ].map((app, i) => (
          <G key={i} x={i * 80} y={0}>
            <Line x1={90 - i * 80} y1={0} x2={30} y2={0} stroke="#D9A05B" strokeWidth={1} strokeDasharray="4 2" />
            <Line x1={30} y1={0} x2={30} y2={16} stroke="#D9A05B" strokeWidth={1} />
            <Rect x={i > 0 ? 0 : -5} y={16} width={65} height={30} rx={4} fill="rgba(26,26,26,0.06)" stroke="#D9A05B" strokeWidth={1} />
            <SvgText x={28} y={30} fontSize={7} fill="#1A1A1A" textAnchor="middle">{app.icon}</SvgText>
            <SvgText x={28} y={42} fontSize={7} fill="#555" textAnchor="middle">{app.label}</SvgText>
          </G>
        ))}
      </G>

      {/* ── Wires ── */}

      {/* W1: Battery POS → Isolator IN */}
      <WireSVG wireId="w1" from={pt(p.battery, BATTERY_CONN.POS)} to={pt(p.isolator, ISOLATOR_CONN.IN)}
        color={WC.red} gauge={mG}
        waypoints={[
          { x: pt(p.battery, BATTERY_CONN.POS).x, y: UP.batPos },
          { x: pt(p.isolator, ISOLATOR_CONN.IN).x, y: UP.batPos },
        ]}
        lugFrom={dLug(mG, 'up')} lugTo={dLug(mG, 'left')}
        fuse={mW?.fuseRating ? { rating: `${mW.fuseRating}A`, type: mW.fuseType?.toUpperCase(), position: 0.4 } : undefined}
      />

      {/* W2: Isolator OUT → Lynx Dist BUS_POS_IN */}
      <WireSVG wireId="w2" from={pt(p.isolator, ISOLATOR_CONN.OUT)} to={pt(p.lynxDist, LYNX_DIST_CONN.BUS_POS_IN)}
        color={WC.red} gauge={mG}
        waypoints={[
          { x: 860, y: pt(p.isolator, ISOLATOR_CONN.OUT).y },
          { x: 860, y: pt(p.lynxDist, LYNX_DIST_CONN.BUS_POS_IN).y },
        ]}
        lugFrom={dLug(mG, 'right')} lugTo={dLug(mG, 'left')} />

      {/* W3: Battery NEG → SmartShunt BAT(-) */}
      <WireSVG wireId="w3" from={pt(p.battery, BATTERY_CONN.NEG)} to={pt(p.shunt, SHUNT_CONN.BAT_NEG)}
        color={WC.blk} gauge={mG}
        waypoints={[
          { x: 485, y: pt(p.battery, BATTERY_CONN.NEG).y },
          { x: 485, y: pt(p.shunt, SHUNT_CONN.BAT_NEG).y },
        ]}
        lugFrom={dLug(mG, 'up')} lugTo={dLug(mG, 'left')} />

      {/* W4: SmartShunt SYS(-) → Lynx Dist BUS_NEG_IN */}
      <WireSVG wireId="w4" from={pt(p.shunt, SHUNT_CONN.SYS_NEG)} to={pt(p.lynxDist, LYNX_DIST_CONN.BUS_NEG_IN)}
        color={WC.blk} gauge={mG}
        waypoints={[
          { x: 680, y: pt(p.shunt, SHUNT_CONN.SYS_NEG).y },
          { x: 680, y: LO.shuntNeg },
          { x: 900, y: LO.shuntNeg },
          { x: 900, y: pt(p.lynxDist, LYNX_DIST_CONN.BUS_NEG_IN).y },
        ]}
        lugFrom={dLug(mG, 'right')} lugTo={dLug(mG, 'left')} />

      {/* W5: SmartShunt AUX → Battery POS (V-Sense) */}
      <WireSVG wireId="w5" from={pt(p.shunt, SHUNT_CONN.AUX)} to={pt(p.battery, BATTERY_CONN.POS)}
        color={WC.red} gauge={1.5} gaugeLabel="1.5mm²"
        waypoints={[
          { x: pt(p.shunt, SHUNT_CONN.AUX).x, y: UP.aux },
          { x: pt(p.battery, BATTERY_CONN.POS).x, y: UP.aux },
        ]}
        label="AUX (V-Sense)" />

      {/* W6+W7: Lynx FUSE1 → Inverter DC */}
      {hasInv && hasLynx && (
        <>
          <WireSVG wireId="w6" from={pt(p.lynxDist, LYNX_DIST_CONN.FUSE_1_POS)} to={pt(p.inverter, INVERTER_CONN.DC_POS)}
            color={WC.red} gauge={iG}
            waypoints={[
              { x: pt(p.lynxDist, LYNX_DIST_CONN.FUSE_1_POS).x, y: UP.invPos },
              { x: 1360, y: UP.invPos },
              { x: 1360, y: pt(p.inverter, INVERTER_CONN.DC_POS).y },
            ]}
            lugFrom={dLug(iG, 'up')} lugTo={dLug(iG, 'left')} />
          <WireSVG wireId="w7" from={pt(p.lynxDist, LYNX_DIST_CONN.FUSE_1_NEG)} to={pt(p.inverter, INVERTER_CONN.DC_NEG)}
            color={WC.blk} gauge={iG}
            waypoints={[
              { x: pt(p.lynxDist, LYNX_DIST_CONN.FUSE_1_NEG).x, y: LO.invNeg },
              { x: 1370, y: LO.invNeg },
              { x: 1370, y: pt(p.inverter, INVERTER_CONN.DC_NEG).y },
            ]}
            lugFrom={dLug(iG, 'down')} lugTo={dLug(iG, 'left')} />
        </>
      )}

      {/* W8+W9: Lynx FUSE2 → MPPT Battery */}
      {hasMPPT && hasLynx && (
        <>
          <WireSVG wireId="w8" from={pt(p.lynxDist, LYNX_DIST_CONN.FUSE_2_POS)} to={pt(p.mppt, MPPT_CONN.BAT_POS)}
            color={WC.red} gauge={mpG}
            waypoints={[
              { x: pt(p.lynxDist, LYNX_DIST_CONN.FUSE_2_POS).x, y: UP.mpptPos },
              { x: pt(p.mppt, MPPT_CONN.BAT_POS).x, y: UP.mpptPos },
            ]}
            lugFrom={dLug(mpG, 'up')} lugTo={dLug(mpG, 'down')} />
          <WireSVG wireId="w9" from={pt(p.lynxDist, LYNX_DIST_CONN.FUSE_2_NEG)} to={pt(p.mppt, MPPT_CONN.BAT_NEG)}
            color={WC.blk} gauge={mpG}
            waypoints={[
              { x: pt(p.lynxDist, LYNX_DIST_CONN.FUSE_2_NEG).x, y: LO.mpptNeg },
              { x: 1350, y: LO.mpptNeg },
              { x: 1350, y: pt(p.mppt, MPPT_CONN.BAT_NEG).y },
            ]}
            lugFrom={dLug(mpG, 'down')} lugTo={dLug(mpG, 'right')} />
        </>
      )}

      {/* W10+W11: Solar → MPPT PV */}
      {hasMPPT && (
        <>
          <WireSVG wireId="w10" from={pt(p.solar, SOLAR_CONN.PV_POS)} to={pt(p.mppt, MPPT_CONN.PV_POS)}
            color={WC.red} gauge={mPW?.cableGauge ?? 6} gaugeLabel={`${mPW?.cableGauge ?? 6}mm² Solar`} />
          <WireSVG wireId="w11" from={pt(p.solar, SOLAR_CONN.PV_NEG)} to={pt(p.mppt, MPPT_CONN.PV_NEG)}
            color={WC.blk} gauge={mPW?.cableGauge ?? 6} />
        </>
      )}

      {/* W12+W13: Starter → DC-DC IN */}
      {hasDC && (
        <>
          <WireSVG wireId="w12" from={pt(p.starter, STARTER_CONN.POS)} to={pt(p.dcdc, DCDC_CONN.IN_POS)}
            color={WC.red} gauge={diG}
            waypoints={[
              { x: pt(p.starter, STARTER_CONN.POS).x, y: 82 },
              { x: 275, y: 82 },
              { x: 275, y: pt(p.dcdc, DCDC_CONN.IN_POS).y },
            ]}
            fuse={dIW?.fuseRating ? { rating: `${dIW.fuseRating}A`, type: dIW.fuseType?.toUpperCase(), position: 0.4 } : undefined}
            lugFrom={dLug(diG, 'up')} lugTo={dLug(diG, 'left')} />
          <WireSVG wireId="w13" from={pt(p.starter, STARTER_CONN.NEG)} to={pt(p.dcdc, DCDC_CONN.IN_NEG)}
            color={WC.blk} gauge={diG}
            waypoints={[
              { x: pt(p.starter, STARTER_CONN.NEG).x, y: 82 },
              { x: 255, y: 82 },
              { x: 255, y: pt(p.dcdc, DCDC_CONN.IN_NEG).y },
            ]}
            lugFrom={dLug(diG, 'up')} lugTo={dLug(diG, 'left')} />
        </>
      )}

      {/* W14+W15: DC-DC OUT → Lynx FUSE3 */}
      {hasDC && hasLynx && (
        <>
          <WireSVG wireId="w14" from={pt(p.dcdc, DCDC_CONN.OUT_POS)} to={pt(p.lynxDist, LYNX_DIST_CONN.FUSE_3_POS)}
            color={WC.red} gauge={doG}
            waypoints={[
              { x: 495, y: pt(p.dcdc, DCDC_CONN.OUT_POS).y },
              { x: 495, y: UP.dcPos },
              { x: pt(p.lynxDist, LYNX_DIST_CONN.FUSE_3_POS).x, y: UP.dcPos },
            ]}
            lugFrom={dLug(doG, 'right')} lugTo={dLug(doG, 'up')} />
          <WireSVG wireId="w15" from={pt(p.dcdc, DCDC_CONN.OUT_NEG)} to={pt(p.lynxDist, LYNX_DIST_CONN.FUSE_3_NEG)}
            color={WC.blk} gauge={doG}
            waypoints={[
              { x: 530, y: pt(p.dcdc, DCDC_CONN.OUT_NEG).y },
              { x: 530, y: LO.dcdcNeg },
              { x: pt(p.lynxDist, LYNX_DIST_CONN.FUSE_3_NEG).x, y: LO.dcdcNeg },
            ]}
            lugFrom={dLug(doG, 'right')} lugTo={dLug(doG, 'down')} />
        </>
      )}

      {/* W16+W17: Lynx FUSE4 → BP IN + FuseBlock NEG */}
      {bpC && hasLynx && (
        <>
          <WireSVG wireId="w16" from={pt(p.lynxDist, LYNX_DIST_CONN.FUSE_4_POS)} to={pt(p.bp, BP_CONN.IN)}
            color={WC.red} gauge={bG}
            waypoints={[
              { x: pt(p.lynxDist, LYNX_DIST_CONN.FUSE_4_POS).x, y: UP.bpUp },
              { x: 1300, y: UP.bpUp },
              { x: 1300, y: LO.bpLo },
              { x: 1020, y: LO.bpLo },
              { x: 1020, y: pt(p.bp, BP_CONN.IN).y },
            ]}
            lugFrom={dLug(bG, 'up')} lugTo={dLug(bG, 'left')} />
          <WireSVG wireId="w17" from={pt(p.lynxDist, LYNX_DIST_CONN.FUSE_4_NEG)} to={pt(p.fuseBlock, FUSEBLOCK_CONN.NEG_BUS)}
            color={WC.blk} gauge={bG}
            waypoints={[
              { x: pt(p.lynxDist, LYNX_DIST_CONN.FUSE_4_NEG).x, y: LO.fbNeg },
              { x: pt(p.fuseBlock, FUSEBLOCK_CONN.NEG_BUS).x, y: LO.fbNeg },
            ]}
            lugFrom={dLug(bG, 'down')} lugTo={dLug(bG, 'up')} />
        </>
      )}

      {/* W18: BP OUT → FuseBlock POS IN */}
      {bpC && (
        <WireSVG wireId="w18" from={pt(p.bp, BP_CONN.OUT)} to={pt(p.fuseBlock, FUSEBLOCK_CONN.POS_IN)}
          color={WC.red} gauge={bG}
          waypoints={[
            { x: 1215, y: pt(p.bp, BP_CONN.OUT).y },
            { x: 1215, y: pt(p.fuseBlock, FUSEBLOCK_CONN.POS_IN).y },
          ]}
          lugFrom={dLug(bG, 'right')} lugTo={dLug(bG, 'up')} />
      )}

      {/* W19: Ground → Lynx chassis bond */}
      <WireSVG wireId="w19" from={pt(p.ground, GROUND_CONN.GND)} to={{ x: p.lynxDist.x + 180, y: p.lynxDist.y + 180 }}
        color={WC.gn} gauge={gW?.cableGauge ?? 35} gaugeLabel={`≥${gW?.cableGauge ?? 35}mm²`}
        dashed label="Chassis Bond"
        waypoints={[
          { x: pt(p.ground, GROUND_CONN.GND).x, y: LO.gndBond },
          { x: p.lynxDist.x + 180, y: LO.gndBond },
        ]}
        lugFrom={dLug(35, 'up')} />

      {/* W20: Inverter chassis GND → Ground */}
      {hasInv && (
        <WireSVG wireId="w20" from={pt(p.inverter, INVERTER_CONN.CHASSIS_GND)} to={pt(p.ground, GROUND_CONN.GND)}
          color={WC.gn} gauge={16} gaugeLabel="≥16mm²" dashed
          waypoints={[
            { x: pt(p.inverter, INVERTER_CONN.CHASSIS_GND).x, y: LO.invGnd },
            { x: pt(p.ground, GROUND_CONN.GND).x, y: LO.invGnd },
          ]}
          lugFrom={dLug(16, 'down')} lugTo={dLug(16, 'up')} />
      )}

      {/* ── AC Wires (shore power) ── */}
      {hasShore && (
        <>
          <WireSVG wireId="w21" from={pt(p.cuIn, CU_CONN.MCB_OUT)} to={pt(p.inverter, INVERTER_CONN.AC_IN)}
            color={WC.blu} gaugeLabel="3-core 2.5mm²" label="L · N · E (H07RN-F)"
            waypoints={[
              { x: pt(p.cuIn, CU_CONN.MCB_OUT).x, y: AY.acIn },
              { x: pt(p.inverter, INVERTER_CONN.AC_IN).x, y: AY.acIn },
            ]} />
          <WireSVG wireId="w22" from={pt(p.inverter, INVERTER_CONN.AC_OUT)} to={pt(p.cuOut, CU_CONN.MAIN_IN)}
            color={WC.brn} gaugeLabel="3-core 2.5mm²" label="L · N · E (H07RN-F)"
            waypoints={[
              { x: pt(p.inverter, INVERTER_CONN.AC_OUT).x, y: AY.acOut },
              { x: pt(p.cuOut, CU_CONN.MAIN_IN).x, y: AY.acOut },
            ]} />
          <WireSVG wireId="w23" from={pt(p.cuIn, CU_CONN.EARTH)} to={pt(p.ground, GROUND_CONN.GND)}
            color={WC.gn} gaugeLabel="6mm²" dashed
            waypoints={[
              { x: 1960, y: pt(p.cuIn, CU_CONN.EARTH).y },
              { x: 1960, y: 1020 },
              { x: pt(p.ground, GROUND_CONN.GND).x, y: 1020 },
            ]} />
          <WireSVG wireId="w24" from={pt(p.cuOut, CU_CONN.EARTH)} to={pt(p.ground, GROUND_CONN.GND)}
            color={WC.gn} gaugeLabel="6mm²" dashed
            waypoints={[
              { x: 1975, y: pt(p.cuOut, CU_CONN.EARTH).y },
              { x: 1975, y: 1035 },
              { x: pt(p.ground, GROUND_CONN.GND).x, y: 1035 },
            ]} />
        </>
      )}

      {/* ── Regulation Boxes (left edge) ── */}
      {spec.regulations.slice(0, 4).map((r, i) => (
        <RegulationBox key={r.id} x={12} y={80 + i * 120} width={210} standard={r.standard} clause={r.clause} text={r.text} />
      ))}

      {/* ── Action Boxes (right edge) ── */}
      {spec.actions
        .filter(a => a.priority === 'critical' || a.priority === 'important')
        .slice(0, 4)
        .map((a, i) => (
          <ActionBox key={a.id} x={W - 220} y={80 + i * 110} width={208} text={a.text} priority={a.priority} />
        ))}

      {/* ── Bottom Info Strips ── */}
      <G x={24} y={H - 200}>
        <Rect x={0} y={0} width={480} height={80} rx={6} fill="rgba(26,26,26,0.05)" stroke="#1A1A1A" strokeWidth={1.5} />
        <SvgText x={14} y={20} fontSize={10} fill="#1A1A1A" fontWeight="bold">COMPULSORY READING:</SvgText>
        <SvgText x={14} y={38} fontSize={9} fill="#555">All cable &amp; fuse sizes based on manufacturer-stated recommendations.</SvgText>
        <SvgText x={14} y={54} fontSize={9} fill="#555">Must be installed by a skilled/competent/qualified fitter.</SvgText>
        <SvgText x={14} y={70} fontSize={9} fill="#555">EIC required before first use.</SvgText>
      </G>

      <G x={530} y={H - 200}>
        <Rect x={0} y={0} width={420} height={80} rx={6} fill="rgba(217,160,91,0.05)" stroke="#D9A05B" strokeWidth={1.5} />
        <SvgText x={14} y={20} fontSize={10} fill="#D9A05B" fontWeight="bold">RECOMMENDED DC CABLE SIZING</SvgText>
        <SvgText x={14} y={38} fontSize={9} fill="#555">Cable length = MAX distance between battery ± and device.</SvgText>
        <SvgText x={14} y={54} fontSize={9} fill="#555">
          Cable runs: {config.cableRunLength} ({config.cableRunLength === 'short' ? '0-2m' : config.cableRunLength === 'medium' ? '2-5m' : '5-10m'})
        </SvgText>
        <SvgText x={14} y={70} fontSize={9} fill="#555">DC: Tri-Rated (BS 6231). AC: H07RN-F (BS EN 50525).</SvgText>
      </G>

      <G x={976} y={H - 200}>
        <Rect x={0} y={0} width={380} height={80} rx={6} fill="rgba(39,174,96,0.05)" stroke="#27AE60" strokeWidth={1.5} />
        <SvgText x={14} y={20} fontSize={10} fill="#27AE60" fontWeight="bold">EARTHING &amp; BONDING</SvgText>
        <SvgText x={14} y={38} fontSize={9} fill="#555">
          Chassis bond: ≥{spec.earthingSpec?.chassisGroundCable ?? 35}mm² from neg busbar to chassis.
        </SvgText>
        <SvgText x={14} y={54} fontSize={9} fill="#555">All exposed metal parts bonded to chassis.</SvgText>
        <SvgText x={14} y={70} fontSize={9} fill="#555">Ref: BS 7671:2018+A2:2022 Section 411.</SvgText>
      </G>

      {/* ── Safety Banner ── */}
      <Rect x={0} y={H - 50} width={W} height={50} fill="#C0392B" />
      <SvgText x={W / 2} y={H - 30} fontSize={14} fill="#fff" textAnchor="middle" fontWeight="bold">
        ⚠ 230V IS EXTREMELY HAZARDOUS — DO NOT TOUCH LIVE PARTS — MUST BE INSTALLED BY A QUALIFIED FITTER ⚠
      </SvgText>
      <SvgText x={W / 2} y={H - 12} fontSize={9} fill="rgba(255,255,255,0.85)" textAnchor="middle">
        All cable &amp; fuse sizes per Victron recommendations. EIC must be issued prior to first use.
      </SvgText>
    </Svg>
  );
}
