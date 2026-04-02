/**
 * Wiring diagram product SVG components.
 * Ported from wiring-prototype to react-native-svg.
 * Each component includes actual product images from assets/images/victron/.
 */
import React from 'react';
import {
  G, Rect, Circle, Line, Path, Text as SvgText, Image as SvgImage,
  Defs, LinearGradient, Stop,
} from 'react-native-svg';

// ─── Asset requires (static, must be at module level) ────────────────────────
const IMG_BATTERY = require('../../assets/images/third-party/fogstar-drift-230ah.png');
const IMG_MPPT = require('../../assets/images/victron/mppt-100-30.png');
const IMG_INVERTER = require('../../assets/images/victron/multiplus-2000.png');
const IMG_DCDC = require('../../assets/images/victron/orion-tr-smart-30.png');
const IMG_SHUNT = require('../../assets/images/victron/smartshunt-500a.png');
const IMG_LYNX = require('../../assets/images/victron/lynx-distributor.png');
const IMG_BP = require('../../assets/images/victron/battery-protect-65a.png');

// ─── Connection point exports ─────────────────────────────────────────────────
export const BATTERY_CONN = { POS: { x: 65, y: 0 }, NEG: { x: 135, y: 0 } };
export const MPPT_CONN = {
  PV_POS: { x: 40, y: 0 }, PV_NEG: { x: 100, y: 0 },
  BAT_POS: { x: 40, y: 160 }, BAT_NEG: { x: 100, y: 160 },
  CHASSIS_GND: { x: 70, y: 160 },
};
export const INVERTER_CONN = {
  DC_POS: { x: 40, y: 180 }, DC_NEG: { x: 70, y: 180 },
  AC_IN: { x: 150, y: 180 }, AC_OUT: { x: 180, y: 180 },
  CHASSIS_GND: { x: 100, y: 180 },
};
export const DCDC_CONN = {
  IN_POS: { x: 0, y: 30 }, IN_NEG: { x: 0, y: 70 },
  OUT_POS: { x: 160, y: 30 }, OUT_NEG: { x: 160, y: 70 },
  IGN: { x: 80, y: 100 },
};
export const SHUNT_CONN = { BAT_NEG: { x: 0, y: 30 }, SYS_NEG: { x: 140, y: 30 }, AUX: { x: 70, y: 0 } };
export const LYNX_DIST_CONN = {
  BUS_POS_IN: { x: 0, y: 40 }, BUS_NEG_IN: { x: 0, y: 140 },
  FUSE_1_POS: { x: 100, y: 0 }, FUSE_1_NEG: { x: 100, y: 180 },
  FUSE_2_POS: { x: 170, y: 0 }, FUSE_2_NEG: { x: 170, y: 180 },
  FUSE_3_POS: { x: 240, y: 0 }, FUSE_3_NEG: { x: 240, y: 180 },
  FUSE_4_POS: { x: 310, y: 0 }, FUSE_4_NEG: { x: 310, y: 180 },
};
export const BP_CONN = { IN: { x: 0, y: 30 }, OUT: { x: 100, y: 30 } };
export const ISOLATOR_CONN = { IN: { x: 0, y: 35 }, OUT: { x: 70, y: 35 } };
export const GROUND_CONN = { GND: { x: 30, y: 0 } };
export const SOLAR_CONN = { PV_POS: { x: 60, y: 100 }, PV_NEG: { x: 120, y: 100 } };
export const STARTER_CONN = { POS: { x: 50, y: 0 }, NEG: { x: 90, y: 0 } };
export const FUSEBLOCK_CONN = { POS_IN: { x: 50, y: 0 }, NEG_BUS: { x: 20, y: 0 }, LOADS: { x: 50, y: 180 } };
export const CU_CONN = { MAIN_IN: { x: 80, y: 0 }, MCB_OUT: { x: 80, y: 100 }, EARTH: { x: 140, y: 100 } };

