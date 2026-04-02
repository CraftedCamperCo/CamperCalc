import type { WiringSpec, SystemArchetype } from '@/utils/wiringTypes';
import React from 'react';
import { Dimensions } from 'react-native';
import Svg, { Rect, Text as SvgText, Line, G, Circle, Defs, LinearGradient, Stop } from 'react-native-svg';

const COLORS = {
  red: '#E74C3C',
  black: '#2C3E50',
  green_yellow: '#27AE60',
  brown: '#8B572A',
  blue: '#3498DB',
  grey: '#95A5A6',
  wire: { red: '#E74C3C', black: '#34495E', green_yellow: '#27AE60', brown: '#8B4513', blue: '#2980B9', grey: '#7F8C8D' },
  bg: '#1A1A2E',
  cardBg: '#252540',
  text: '#ECF0F1',
  textDim: '#7F8C8D',
  accent: '#D9A05B',
  positive: '#E74C3C',
  negative: '#2C3E50',
};

interface Box {
  id: string;
  label: string;
  sublabel?: string;
  x: number;
  y: number;
  w: number;
  h: number;
  color: string;
}

interface Wire {
  from: { x: number; y: number };
  to: { x: number; y: number };
  color: string;
  label?: string;
  dashed?: boolean;
}

function layoutComponents(spec: WiringSpec): { boxes: Box[]; wires: Wire[]; width: number; height: number } {
  const boxes: Box[] = [];
  const wires: Wire[] = [];
  const W = 130;
  const H = 48;
  const GAP = 20;

  const battery = spec.components.find(c => c.product.category === 'battery');
  const shunt = spec.components.find(c => c.product.id === 'smartshunt_500');
  const inverter = spec.components.find(c => c.product.category === 'inverterCharger' || c.product.category === 'inverter');
  const mppt = spec.components.find(c => c.product.category === 'mppt');
  const dcdc = spec.components.find(c => c.product.category === 'dcdc');
  const bp = spec.components.find(c => c.product.category === 'protect');
  const lynxDist = spec.components.find(c => c.product.id === 'lynx_dist');
  const lynxPower = spec.components.find(c => c.product.id === 'lynx_power_in');

  let col = 0;
  const centerX = (c: number) => c * (W + GAP * 2) + GAP;
  const row1Y = GAP;
  const row2Y = GAP + H + GAP * 3;
  const row3Y = row2Y + H + GAP * 3;
  const row4Y = row3Y + H + GAP * 3;

  if (battery) boxes.push({ id: 'battery', label: 'LiFePO4 Battery', sublabel: `${battery.product.specs.capacity}Ah`, x: centerX(0), y: row2Y, w: W, h: H, color: COLORS.accent });
  if (shunt) boxes.push({ id: 'shunt', label: 'SmartShunt', sublabel: '500A', x: centerX(1), y: row2Y, w: W * 0.8, h: H, color: COLORS.textDim });

  if (lynxPower) boxes.push({ id: 'lynx_pi', label: 'Lynx Power In', x: centerX(2), y: row2Y, w: W, h: H, color: '#6C5CE7' });
  if (lynxDist) boxes.push({ id: 'lynx_dist', label: 'Lynx Distributor', sublabel: '4x MEGA', x: centerX(2), y: row3Y, w: W * 1.4, h: H, color: '#6C5CE7' });

  const distCol = lynxDist ? 2 : 1;

  if (inverter) boxes.push({ id: 'inverter', label: inverter.product.name, sublabel: `${inverter.product.specs.continuousVA}VA`, x: centerX(distCol + 1), y: row2Y, w: W, h: H, color: '#0984E3' });
  if (mppt) boxes.push({ id: 'mppt', label: mppt.product.name, sublabel: `${mppt.product.specs.maxChargeAmps}A`, x: centerX(distCol + 1), y: row3Y, w: W, h: H, color: '#00B894' });
  if (dcdc) boxes.push({ id: 'dcdc', label: dcdc.product.name, sublabel: `${dcdc.product.specs.outputAmps}A`, x: centerX(distCol + 2), y: row2Y, w: W, h: H, color: '#E17055' });
  if (bp) boxes.push({ id: 'bp', label: 'Battery Protect', sublabel: `${bp.product.specs.maxCurrent}A`, x: centerX(distCol + 2), y: row3Y, w: W * 0.9, h: H, color: '#FDCB6E' });

  boxes.push({ id: 'solar', label: 'Solar Panels', sublabel: mppt ? `${spec.components.find(c => c.product.category === 'mppt')?.product.specs.maxPvPower12V ?? ''}W` : '', x: centerX(distCol + 1), y: row1Y, w: W * 0.9, h: H * 0.8, color: '#F39C12' });
  if (dcdc) boxes.push({ id: 'starter', label: 'Starter Battery', x: centerX(distCol + 2), y: row1Y, w: W * 0.9, h: H * 0.8, color: '#636E72' });
  boxes.push({ id: 'fuse_block', label: 'DC Fuse Block', sublabel: '12V Loads', x: centerX(distCol + 2), y: row4Y, w: W, h: H, color: '#2D3436' });

  const findBox = (id: string) => boxes.find(b => b.id === id);
  const center = (b: Box) => ({ x: b.x + b.w / 2, y: b.y + b.h / 2 });
  const bottom = (b: Box) => ({ x: b.x + b.w / 2, y: b.y + b.h });
  const top = (b: Box) => ({ x: b.x + b.w / 2, y: b.y });
  const right = (b: Box) => ({ x: b.x + b.w, y: b.y + b.h / 2 });
  const left = (b: Box) => ({ x: b.x, y: b.y + b.h / 2 });

  const bat = findBox('battery');
  const sht = findBox('shunt');
  if (bat && sht) wires.push({ from: right(bat), to: left(sht), color: COLORS.wire.black, label: 'NEG' });

  const lpi = findBox('lynx_pi');
  const ld = findBox('lynx_dist');
  if (sht && lpi) wires.push({ from: right(sht), to: left(lpi), color: COLORS.wire.red, label: 'POS' });
  else if (sht && !lpi) {
    const inv = findBox('inverter');
    if (inv) wires.push({ from: right(sht), to: left(inv), color: COLORS.wire.red });
  }
  if (lpi && ld) wires.push({ from: bottom(lpi), to: top(ld), color: COLORS.wire.red });

  const invBox = findBox('inverter');
  const mpptBox = findBox('mppt');
  const dcdcBox = findBox('dcdc');
  const bpBox = findBox('bp');
  const solarBox = findBox('solar');
  const starterBox = findBox('starter');
  const fuseBlockBox = findBox('fuse_block');

  if (ld) {
    if (invBox) wires.push({ from: right(ld), to: left(invBox), color: COLORS.wire.red });
    if (mpptBox) wires.push({ from: { x: ld.x + ld.w, y: ld.y + ld.h * 0.7 }, to: left(mpptBox), color: COLORS.wire.red });
    if (bpBox) wires.push({ from: { x: ld.x + ld.w, y: ld.y + ld.h * 0.3 }, to: left(bpBox), color: COLORS.wire.red });
  }

  if (solarBox && mpptBox) wires.push({ from: bottom(solarBox), to: top(mpptBox), color: COLORS.wire.red, label: 'PV' });
  if (starterBox && dcdcBox) wires.push({ from: bottom(starterBox), to: top(dcdcBox), color: COLORS.wire.red, label: 'ALT' });
  if (bpBox && fuseBlockBox) wires.push({ from: bottom(bpBox), to: top(fuseBlockBox), color: COLORS.wire.red, label: '12V' });

  const maxX = Math.max(...boxes.map(b => b.x + b.w)) + GAP;
  const maxY = Math.max(...boxes.map(b => b.y + b.h)) + GAP * 2;

  return { boxes, wires, width: maxX, height: maxY };
}

