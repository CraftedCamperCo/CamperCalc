/**
 * Shared helper SVG sub-components for wiring diagrams.
 * Ported from wiring-prototype to react-native-svg.
 */
import React from 'react';
import {
  G, Rect, Circle, Line, Path, Text as SvgText, Defs, LinearGradient, Stop,
} from 'react-native-svg';

// ─── InlineFuse ──────────────────────────────────────────────────────────────

interface InlineFuseProps {
  x: number;
  y: number;
  rating: string;
  type?: string;
  orientation?: 'horizontal' | 'vertical';
}

export function InlineFuse({ x, y, rating, type, orientation = 'horizontal' }: InlineFuseProps) {
  const isVert = orientation === 'vertical';
  const w = isVert ? 24 : 44;
  const h = isVert ? 44 : 24;
  return (
    <G x={x} y={y}>
      <Rect x={-w / 2} y={-h / 2} width={w} height={h} rx={4} fill="#C0392B" />
      <Rect x={-w / 2 + 2} y={-h / 2 + 2} width={w - 4} height={h - 4} rx={3} fill="#E74C3C" />
      {isVert ? (
        <>
          <SvgText x={0} y={-2} fontSize={8} fill="#fff" textAnchor="middle" fontWeight="bold">{rating}</SvgText>
          {type && <SvgText x={0} y={10} fontSize={6} fill="rgba(255,255,255,0.8)" textAnchor="middle">{type}</SvgText>}
          <Line x1={0} y1={-h / 2 - 4} x2={0} y2={-h / 2} stroke="#C0392B" strokeWidth={3} />
          <Line x1={0} y1={h / 2} x2={0} y2={h / 2 + 4} stroke="#C0392B" strokeWidth={3} />
        </>
      ) : (
        <>
          <SvgText x={type ? -4 : 0} y={4} fontSize={8} fill="#fff" textAnchor="middle" fontWeight="bold">{rating}</SvgText>
          {type && <SvgText x={16} y={4} fontSize={6} fill="rgba(255,255,255,0.8)" textAnchor="start">{type}</SvgText>}
          <Line x1={-w / 2 - 4} y1={0} x2={-w / 2} y2={0} stroke="#C0392B" strokeWidth={3} />
          <Line x1={w / 2} y1={0} x2={w / 2 + 4} y2={0} stroke="#C0392B" strokeWidth={3} />
        </>
      )}
    </G>
  );
}

// ─── TerminalLug ─────────────────────────────────────────────────────────────

interface TerminalLugProps {
  x: number;
  y: number;
  label: string;
  orientation?: 'left' | 'right' | 'up' | 'down';
  color?: string;
  id: string;
}

export function TerminalLug({ x, y, label, orientation = 'right', color = '#B87333', id }: TerminalLugProps) {
  const rotations: Record<string, number> = { right: 0, down: 90, left: 180, up: 270 };
  const rot = rotations[orientation];
  const barrelId = `${id}-barrel`;
  const ringId = `${id}-ring`;
  return (
    <G x={x} y={y} rotation={rot} origin={`${x}, ${y}`}>
      <Defs>
        <LinearGradient id={barrelId} x1="0%" y1="0%" x2="0%" y2="100%">
          <Stop offset="0%" stopColor="#D4A76A" />
          <Stop offset="30%" stopColor="#B87333" />
          <Stop offset="70%" stopColor="#8B5A2B" />
          <Stop offset="100%" stopColor="#6B4423" />
        </LinearGradient>
        <LinearGradient id={ringId} x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#D4A76A" />
          <Stop offset="50%" stopColor="#B87333" />
          <Stop offset="100%" stopColor="#8B5A2B" />
        </LinearGradient>
      </Defs>
      <Circle cx={0} cy={0} r={6} fill={`url(#${ringId})`} />
      <Circle cx={0} cy={0} r={3} fill="#1A1A1A" />
      <Rect x={5} y={-4} width={16} height={8} rx={2} fill={`url(#${barrelId})`} />
      <Line x1={10} y1={-3.5} x2={10} y2={3.5} stroke="#6B4423" strokeWidth={0.5} />
      <Line x1={14} y1={-3.5} x2={14} y2={3.5} stroke="#6B4423" strokeWidth={0.5} />
    </G>
  );
}