// ─── BatterySVG ───────────────────────────────────────────────────────────────
export function BatterySVG({ x, y, label, capacity }: { x: number; y: number; label: string; capacity?: string }) {
  return (
    <G x={x} y={y}>
      <SvgImage href={IMG_BATTERY} x={4} y={10} width={192} height={116} preserveAspectRatio="xMidYMid meet" />
      <Rect x={4} y={10} width={192} height={116} rx={8} fill="rgba(0,0,0,0.3)" />
      <Rect x={55} y={0} width={20} height={20} rx={4} fill="#D9A05B" stroke="#1A1A1A" strokeWidth={1} />
      <SvgText x={65} y={-5} fontSize={11} fill="#D9A05B" textAnchor="middle" fontWeight="bold">+</SvgText>
      <Rect x={125} y={0} width={20} height={20} rx={4} fill="#555" stroke="#1A1A1A" strokeWidth={1} />
      <SvgText x={135} y={-5} fontSize={11} fill="#888" textAnchor="middle" fontWeight="bold">−</SvgText>
      <SvgText x={100} y={55} fontSize={14} fill="#fff" textAnchor="middle" fontWeight="bold">{label}</SvgText>
      {capacity && <SvgText x={100} y={78} fontSize={12} fill="#D9A05B" textAnchor="middle" fontWeight="bold">{capacity}</SvgText>}
      <SvgText x={100} y={98} fontSize={10} fill="rgba(255,255,255,0.75)" textAnchor="middle">LiFePO4 12.8V</SvgText>
    </G>
  );
}

// ─── SmartShuntSVG ────────────────────────────────────────────────────────────
export function SmartShuntSVG({ x, y }: { x: number; y: number }) {
  return (
    <G x={x} y={y}>
      <SvgImage href={IMG_SHUNT} x={5} y={2} width={130} height={56} preserveAspectRatio="xMidYMid meet" />
      <Circle cx={0} cy={30} r={6} fill="#333" stroke="#555" strokeWidth={1.5} />
      <Circle cx={0} cy={30} r={2} fill="#1A1A1A" />
      <SvgText x={20} y={26} fontSize={7} fill="#888" textAnchor="middle">14Nm</SvgText>
      <SvgText x={20} y={34} fontSize={8} fill="#D9A05B" textAnchor="middle">BAT(−)</SvgText>
      <Circle cx={140} cy={30} r={6} fill="#333" stroke="#555" strokeWidth={1.5} />
      <Circle cx={140} cy={30} r={2} fill="#1A1A1A" />
      <SvgText x={120} y={26} fontSize={7} fill="#888" textAnchor="middle">14Nm</SvgText>
      <SvgText x={120} y={34} fontSize={8} fill="#D9A05B" textAnchor="middle">SYS(−)</SvgText>
      <Circle cx={70} cy={0} r={4} fill="#003E7E" stroke="#D9A05B" strokeWidth={0.8} />
      <SvgText x={70} y={-8} fontSize={6} fill="#D9A05B" textAnchor="middle">AUX</SvgText>
    </G>
  );
}

// ─── IsolatorSVG ──────────────────────────────────────────────────────────────
export function IsolatorSVG({ x, y, label }: { x: number; y: number; label: string }) {
  return (
    <G x={x} y={y}>
      <Circle cx={35} cy={35} r={28} fill="#1A1A1A" stroke="#003E7E" strokeWidth={2} />
      <Circle cx={35} cy={35} r={22} fill="none" stroke="#003E7E" strokeWidth={1.5} />
      <Line x1={35} y1={35} x2={48} y2={22} stroke="#D9A05B" strokeWidth={3} strokeLinecap="round" />
      <Circle cx={48} cy={22} r={4} fill="#D9A05B" stroke="#fff" strokeWidth={0.5} />
      <Circle cx={35} cy={13} r={2} fill="#D9A05B" />
      <Circle cx={0} cy={35} r={5} fill="#333" stroke="#003E7E" strokeWidth={1} />
      <Circle cx={70} cy={35} r={5} fill="#333" stroke="#003E7E" strokeWidth={1} />
      <Rect x={7} y={58} width={56} height={14} rx={3} fill="rgba(26,26,26,0.9)" />
      <SvgText x={35} y={69} fontSize={9} fill="#D9A05B" textAnchor="middle" fontWeight="bold">{label}</SvgText>
    </G>
  );
}

