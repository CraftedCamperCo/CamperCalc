import type { WiringSpec, SystemConfig, WireConnection } from '../types';
import { BatterySVG, BATTERY_CONN } from './svg/Battery';
import { InverterSVG, INVERTER_CONN } from './svg/Inverter';
import { MPPTSVG, MPPT_CONN } from './svg/MPPT';
import { DCDCChargerSVG, DCDC_CONN } from './svg/DCDCCharger';
import { LynxDistributorSVG, LYNX_DIST_CONN } from './svg/LynxDistributor';
import { FuseBlockSVG, FUSEBLOCK_CONN } from './svg/FuseBlock';
import { SolarPanelSVG, SOLAR_CONN } from './svg/SolarPanel';
import { ConsumerUnitSVG, CU_CONN } from './svg/ConsumerUnit';
import { SmartShuntSVG, SHUNT_CONN } from './svg/SmartShunt';
import { BatteryProtectSVG, BP_CONN } from './svg/BatteryProtect';
import { StarterBatterySVG, STARTER_CONN } from './svg/StarterBattery';
import { IsolatorSVG, ISOLATOR_CONN } from './svg/Isolator';
import { WireSVG } from './svg/Wire';
import { GroundSymbolSVG, GROUND_CONN } from './svg/GroundSymbol';
import { RegulationBoxSVG } from './svg/RegulationBox';
import { ActionBoxSVG } from './svg/ActionBox';

interface Props { spec: WiringSpec; config: SystemConfig }
interface Pt { x: number; y: number }
function pt(b: Pt, o: Pt): Pt { return { x: b.x + o.x, y: b.y + o.y }; }
function findW(cs: WireConnection[], ...kw: string[]) {
  return cs.find(w => kw.every(k => w.label.toLowerCase().includes(k.toLowerCase())));
}
function dLug(g?: number, o: 'left'|'right'|'up'|'down' = 'right') {
  if (!g || g < 6) return undefined;
  const s: Record<number,number> = {6:5,10:6,16:6,25:8,35:8,50:8,70:8,95:10};
  return { label: `${g}-${s[g]??8}`, orientation: o };
}
const WC = { red: '#C0392B', blk: '#333', gn: '#27AE60', brn: '#8B4513', blu: '#3498DB' };