// ─── WireSVG ─────────────────────────────────────────────────────────────────

interface Pt { x: number; y: number }

function gaugeToStrokeWidth(gauge?: number): number {
  if (!gauge) return 2;
  if (gauge <= 6) return 1.5;
  if (gauge <= 16) return 2.5;
  if (gauge <= 35) return 3.5;
  if (gauge <= 70) return 4.5;
  return 5.5;
}

function buildOrthogonalPath(from: Pt, to: Pt, waypoints?: Pt[]): Pt[] {
  if (waypoints && waypoints.length > 0) return [from, ...waypoints, to];
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  if (Math.abs(dx) < 2) return [from, to];
  if (Math.abs(dy) < 2) return [from, to];
  if (Math.abs(dx) >= Math.abs(dy)) {
    const midX = from.x + dx / 2;
    return [from, { x: midX, y: from.y }, { x: midX, y: to.y }, to];
  } else {
    const midY = from.y + dy / 2;
    return [from, { x: from.x, y: midY }, { x: to.x, y: midY }, to];
  }
}

function longestSegmentMidpoint(points: Pt[]): { point: Pt; isVertical: boolean } {
  let bestLen = 0;
  let bestMid: Pt = points[0];
  let bestVert = false;
  for (let i = 0; i < points.length - 1; i++) {
    const a = points[i], b = points[i + 1];
    const len = Math.abs(b.x - a.x) + Math.abs(b.y - a.y);
    if (len > bestLen) {
      bestLen = len;
      bestMid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
      bestVert = Math.abs(b.x - a.x) < Math.abs(b.y - a.y);
    }
  }
  return { point: bestMid, isVertical: bestVert };
}

interface LugSpec { label: string; orientation?: 'left' | 'right' | 'up' | 'down' }
interface FuseSpec { rating: string; type?: string; position?: number }

interface WireSVGProps {
  from: Pt;
  to: Pt;
  color: string;
  gauge?: number;
  gaugeLabel?: string;
  strokeWidth?: number;
  lugFrom?: LugSpec;
  lugTo?: LugSpec;
  fuse?: FuseSpec;
  label?: string;
  dashed?: boolean;
  waypoints?: Pt[];
  wireId: string;
}

export function WireSVG({
  from, to, color, gauge, gaugeLabel, strokeWidth, lugFrom, lugTo,
  fuse, label, dashed, waypoints, wireId,
}: WireSVGProps) {
  const sw = strokeWidth ?? gaugeToStrokeWidth(gauge);
  const points = buildOrthogonalPath(from, to, waypoints);
  const d = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const { point: labelPt, isVertical } = longestSegmentMidpoint(points);

  const fusePos = fuse?.position ?? 0.3;
  let fusePt: Pt | null = null;
  let fuseOrientation: 'horizontal' | 'vertical' = 'horizontal';
  if (fuse) {
    const totalLen = points.reduce((acc, p, i) => {
      if (i === 0) return 0;
      return acc + Math.abs(p.x - points[i - 1].x) + Math.abs(p.y - points[i - 1].y);
    }, 0);
    const targetLen = totalLen * fusePos;
    let accum = 0;
    for (let i = 1; i < points.length; i++) {
      const seg = Math.abs(points[i].x - points[i - 1].x) + Math.abs(points[i].y - points[i - 1].y);
      if (accum + seg >= targetLen) {
        const ratio = (targetLen - accum) / seg;
        fusePt = {
          x: points[i - 1].x + (points[i].x - points[i - 1].x) * ratio,
          y: points[i - 1].y + (points[i].y - points[i - 1].y) * ratio,
        };
        fuseOrientation = Math.abs(points[i].x - points[i - 1].x) < Math.abs(points[i].y - points[i - 1].y) ? 'vertical' : 'horizontal';
        break;
      }
      accum += seg;
    }
  }

  const gaugeLabelText = gaugeLabel ?? (gauge ? `${gauge}mm²` : undefined);

  return (
    <G>
      <Path d={d} fill="none" stroke={color} strokeWidth={sw}
        strokeDasharray={dashed ? '8 4' : undefined}
        strokeLinecap="round" strokeLinejoin="round" />

      {gaugeLabelText && (
        <G>
          <Rect
            x={labelPt.x + (isVertical ? 6 : -24)}
            y={labelPt.y + (isVertical ? -7 : -16)}
            width={48} height={14} rx={3} fill="rgba(26,26,26,0.9)" />
          <SvgText
            x={labelPt.x + (isVertical ? 30 : 0)}
            y={labelPt.y + (isVertical ? 4 : -5)}
            fontSize={8} fill="#D9A05B" textAnchor="middle" fontWeight="bold">
            {gaugeLabelText}
          </SvgText>
        </G>
      )}

      {fuse && fusePt && (
        <InlineFuse x={fusePt.x} y={fusePt.y} rating={fuse.rating} type={fuse.type} orientation={fuseOrientation} />
      )}

      {lugFrom && <TerminalLug x={from.x} y={from.y} label={lugFrom.label} orientation={lugFrom.orientation} color={color === '#333' || color === '#000' ? '#aaa' : '#D9A05B'} id={`${wireId}-lf`} />}
      {lugTo && <TerminalLug x={to.x} y={to.y} label={lugTo.label} orientation={lugTo.orientation} color={color === '#333' || color === '#000' ? '#aaa' : '#D9A05B'} id={`${wireId}-lt`} />}

      {label && (
        <SvgText x={labelPt.x} y={labelPt.y + (isVertical ? 0 : 22)} fontSize={7} fill="#888" textAnchor="middle">
          {label}
        </SvgText>
      )}
    </G>
  );
}