// ─── LynxDistributorSVG ───────────────────────────────────────────────────────
export function LynxDistributorSVG({
  x, y, fuseLabels = [], fuseAssignments = [],
}: { x: number; y: number; fuseLabels?: string[]; fuseAssignments?: string[] }) {
  const W = 360; const H = 180;
  const slotXPositions = [80, 150, 220, 290];
  const fuseW = 50; const fuseH = 60;
  return (
    <G x={x} y={y}>
      <SvgImage href={IMG_LYNX} x={5} y={5} width={350} height={170} preserveAspectRatio="xMidYMid meet" />
      <Rect x={W / 2 - 60} y={10} width={120} height={18} rx={3} fill="rgba(26,26,26,0.75)" />
      <SvgText x={W / 2} y={22} fontSize={11} fill="#D9A05B" textAnchor="middle" fontWeight="bold">LYNX DISTRIBUTOR</SvgText>
      <Rect x={30} y={26} width={W - 60} height={18} rx={3} fill="rgba(26,26,26,0.75)" />
      <SvgText x={50} y={39} fontSize={7} fill="#fff" fontWeight="bold">POSITIVE BUSBAR</SvgText>
      <Rect x={30} y={H - 50} width={W - 60} height={18} rx={3} fill="rgba(26,26,26,0.75)" />
      <SvgText x={50} y={H - 37} fontSize={7} fill="#ddd" fontWeight="bold">NEGATIVE BUSBAR</SvgText>

      {slotXPositions.map((sx, i) => {
        const fuseY = 56;
        return (
          <G key={i} x={sx} y={fuseY}>
            <Circle cx={fuseW / 2} cy={-6} r={5} fill="#B87333" stroke="#8B5A2B" strokeWidth={1.5} />
            <Circle cx={fuseW / 2} cy={-6} r={2} fill="#8B5A2B" />
            <Circle cx={fuseW / 2} cy={fuseH + 16} r={5} fill="#777" stroke="#555" strokeWidth={1.5} />
            <Circle cx={fuseW / 2} cy={fuseH + 16} r={2} fill="#555" />
            <Rect x={5} y={8} width={fuseW - 10} height={fuseH - 16} rx={3} fill="rgba(26,26,26,0.75)" />
            <SvgText x={fuseW / 2} y={32} fontSize={10} fill="#fff" textAnchor="middle" fontWeight="bold">
              {fuseLabels[i] || '---'}
            </SvgText>
            <SvgText x={fuseW / 2} y={44} fontSize={7} fill="rgba(255,255,255,0.8)" textAnchor="middle">MEGA</SvgText>
            {fuseAssignments[i] && (
              <G x={fuseW / 2} y={-20}>
                <Rect x={-28} y={-9} width={56} height={14} rx={3} fill="rgba(26,26,26,0.85)" />
                <SvgText x={0} y={2} fontSize={8} fill="#D9A05B" textAnchor="middle" fontWeight="bold">
                  {fuseAssignments[i]}
                </SvgText>
              </G>
            )}
          </G>
        );
      })}

      <Circle cx={0} cy={40} r={6} fill="#B87333" stroke="#D9A05B" strokeWidth={2} />
      <SvgText x={-10} y={44} fontSize={8} fill="#D9A05B" textAnchor="end" fontWeight="bold">+</SvgText>
      <Circle cx={0} cy={140} r={6} fill="#666" stroke="#aaa" strokeWidth={2} />
      <SvgText x={-10} y={144} fontSize={8} fill="#888" textAnchor="end" fontWeight="bold">−</SvgText>
      <Rect x={W / 2 - 100} y={H - 18} width={200} height={12} rx={2} fill="rgba(26,26,26,0.75)" />
      <SvgText x={W / 2} y={H - 8} fontSize={7} fill="#888" textAnchor="middle">Integrated Slow Blow Fuses</SvgText>
    </G>
  );
}