export function SchematicRenderer({ spec, config }: Props) {
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

  const W = 2400, H = hasShore ? 1600 : 1200;

  /* ══════════════════════════════════════════════════════════════════
     LAYOUT v4 — Lynx Power In removed; Lynx Dist shifted left.
     100 px corridor gaps. Every wire path verified.

     ── TOP ZONE ──────────────────────────────────────────────────
     starter     x:[340,480]   y:[100,180]
     dcdc        x:[310,470]   y:[270,370]
     solar       x:[1200,1380] y:[80,180]
     mppt        x:[1220,1360] y:[230,390]

     ── UPPER CORRIDOR  y: 390 → 490  (100 px) ───────────────────

     ── MAIN ZONE ─────────────────────────────────────────────────
     battery     x:[250,450]   y:[500,630]  (terminals y=500)
     shunt       x:[520,660]   y:[580,640]
     isolator    x:[730,800]   y:[570,640]
     lynxDist    x:[920,1280]  y:[490,670]
     inverter    x:[1440,1640] y:[490,670]
     cuIn        x:[1780,1940] y:[490,590]

     ── LOWER CORRIDOR  y: 670 → 770  (100 px) ───────────────────

     ── BOTTOM ZONE ───────────────────────────────────────────────
     bp          x:[1050,1150] y:[800,860]
     fuseBlock   x:[1280,1380] y:[770,950]
     cuOut       x:[1780,1940] y:[770,870]
     ground      x:[850,910]   y:[950,1000]
  ════════════════════════════════════════════════════════════════ */

  const p = {
    starter:   { x: 340,  y: 100 },
    dcdc:      { x: 310,  y: 270 },
    solar:     { x: 1200, y: 80 },
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

  /* Corridor sub-lanes — 20 px spacing between parallel wires */
  const UP = { aux: 400, dcPos: 420, batPos: 440, invPos: 450, mpptPos: 460, bpUp: 470 };
  const LO = { gndBond: 690, shuntNeg: 700, dcdcNeg: 710, fbNeg: 720, invNeg: 730, mpptNeg: 740, bpLo: 750, invGnd: 755 };
  const AY = { acIn: 685, acOut: 710 };

  const cn = spec.connections;
  const mW = findW(cn,'battery','distribution') ?? findW(cn,'battery','bus');
  const iW = findW(cn,'inverter','dc');
  const mBW = findW(cn,'mppt','battery');
  const mPW = findW(cn,'solar','mppt') ?? findW(cn,'pv');
  const dIW = findW(cn,'starter','dc-dc');
  const dOW = findW(cn,'dc-dc','battery') ?? findW(cn,'dc-dc','distribution');
  const bW = findW(cn,'protect') ?? findW(cn,'battery protect');
  const gW = findW(cn,'chassis') ?? findW(cn,'ground');

  const mG = mW?.cableGauge ?? 70;
  const iG = iW?.cableGauge ?? 50;
  const mpG = mBW?.cableGauge ?? 10;
  const diG = dIW?.cableGauge ?? 10;
  const doG = dOW?.cableGauge ?? 10;
  const bG = bW?.cableGauge ?? 16;

  const fL = [
    hasInv ? (mG >= 50 ? '175A' : '100A') : '',
    hasMPPT ? `${Math.ceil((Number(mpptC?.product.specs.maxChargeAmps)||30)*1.25)}A` : '',
    hasDC ? `${Math.ceil(config.dcDcAmps*1.25)}A` : '',
    `${Math.ceil(((bpC?.product.specs.maxCurrent as number)||65)*1.25)}A`,
  ];
  const fA = [hasInv?'Inverter':'', hasMPPT?'MPPT':'', hasDC?'DC-DC':'', '12V Loads'];

  return (
    <svg id="schematic-svg" viewBox={`0 0 ${W} ${H}`} width="100%" height="100%"
      xmlns="http://www.w3.org/2000/svg" style={{ background: '#F8F9FA', fontFamily: 'Inter, system-ui, sans-serif' }}>

      {/* ═══ TITLE BAR ═══ */}
      <rect x={0} y={0} width={W} height={60} fill="#1A1A1A"/>
      <text x={24} y={24} fontSize={16} fill="#D9A05B" fontWeight="bold">CRAFTED CAMPER CO.</text>
      <text x={24} y={46} fontSize={11} fill="#fff">Wiring Schematic — {spec.archetype.replace(/_/g,' ')}</text>
      <text x={W-24} y={24} fontSize={10} fill="#888" textAnchor="end">
        {bat?.name} | {invC?.product.name??'No Inverter'} | {config.solarWatts}W Solar | {config.dcDcAmps}A DC-DC
      </text>
      <text x={W-24} y={46} fontSize={9} fill="#D9A05B" textAnchor="end">
        Recommended: {config.batteryAh}Ah | Cable: {config.cableRunLength} ({config.cableRunLength==='short'?'0-2m':config.cableRunLength==='medium'?'2-5m':'5-10m'})
      </text>
      <line x1={0} y1={60} x2={W} y2={60} stroke="#D9A05B" strokeWidth={2}/>

      {/* ═══ COMPONENTS ═══ */}
      <BatterySVG x={p.battery.x} y={p.battery.y}
        label={bat?.name?.split(' ').slice(-2).join(' ')??'Battery'}
        capacity={`${config.batteryAh}Ah`}/>
      <SmartShuntSVG x={p.shunt.x} y={p.shunt.y}/>
      <IsolatorSVG x={p.isolator.x} y={p.isolator.y} label="BAT ISO"/>

      {hasLynx ? (
        <LynxDistributorSVG x={p.lynxDist.x} y={p.lynxDist.y} fuseLabels={fL} fuseAssignments={fA}/>
      ) : (
        <g transform={`translate(${p.lynxDist.x},${p.lynxDist.y})`}>
          <rect x={0} y={0} width={300} height={50} rx={6} fill="#1A1A1A" stroke="#C0392B" strokeWidth={2}/>
          <text x={150} y={30} fontSize={10} fill="#fff" textAnchor="middle" fontWeight="bold">BUSBAR</text>
        </g>
      )}

      {hasInv && invC && (
        <InverterSVG x={p.inverter.x} y={p.inverter.y}
          label={invC.product.name.split(' ').slice(0,2).join(' ')}
          model={`${invC.product.name} ${config.inverterVA}VA`} isCharger={hasMP}/>
      )}

      {hasMPPT && mpptC && (<>
        <MPPTSVG x={p.mppt.x} y={p.mppt.y}
          label={mpptC.product.name.split(' ').slice(1).join(' ')}
          model={`SmartSolar ${config.solarWatts}W`}/>
        <SolarPanelSVG x={p.solar.x} y={p.solar.y}
          watts={config.solarWatts} panelCount={Math.ceil(config.solarWatts/200)}/>
      </>)}

      {hasDC && dcdcC && (<>
        <DCDCChargerSVG x={p.dcdc.x} y={p.dcdc.y}
          label={dcdcC.product.name.split(' ').slice(0,3).join(' ')}
          model={`Orion ${config.dcDcAmps}A`}/>
        <StarterBatterySVG x={p.starter.x} y={p.starter.y}/>
      </>)}

      {bpC && <BatteryProtectSVG x={p.bp.x} y={p.bp.y} amps={bpC.product.specs.maxCurrent as number}/>}
      <FuseBlockSVG x={p.fuseBlock.x} y={p.fuseBlock.y}/>
      <GroundSymbolSVG x={p.ground.x} y={p.ground.y} label="VEHICLE CHASSIS"/>

      {hasShore && (<>
        <ConsumerUnitSVG x={p.cuIn.x} y={p.cuIn.y} label="AC-In Consumer Unit" type="ac_in"/>
        <ConsumerUnitSVG x={p.cuOut.x} y={p.cuOut.y} label="AC-Out Consumer Unit" type="ac_out"/>
        <g transform={`translate(${p.cuIn.x+80},${p.cuIn.y-30})`}>
          <rect x={-55} y={-14} width={110} height={28} rx={4} fill="#3498DB" opacity={0.15} stroke="#3498DB" strokeWidth={1}/>
          <text x={0} y={5} fontSize={10} fill="#3498DB" textAnchor="middle" fontWeight="bold">SHORE POWER</text>
        </g>
      </>)}

      {/* ═══ EXAMPLE APPLIANCES ═══ */}
      {/* 12V loads from FuseBlock */}
      <g transform={`translate(${p.fuseBlock.x - 40},${p.fuseBlock.y + 195})`}>
        <line x1={90} y1={-13} x2={90} y2={0} stroke="#D9A05B" strokeWidth={1.5}/>
        {[
          { icon: '💡', label: 'LED Lights' },
          { icon: '🔌', label: 'USB' },
          { icon: '💧', label: 'Water Pump' },
          { icon: '❄️', label: '12V Fridge' },
        ].map((app, i) => (
          <g key={i} transform={`translate(${i * 80}, 0)`}>
            <line x1={90} y1={0} x2={i * 80 + 30} y2={0} stroke="#D9A05B" strokeWidth={1} strokeDasharray="4 2"/>
            <line x1={i * 80 + 30} y1={0} x2={i * 80 + 30} y2={16} stroke="#D9A05B" strokeWidth={1}/>
            <rect x={i > 0 ? 0 : -5} y={16} width={65} height={30} rx={4} fill="rgba(26,26,26,0.06)" stroke="#D9A05B" strokeWidth={1}/>
            <text x={i > 0 ? 32 : 28} y={30} fontSize={7} fill="#1A1A1A" textAnchor="middle">{app.icon}</text>
            <text x={i > 0 ? 32 : 28} y={42} fontSize={7} fill="#555" textAnchor="middle">{app.label}</text>
          </g>
        ))}
      </g>

      {/* AC loads from AC-Out CU */}
      {hasShore && (
        <g transform={`translate(${p.cuOut.x},${p.cuOut.y + 115})`}>
          <line x1={80} y1={-13} x2={80} y2={0} stroke="#8B4513" strokeWidth={1.5}/>
          {[
            { label: '230V Socket' },
            { label: 'Induction Hob' },
          ].map((app, i) => (
            <g key={i} transform={`translate(${i * 90}, 0)`}>
              <line x1={80} y1={0} x2={i * 90 + 40} y2={0} stroke="#8B4513" strokeWidth={1} strokeDasharray="4 2"/>
              <line x1={i * 90 + 40} y1={0} x2={i * 90 + 40} y2={16} stroke="#8B4513" strokeWidth={1}/>
              <rect x={i * 90 + 5} y={16} width={70} height={30} rx={4} fill="rgba(52,152,219,0.06)" stroke="#3498DB" strokeWidth={1}/>
              <rect x={i * 90 + 22} y={22} width={36} height={8} rx={2} fill="#3498DB" opacity={0.3}/>
              <circle cx={i * 90 + 30} cy={26} r={2} fill="#3498DB"/>
              <circle cx={i * 90 + 40} cy={23} r={1.5} fill="#3498DB"/>
              <circle cx={i * 90 + 50} cy={26} r={2} fill="#3498DB"/>
              <text x={i * 90 + 40} y={42} fontSize={7} fill="#555" textAnchor="middle">{app.label}</text>
            </g>
          ))}
        </g>
      )}

      {/* ═══════════════════════════════════════════════════════════
          WIRES — all paths verified against bounding boxes.
          20 px offsets within corridors for parallel runs.
          ═══════════════════════════════════════════════════════════ */}

      {/* W1 · Battery POS → Isolator IN · upper corridor y=440 */}
      <WireSVG from={pt(p.battery,BATTERY_CONN.POS)} to={pt(p.isolator,ISOLATOR_CONN.IN)}
        color={WC.red} gauge={mG}
        waypoints={[
          { x: pt(p.battery,BATTERY_CONN.POS).x, y: UP.batPos },
          { x: pt(p.isolator,ISOLATOR_CONN.IN).x, y: UP.batPos },
        ]}
        lugFrom={dLug(mG,'up')} lugTo={dLug(mG,'left')}
        fuse={mW?.fuseRating ? { rating:`${mW.fuseRating}A`, type:mW.fuseType?.toUpperCase(), position:0.4 } : undefined}
      />

      {/* W2 · Isolator OUT → Lynx Dist BUS_POS_IN · x=860 gap */}
      <WireSVG from={pt(p.isolator,ISOLATOR_CONN.OUT)} to={pt(p.lynxDist,LYNX_DIST_CONN.BUS_POS_IN)}
        color={WC.red} gauge={mG}
        waypoints={[
          { x: 860, y: pt(p.isolator,ISOLATOR_CONN.OUT).y },
          { x: 860, y: pt(p.lynxDist,LYNX_DIST_CONN.BUS_POS_IN).y },
        ]}
        lugFrom={dLug(mG,'right')} lugTo={dLug(mG,'left')}
      />

      {/* W3 · Battery NEG → SmartShunt BAT(-) · x=485 gap */}
      <WireSVG from={pt(p.battery,BATTERY_CONN.NEG)} to={pt(p.shunt,SHUNT_CONN.BAT_NEG)}
        color={WC.blk} gauge={mG}
        waypoints={[
          { x: 485, y: pt(p.battery,BATTERY_CONN.NEG).y },
          { x: 485, y: pt(p.shunt,SHUNT_CONN.BAT_NEG).y },
        ]}
        lugFrom={dLug(mG,'up')} lugTo={dLug(mG,'left')}
      />

      {/* W4 · SmartShunt SYS(-) → Lynx Dist BUS_NEG_IN · lower corridor + x=680/900 gaps */}
      <WireSVG from={pt(p.shunt,SHUNT_CONN.SYS_NEG)} to={pt(p.lynxDist,LYNX_DIST_CONN.BUS_NEG_IN)}
        color={WC.blk} gauge={mG}
        waypoints={[
          { x: 680, y: pt(p.shunt,SHUNT_CONN.SYS_NEG).y },
          { x: 680, y: LO.shuntNeg },
          { x: 900, y: LO.shuntNeg },
          { x: 900, y: pt(p.lynxDist,LYNX_DIST_CONN.BUS_NEG_IN).y },
        ]}
        lugFrom={dLug(mG,'right')} lugTo={dLug(mG,'left')}
      />

      {/* W5 · SmartShunt AUX → Battery POS · y=400 */}
      <WireSVG from={pt(p.shunt,SHUNT_CONN.AUX)} to={pt(p.battery,BATTERY_CONN.POS)}
        color={WC.red} gauge={1.5} gaugeLabel="1.5mm²"
        waypoints={[
          { x: pt(p.shunt,SHUNT_CONN.AUX).x, y: UP.aux },
          { x: pt(p.battery,BATTERY_CONN.POS).x, y: UP.aux },
        ]}
        label="AUX (V-Sense)"
      />

      {/* W6 · Lynx FUSE1 POS → Inverter DC POS · x=1360 gap */}
      {hasInv && hasLynx && (<>
        <WireSVG from={pt(p.lynxDist,LYNX_DIST_CONN.FUSE_1_POS)} to={pt(p.inverter,INVERTER_CONN.DC_POS)}
          color={WC.red} gauge={iG}
          waypoints={[
            { x: pt(p.lynxDist,LYNX_DIST_CONN.FUSE_1_POS).x, y: UP.invPos },
            { x: 1360, y: UP.invPos },
            { x: 1360, y: pt(p.inverter,INVERTER_CONN.DC_POS).y },
          ]}
          lugFrom={dLug(iG,'up')} lugTo={dLug(iG,'left')}
        />
        {/* W7 · Lynx FUSE1 NEG → Inverter DC NEG · x=1370 gap */}
        <WireSVG from={pt(p.lynxDist,LYNX_DIST_CONN.FUSE_1_NEG)} to={pt(p.inverter,INVERTER_CONN.DC_NEG)}
          color={WC.blk} gauge={iG}
          waypoints={[
            { x: pt(p.lynxDist,LYNX_DIST_CONN.FUSE_1_NEG).x, y: LO.invNeg },
            { x: 1370, y: LO.invNeg },
            { x: 1370, y: pt(p.inverter,INVERTER_CONN.DC_NEG).y },
          ]}
          lugFrom={dLug(iG,'down')} lugTo={dLug(iG,'left')}
        />
      </>)}

      {/* W8 · Lynx FUSE2 POS → MPPT BAT POS · upper corridor */}
      {hasMPPT && hasLynx && (<>
        <WireSVG from={pt(p.lynxDist,LYNX_DIST_CONN.FUSE_2_POS)} to={pt(p.mppt,MPPT_CONN.BAT_POS)}
          color={WC.red} gauge={mpG}
          waypoints={[
            { x: pt(p.lynxDist,LYNX_DIST_CONN.FUSE_2_POS).x, y: UP.mpptPos },
            { x: pt(p.mppt,MPPT_CONN.BAT_POS).x, y: UP.mpptPos },
          ]}
          lugFrom={dLug(mpG,'up')} lugTo={dLug(mpG,'down')}
        />
        {/* W9 · Lynx FUSE2 NEG → MPPT BAT NEG · x=1350 right of Lynx */}
        <WireSVG from={pt(p.lynxDist,LYNX_DIST_CONN.FUSE_2_NEG)} to={pt(p.mppt,MPPT_CONN.BAT_NEG)}
          color={WC.blk} gauge={mpG}
          waypoints={[
            { x: pt(p.lynxDist,LYNX_DIST_CONN.FUSE_2_NEG).x, y: LO.mpptNeg },
            { x: 1350, y: LO.mpptNeg },
            { x: 1350, y: pt(p.mppt,MPPT_CONN.BAT_NEG).y },
          ]}
          lugFrom={dLug(mpG,'down')} lugTo={dLug(mpG,'right')}
        />
      </>)}

      {/* W10-11 · Solar → MPPT PV · straight vertical drops */}
      {hasMPPT && (<>
        <WireSVG from={pt(p.solar,SOLAR_CONN.PV_POS)} to={pt(p.mppt,MPPT_CONN.PV_POS)}
          color={WC.red} gauge={mPW?.cableGauge??6} gaugeLabel={`${mPW?.cableGauge??6}mm² Solar`}/>
        <WireSVG from={pt(p.solar,SOLAR_CONN.PV_NEG)} to={pt(p.mppt,MPPT_CONN.PV_NEG)}
          color={WC.blk} gauge={mPW?.cableGauge??6}/>
      </>)}

      {/* W12 · Starter POS → DC-DC IN POS · route UP then LEFT to avoid body overlap */}
      {hasDC && (<>
        <WireSVG from={pt(p.starter,STARTER_CONN.POS)} to={pt(p.dcdc,DCDC_CONN.IN_POS)}
          color={WC.red} gauge={diG}
          waypoints={[
            { x: pt(p.starter,STARTER_CONN.POS).x, y: 82 },
            { x: 275, y: 82 },
            { x: 275, y: pt(p.dcdc,DCDC_CONN.IN_POS).y },
          ]}
          fuse={dIW?.fuseRating ? { rating:`${dIW.fuseRating}A`, type:dIW.fuseType?.toUpperCase(), position:0.4 } : undefined}
          lugFrom={dLug(diG,'up')} lugTo={dLug(diG,'left')}
        />
        {/* W13 · Starter NEG → DC-DC IN NEG · route UP then LEFT (x=255, offset from POS) */}
        <WireSVG from={pt(p.starter,STARTER_CONN.NEG)} to={pt(p.dcdc,DCDC_CONN.IN_NEG)}
          color={WC.blk} gauge={diG}
          waypoints={[
            { x: pt(p.starter,STARTER_CONN.NEG).x, y: 82 },
            { x: 255, y: 82 },
            { x: 255, y: pt(p.dcdc,DCDC_CONN.IN_NEG).y },
          ]}
          lugFrom={dLug(diG,'up')} lugTo={dLug(diG,'left')}
        />
      </>)}

      {/* W14 · DC-DC OUT POS → Lynx FUSE3 POS · x=495 gap then corridor */}
      {hasDC && hasLynx && (<>
        <WireSVG from={pt(p.dcdc,DCDC_CONN.OUT_POS)} to={pt(p.lynxDist,LYNX_DIST_CONN.FUSE_3_POS)}
          color={WC.red} gauge={doG}
          waypoints={[
            { x: 495, y: pt(p.dcdc,DCDC_CONN.OUT_POS).y },
            { x: 495, y: UP.dcPos },
            { x: pt(p.lynxDist,LYNX_DIST_CONN.FUSE_3_POS).x, y: UP.dcPos },
          ]}
          lugFrom={dLug(doG,'right')} lugTo={dLug(doG,'up')}
        />
        {/* W15 · DC-DC OUT NEG → Lynx FUSE3 NEG · x=530 gap then corridor */}
        <WireSVG from={pt(p.dcdc,DCDC_CONN.OUT_NEG)} to={pt(p.lynxDist,LYNX_DIST_CONN.FUSE_3_NEG)}
          color={WC.blk} gauge={doG}
          waypoints={[
            { x: 530, y: pt(p.dcdc,DCDC_CONN.OUT_NEG).y },
            { x: 530, y: LO.dcdcNeg },
            { x: pt(p.lynxDist,LYNX_DIST_CONN.FUSE_3_NEG).x, y: LO.dcdcNeg },
          ]}
          lugFrom={dLug(doG,'right')} lugTo={dLug(doG,'down')}
        />
      </>)}

      {/* W16 · Lynx FUSE4 POS → BP IN · right of Lynx at x=1300, lower corridor, left of BP at x=1020 */}
      {bpC && hasLynx && (<>
        <WireSVG from={pt(p.lynxDist,LYNX_DIST_CONN.FUSE_4_POS)} to={pt(p.bp,BP_CONN.IN)}
          color={WC.red} gauge={bG}
          waypoints={[
            { x: pt(p.lynxDist,LYNX_DIST_CONN.FUSE_4_POS).x, y: UP.bpUp },
            { x: 1300, y: UP.bpUp },
            { x: 1300, y: LO.bpLo },
            { x: 1020, y: LO.bpLo },
            { x: 1020, y: pt(p.bp,BP_CONN.IN).y },
          ]}
          lugFrom={dLug(bG,'up')} lugTo={dLug(bG,'left')}
        />
        {/* W17 · Lynx FUSE4 NEG → FuseBlock NEG BUS */}
        <WireSVG from={pt(p.lynxDist,LYNX_DIST_CONN.FUSE_4_NEG)} to={pt(p.fuseBlock,FUSEBLOCK_CONN.NEG_BUS)}
          color={WC.blk} gauge={bG}
          waypoints={[
            { x: pt(p.lynxDist,LYNX_DIST_CONN.FUSE_4_NEG).x, y: LO.fbNeg },
            { x: pt(p.fuseBlock,FUSEBLOCK_CONN.NEG_BUS).x, y: LO.fbNeg },
          ]}
          lugFrom={dLug(bG,'down')} lugTo={dLug(bG,'up')}
        />
      </>)}

      {/* W18 · BP OUT → FuseBlock POS IN · x=1215 gap */}
      {bpC && (
        <WireSVG from={pt(p.bp,BP_CONN.OUT)} to={pt(p.fuseBlock,FUSEBLOCK_CONN.POS_IN)}
          color={WC.red} gauge={bG}
          waypoints={[
            { x: 1215, y: pt(p.bp,BP_CONN.OUT).y },
            { x: 1215, y: pt(p.fuseBlock,FUSEBLOCK_CONN.POS_IN).y },
          ]}
          lugFrom={dLug(bG,'right')} lugTo={dLug(bG,'up')}
        />
      )}

      {/* W19 · Ground → Lynx (chassis bond) · lower corridor y=690 */}
      <WireSVG from={pt(p.ground,GROUND_CONN.GND)} to={pt(p.lynxDist,{x:180,y:180})}
        color={WC.gn} gauge={gW?.cableGauge??35} gaugeLabel={`≥${gW?.cableGauge??35}mm²`}
        dashed label="Chassis Bond"
        waypoints={[
          { x: pt(p.ground,GROUND_CONN.GND).x, y: LO.gndBond },
          { x: pt(p.lynxDist,{x:180,y:180}).x, y: LO.gndBond },
        ]}
        lugFrom={dLug(35,'up')}
      />

      {/* W20 · Inverter chassis GND → Ground · y=755 */}
      {hasInv && (
        <WireSVG from={pt(p.inverter,INVERTER_CONN.CHASSIS_GND)} to={pt(p.ground,GROUND_CONN.GND)}
          color={WC.gn} gauge={16} gaugeLabel="≥16mm²" dashed
          waypoints={[
            { x: pt(p.inverter,INVERTER_CONN.CHASSIS_GND).x, y: LO.invGnd },
            { x: pt(p.ground,GROUND_CONN.GND).x, y: LO.invGnd },
          ]}
          lugFrom={dLug(16,'down')} lugTo={dLug(16,'up')}
        />
      )}

      {/* ═══ AC WIRES ═══ */}
      {hasShore && (<>
        {/* W21 · CU-In MCB OUT → Inverter AC IN · y=685 */}
        <WireSVG from={pt(p.cuIn,CU_CONN.MCB_OUT)} to={pt(p.inverter,INVERTER_CONN.AC_IN)}
          color={WC.blu} gaugeLabel="3-core 2.5mm²" label="L · N · E (H07RN-F)"
          waypoints={[
            { x: pt(p.cuIn,CU_CONN.MCB_OUT).x, y: AY.acIn },
            { x: pt(p.inverter,INVERTER_CONN.AC_IN).x, y: AY.acIn },
          ]}
        />
        {/* W22 · Inverter AC OUT → CU-Out MAIN IN · y=710 */}
        <WireSVG from={pt(p.inverter,INVERTER_CONN.AC_OUT)} to={pt(p.cuOut,CU_CONN.MAIN_IN)}
          color={WC.brn} gaugeLabel="3-core 2.5mm²" label="L · N · E (H07RN-F)"
          waypoints={[
            { x: pt(p.inverter,INVERTER_CONN.AC_OUT).x, y: AY.acOut },
            { x: pt(p.cuOut,CU_CONN.MAIN_IN).x, y: AY.acOut },
          ]}
        />

        {/* W23 · CU-In EARTH → Ground · DOWN then LEFT (short path) */}
        <WireSVG from={pt(p.cuIn,CU_CONN.EARTH)} to={pt(p.ground,GROUND_CONN.GND)}
          color={WC.gn} gaugeLabel="6mm²" dashed
          waypoints={[
            { x: 1960, y: pt(p.cuIn,CU_CONN.EARTH).y },
            { x: 1960, y: 1020 },
            { x: pt(p.ground,GROUND_CONN.GND).x, y: 1020 },
          ]}
        />
        {/* W24 · CU-Out EARTH → Ground */}
        <WireSVG from={pt(p.cuOut,CU_CONN.EARTH)} to={pt(p.ground,GROUND_CONN.GND)}
          color={WC.gn} gaugeLabel="6mm²" dashed
          waypoints={[
            { x: 1975, y: pt(p.cuOut,CU_CONN.EARTH).y },
            { x: 1975, y: 1035 },
            { x: pt(p.ground,GROUND_CONN.GND).x, y: 1035 },
          ]}
        />
      </>)}

      {/* ═══ AC WIRING LEGEND ═══ */}
      {hasShore && (
        <g transform={`translate(${p.inverter.x + 20},${p.inverter.y + 195})`}>
          <rect x={-8} y={-12} width={180} height={58} rx={5}
            fill="rgba(52,152,219,0.06)" stroke="#3498DB" strokeWidth={1}/>
          <text x={82} y={2} fontSize={9} fill="#3498DB" textAnchor="middle" fontWeight="bold">AC CABLE (3-core)</text>
          <line x1={4} y1={14} x2={30} y2={14} stroke="#8B4513" strokeWidth={2}/>
          <text x={36} y={18} fontSize={8} fill="#555">L — Live (Brown)</text>
          <line x1={4} y1={28} x2={30} y2={28} stroke="#3498DB" strokeWidth={2}/>
          <text x={36} y={32} fontSize={8} fill="#555">N — Neutral (Blue)</text>
          <line x1={4} y1={42} x2={30} y2={42} stroke="#27AE60" strokeWidth={2} strokeDasharray="4 2"/>
          <text x={36} y={46} fontSize={8} fill="#555">E — Earth (Green/Yellow)</text>
        </g>
      )}

      {/* ═══ EDGE ANNOTATIONS ═══ */}
      {spec.regulations.slice(0,4).map((r,i) => (
        <RegulationBoxSVG key={r.id} x={12} y={80 + i * 120}
          width={210} standard={r.standard} clause={r.clause} text={r.text}/>
      ))}
      {spec.actions
        .filter(a => a.priority === 'critical' || a.priority === 'important')
        .slice(0,4)
        .map((a,i) => (
          <ActionBoxSVG key={a.id} x={W - 220} y={80 + i * 110}
            width={208} text={a.text} priority={a.priority}/>
        ))}

      {/* ═══ BOTTOM INFO STRIP ═══ */}
      <g transform={`translate(24,${H - 200})`}>
        <rect x={0} y={0} width={480} height={80} rx={6}
          fill="rgba(26,26,26,0.05)" stroke="#1A1A1A" strokeWidth={1.5}/>
        <text x={14} y={20} fontSize={10} fill="#1A1A1A" fontWeight="bold">COMPULSORY READING:</text>
        <text x={14} y={38} fontSize={9} fill="#555">
          All cable &amp; fuse sizes based on manufacturer-stated recommendations.
        </text>
        <text x={14} y={54} fontSize={9} fill="#555">
          Must be installed by a skilled/competent/qualified fitter.
        </text>
        <text x={14} y={70} fontSize={9} fill="#555">EIC required before first use.</text>
      </g>
      <g transform={`translate(530,${H - 200})`}>
        <rect x={0} y={0} width={420} height={80} rx={6}
          fill="rgba(217,160,91,0.05)" stroke="#D9A05B" strokeWidth={1.5}/>
        <text x={14} y={20} fontSize={10} fill="#D9A05B" fontWeight="bold">RECOMMENDED DC CABLE SIZING</text>
        <text x={14} y={38} fontSize={9} fill="#555">
          Cable length = MAX distance between battery ± and device.
        </text>
        <text x={14} y={54} fontSize={9} fill="#555">
          Cable runs: {config.cableRunLength} ({config.cableRunLength==='short'?'0-2m':config.cableRunLength==='medium'?'2-5m':'5-10m'})
        </text>
        <text x={14} y={70} fontSize={9} fill="#555">DC: Tri-Rated (BS 6231). AC: H07RN-F (BS EN 50525).</text>
      </g>
      <g transform={`translate(976,${H - 200})`}>
        <rect x={0} y={0} width={380} height={80} rx={6}
          fill="rgba(39,174,96,0.05)" stroke="#27AE60" strokeWidth={1.5}/>
        <text x={14} y={20} fontSize={10} fill="#27AE60" fontWeight="bold">EARTHING &amp; BONDING</text>
        <text x={14} y={38} fontSize={9} fill="#555">
          Chassis bond: ≥{spec.earthingSpec?.chassisGroundCable ?? 35}mm² from neg busbar to chassis.
        </text>
        <text x={14} y={54} fontSize={9} fill="#555">All exposed metal parts bonded to chassis.</text>
        <text x={14} y={70} fontSize={9} fill="#555">Ref: BS 7671:2018+A2:2022 Section 411.</text>
      </g>
      {hasShore && (
        <g transform={`translate(1382,${H - 200})`}>
          <rect x={0} y={0} width={380} height={80} rx={6}
            fill="rgba(52,152,219,0.05)" stroke="#3498DB" strokeWidth={1.5}/>
          <text x={14} y={20} fontSize={10} fill="#3498DB" fontWeight="bold">AC PROTECTION (Auto-Transfer)</text>
          <text x={14} y={38} fontSize={9} fill="#555">
            MultiPlus has built-in automatic transfer — no external switch.
          </text>
          <text x={14} y={54} fontSize={9} fill="#555">
            Shore → AC-In CU (30mA Type A RCD) → MultiPlus AC-IN.
          </text>
          <text x={14} y={70} fontSize={9} fill="#555">AC-OUT → AC-Out CU → Loads. Test RCD before connection.</text>
        </g>
      )}

      {/* ═══ SAFETY BANNER ═══ */}
      <rect x={0} y={H - 50} width={W} height={50} fill="#C0392B"/>
      <text x={W/2} y={H - 30} fontSize={14} fill="#fff" textAnchor="middle" fontWeight="bold">
        ⚠ 230V IS EXTREMELY HAZARDOUS — DO NOT TOUCH LIVE PARTS — MUST BE INSTALLED BY A QUALIFIED FITTER ⚠
      </text>
      <text x={W/2} y={H - 12} fontSize={9} fill="rgba(255,255,255,0.85)" textAnchor="middle">
        All cable &amp; fuse sizes per Victron recommendations. EIC must be issued prior to first use.
      </text>
    </svg>
  );
}