// ─── RegulationBox ───────────────────────────────────────────────────────────

function wrapText(text: string, maxWidth: number, fontSize: number): string[] {
  const charWidth = fontSize * 0.52;
  const maxChars = Math.floor(maxWidth / charWidth);
  const words = text.split(' ');
  const lines: string[] = [];
  let current = '';
  for (const word of words) {
    if ((current + ' ' + word).trim().length > maxChars) {
      if (current) lines.push(current);
      current = word;
    } else {
      current = current ? current + ' ' + word : word;
    }
  }
  if (current) lines.push(current);
  return lines;
}

interface RegulationBoxProps { x: number; y: number; width: number; standard: string; clause: string; text: string }

export function RegulationBox({ x, y, width, standard, clause, text }: RegulationBoxProps) {
  const lines = wrapText(text, width - 24, 8);
  const height = 44 + lines.length * 13;
  return (
    <G x={x} y={y}>
      <Rect x={0} y={0} width={width} height={height} rx={6}
        fill="rgba(248,249,250,0.95)" stroke="#D9A05B" strokeWidth={1.5} strokeDasharray="6 4" />
      <SvgText x={12} y={18} fontSize={10} fill="#1A1A1A" fontWeight="bold">REGULATION:</SvgText>
      <SvgText x={12} y={34} fontSize={8} fill="#333">{standard} {clause}</SvgText>
      {lines.map((line, i) => (
        <SvgText key={i} x={12} y={50 + i * 13} fontSize={8} fill="#555" fontStyle="italic">
          "{line}"
        </SvgText>
      ))}
    </G>
  );
}

// ─── ActionBox ───────────────────────────────────────────────────────────────

interface ActionBoxProps { x: number; y: number; width: number; text: string; priority: 'critical' | 'important' | 'info' }

export function ActionBox({ x, y, width, text, priority }: ActionBoxProps) {
  const borderColor = priority === 'critical' ? '#C0392B' : priority === 'important' ? '#D9A05B' : '#3498DB';
  const bgColor = priority === 'critical' ? 'rgba(192,57,43,0.08)' : priority === 'important' ? 'rgba(217,160,91,0.1)' : 'rgba(52,152,219,0.08)';
  const textColor = priority === 'critical' ? '#C0392B' : priority === 'important' ? '#1A1A1A' : '#2980B9';
  const lines = wrapText(text, width - 24, 8);
  const height = 28 + lines.length * 13;
  return (
    <G x={x} y={y}>
      <Rect x={0} y={0} width={width} height={height} rx={6} fill={bgColor} stroke={borderColor} strokeWidth={2} />
      <SvgText x={12} y={18} fontSize={10} fill={borderColor} fontWeight="bold">ACTION:</SvgText>
      {lines.map((line, i) => (
        <SvgText key={i} x={12} y={34 + i * 13} fontSize={8} fill={textColor}>{line}</SvgText>
      ))}
    </G>
  );
}