// ─── InverterSVG ──────────────────────────────────────────────────────────────
export function InverterSVG({
  x, y, label, model = 'MultiPlus 3000', isCharger = true,
}: { x: number; y: number; label: string; model?: string; isCharger?: boolean }) {
  return (
    <G x={x} y={y}>
      <SvgImage href={IMG_INVERTER} x={10} y={2} width={180} height={150} preserveAspectRatio="xMidYMid meet" />
      <Rect x={0} y={140} width={200} height={40} fill="rgba(26,26,26,0.85)" />
      <SvgText x={100} y={165} fontSize={12} fill="#FFFFFF" textAnchor="middle">{model}</SvgText>
      <Circle cx={40} cy={165} r={6} fill="#1A1A1A" stroke="#C0392B" strokeWidth={2} />
      <Circle cx={40} cy={165} r={2} fill="#C0392B" />
      <Circle cx={70} cy={165} r={6} fill="#1A1A1A" stroke="#333333" strokeWidth={2} />
      <Circle cx={70} cy={165} r={2} fill="#333333" />
      <SvgText x={40} y={178} fontSize={8} fill="#FFFFFF" textAnchor="middle">DC+</SvgText>
      <SvgText x={70} y={178} fontSize={8} fill="#FFFFFF" textAnchor="middle">DC−</SvgText>
      <SvgText x={55} y={148} fontSize={7} fill="#D9A05B" textAnchor="middle">9 Nm</SvgText>
      {isCharger && (
        <>
          <Rect x={130} y={155} width={50} height={22} rx={4} fill="#1A1A1A" stroke="#003E7E" strokeWidth={1} />
          <Circle cx={142} cy={166} r={3} fill="#3498DB" />
          <Circle cx={158} cy={166} r={3} fill="#3498DB" />
          <Circle cx={174} cy={166} r={3} fill="#3498DB" />
          <SvgText x={142} y={178} fontSize={6} fill="#FFFFFF" textAnchor="middle">L</SvgText>
          <SvgText x={158} y={178} fontSize={6} fill="#FFFFFF" textAnchor="middle">N</SvgText>
          <SvgText x={174} y={178} fontSize={6} fill="#FFFFFF" textAnchor="middle">E</SvgText>
          <SvgText x={155} y={148} fontSize={7} fill="#D9A05B" textAnchor="middle">AC-IN</SvgText>
        </>
      )}
      <Rect x={175} y={155} width={25} height={22} rx={4} fill="#1A1A1A" stroke="#003E7E" strokeWidth={1} />
      <Circle cx={185} cy={166} r={3} fill="#3498DB" />
      <Circle cx={195} cy={166} r={3} fill="#3498DB" />
      <SvgText x={190} y={148} fontSize={7} fill="#D9A05B" textAnchor="middle">AC-OUT</SvgText>
      <Circle cx={100} cy={165} r={6} fill="#1A1A1A" stroke="#D9A05B" strokeWidth={2} />
      <SvgText x={100} y={170} fontSize={6} fill="#D9A05B" textAnchor="middle">GND</SvgText>
    </G>
  );
}

// ─── MPPTSVG ──────────────────────────────────────────────────────────────────
export function MPPTSVG({
  x, y, label, model = 'SmartSolar MPPT 100|30',
}: { x: number; y: number; label: string; model?: string }) {
  return (
    <G x={x} y={y}>
      <SvgImage href={IMG_MPPT} x={5} y={10} width={130} height={130} preserveAspectRatio="xMidYMid meet" />
      <Rect x={0} y={0} width={140} height={20} fill="rgba(26,26,26,0.85)" />
      <SvgText x={70} y={14} fontSize={9} fill="#FFFFFF" textAnchor="middle" fontWeight="bold">{model}</SvgText>
      <Circle cx={40} cy={8} r={6} fill="#1A1A1A" stroke="#E67E22" strokeWidth={2} />
      <Circle cx={40} cy={8} r={2} fill="#E67E22" />
      <Circle cx={100} cy={8} r={6} fill="#1A1A1A" stroke="#333333" strokeWidth={2} />
      <Circle cx={100} cy={8} r={2} fill="#333333" />
      <SvgText x={40} y={-2} fontSize={7} fill="#E67E22" textAnchor="middle">PV+</SvgText>
      <SvgText x={100} y={-2} fontSize={7} fill="#FFFFFF" textAnchor="middle">PV−</SvgText>
      <SvgText x={70} y={-8} fontSize={6} fill="#D9A05B" textAnchor="middle">2.03 Nm</SvgText>
      <Circle cx={40} cy={152} r={6} fill="#1A1A1A" stroke="#C0392B" strokeWidth={2} />
      <Circle cx={40} cy={152} r={2} fill="#C0392B" />
      <Circle cx={100} cy={152} r={6} fill="#1A1A1A" stroke="#333333" strokeWidth={2} />
      <Circle cx={100} cy={152} r={2} fill="#333333" />
      <SvgText x={40} y={168} fontSize={7} fill="#C0392B" textAnchor="middle">BAT+</SvgText>
      <SvgText x={100} y={168} fontSize={7} fill="#FFFFFF" textAnchor="middle">BAT−</SvgText>
      <SvgText x={70} y={178} fontSize={6} fill="#D9A05B" textAnchor="middle">2.71 Nm</SvgText>
      <Circle cx={70} cy={152} r={5} fill="#1A1A1A" stroke="#D9A05B" strokeWidth={1.5} />
      <SvgText x={70} y={156} fontSize={5} fill="#D9A05B" textAnchor="middle">GND</SvgText>
    </G>
  );
}