interface Props { spec: WiringSpec; }

export default function SchematicDiagram({ spec }: Props) {
  const { boxes, wires, width: layoutW, height: layoutH } = layoutComponents(spec);
  const screenW = Dimensions.get('window').width - 48;
  const scale = screenW / layoutW;
  const svgH = layoutH * scale;

  return (
    <Svg width={screenW} height={svgH} viewBox={`0 0 ${layoutW} ${layoutH}`}>
      <Defs>
        <LinearGradient id="bgGrad" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#1a1a2e" />
          <Stop offset="1" stopColor="#16213e" />
        </LinearGradient>
      </Defs>
      <Rect x="0" y="0" width={layoutW} height={layoutH} fill="url(#bgGrad)" rx="12" />

      {wires.map((w, i) => (
        <G key={`w${i}`}>
          <Line x1={w.from.x} y1={w.from.y} x2={w.to.x} y2={w.to.y} stroke={w.color} strokeWidth={2.5} strokeLinecap="round" strokeDasharray={w.dashed ? '6,4' : undefined} />
          {w.label && (
            <SvgText x={(w.from.x + w.to.x) / 2} y={(w.from.y + w.to.y) / 2 - 6} fill={COLORS.textDim} fontSize={8} textAnchor="middle" fontWeight="600">{w.label}</SvgText>
          )}
        </G>
      ))}

      {boxes.map((box) => (
        <G key={box.id}>
          <Rect x={box.x} y={box.y} width={box.w} height={box.h} rx={8} fill={box.color} opacity={0.85} />
          <Rect x={box.x} y={box.y} width={box.w} height={box.h} rx={8} fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth={1} />
          <SvgText x={box.x + box.w / 2} y={box.y + (box.sublabel ? box.h / 2 - 2 : box.h / 2 + 4)} fill="#fff" fontSize={9} fontWeight="700" textAnchor="middle">{box.label}</SvgText>
          {box.sublabel && (
            <SvgText x={box.x + box.w / 2} y={box.y + box.h / 2 + 12} fill="rgba(255,255,255,0.7)" fontSize={8} textAnchor="middle">{box.sublabel}</SvgText>
          )}
          <Circle cx={box.x + 8} cy={box.y + box.h / 2} r={3} fill={COLORS.positive} />
          <Circle cx={box.x + box.w - 8} cy={box.y + box.h / 2} r={3} fill={COLORS.negative} />
        </G>
      ))}

      <SvgText x={layoutW / 2} y={layoutH - 8} fill={COLORS.textDim} fontSize={7} textAnchor="middle">
        {spec.archetype.replace(/_/g, ' ')} Architecture — Generated by CamperPlan
      </SvgText>
    </Svg>
  );
}