// ─── DCDCChargerSVG ───────────────────────────────────────────────────────────
export function DCDCChargerSVG({
  x, y, label, model = 'Orion-Tr Smart 12|12|30',
}: { x: number; y: number; label: string; model?: string }) {
  return (
    <G x={x} y={y}>
      <SvgImage href={IMG_DCDC} x={5} y={5} width={150} height={90} preserveAspectRatio="xMidYMid meet" />
      <Rect x={0} y={80} width={160} height={20} fill="rgba(26,26,26,0.85)" />
      <SvgText x={80} y={92} fontSize={8} fill="#D9A05B" textAnchor="middle">{label}</SvgText>
      <Circle cx={8} cy={30} r={6} fill="#1A1A1A" stroke="#E67E22" strokeWidth={2} />
      <Circle cx={8} cy={30} r={2} fill="#E67E22" />
      <Circle cx={8} cy={70} r={6} fill="#1A1A1A" stroke="#333333" strokeWidth={2} />
      <Circle cx={8} cy={70} r={2} fill="#333333" />
      <SvgText x={-4} y={33} fontSize={7} fill="#E67E22" textAnchor="end">IN+</SvgText>
      <SvgText x={-4} y={73} fontSize={7} fill="#FFFFFF" textAnchor="end">IN−</SvgText>
      <Circle cx={152} cy={30} r={6} fill="#1A1A1A" stroke="#C0392B" strokeWidth={2} />
      <Circle cx={152} cy={30} r={2} fill="#C0392B" />
      <Circle cx={152} cy={70} r={6} fill="#1A1A1A" stroke="#333333" strokeWidth={2} />
      <Circle cx={152} cy={70} r={2} fill="#333333" />
      <SvgText x={164} y={33} fontSize={7} fill="#C0392B" textAnchor="start">OUT+</SvgText>
      <SvgText x={164} y={73} fontSize={7} fill="#FFFFFF" textAnchor="start">OUT−</SvgText>
      <Circle cx={80} cy={94} r={5} fill="#1A1A1A" stroke="#D9A05B" strokeWidth={1.5} />
      <Circle cx={80} cy={94} r={1.5} fill="#D9A05B" />
      <SvgText x={80} y={105} fontSize={6} fill="#D9A05B" textAnchor="middle">IGN</SvgText>
    </G>
  );
}

// ─── BatteryProtectSVG ────────────────────────────────────────────────────────
export function BatteryProtectSVG({ x, y, amps }: { x: number; y: number; amps: number }) {
  return (
    <G x={x} y={y}>
      <SvgImage href={IMG_BP} x={5} y={2} width={90} height={56} preserveAspectRatio="xMidYMid meet" />
      <Rect x={0} y={48} width={100} height={12} fill="rgba(26,26,26,0.85)" />
      <SvgText x={50} y={58} fontSize={10} fill="#D9A05B" textAnchor="middle" fontWeight="bold">{amps}A</SvgText>
      <Circle cx={0} cy={30} r={6} fill="#1A1A1A" stroke="#D9A05B" strokeWidth={2} />
      <Circle cx={0} cy={30} r={2} fill="#D9A05B" />
      <Circle cx={100} cy={30} r={6} fill="#1A1A1A" stroke="#D9A05B" strokeWidth={2} />
      <Circle cx={100} cy={30} r={2} fill="#D9A05B" />
    </G>
  );
}

// ─── SolarPanelSVG ────────────────────────────────────────────────────────────
export function SolarPanelSVG({ x, y, watts, panelCount }: { x: number; y: number; watts: number; panelCount: number }) {
  const count = Math.max(1, Math.min(3, panelCount));
  const panelWidth = 180 / count - 8;
  const panelHeight = 80;
  return (
    <G x={x} y={y}>
      <SvgText x={90} y={-6} fontSize={10} fill="#D9A05B" textAnchor="middle" fontWeight="bold">
        {count}x {Math.round(watts / count)}W
      </SvgText>
      {Array.from({ length: count }).map((_, i) => {
        const px = 4 + i * (panelWidth + 4);
        return (
          <G key={i}>
            <Rect x={px} y={4} width={panelWidth} height={panelHeight} rx={4} fill="#1A1A1A" stroke="#003E7E" strokeWidth={2} />
            <Rect x={px + 4} y={12} width={panelWidth - 8} height={panelHeight - 16} rx={2} fill="#3D5A80" stroke="#2A3F5F" strokeWidth={0.5} />
            {[0, 1, 2, 3, 4].map(row =>
              [0, 1, 2, 3, 4].map(col => (
                <Rect key={`${row}-${col}`}
                  x={px + 8 + col * ((panelWidth - 24) / 5)}
                  y={16 + row * ((panelHeight - 24) / 5)}
                  width={(panelWidth - 24) / 5 - 2} height={(panelHeight - 24) / 5 - 2}
                  rx={1} fill="none" stroke="#2A3F5F" strokeWidth={0.5} />
              ))
            )}
          </G>
        );
      })}
      <Circle cx={60} cy={96} r={5} fill="#1A1A1A" stroke="#C0392B" strokeWidth={2} />
      <Circle cx={60} cy={96} r={2} fill="#C0392B" />
      <Circle cx={120} cy={96} r={5} fill="#1A1A1A" stroke="#333333" strokeWidth={2} />
      <Circle cx={120} cy={96} r={2} fill="#333333" />
      <SvgText x={60} y={108} fontSize={7} fill="#C0392B" textAnchor="middle">PV+</SvgText>
      <SvgText x={120} y={108} fontSize={7} fill="#FFFFFF" textAnchor="middle">PV−</SvgText>
    </G>
  );
}

// ─── StarterBatterySVG ────────────────────────────────────────────────────────
export function StarterBatterySVG({ x, y }: { x: number; y: number }) {
  return (
    <G x={x} y={y}>
      <Rect x={4} y={18} width={132} height={58} rx={8} fill="#3a3a3a" stroke="#1A1A1A" strokeWidth={1.5} />
      <Rect x={40} y={0} width={20} height={18} rx={3} fill="#D9A05B" stroke="#1A1A1A" strokeWidth={1} />
      <Rect x={80} y={0} width={20} height={18} rx={3} fill="#555" stroke="#1A1A1A" strokeWidth={1} />
      <SvgText x={70} y={42} fontSize={11} fill="#fff" textAnchor="middle" fontWeight="bold">STARTER BATTERY</SvgText>
      <SvgText x={70} y={55} fontSize={10} fill="#D9A05B" textAnchor="middle">12V</SvgText>
      <SvgText x={70} y={68} fontSize={8} fill="rgba(255,255,255,0.6)" textAnchor="middle">Engine Alternator</SvgText>
    </G>
  );
}

// ─── FuseBlockSVG ─────────────────────────────────────────────────────────────
export function FuseBlockSVG({ x, y }: { x: number; y: number }) {
  return (
    <G x={x} y={y}>
      <Rect x={0} y={0} width={100} height={180} rx={6} fill="#1A1A1A" stroke="#333" strokeWidth={1.5} />
      <SvgText x={50} y={20} fontSize={9} fill="#fff" textAnchor="middle" fontWeight="bold">Blue Sea</SvgText>
      <SvgText x={50} y={33} fontSize={8} fill="#D9A05B" textAnchor="middle">ST Blade (5026)</SvgText>
      {[0, 1, 2, 3, 4, 5].map(row =>
        [0, 1].map(col => (
          <Rect key={`${row}-${col}`}
            x={18 + col * 32} y={42 + row * 20} width={26} height={14} rx={2}
            fill="#2a2a2a" stroke="#D9A05B" strokeWidth={0.8} />
        ))
      )}
      <Circle cx={50} cy={0} r={5} fill="#1A1A1A" stroke="#D9A05B" strokeWidth={2} />
      <SvgText x={64} y={4} fontSize={7} fill="#D9A05B" fontWeight="bold">+</SvgText>
      <Circle cx={20} cy={0} r={4} fill="#1A1A1A" stroke="#888" strokeWidth={1.5} />
      <SvgText x={8} y={4} fontSize={6} fill="#888" textAnchor="end">−</SvgText>
      <SvgText x={50} y={170} fontSize={8} fill="#888" textAnchor="middle">12V DC Loads</SvgText>
    </G>
  );
}

// ─── GroundSymbolSVG ──────────────────────────────────────────────────────────
export function GroundSymbolSVG({ x, y, label }: { x: number; y: number; label: string }) {
  return (
    <G x={x} y={y}>
      <Line x1={30} y1={0} x2={30} y2={12} stroke="#1A1A1A" strokeWidth={2.5} />
      <Line x1={15} y1={12} x2={45} y2={12} stroke="#1A1A1A" strokeWidth={2} />
      <Line x1={20} y1={20} x2={40} y2={20} stroke="#1A1A1A" strokeWidth={1.5} />
      <Line x1={25} y1={28} x2={35} y2={28} stroke="#1A1A1A" strokeWidth={1} />
      <SvgText x={30} y={45} fontSize={6} fill="#1A1A1A" textAnchor="middle" fontWeight="bold">
        {label || 'VEHICLE CHASSIS'}
      </SvgText>
    </G>
  );
}

// ─── ConsumerUnitSVG ──────────────────────────────────────────────────────────
export function ConsumerUnitSVG({ x, y, label, type }: { x: number; y: number; label: string; type: 'ac_in' | 'ac_out' }) {
  const displayLabel = label || (type === 'ac_in' ? 'AC-In Consumer Unit' : 'AC-Out Consumer Unit');
  return (
    <G x={x} y={y}>
      <Rect x={0} y={0} width={160} height={100} rx={4} fill="#5a5a5a" stroke="#444" strokeWidth={2} />
      <Rect x={4} y={4} width={152} height={92} rx={2} fill="#4a4a4a" stroke="#3a3a3a" strokeWidth={1} />
      <Rect x={20} y={50} width={120} height={8} rx={2} fill="#6a6a6a" stroke="#555" strokeWidth={1} />
      <Rect x={28} y={58} width={32} height={24} rx={2} fill="#3a3a3a" stroke="#D9A05B" strokeWidth={1} />
      <SvgText x={44} y={73} fontSize={5} fill="#D9A05B" textAnchor="middle">RCD</SvgText>
      {[0, 1, 2].map(i => (
        <Rect key={i} x={68 + i * 28} y={58} width={22} height={24} rx={2} fill="#3a3a3a" stroke="#888" strokeWidth={1} />
      ))}
      <SvgText x={80} y={22} fontSize={9} fill="#fff" textAnchor="middle" fontWeight="bold">{displayLabel}</SvgText>
      <SvgText x={80} y={38} fontSize={6} fill="#D9A05B" textAnchor="middle">Type A 30mA RCD</SvgText>
      <Rect x={70} y={-2} width={20} height={6} fill="#333" stroke="#555" strokeWidth={1} />
      <Rect x={70} y={96} width={20} height={6} fill="#333" stroke="#555" strokeWidth={1} />
      <Circle cx={140} cy={100} r={4} fill="none" stroke="#D9A05B" strokeWidth={1.5} />
      <Line x1={137} y1={97} x2={143} y2={103} stroke="#D9A05B" strokeWidth={1} />
      <Line x1={143} y1={97} x2={137} y2={103} stroke="#D9A05B" strokeWidth={1} />
    </G>
  );
}
