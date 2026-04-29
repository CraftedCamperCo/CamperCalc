/**
 * V3 — Zone-based layout rewrite.
 * Fixed 1190x842 landscape canvas (A4 proportions).
 * Numbered component references with a sidebar key table.
 * Clean wire routing with gauge-only labels (no verbose descriptions).
 * Regulation boxes stacked in left margin. Sidebar for key/legend/glossary.
 */
import { drawComponent, drawLug, type ComponentSpec } from './schematicComponents';
import {
  COMPONENT_RULES,
  GAUGE_STROKE,
  ROUTING,
  WIRE_COLOURS,
  getEffectiveGauge,
  getPortRule,
  type WireGauge,
} from './schematicRules';
import type { SystemConfig, WireConnection, WiringSpec } from './wiringTypes';

// ────────────────────────────────────────────────────────────────────────────
// 1. HELPERS
// ────────────────────────────────────────────────────────────────────────────

interface Pt { x: number; y: number }
interface Rect { x: number; y: number; w: number; h: number }
type NetClass = 'dc_hi' | 'dc_lo' | 'ac_in' | 'ac_out' | 'earth' | 'signal';
interface Seg { a: Pt; b: Pt; cls: NetClass | 'unknown' }
interface WireSeg { a: Pt; b: Pt }

function wrapText(text: string, maxChars: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let cur = '';
  for (const w of words) {
    if (cur.length + w.length + 1 > maxChars && cur.length > 0) { lines.push(cur); cur = w; }
    else cur = cur ? `${cur} ${w}` : w;
  }
  if (cur) lines.push(cur);
  return lines;
}

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function gaugeToStroke(g: number): number {
  const gaugeKey = Number.isInteger(g) ? String(g) : String(g);
  const exactFromRules = GAUGE_STROKE[gaugeKey as WireGauge];
  if (typeof exactFromRules === 'number') return exactFromRules * WIRE_THICKNESS_SCALE;

  const exactScale: Record<string, number> = {
    '1.5': 1.5,
    '2.5': 2.0,
    '4': 2.8,
    '6': 3.5,
    '10': 4.5,
    '16': 6.0,
    '25': 8.0,
    '35': 7.0,
    '50': 9.0,
    '70': 11.0,
  };
  const exact = exactScale[gaugeKey];
  if (typeof exact === 'number') return exact * WIRE_THICKNESS_SCALE;

  if (g >= 70) return 11.0 * WIRE_THICKNESS_SCALE;
  if (g >= 50) return 9.0 * WIRE_THICKNESS_SCALE;
  if (g >= 35) return 7.0 * WIRE_THICKNESS_SCALE;
  if (g >= 25) return 8.0 * WIRE_THICKNESS_SCALE;
  if (g >= 16) return 6.0 * WIRE_THICKNESS_SCALE;
  if (g >= 10) return 4.5 * WIRE_THICKNESS_SCALE;
  if (g >= 6) return 3.5 * WIRE_THICKNESS_SCALE;
  if (g >= 4) return 2.8 * WIRE_THICKNESS_SCALE;
  if (g >= 2.5) return 2.0 * WIRE_THICKNESS_SCALE;
  return 1.5 * WIRE_THICKNESS_SCALE;
}

const WC = { red: '#C0392B', blk: '#2C3E50', gn: '#27AE60', brn: '#8B4513', blu: '#2980B9' };
const STUB = 20;
const COMPONENT_SCALE = 0.77;
const WIRE_THICKNESS_SCALE = 0.8;
const LEFT_EDGE_MIN_X = 60;
const scaleDim = (v: number, min = 10) => Math.max(min, Math.round(v * COMPONENT_SCALE));
// ENGINE RULE: MultiPlus port positions match the real product bottom edge.
// All ports clustered in the right-centre ~40% of the unit width, not spread
// across the full width. Order left→right: AC-Out, AC-In, Earth, DC−, DC+
const INV_PORT_RATIO = {
  acOut: 0.38,
  acIn: 0.48,
  earth: 0.58,
  dcNeg: 0.70,
  dcPos: 0.82,
} as const;

let usedRects: { x: number; y: number; w: number; h: number }[] = [];
let routedSegs: Seg[] = [];
let drawnSegments: WireSeg[] = [];
let wireIdCounter = 0;

function simplifyPolyline(points: Pt[]): Pt[] {
  if (points.length <= 2) return points;
  const out: Pt[] = [points[0]];
  for (let i = 1; i < points.length - 1; i++) {
    const p0 = out[out.length - 1];
    const p1 = points[i];
    const p2 = points[i + 1];
    // skip exact duplicates
    if (p1.x === p0.x && p1.y === p0.y) continue;
    // skip collinear orthogonal middle points
    const collinearX = p0.x === p1.x && p1.x === p2.x;
    const collinearY = p0.y === p1.y && p1.y === p2.y;
    if (collinearX || collinearY) continue;
    out.push(p1);
  }
  out.push(points[points.length - 1]);
  return out;
}

function segmentIntersectsRect(a: Pt, b: Pt, rect: Rect, padding = 4): boolean {
  const r = {
    x: rect.x - padding,
    y: rect.y - padding,
    w: rect.w + padding * 2,
    h: rect.h + padding * 2,
  };

  if (a.y === b.y) {
    const minX = Math.min(a.x, b.x);
    const maxX = Math.max(a.x, b.x);
    return a.y >= r.y && a.y <= r.y + r.h && maxX >= r.x && minX <= r.x + r.w;
  }
  if (a.x === b.x) {
    const minY = Math.min(a.y, b.y);
    const maxY = Math.max(a.y, b.y);
    return a.x >= r.x && a.x <= r.x + r.w && maxY >= r.y && minY <= r.y + r.h;
  }
  return false;
}

function pathIntersectsAny(points: Pt[], obstacles: Rect[]): boolean {
  for (let i = 0; i < points.length - 1; i++) {
    for (const rect of obstacles) {
      if (segmentIntersectsRect(points[i], points[i + 1], rect)) return true;
    }
  }
  return false;
}

function crossingBump(pt: Pt, isHorizontal: boolean, color: string, strokeWidth: number): string {
  const r = 3;
  if (isHorizontal) {
    return `<path d="M${pt.x - r},${pt.y} A${r},${r} 0 0,1 ${pt.x + r},${pt.y}" fill="none" stroke="${color}" stroke-width="${strokeWidth}"/>`;
  }
  return `<path d="M${pt.x},${pt.y - r} A${r},${r} 0 0,1 ${pt.x},${pt.y + r}" fill="none" stroke="${color}" stroke-width="${strokeWidth}"/>`;
}

function findCrossings(seg: WireSeg, existing: WireSeg[]): Pt[] {
  const crossings: Pt[] = [];
  const isHoriz = seg.a.y === seg.b.y;
  for (const other of existing) {
    const otherHoriz = other.a.y === other.b.y;
    if (isHoriz === otherHoriz) continue;

    const h = isHoriz ? seg : other;
    const v = isHoriz ? other : seg;
    const hY = h.a.y;
    const vX = v.a.x;
    const hMinX = Math.min(h.a.x, h.b.x);
    const hMaxX = Math.max(h.a.x, h.b.x);
    const vMinY = Math.min(v.a.y, v.b.y);
    const vMaxY = Math.max(v.a.y, v.b.y);

    // Strictly internal crossing only, not shared endpoints/touches.
    if (vX > hMinX && vX < hMaxX && hY > vMinY && hY < vMaxY) {
      crossings.push({ x: vX, y: hY });
    }
  }
  return crossings;
}

let shownGaugeLabels = new Map<string, number>();
interface ParallelNominalSeg {
  axis: 'h' | 'v';
  coord: number;
  min: number;
  max: number;
  offset: number;
  netClass: Seg['cls'];
  color: string;
}
let nominalParallelSegs: ParallelNominalSeg[] = [];

function findW(cs: WireConnection[], ...kw: string[]) {
  return cs.find(w => kw.every(k => w.label.toLowerCase().includes(k.toLowerCase())));
}

type RouteHint = 'auto' | 'direct' | 'direct-v' | 'top' | 'bottom' | 'left' | 'right';

// ────────────────────────────────────────────────────────────────────────────
// 2. WIRE DRAWING (gauge labels only — no verbose description labels)
// ────────────────────────────────────────────────────────────────────────────

function wire(from: Pt, to: Pt, color: string, gauge: number, waypoints?: Pt[], opts?: {
  dashed?: boolean; netClass?: Seg['cls']; fuse?: unknown; strokeWidth?: number;
}): string {
  const { dashed = false, netClass = 'unknown', strokeWidth } = opts ?? {};
  const pts = simplifyPolyline([from, ...(waypoints ?? []), to]);
  const segPoints = [...pts];
  // ═══ ORTHOGONAL ENFORCEMENT ═══
  // No diagonal segments allowed. Insert a corner where needed.
  for (let i = 1; i < segPoints.length; i++) {
    if (segPoints[i].x !== segPoints[i - 1].x && segPoints[i].y !== segPoints[i - 1].y) {
      segPoints.splice(i, 0, { x: segPoints[i].x, y: segPoints[i - 1].y });
      i++;
    }
  }

  const overlapLen = (a1: number, a2: number, b1: number, b2: number): number => {
    const lo = Math.max(Math.min(a1, a2), Math.min(b1, b2));
    const hi = Math.min(Math.max(a1, a2), Math.max(b1, b2));
    return Math.max(0, hi - lo);
  };
  const isDcPair = (aColor: string, aClass: Seg['cls'], bColor: string, bClass: Seg['cls']): boolean => {
    if (aClass !== 'dc_hi' || bClass !== 'dc_hi') return false;
    const isRB = (aColor === WC.red && bColor === WC.blk) || (aColor === WC.blk && bColor === WC.red);
    return isRB;
  };
  const chooseSymmetricOffset = (occupied: number[], spacing: number): number => {
    const tol = 0.25;
    if (occupied.length === 0) return 0;
    const hasZero = occupied.some((o) => Math.abs(o) <= tol);
    if (!hasZero) return 0;
    const seq: number[] = [];
    for (let i = 1; i <= 6; i++) seq.push(i * spacing, -i * spacing);
    for (const c of seq) {
      if (!occupied.some((o) => Math.abs(o - c) <= tol)) return c;
    }
    return (occupied.length + 1) * spacing;
  };
  const applyParallelOffset = (basePts: Pt[]): { shifted: Pt[]; offsetAxis: 'h' | 'v' | null; offset: number } => {
    if (basePts.length < 3) return { shifted: basePts, offsetAxis: null, offset: 0 };
    let bestAxis: 'h' | 'v' | null = null;
    let bestCoord = 0;
    let bestMin = 0;
    let bestMax = 0;
    let bestOverlap = 0;
    let bestPair = false;
    const overlappingOffsets: number[] = [];

    for (let i = 0; i < basePts.length - 1; i++) {
      const a = basePts[i];
      const b = basePts[i + 1];
      const axis: 'h' | 'v' | null = a.y === b.y ? 'h' : a.x === b.x ? 'v' : null;
      if (!axis) continue;
      const coord = axis === 'h' ? a.y : a.x;
      const min = axis === 'h' ? Math.min(a.x, b.x) : Math.min(a.y, b.y);
      const max = axis === 'h' ? Math.max(a.x, b.x) : Math.max(a.y, b.y);
      for (const ex of nominalParallelSegs) {
        if (ex.axis !== axis) continue;
        if (Math.abs(ex.coord - coord) > 0.5) continue;
        const ov = overlapLen(min, max, ex.min, ex.max);
        if (ov < 12) continue;
        if (ov > bestOverlap) {
          bestOverlap = ov;
          bestAxis = axis;
          bestCoord = coord;
          bestMin = min;
          bestMax = max;
          bestPair = isDcPair(color, netClass, ex.color, ex.netClass);
        }
        overlappingOffsets.push(ex.offset);
      }
    }

    const parallelWireSpacing = ROUTING?.parallelWireSpacing ?? 5;
    const pairedWireSpacing = ROUTING?.pairedWireSpacing ?? 8;
    const spacing = bestPair ? pairedWireSpacing : parallelWireSpacing;
    const chosenOffset = chooseSymmetricOffset(overlappingOffsets, spacing);
    if (!bestAxis || chosenOffset === 0) {
      for (let i = 0; i < basePts.length - 1; i++) {
        const a = basePts[i];
        const b = basePts[i + 1];
        const axis: 'h' | 'v' | null = a.y === b.y ? 'h' : a.x === b.x ? 'v' : null;
        if (!axis) continue;
        const coord = axis === 'h' ? a.y : a.x;
        const min = axis === 'h' ? Math.min(a.x, b.x) : Math.min(a.y, b.y);
        const max = axis === 'h' ? Math.max(a.x, b.x) : Math.max(a.y, b.y);
        nominalParallelSegs.push({ axis, coord, min, max, offset: 0, netClass, color });
      }
      return { shifted: basePts, offsetAxis: null, offset: 0 };
    }

    const shifted = basePts.map((p, idx) => {
      if (idx === 0 || idx === basePts.length - 1) return p; // Keep exact port coordinates.
      return bestAxis === 'h' ? { x: p.x, y: p.y + chosenOffset } : { x: p.x + chosenOffset, y: p.y };
    });

    // Register nominal shared run with chosen offset so future wires spread around it.
    nominalParallelSegs.push({
      axis: bestAxis,
      coord: bestCoord,
      min: bestMin,
      max: bestMax,
      offset: chosenOffset,
      netClass,
      color,
    });
    for (let i = 0; i < basePts.length - 1; i++) {
      const a = basePts[i];
      const b = basePts[i + 1];
      const axis: 'h' | 'v' | null = a.y === b.y ? 'h' : a.x === b.x ? 'v' : null;
      if (!axis) continue;
      const coord = axis === 'h' ? a.y : a.x;
      const min = axis === 'h' ? Math.min(a.x, b.x) : Math.min(a.y, b.y);
      const max = axis === 'h' ? Math.max(a.x, b.x) : Math.max(a.y, b.y);
      nominalParallelSegs.push({ axis, coord, min, max, offset: chosenOffset, netClass, color });
    }
    return { shifted, offsetAxis: bestAxis, offset: chosenOffset };
  };

  const { shifted: drawPts } = applyParallelOffset(segPoints);
  const finalPts = [...drawPts];
  for (let i = 1; i < finalPts.length; i++) {
    if (finalPts[i].x !== finalPts[i - 1].x && finalPts[i].y !== finalPts[i - 1].y) {
      finalPts.splice(i, 0, { x: finalPts[i].x, y: finalPts[i - 1].y });
      i++;
    }
  }
  const sw = strokeWidth ?? gaugeToStroke(gauge);
  const dash = dashed ? ` stroke-dasharray="6 3"` : '';
  const wid = wireIdCounter++;

  let d = '';
  for (let i = 0; i < finalPts.length; i++) {
    d += i === 0 ? `M${finalPts[i].x},${finalPts[i].y}` : ` L${finalPts[i].x},${finalPts[i].y}`;
  }

  // ENGINE RULE: Wire path gets a unique ID so <textPath> can reference it.
  let svg = `<path id="w${wid}" d="${d}" fill="none" stroke="${color}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round"${dash}/>`;

  // ═══ ON-WIRE GAUGE LABEL ═══
  // Small text directly on the wire, not a large separate pill.
  const gaugeKey = `${netClass}:${gauge}`;
  const shownCount = shownGaugeLabels.get(gaugeKey) ?? 0;
  const shouldShowGauge = shownCount < 2;

  if (shouldShowGauge && finalPts.length >= 2) {
    let bestLen = 0;
    let bestIdx = -1;
    let bestIsVert = false;
    for (let i = 0; i < finalPts.length - 1; i++) {
      const dx = Math.abs(finalPts[i + 1].x - finalPts[i].x);
      const dy = Math.abs(finalPts[i + 1].y - finalPts[i].y);
      const len = dx + dy;
      if (len > bestLen) { bestLen = len; bestIdx = i; bestIsVert = dx < dy; }
    }
    if (bestIdx >= 0 && bestLen > 30) {
      const midX = (finalPts[bestIdx].x + finalPts[bestIdx + 1].x) / 2;
      const midY = (finalPts[bestIdx].y + finalPts[bestIdx + 1].y) / 2;
      const gLabel = `${gauge}mm²`;

      // Label sized to fit WITHIN the wire stroke thickness
      const sw = strokeWidth ?? gaugeToStroke(gauge);
      const labelH = Math.max(sw, 5); // pill height = wire thickness (min 5px)
      const fontSize = Math.min(labelH * 0.75, 5); // font scales with wire
      const labelW = gLabel.length * fontSize * 0.65 + 4;
      const bgFill = color === WC.red ? 'rgba(192,57,43,0.92)'
                   : color === WC.blk ? 'rgba(44,62,80,0.92)'
                   : color === WC.gn ? 'rgba(39,174,96,0.92)'
                   : color === WC.blu ? 'rgba(41,128,185,0.92)'
                   : 'rgba(80,80,80,0.92)';
      const labelRect = { x: midX - labelW / 2, y: midY - labelH / 2, w: labelW, h: labelH };
      const overlapsExisting = usedRects.some((r) =>
        !(labelRect.x + labelRect.w < r.x ||
          labelRect.x > r.x + r.w ||
          labelRect.y + labelRect.h < r.y ||
          labelRect.y > r.y + r.h)
      );

      // Keep labels from colliding with components/other labels.
      if (!overlapsExisting) {
        if (bestIsVert) {
          svg += `<g transform="rotate(-90, ${midX}, ${midY})">`;
          svg += `<rect x="${midX - labelW / 2}" y="${midY - labelH / 2}" width="${labelW}" height="${labelH}" rx="${labelH / 2}" fill="${bgFill}"/>`;
          svg += `<text x="${midX}" y="${midY}" text-anchor="middle" dominant-baseline="central" font-size="${fontSize}" fill="#FFF" font-weight="700" font-family="Arial,sans-serif">${gLabel}</text>`;
          svg += `</g>`;
        } else {
          svg += `<rect x="${midX - labelW / 2}" y="${midY - labelH / 2}" width="${labelW}" height="${labelH}" rx="${labelH / 2}" fill="${bgFill}"/>`;
          svg += `<text x="${midX}" y="${midY}" text-anchor="middle" dominant-baseline="central" font-size="${fontSize}" fill="#FFF" font-weight="700" font-family="Arial,sans-serif">${gLabel}</text>`;
        }
        usedRects.push(labelRect);
        shownGaugeLabels.set(gaugeKey, shownCount + 1);
      }
    }
  }

  // Add crossing bridge markers where this wire crosses prior wires.
  for (let i = 0; i < finalPts.length - 1; i++) {
    const seg: WireSeg = { a: finalPts[i], b: finalPts[i + 1] };
    const crosses = findCrossings(seg, drawnSegments);
    const isHoriz = seg.a.y === seg.b.y;
    for (const pt of crosses) {
      svg += crossingBump(pt, isHoriz, color, sw);
    }
  }

  // Register laid segments for subsequent route avoidance.
  for (let i = 0; i < finalPts.length - 1; i++) {
    routedSegs.push({ a: finalPts[i], b: finalPts[i + 1], cls: netClass });
    drawnSegments.push({ a: finalPts[i], b: finalPts[i + 1] });
  }

  return svg;
}

// ────────────────────────────────────────────────────────────────────────────
// 3. TERMINAL & POLARITY GRAPHICS
// ────────────────────────────────────────────────────────────────────────────

function terminalStud(x: number, y: number): string {
  return `<circle cx="${x}" cy="${y}" r="4" fill="#B8860B" stroke="#8B6914" stroke-width="1"/><circle cx="${x}" cy="${y}" r="1.8" fill="#DAA520"/>`;
}

function polarityMarker(x: number, y: number, type: '+' | '−' | 'E'): string {
  const color = type === '+' ? WC.red : type === '−' ? WC.blk : WC.gn;
  const bg = type === '+' ? '#FDEAEA' : type === '−' ? '#E8E8E8' : '#E8F8F0';
  return `<circle cx="${x}" cy="${y}" r="6" fill="${bg}" stroke="${color}" stroke-width="0.8"/><text x="${x}" y="${y + 3}" text-anchor="middle" font-size="8" fill="${color}" font-weight="900">${type}</text>`;
}

// ────────────────────────────────────────────────────────────────────────────
// 4. NUMBERED BADGE + COMPONENT KEY TABLE
// ────────────────────────────────────────────────────────────────────────────

function componentNumber(x: number, y: number, num: number): string {
  return `<circle cx="${x}" cy="${y}" r="8.5" fill="#D9A05B" stroke="#8B6914" stroke-width="1.1"/><text x="${x}" y="${y + 3.1}" text-anchor="middle" font-size="7.3" fill="#1A1A1A" font-weight="900">${num}</text>`;
}

function componentKeyTable(x: number, y: number, items: { num: number; name: string; detail: string }[]): string {
  const w = 258;
  const rowH = 15;
  const h = 22 + items.length * rowH + 4;
  let svg = `<g transform="translate(${x},${y})">`;
  svg += `<rect x="0" y="0" width="${w}" height="${h}" rx="5" fill="rgba(0,0,0,0.03)" stroke="#ccc" stroke-width="0.5"/>`;
  svg += `<rect x="0" y="0" width="${w}" height="18" rx="5" fill="#1A1A1A"/>`;
  svg += `<rect x="0" y="9" width="${w}" height="9" fill="#1A1A1A"/>`;
  svg += `<text x="${w / 2}" y="13" text-anchor="middle" font-size="7" fill="#D9A05B" font-weight="800" letter-spacing="1">COMPONENT KEY</text>`;
  items.forEach((it, i) => {
    const iy = 26 + i * rowH;
    svg += `<circle cx="14" cy="${iy}" r="7" fill="#D9A05B" stroke="#8B6914" stroke-width="0.7"/>`;
    svg += `<text x="14" y="${iy + 3}" text-anchor="middle" font-size="6" fill="#1A1A1A" font-weight="900">${it.num}</text>`;
    svg += `<text x="28" y="${iy + 3}" font-size="6.5" fill="#333" font-weight="700">${esc(it.name)}</text>`;
    if (it.detail) {
      svg += `<text x="${w - 6}" y="${iy + 3}" text-anchor="end" font-size="6" fill="#888">${esc(it.detail)}</text>`;
    }
  });
  svg += `</g>`;
  return svg;
}

// ────────────────────────────────────────────────────────────────────────────
// 5. REFERENCE SHEET TABLES
// ────────────────────────────────────────────────────────────────────────────

function dcCircuitsTable(x: number, y: number, circuits: { label: string; fuseA: number }[]): string {
  const w = 175;
  const rowH = 12;
  const headerH = 16;
  const h = headerH + circuits.length * rowH + 6;
  const colors = ['#E74C3C', '#E67E22', '#F1C40F', '#2ECC71', '#3498DB', '#9B59B6', '#1ABC9C', '#E74C3C'];
  let svg = `<g transform="translate(${x},${y})">`;
  svg += `<rect x="0" y="0" width="${w}" height="${h}" rx="4" fill="rgba(0,0,0,0.02)" stroke="#2C3E50" stroke-width="0.6"/>`;
  svg += `<rect x="0" y="0" width="${w}" height="${headerH}" rx="4" fill="#2C3E50"/>`;
  svg += `<rect x="0" y="8" width="${w}" height="8" fill="#2C3E50"/>`;
  svg += `<text x="${w / 2}" y="12" text-anchor="middle" font-size="6" fill="#fff" font-weight="800">DC FUSE BOARD CIRCUITS</text>`;
  circuits.forEach((c, i) => {
    const ry = headerH + 2 + i * rowH;
    svg += `<rect x="6" y="${ry + 1}" width="7" height="9" rx="1.5" fill="${colors[i % colors.length]}" opacity="0.7"/>`;
    svg += `<text x="16" y="${ry + 9}" font-size="5.5" fill="#333" font-weight="700">${c.fuseA}A</text>`;
    svg += `<text x="32" y="${ry + 9}" font-size="5.5" fill="#555">${esc(c.label)}</text>`;
  });
  svg += `</g>`;
  return svg;
}

function rcdConsumerUnit(x: number, y: number, type: 'ac_in' | 'ac_out'): string {
  const fill = type === 'ac_in' ? '#D6E9F8' : '#F2E5D5';
  const border = type === 'ac_in' ? '#3498DB' : '#8B4513';
  const lineLabel = type === 'ac_in' ? 'GRID' : 'LOAD';
  return `<g transform="translate(${x},${y})">
    <rect x="0" y="0" width="140" height="75" rx="7" fill="${fill}" stroke="${border}" stroke-width="1.5"/>
    <rect x="8" y="8" width="124" height="58" rx="4" fill="#fff" stroke="#D3D7DB" stroke-width="0.8"/>
    <rect x="10" y="13" width="120" height="3" rx="1.5" fill="#C7CDD3"/>
    <text x="70" y="11" text-anchor="middle" font-size="4.8" fill="${border}" font-weight="700">${lineLabel} CONSUMER UNIT</text>
    <rect x="18" y="20" width="36" height="40" rx="2.5" fill="#F8F9FA" stroke="#D8DDE2"/>
    <text x="36" y="31" text-anchor="middle" font-size="5.5" fill="#333" font-weight="700">RCD</text>
    <text x="36" y="37" text-anchor="middle" font-size="4" fill="#777">30mA</text>
    <circle cx="26" cy="43" r="2" fill="#fff" stroke="#AAB4BE" stroke-width="0.7"/>
    <rect x="33" y="41" width="6" height="14" rx="1.5" fill="#E74C3C"/>
    <rect x="60" y="20" width="28" height="40" rx="2.5" fill="#F8F9FA" stroke="#D8DDE2"/>
    <text x="74" y="31" text-anchor="middle" font-size="5.2" fill="#333" font-weight="700">MCB</text>
    <rect x="71" y="39" width="6" height="16" rx="1.5" fill="#2ECC71"/>
    <rect x="94" y="20" width="28" height="40" rx="2.5" fill="#F8F9FA" stroke="#D8DDE2"/>
    <text x="108" y="31" text-anchor="middle" font-size="5.2" fill="#333" font-weight="700">MCB</text>
    <rect x="105" y="39" width="6" height="16" rx="1.5" fill="#2ECC71"/>
    <circle cx="70" cy="0" r="3.5" fill="${border}" stroke="#1A1A1A"/>
    <circle cx="70" cy="75" r="3.5" fill="${border}" stroke="#1A1A1A"/>
    <circle cx="122" cy="75" r="3.5" fill="#27AE60" stroke="#1A1A1A"/>
  </g>`;
}

function acLoadsSocket(x: number, y: number): string {
  return `<g transform="translate(${x},${y})">
    <rect x="0" y="0" width="65" height="42" rx="5" fill="#F5F5F5" stroke="#888" stroke-width="0.8"/>
    <rect x="8" y="6" width="20" height="30" rx="2" fill="#fff" stroke="#bbb"/>
    <rect x="13" y="11" width="3" height="8" rx="1" fill="#333"/>
    <rect x="19" y="11" width="3" height="8" rx="1" fill="#333"/>
    <circle cx="17" cy="27" r="2.5" fill="#333"/>
    <rect x="36" y="6" width="20" height="30" rx="2" fill="#fff" stroke="#bbb"/>
    <rect x="41" y="11" width="3" height="8" rx="1" fill="#333"/>
    <rect x="47" y="11" width="3" height="8" rx="1" fill="#333"/>
    <circle cx="45" cy="27" r="2.5" fill="#333"/>
  </g>`;
}

function groundSymbol(x: number, y: number): string {
  return `<g transform="translate(${x},${y})">
    <line x1="20" y1="0" x2="20" y2="12" stroke="#27AE60" stroke-width="2"/>
    <line x1="6" y1="12" x2="34" y2="12" stroke="#27AE60" stroke-width="2"/>
    <line x1="10" y1="18" x2="30" y2="18" stroke="#27AE60" stroke-width="1.5"/>
    <line x1="14" y1="23" x2="26" y2="23" stroke="#27AE60" stroke-width="1"/>
  </g>`;
}

function inlineGround(cx: number, topY: number, label?: string): string {
  const stubLen = 20;
  const symY = topY + stubLen;
  let s = '';
  s += `<line x1="${cx}" y1="${topY}" x2="${cx}" y2="${symY}" stroke="#27AE60" stroke-width="1.5" stroke-dasharray="4,2"/>`;
  s += `<line x1="${cx - 10}" y1="${symY}" x2="${cx + 10}" y2="${symY}" stroke="#27AE60" stroke-width="2"/>`;
  s += `<line x1="${cx - 6}" y1="${symY + 5}" x2="${cx + 6}" y2="${symY + 5}" stroke="#27AE60" stroke-width="1.5"/>`;
  s += `<line x1="${cx - 3}" y1="${symY + 9}" x2="${cx + 3}" y2="${symY + 9}" stroke="#27AE60" stroke-width="1"/>`;
  if (label) {
    s += `<text x="${cx}" y="${symY + 19}" text-anchor="middle" font-size="4.5" fill="#27AE60" font-weight="600">${label}</text>`;
  }
  return s;
}

// ────────────────────────────────────────────────────────────────────────────
// 6. SIDEBAR: LEGEND, GLOSSARY, PHONE MOCKUP, QR
// ────────────────────────────────────────────────────────────────────────────

function colorLegend(x: number, y: number): string {
  const items = [
    { color: WC.red, dash: false, label: 'DC Positive (+)' },
    { color: WC.blk, dash: false, label: 'DC Negative (−)' },
    { color: WC.gn, dash: true, label: 'Earth/Bond (E)' },
    { color: WC.brn, dash: false, label: '230V AC Live' },
    { color: WC.blu, dash: false, label: '230V AC Neutral' },
  ];
  let svg = `<g transform="translate(${x},${y})">`;
  svg += `<rect x="0" y="0" width="130" height="${14 + items.length * 14}" rx="4" fill="rgba(0,0,0,0.03)" stroke="#ccc" stroke-width="0.5"/>`;
  svg += `<text x="8" y="11" font-size="6.5" fill="#333" font-weight="800">WIRE COLOUR KEY</text>`;
  items.forEach((it, i) => {
    const iy = 20 + i * 14;
    svg += `<line x1="8" y1="${iy}" x2="28" y2="${iy}" stroke="${it.color}" stroke-width="2"${it.dash ? ' stroke-dasharray="4 2"' : ''}/>`;
    svg += `<text x="34" y="${iy + 3}" font-size="6.5" fill="#555">${it.label}</text>`;
  });
  svg += `</g>`;
  return svg;
}

function glossaryBox(x: number, y: number): string {
  const terms = [
    ['MPPT', 'Max Power Point Tracker'],
    ['DC-DC', 'Alternator Charger'],
    ['Ah', 'Amp Hours (Capacity)'],
    ['mm²', 'Cable Cross-Section'],
    ['RCD', 'Residual Current Device'],
    ['MCB', 'Miniature Circuit Breaker'],
    ['MEGA/MIDI', 'Bolt-Down Fuse Types'],
  ];
  const w = 170;
  const h = 14 + terms.length * 12;
  let svg = `<g transform="translate(${x},${y})">`;
  svg += `<rect x="0" y="0" width="${w}" height="${h}" rx="4" fill="rgba(0,0,0,0.02)" stroke="#ccc" stroke-width="0.5"/>`;
  svg += `<text x="8" y="11" font-size="6.5" fill="#333" font-weight="800">GLOSSARY</text>`;
  terms.forEach(([abbr, full], i) => {
    svg += `<text x="8" y="${22 + i * 12}" font-size="6.5"><tspan fill="#D9A05B" font-weight="700">${abbr}</tspan><tspan fill="#666"> — ${full}</tspan></text>`;
  });
  svg += `</g>`;
  return svg;
}

function iphoneMockup(x: number, y: number): string {
  return `<g transform="translate(${x},${y})">
    <rect x="0" y="0" width="32" height="56" rx="5" fill="#1A1A1A" stroke="#555" stroke-width="0.8"/>
    <rect x="2.5" y="7" width="27" height="42" rx="2" fill="#0A4B7C"/>
    <text x="16" y="24" text-anchor="middle" font-size="4" fill="#fff" font-weight="700">Victron</text>
    <text x="16" y="31" text-anchor="middle" font-size="3" fill="#3498DB">Connect</text>
    <circle cx="16" cy="41" r="2" fill="none" stroke="#3498DB" stroke-width="0.5"/>
    <text x="16" y="42.5" text-anchor="middle" font-size="2.5" fill="#3498DB">BT</text>
    <text x="16" y="62" text-anchor="middle" font-size="5" fill="#888">Bluetooth</text>
  </g>`;
}

function qrCodePlaceholder(x: number, y: number): string {
  const s = 4;
  const pattern = [
    [1,1,1,1,1,0,1,0,1,1,1,1,1],
    [1,0,0,0,1,0,0,0,1,0,0,0,1],
    [1,0,1,0,1,0,1,0,1,0,1,0,1],
    [1,0,0,0,1,0,0,0,1,0,0,0,1],
    [1,1,1,1,1,0,1,0,1,1,1,1,1],
    [0,0,0,0,0,0,1,0,0,0,0,0,0],
    [1,0,1,0,1,1,1,1,1,0,1,0,1],
    [0,0,0,0,0,0,1,0,0,0,0,0,0],
    [1,1,1,1,1,0,1,0,1,0,1,0,0],
    [1,0,0,0,1,0,0,0,0,1,0,1,0],
    [1,0,1,0,1,0,1,0,1,0,1,0,1],
    [1,0,0,0,1,0,0,1,0,1,0,0,1],
    [1,1,1,1,1,0,1,0,0,1,1,1,1],
  ];
  const qw = pattern[0].length * s;
  let svg = `<g transform="translate(${x},${y})">`;
  svg += `<rect x="-3" y="-3" width="${qw + 6}" height="${pattern.length * s + 6}" rx="3" fill="#fff" stroke="#ddd"/>`;
  pattern.forEach((row, ry) => {
    row.forEach((cell, cx) => {
      if (cell) svg += `<rect x="${cx * s}" y="${ry * s}" width="${s}" height="${s}" fill="#1A1A1A"/>`;
    });
  });
  svg += `</g>`;
  svg += `<text x="${x + qw / 2}" y="${y + pattern.length * s + 10}" text-anchor="middle" font-size="5" fill="#888">Scan for CamperPlan</text>`;
  return svg;
}

// ────────────────────────────────────────────────────────────────────────────
// 7. REGULATION BOX
// ────────────────────────────────────────────────────────────────────────────

function regBox(x: number, y: number, w: number, standard: string, clause: string, text: string): string {
  const lines = wrapText(text, Math.floor(w / 4.5));
  const boxH = Math.max(44, 20 + lines.length * 10 + 4);
  let svg = `<g transform="translate(${x},${y})">`;
  svg += `<rect x="0" y="0" width="${w}" height="${boxH}" rx="4" fill="rgba(0,0,0,0.02)" stroke="#999" stroke-width="0.7"/>`;
  svg += `<rect x="0" y="0" width="${w}" height="16" rx="4" fill="#1A1A1A"/>`;
  svg += `<rect x="0" y="8" width="${w}" height="8" fill="#1A1A1A"/>`;
  svg += `<text x="5" y="11" font-size="6" fill="#D9A05B" font-weight="800">${esc(standard)}</text>`;
  svg += `<text x="${w - 5}" y="11" text-anchor="end" font-size="5" fill="rgba(255,255,255,0.5)">${esc(clause)}</text>`;
  lines.slice(0, 4).forEach((line, i) => {
    svg += `<text x="5" y="${26 + i * 10}" font-size="6" fill="#555"${i === 0 ? ' font-weight="600"' : ''}>${esc(line)}</text>`;
  });
  svg += `</g>`;
  return svg;
}

// ────────────────────────────────────────────────────────────────────────────
// 8. MAIN GENERATOR
// ────────────────────────────────────────────────────────────────────────────

export function generateSchematicSVG(spec: WiringSpec, config: SystemConfig, imageMap: Record<string, string>): { page1: string; page2: string } {
  usedRects = [];
  routedSegs = [];
  drawnSegments = [];
  shownGaugeLabels = new Map();
  nominalParallelSegs = [];
  wireIdCounter = 0;

  // Feature detection — AC visibility driven by config flags + spec nodes, not indirect assumptions.
  const hasInv = config.inverterVA > 0 && spec.components.some(c => c.product.category === 'inverterCharger' || c.product.category === 'inverter');
  const hasMP = spec.components.some(c => c.product.category === 'inverterCharger');
  const hasMPPT = config.solarWatts > 0;
  const hasDC = config.dcDcAmps > 0;
  const hasLynx = spec.components.some(c => c.product.id === 'lynx_dist');
  const hasShore = !!(config.hasShore && (hasMP || hasInv));
  const hasLPG = config.hasLPG;

  // Component lookups
  const bat = spec.components.find(c => c.product.category === 'battery')?.product;
  const batQty = spec.components.find(c => c.product.category === 'battery')?.quantity ?? 1;
  const shuntC = spec.components.find(c => c.product.category === 'monitor');
  const invC = spec.components.find(c => c.product.category === 'inverterCharger' || c.product.category === 'inverter');
  const mpptC = spec.components.find(c => c.product.category === 'mppt');
  const dcdcC = spec.components.find(c => c.product.category === 'dcdc');
  const bpC = spec.components.find(c => c.product.category === 'protect');

  // ═══ FIXED A4 LANDSCAPE CANVAS ═══
  const W = 1190;
  const H = 842;
  const HWY = {
    top: 55,
    bottom: 770,
    left: 45,
    right: 1145,
    neg: 700,
  } as const;

  // Fixed canvas lower bound for ancillary symbols.
  const S_B = 812;
  const solarCount = Math.ceil(config.solarWatts / 200);
  const earthCount = 3 + (hasInv ? 1 : 0) + (hasLPG ? 1 : 0);

  // Scaled component geometry (~62%) to create whitespace for routing.
  const BAT_UNIT_W = scaleDim(140, 64);
  const BAT_H = scaleDim(90, 44);
  const SHUNT_W = scaleDim(120, 56);
  const SHUNT_H = scaleDim(45, 24);
  const ISO_W = scaleDim(60, 30);
  const ISO_H = scaleDim(54, 26);
  const MIDI_W = scaleDim(46, 24);
  const MIDI_H = scaleDim(28, 16);
  const DIST_W = hasLynx ? scaleDim(280, 132) : scaleDim(260, 124);
  const DIST_H = hasLynx ? scaleDim(180, 80) : scaleDim(38, 22);
  const INV_W = scaleDim(200, 96);
  const INV_H = scaleDim(138, 66);
  const MPPT_W = scaleDim(100, 52);
  const MPPT_H = scaleDim(100, 52);
  const PVDISC_W = scaleDim(56, 30);
  const PVDISC_H = scaleDim(50, 28);
  const DCDC_W = scaleDim(80, 50);
  const DCDC_H = scaleDim(120, 70);
  const STARTER_W = scaleDim(90, 46);
  const STARTER_H = scaleDim(55, 30);
  const BP_W = scaleDim(80, 40);
  const BP_H = scaleDim(42, 22);
  const FB_W = scaleDim(110, 56);
  const FB_H = scaleDim(48, 26);
  const SHORE_W = scaleDim(40, 24);
  const SHORE_H = scaleDim(44, 28);
  const CU_W = scaleDim(140, 70);
  const CU_H = scaleDim(75, 40);
  const AC_LOADS_W = scaleDim(65, 34);
  const AC_LOADS_H = scaleDim(42, 24);
  const SOLAR_PANEL_W = scaleDim(42, 26);
  const SOLAR_PANEL_H = scaleDim(55, 30);
  // ═══ COMPONENT DIMENSIONS — Dan's locked sizes from grid tool ═══
  const DIM = {
    battery: { w: 108, h: 70 },
    smartshunt: { w: 100, h: 38 },
    midi_fuse: { w: MIDI_W, h: MIDI_H },
    class_t_fuse: { w: 56, h: 36 },
    isolator: { w: 54, h: 54 },
    lynx: { w: 220, h: 140 },
    multiplus: { w: 110, h: 80 },
    mppt: { w: 90, h: 120 },
    orion: { w: 70, h: 100 },
    starter_bat: { w: 70, h: 50 },
    battery_protect: { w: 60, h: 70 },
    fuse_block: { w: 80, h: 50 },
    solar_panel: { w: 120, h: 50 },
    pv_disconnect: { w: 44, h: 44 },
    dcdc_isolator: { w: 44, h: 44 },
    shore_inlet: { w: 50, h: 40 },
    consumer_unit: { w: 80, h: 50 },
    ac_load: { w: 56, h: 36 },
    dc_load: { w: 56, h: 36 },
    cerbo_gx: { w: 70, h: 50 },
    // Legacy (kept for type safety)
    earth_bar: { w: 100, h: 16 },
    ac_loads: { w: 56, h: 36 },
  } as const;

  // ═══ POSITIONS — Dan's locked positions from grid layout tool export ═══
  const POS = {
    shore_inlet:      { cx: 850, cy: 60 },
    solar_panel_1:    { cx: 100, cy: 130 },
    solar_panel_2:    { cx: 160, cy: 130 },
    solar_panel_3:    { cx: 220, cy: 130 },
    pv_disconnect:    { cx: 180, cy: 280 },
    mppt:             { cx: 160, cy: 400 },
    dcdc_isolator:    { cx: 570, cy: 70 },
    dcdc:             { cx: 570, cy: 190 },
    starter_battery:  { cx: 420, cy: 70 },
    consumer_unit_in: { cx: 850, cy: 160 },
    inverter:         { cx: 850, cy: 270 },
    distribution:     { cx: 570, cy: 400 },
    class_t_fuse:     { cx: 400, cy: 600 },
    battery_isolator: { cx: 520, cy: 600 },
    smart_shunt:      { cx: 580, cy: 780 },
    cerbo_gx:         { cx: 770, cy: 690 },
    battery_1:        { cx: 390, cy: 710 },
    battery_2:        { cx: 250, cy: 710 },
    consumer_unit_out:{ cx: 1070, cy: 270 },
    ac_load_1:        { cx: 1010, cy: 130 },
    ac_load_2:        { cx: 1080, cy: 130 },
    ac_load_3:        { cx: 1150, cy: 130 },
    battery_protect:  { cx: 870, cy: 420 },
    fuse_block:       { cx: 1070, cy: 530 },
    dc_load_1:        { cx: 1070, cy: 600 },
    dc_load_2:        { cx: 1070, cy: 660 },
    dc_load_3:        { cx: 1070, cy: 730 },
    // Legacy (kept for type safety)
    main_midi_fuse:   { cx: 400, cy: 600 },
    ac_loads:         { cx: 1010, cy: 130 },
    earth_bar:        { cx: 500, cy: 810 },
  } as const;
  const invPortX = (ratio: number) => Math.round(INV_W * ratio);
  const invX = POS.inverter.cx - Math.floor(INV_W / 2);
  const invY = POS.inverter.cy - Math.floor(INV_H / 2);
  const earthBarW = DIM.earth_bar.w;
  const earthBarX = POS.earth_bar.cx - Math.floor(earthBarW / 2);
  const earthBarYClamped = POS.earth_bar.cy - 8;
  const groundX = earthBarX + Math.floor(earthBarW / 2) - 20;
  const groundY = Math.min(S_B - 10, earthBarYClamped + 16 + 8);
  const acLoadsX = POS.ac_loads.cx - Math.floor(AC_LOADS_W / 2);
  const acLoadsY = POS.ac_loads.cy - Math.floor(AC_LOADS_H / 2);

  // Component body registration is still needed for gauge-label avoidance.
  const registerRect = (cx: number, cy: number, w: number, h: number) => {
    usedRects.push({ x: cx - w / 2, y: cy - h / 2, w, h });
  };
  registerRect(POS.battery_1.cx, POS.battery_1.cy, DIM.battery.w, DIM.battery.h);
  if (batQty > 1) registerRect(POS.battery_2.cx, POS.battery_2.cy, DIM.battery.w, DIM.battery.h);
  registerRect(POS.smart_shunt.cx, POS.smart_shunt.cy, DIM.smartshunt.w, DIM.smartshunt.h);
  registerRect(POS.main_midi_fuse.cx, POS.main_midi_fuse.cy, DIM.midi_fuse.w, DIM.midi_fuse.h);
  registerRect(POS.battery_isolator.cx, POS.battery_isolator.cy, DIM.isolator.w, DIM.isolator.h);
  registerRect(POS.distribution.cx, POS.distribution.cy, DIM.lynx.w, DIM.lynx.h);
  if (hasInv) registerRect(POS.inverter.cx, POS.inverter.cy, DIM.multiplus.w, DIM.multiplus.h);
  if (hasMPPT) {
    registerRect(POS.solar_panel_1.cx, POS.solar_panel_1.cy, DIM.solar_panel.w, DIM.solar_panel.h);
    registerRect(POS.pv_disconnect.cx, POS.pv_disconnect.cy, DIM.pv_disconnect.w, DIM.pv_disconnect.h);
    registerRect(POS.mppt.cx, POS.mppt.cy, DIM.mppt.w, DIM.mppt.h);
  }
  if (hasDC) {
    registerRect(POS.starter_battery.cx, POS.starter_battery.cy, DIM.starter_bat.w, DIM.starter_bat.h);
    registerRect(POS.dcdc.cx, POS.dcdc.cy, DIM.orion.w, DIM.orion.h);
  }
  if (bpC) registerRect(POS.battery_protect.cx, POS.battery_protect.cy, DIM.battery_protect.w, DIM.battery_protect.h);
  registerRect(POS.fuse_block.cx, POS.fuse_block.cy, DIM.fuse_block.w, DIM.fuse_block.h);
  if (hasShore) {
    registerRect(POS.shore_inlet.cx, POS.shore_inlet.cy, DIM.shore_inlet.w, DIM.shore_inlet.h);
    registerRect(POS.consumer_unit_in.cx, POS.consumer_unit_in.cy, DIM.consumer_unit.w, DIM.consumer_unit.h);
    registerRect(POS.consumer_unit_out.cx, POS.consumer_unit_out.cy, DIM.consumer_unit.w, DIM.consumer_unit.h);
    registerRect(POS.ac_loads.cx, POS.ac_loads.cy, DIM.ac_loads.w, DIM.ac_loads.h);
  }

  // Fuse block circuits
  const DC_LABELS: Record<string, { label: string; fuseA: number }> = {
    dc_fridge: { label: 'Fridge', fuseA: 10 },
    dc_fan: { label: 'Roof Fan', fuseA: 5 },
    dc_led: { label: 'LED Lights', fuseA: 5 },
    dc_usb: { label: 'USB/12V', fuseA: 5 },
    dc_pump: { label: 'Water Pump', fuseA: 5 },
    ac_laptop: { label: 'Laptop', fuseA: 10 },
    ac_starlink: { label: 'Starlink', fuseA: 10 },
  };
  const fbCircuits: { label: string; fuseA: number }[] = [];
  for (const id of config.selectedDcAppliances ?? []) {
    if (DC_LABELS[id]) fbCircuits.push(DC_LABELS[id]);
  }
  for (const name of config.customApplianceNames ?? []) {
    fbCircuits.push({ label: name, fuseA: 10 });
  }
  if (fbCircuits.length === 0) {
    fbCircuits.push({ label: 'LED Lights', fuseA: 5 }, { label: 'USB/12V', fuseA: 5 }, { label: 'Water Pump', fuseA: 5 }, { label: 'Fridge', fuseA: 10 });
  }

  // Wire gauge data
  const cn = spec.connections;
  const mW = findW(cn, 'midi', 'distribution') ?? findW(cn, 'battery', 'distribution');
  const mG = mW?.cableGauge ?? 70;
  const iG = findW(cn, 'inverter', 'dc')?.cableGauge ?? 50;
  const mpG = findW(cn, 'mppt', 'battery')?.cableGauge ?? 10;
  const diG = findW(cn, 'starter', 'dc-dc')?.cableGauge ?? 10;
  const doG = (findW(cn, 'dc-dc', 'battery') ?? findW(cn, 'dc-dc', 'distribution'))?.cableGauge ?? 10;
  const bG = findW(cn, 'protect')?.cableGauge ?? 16;

  const fL = [
    hasInv ? (iG >= 50 ? '175A' : '100A') : '',
    hasMPPT ? `${Math.ceil((Number(mpptC?.product.specs.maxChargeAmps) || 30) * 1.25)}A` : '',
    hasDC ? `${Math.ceil(config.dcDcAmps * 1.25)}A` : '',
    `${Math.ceil(((bpC?.product.specs.maxCurrent as number) || 65) * 1.25)}A`,
  ];

  const today = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

  // ═══ BUILD COMPONENT KEY ═══
  let compNum = 0;
  const keyItems: { num: number; name: string; detail: string }[] = [];
  const N_BAT = ++compNum; keyItems.push({ num: N_BAT, name: bat?.name ?? 'Leisure Battery', detail: `${config.batteryAh}Ah${batQty > 1 ? ` x${batQty}` : ''}` });
  const N_SHUNT = ++compNum; keyItems.push({ num: N_SHUNT, name: 'SmartShunt 500A', detail: 'Battery Monitor' });
  const N_ISO = ++compNum; keyItems.push({ num: N_ISO, name: 'Battery Isolator', detail: 'Main Disconnect' });
  const N_MIDI = ++compNum; keyItems.push({ num: N_MIDI, name: 'MIDI Fuse', detail: mW?.fuseRating ? `${mW.fuseRating}A` : (mG >= 50 ? '200A' : '125A') });
  const N_DIST = ++compNum; keyItems.push({ num: N_DIST, name: hasLynx ? 'Lynx Distributor' : 'Busbar Pair', detail: 'DC Distribution' });
  let N_INV = 0;
  if (hasInv && invC) { N_INV = ++compNum; keyItems.push({ num: N_INV, name: invC.product.name, detail: `${config.inverterVA}VA` }); }
  let N_MPPT = 0;
  if (hasMPPT && mpptC) { N_MPPT = ++compNum; keyItems.push({ num: N_MPPT, name: mpptC.product.name, detail: 'Solar MPPT' }); }
  let N_SOLAR = 0;
  if (hasMPPT) { N_SOLAR = ++compNum; keyItems.push({ num: N_SOLAR, name: `${config.solarWatts}W Solar Array`, detail: `${solarCount} panels` }); }
  let N_PVDISC = 0;
  if (hasMPPT) { N_PVDISC = ++compNum; keyItems.push({ num: N_PVDISC, name: 'PV Disconnect', detail: 'Solar Isolator' }); }
  let N_DCDC = 0;
  if (hasDC && dcdcC) { N_DCDC = ++compNum; keyItems.push({ num: N_DCDC, name: dcdcC.product.name, detail: `${config.dcDcAmps}A` }); }
  let N_STARTER = 0;
  if (hasDC) { N_STARTER = ++compNum; keyItems.push({ num: N_STARTER, name: 'Starter Battery', detail: '12V Vehicle' }); }
  let N_BP = 0;
  if (bpC) { N_BP = ++compNum; keyItems.push({ num: N_BP, name: `BatteryProtect`, detail: `${bpC.product.specs.maxCurrent}A` }); }
  const N_FB = ++compNum; keyItems.push({ num: N_FB, name: '12V Fuse Block', detail: `${fbCircuits.length} circuits` });
  let N_SHORE = 0, N_CUIN = 0, N_CUOUT = 0, N_ACLOADS = 0;
  if (hasShore) {
    N_SHORE = ++compNum; keyItems.push({ num: N_SHORE, name: '16A CEE Shore Inlet', detail: 'Grid/Campsite' });
    N_CUIN = ++compNum; keyItems.push({ num: N_CUIN, name: 'AC-In Consumer Unit', detail: 'RCD + MCBs' });
    N_CUOUT = ++compNum; keyItems.push({ num: N_CUOUT, name: 'AC-Out Consumer Unit', detail: 'RCD + MCBs' });
    N_ACLOADS = ++compNum; keyItems.push({ num: N_ACLOADS, name: 'AC Loads (240V)', detail: 'Double Socket' });
  }

  // ═══ SVG START ═══
  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" style="font-family:-apple-system,BlinkMacSystemFont,'Helvetica Neue',Arial,sans-serif">`;

  const placedPorts: Record<string, Record<string, Pt>> = {};
  const placedComponentTypes: Record<string, string> = {};
  const placedComponentSku: Record<string, string | undefined> = {};
  const placeComponent = (
    componentId: string,
    type: string,
    cx: number,
    cy: number,
    w?: number,
    h?: number,
    params: Record<string, string | number> = {},
    sku?: string,
  ) => {
    const defaults = COMPONENT_RULES[type];
    const drawW = w ?? defaults?.defaultW ?? 80;
    const drawH = h ?? defaults?.defaultH ?? 60;
    const clampedCx = Math.max(LEFT_EDGE_MIN_X + Math.floor(drawW / 2), cx);
    const specForDraw: ComponentSpec = {
      type,
      cx: clampedCx,
      cy,
      w: drawW,
      h: drawH,
      ...params,
    };
    const result = drawComponent(specForDraw);
    placedPorts[componentId] = result.ports as Record<string, Pt>;
    placedComponentTypes[componentId] = type;
    placedComponentSku[componentId] = sku;
    return result.svg;
  };

  // ═══ PORT POSITION OVERRIDE SYSTEM ═══
  // Dan's grid tool specifies which SIDE each port sits on. The draw functions
  // place ports based on physical product layout. This function overrides port
  // positions to match Dan's schematic-optimised layout.
  type Side = 'top' | 'bottom' | 'left' | 'right';
  const overridePort = (componentId: string, portName: string, side: Side, cx: number, cy: number, w: number, h: number, offset = 0) => {
    if (!placedPorts[componentId]) return;
    switch (side) {
      case 'top':    placedPorts[componentId][portName] = { x: cx + offset, y: cy - h / 2 }; break;
      case 'bottom': placedPorts[componentId][portName] = { x: cx + offset, y: cy + h / 2 }; break;
      case 'left':   placedPorts[componentId][portName] = { x: cx - w / 2, y: cy + offset }; break;
      case 'right':  placedPorts[componentId][portName] = { x: cx + w / 2, y: cy + offset }; break;
    }
  };

  // ═══ PORT EXIT DIRECTION OVERRIDES ═══
  // Per-instance exit directions that override schematicRules defaults.
  // Checked by drawRuleWire before falling back to getPortRule.
  const PORT_EXIT_OVERRIDES: Record<string, Record<string, string>> = {
    battery_1:        { positive_terminal: 'up', negative_terminal: 'down' },
    battery_2:        { positive_terminal: 'up', negative_terminal: 'down' },
    starter_battery:  { positive_terminal: 'right', negative_terminal: 'down' },
    smart_shunt:      { batt_neg_in: 'left', system_neg_out: 'up', aux_sense: 'right' },
    mppt:             { pv_positive: 'up', pv_negative: 'up', bat_positive: 'right', bat_negative: 'right' },
    dcdc:             { in_positive: 'up', in_negative: 'left', out_positive: 'down', out_negative: 'down' },
    inverter:         { ac_in: 'up', ac_out: 'right', dc_positive: 'left', dc_negative: 'left' },
    distribution:     {
      busbar_in: 'down', busbar_neg: 'down',
      fuse_out_1: 'left', neg_out_1: 'left',
      fuse_out_2: 'up', neg_out_2: 'up',
      fuse_out_3: 'right', neg_out_3: 'right',
      fuse_out_4: 'right', neg_out_4: 'right',
      earth: 'down',
    },
    battery_isolator: { in_positive: 'left', out_positive: 'up' },
    dcdc_isolator:    { in_positive: 'down', out_positive: 'up' },
    class_t_fuse:     { in_positive: 'down', out_positive: 'right' },
    battery_protect:  { in_positive: 'left', out_positive: 'right' },
    fuse_block:       { pos_in: 'up', neg_in: 'up' },
    shore_inlet:      { ac_line: 'down' },
    pv_disconnect:    { pv_in_positive: 'left', pv_out_positive: 'down' },
    consumer_unit_in: { ac_in: 'up', ac_out_1: 'down', earth: 'right' },
    consumer_unit_out:{ ac_in: 'left', ac_out_1: 'up', ac_out_2: 'up', ac_out_3: 'up' },
    cerbo_gx:         { ve_bus: 'left', pos_12v: 'up', neg_12v: 'up' },
  };

  // Chassis earth symbol helper (green tree symbol like Tiny Build)
  const earthSymbol = (x: number, y: number, size = 16): string => {
    const s = size;
    return `<g transform="translate(${x},${y})">
      <line x1="0" y1="0" x2="0" y2="${s * 0.3}" stroke="#4CAF50" stroke-width="1.5"/>
      <line x1="${-s * 0.4}" y1="${s * 0.3}" x2="${s * 0.4}" y2="${s * 0.3}" stroke="#4CAF50" stroke-width="1.5"/>
      <line x1="${-s * 0.25}" y1="${s * 0.5}" x2="${s * 0.25}" y2="${s * 0.5}" stroke="#4CAF50" stroke-width="1.5"/>
      <line x1="${-s * 0.1}" y1="${s * 0.7}" x2="${s * 0.1}" y2="${s * 0.7}" stroke="#4CAF50" stroke-width="1.5"/>
    </g>`;
  };

  svg += `<rect x="0" y="0" width="${W}" height="${H}" fill="#F8F9FA"/>`;

  // Diagonal watermarks
  if (imageMap.logo) {
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 4; c++) {
        const cx = 60 + c * 300 + (r % 2 === 0 ? 0 : 150);
        const cy = 100 + r * 260;
        svg += `<image href="${imageMap.logo}" x="${cx}" y="${cy}" width="280" height="95" opacity="0.07" preserveAspectRatio="xMidYMid meet" transform="rotate(-25,${cx + 140},${cy + 48})"/>`;
      }
    }
  }

  // ═══ CLEAN BACKGROUND (columns removed in Fundamental Change v2) ═══
  svg += `<rect x="0" y="27" width="${W}" height="${H - 27}" fill="#FDF6E3" opacity="0.4"/>`;

  // ═══ HEADER BAR ═══
  svg += `<rect x="0" y="0" width="${W}" height="26" fill="#1A1A1A"/>`;
  if (imageMap.logo) svg += `<image href="${imageMap.logo}" x="14" y="3" width="90" height="20" preserveAspectRatio="xMidYMid meet"/>`;
  else svg += `<text x="14" y="18" font-size="8" fill="#D9A05B" font-weight="800">CRAFTED CAMPER CO.</text>`;
  svg += `<text x="112" y="18" font-size="6" fill="#fff" font-weight="600">Wiring Schematic</text>`;
  svg += `<text x="${W / 2}" y="18" text-anchor="middle" font-size="6" fill="#D9A05B" font-weight="600">${spec.archetype.replace(/_/g, ' ')}</text>`;
  svg += `<text x="${W - 70}" y="18" text-anchor="end" font-size="6" fill="#888">${today}</text>`;
  svg += `<text x="${W - 14}" y="18" text-anchor="end" font-size="6" fill="#D9A05B" font-weight="700">V4.0</text>`;
  svg += `<line x1="0" y1="26" x2="${W}" y2="26" stroke="#D9A05B" stroke-width="1.5"/>`;

  // ═══ PLACE COMPONENTS (Fundamental Change v2 — Dan's locked positions) ═══
  const mainFuseRating = mW?.fuseRating ? `${mW.fuseRating}A` : (mG >= 50 ? '200A' : '125A');
  const mainFuseAmps = Number.parseInt(mainFuseRating, 10) || (mG >= 50 ? 200 : 125);

  // --- Batteries (parallel, 1-2) ---
  const batteryDisplayQty = Math.min(batQty, 2);
  for (let i = 0; i < batteryDisplayQty; i++) {
    const batteryPos = i === 0 ? POS.battery_1 : POS.battery_2;
    svg += placeComponent(`battery_${i + 1}`, 'battery', batteryPos.cx, batteryPos.cy, DIM.battery.w, DIM.battery.h, { capacityAh: config.batteryAh }, bat?.model);
    // Override: + on top, - on bottom (Dan's layout)
    overridePort(`battery_${i + 1}`, 'positive_terminal', 'top', batteryPos.cx, batteryPos.cy, DIM.battery.w, DIM.battery.h, DIM.battery.w * 0.24);
    overridePort(`battery_${i + 1}`, 'negative_terminal', 'bottom', batteryPos.cx, batteryPos.cy, DIM.battery.w, DIM.battery.h, -DIM.battery.w * 0.15);
  }

  // --- Smart Shunt ---
  svg += placeComponent('smart_shunt', 'smartshunt', POS.smart_shunt.cx, POS.smart_shunt.cy, DIM.smartshunt.w, DIM.smartshunt.h, {}, shuntC?.product.model);
  overridePort('smart_shunt', 'batt_neg_in', 'left', POS.smart_shunt.cx, POS.smart_shunt.cy, DIM.smartshunt.w, DIM.smartshunt.h);
  overridePort('smart_shunt', 'system_neg_out', 'top', POS.smart_shunt.cx, POS.smart_shunt.cy, DIM.smartshunt.w, DIM.smartshunt.h);
  overridePort('smart_shunt', 'aux_sense', 'right', POS.smart_shunt.cx, POS.smart_shunt.cy, DIM.smartshunt.w, DIM.smartshunt.h);

  // --- Battery Isolator ---
  svg += placeComponent('battery_isolator', 'isolator', POS.battery_isolator.cx, POS.battery_isolator.cy, DIM.isolator.w, DIM.isolator.h);
  overridePort('battery_isolator', 'in_positive', 'left', POS.battery_isolator.cx, POS.battery_isolator.cy, DIM.isolator.w, DIM.isolator.h);
  overridePort('battery_isolator', 'out_positive', 'top', POS.battery_isolator.cx, POS.battery_isolator.cy, DIM.isolator.w, DIM.isolator.h);

  // --- Class T Fuse (replaces MIDI fuse in positive chain) ---
  svg += placeComponent('class_t_fuse', 'class_t_fuse', POS.class_t_fuse.cx, POS.class_t_fuse.cy, DIM.class_t_fuse.w, DIM.class_t_fuse.h, { amps: mainFuseAmps });

  // --- Lynx Distributor ---
  if (hasLynx) {
    svg += placeComponent('distribution', 'lynx', POS.distribution.cx, POS.distribution.cy, DIM.lynx.w, DIM.lynx.h, {}, 'LYN060102010');
  } else {
    svg += placeComponent('distribution', 'busbar', POS.distribution.cx, POS.distribution.cy, DIM.lynx.w, DIM.lynx.h, {}, 'BUSBAR-POS');
  }
  // Override Lynx port positions to match Dan's side assignments
  {
    const dc = POS.distribution, dw = DIM.lynx.w, dh = DIM.lynx.h;
    // Bottom: bus+in (left of centre), bus-in (right of centre)
    overridePort('distribution', 'busbar_in', 'bottom', dc.cx, dc.cy, dw, dh, -dw * 0.15);
    overridePort('distribution', 'busbar_neg', 'bottom', dc.cx, dc.cy, dw, dh, dw * 0.15);
    // Left side: fuse1 (upper), neg1 (lower)
    overridePort('distribution', 'fuse_out_1', 'left', dc.cx, dc.cy, dw, dh, -dh * 0.2);
    overridePort('distribution', 'neg_out_1', 'left', dc.cx, dc.cy, dw, dh, dh * 0.2);
    // Top: fuse2 (left of centre), neg2 (right of centre)
    overridePort('distribution', 'fuse_out_2', 'top', dc.cx, dc.cy, dw, dh, -dw * 0.15);
    overridePort('distribution', 'neg_out_2', 'top', dc.cx, dc.cy, dw, dh, dw * 0.15);
    // Right side: fuse3 (top), neg3 (upper-mid), fuse4 (lower-mid), neg4 (bottom)
    overridePort('distribution', 'fuse_out_3', 'right', dc.cx, dc.cy, dw, dh, -dh * 0.3);
    overridePort('distribution', 'neg_out_3', 'right', dc.cx, dc.cy, dw, dh, -dh * 0.1);
    overridePort('distribution', 'fuse_out_4', 'right', dc.cx, dc.cy, dw, dh, dh * 0.1);
    overridePort('distribution', 'neg_out_4', 'right', dc.cx, dc.cy, dw, dh, dh * 0.3);
    // Earth at bottom centre
    overridePort('distribution', 'earth', 'bottom', dc.cx, dc.cy, dw, dh);
  }

  // --- Inverter ---
  if (hasInv && invC) {
    svg += placeComponent('inverter', 'multiplus', POS.inverter.cx, POS.inverter.cy, DIM.multiplus.w, DIM.multiplus.h, { model: invC.product.model }, invC.product.model);
    const ic = POS.inverter, iw = DIM.multiplus.w, ih = DIM.multiplus.h;
    overridePort('inverter', 'ac_in', 'top', ic.cx, ic.cy, iw, ih);
    overridePort('inverter', 'ac_out', 'right', ic.cx, ic.cy, iw, ih, -ih * 0.15);
    overridePort('inverter', 'dc_positive', 'left', ic.cx, ic.cy, iw, ih, -ih * 0.15);
    overridePort('inverter', 'dc_negative', 'left', ic.cx, ic.cy, iw, ih, ih * 0.15);
  }

  // --- MPPT + Solar Panels (parallel, 1-3) + PV Disconnect ---
  if (hasMPPT && mpptC) {
    svg += placeComponent('mppt', 'mppt', POS.mppt.cx, POS.mppt.cy, DIM.mppt.w, DIM.mppt.h, { model: mpptC.product.model }, mpptC.product.model);
    overridePort('mppt', 'pv_positive', 'top', POS.mppt.cx, POS.mppt.cy, DIM.mppt.w, DIM.mppt.h, DIM.mppt.w * 0.2);
    overridePort('mppt', 'pv_negative', 'top', POS.mppt.cx, POS.mppt.cy, DIM.mppt.w, DIM.mppt.h, -DIM.mppt.w * 0.2);
    overridePort('mppt', 'bat_positive', 'right', POS.mppt.cx, POS.mppt.cy, DIM.mppt.w, DIM.mppt.h, -DIM.mppt.h * 0.15);
    overridePort('mppt', 'bat_negative', 'right', POS.mppt.cx, POS.mppt.cy, DIM.mppt.w, DIM.mppt.h, DIM.mppt.h * 0.15);

    const panelCount = Math.min(solarCount, 3);
    for (let i = 0; i < panelCount; i++) {
      const panelPos = i === 0 ? POS.solar_panel_1 : i === 1 ? POS.solar_panel_2 : POS.solar_panel_3;
      svg += placeComponent(`solar_panel_${i + 1}`, 'solar_panel', panelPos.cx, panelPos.cy, DIM.solar_panel.w, DIM.solar_panel.h, { watts: Math.round(config.solarWatts / panelCount) });
      overridePort(`solar_panel_${i + 1}`, 'pv_positive', 'bottom', panelPos.cx, panelPos.cy, DIM.solar_panel.w, DIM.solar_panel.h, DIM.solar_panel.w * 0.18);
      overridePort(`solar_panel_${i + 1}`, 'pv_negative', 'bottom', panelPos.cx, panelPos.cy, DIM.solar_panel.w, DIM.solar_panel.h, -DIM.solar_panel.w * 0.18);
    }
    svg += placeComponent('pv_disconnect', 'pv_disconnect', POS.pv_disconnect.cx, POS.pv_disconnect.cy, DIM.pv_disconnect.w, DIM.pv_disconnect.h);
    overridePort('pv_disconnect', 'pv_in_positive', 'left', POS.pv_disconnect.cx, POS.pv_disconnect.cy, DIM.pv_disconnect.w, DIM.pv_disconnect.h);
    overridePort('pv_disconnect', 'pv_out_positive', 'bottom', POS.pv_disconnect.cx, POS.pv_disconnect.cy, DIM.pv_disconnect.w, DIM.pv_disconnect.h);
  }

  // --- DC-DC Charger + Starter Battery ---
  // The Orion-Tr Smart DC-DC handles its own isolation internally, so no
  // external isolator is needed in the starter-to-DC-DC path. Previously a
  // phantom dcdc_isolator was drawn here (visually between the starter battery
  // and the DC-DC) but never wired, which confused customers and undermined
  // the schematic's value as a paid output.
  if (hasDC && dcdcC) {
    svg += placeComponent('dcdc', 'orion', POS.dcdc.cx, POS.dcdc.cy, DIM.orion.w, DIM.orion.h, { model: dcdcC.product.model }, dcdcC.product.model);
    overridePort('dcdc', 'in_positive', 'top', POS.dcdc.cx, POS.dcdc.cy, DIM.orion.w, DIM.orion.h, -DIM.orion.w * 0.15);
    overridePort('dcdc', 'in_negative', 'left', POS.dcdc.cx, POS.dcdc.cy, DIM.orion.w, DIM.orion.h);
    overridePort('dcdc', 'out_positive', 'bottom', POS.dcdc.cx, POS.dcdc.cy, DIM.orion.w, DIM.orion.h, DIM.orion.w * 0.15);
    overridePort('dcdc', 'out_negative', 'bottom', POS.dcdc.cx, POS.dcdc.cy, DIM.orion.w, DIM.orion.h, -DIM.orion.w * 0.15);

    svg += placeComponent('starter_battery', 'starter_battery', POS.starter_battery.cx, POS.starter_battery.cy, DIM.starter_bat.w, DIM.starter_bat.h);
    overridePort('starter_battery', 'positive_terminal', 'right', POS.starter_battery.cx, POS.starter_battery.cy, DIM.starter_bat.w, DIM.starter_bat.h);
    overridePort('starter_battery', 'negative_terminal', 'bottom', POS.starter_battery.cx, POS.starter_battery.cy, DIM.starter_bat.w, DIM.starter_bat.h);
  }

  // --- Battery Protect ---
  if (bpC) {
    svg += placeComponent('battery_protect', 'battery_protect', POS.battery_protect.cx, POS.battery_protect.cy, DIM.battery_protect.w, DIM.battery_protect.h, { amps: Number(bpC.product.specs.maxCurrent) || 100 });
    overridePort('battery_protect', 'in_positive', 'left', POS.battery_protect.cx, POS.battery_protect.cy, DIM.battery_protect.w, DIM.battery_protect.h);
    overridePort('battery_protect', 'out_positive', 'right', POS.battery_protect.cx, POS.battery_protect.cy, DIM.battery_protect.w, DIM.battery_protect.h);
  }

  // --- Fuse Block ---
  svg += placeComponent('fuse_block', 'fuse_block', POS.fuse_block.cx, POS.fuse_block.cy, DIM.fuse_block.w, DIM.fuse_block.h);
  overridePort('fuse_block', 'pos_in', 'top', POS.fuse_block.cx, POS.fuse_block.cy, DIM.fuse_block.w, DIM.fuse_block.h, DIM.fuse_block.w * 0.15);
  overridePort('fuse_block', 'neg_in', 'top', POS.fuse_block.cx, POS.fuse_block.cy, DIM.fuse_block.w, DIM.fuse_block.h, -DIM.fuse_block.w * 0.15);
  overridePort('fuse_block', 'out_1', 'left', POS.fuse_block.cx, POS.fuse_block.cy, DIM.fuse_block.w, DIM.fuse_block.h, -DIM.fuse_block.h * 0.2);
  overridePort('fuse_block', 'out_2', 'left', POS.fuse_block.cx, POS.fuse_block.cy, DIM.fuse_block.w, DIM.fuse_block.h, 0);
  overridePort('fuse_block', 'out_3', 'left', POS.fuse_block.cx, POS.fuse_block.cy, DIM.fuse_block.w, DIM.fuse_block.h, DIM.fuse_block.h * 0.2);

  // --- DC Loads ---
  const dcLoadLabels = ['Lights', 'USB/12V', 'Pump/Fan'];
  for (let i = 0; i < 3; i++) {
    const dlPos = i === 0 ? POS.dc_load_1 : i === 1 ? POS.dc_load_2 : POS.dc_load_3;
    svg += placeComponent(`dc_load_${i + 1}`, 'dc_load', dlPos.cx, dlPos.cy, DIM.dc_load.w, DIM.dc_load.h, { label: dcLoadLabels[i] });
  }

  // --- Cerbo GX ---
  svg += placeComponent('cerbo_gx', 'cerbo_gx', POS.cerbo_gx.cx, POS.cerbo_gx.cy, DIM.cerbo_gx.w, DIM.cerbo_gx.h);

  // --- Shore Power + AC Consumer Units + AC Loads ---
  if (hasShore) {
    svg += placeComponent('shore_inlet', 'shore_inlet', POS.shore_inlet.cx, POS.shore_inlet.cy, DIM.shore_inlet.w, DIM.shore_inlet.h);
    overridePort('shore_inlet', 'ac_line', 'bottom', POS.shore_inlet.cx, POS.shore_inlet.cy, DIM.shore_inlet.w, DIM.shore_inlet.h);

    svg += placeComponent('consumer_unit_in', 'consumer_unit', POS.consumer_unit_in.cx, POS.consumer_unit_in.cy, DIM.consumer_unit.w, DIM.consumer_unit.h, { label: 'RCD/MCB' });
    overridePort('consumer_unit_in', 'ac_in', 'top', POS.consumer_unit_in.cx, POS.consumer_unit_in.cy, DIM.consumer_unit.w, DIM.consumer_unit.h);
    overridePort('consumer_unit_in', 'ac_out_1', 'bottom', POS.consumer_unit_in.cx, POS.consumer_unit_in.cy, DIM.consumer_unit.w, DIM.consumer_unit.h);

    svg += placeComponent('consumer_unit_out', 'consumer_unit', POS.consumer_unit_out.cx, POS.consumer_unit_out.cy, DIM.consumer_unit.w, DIM.consumer_unit.h, { label: 'RCD/MCB' });
    overridePort('consumer_unit_out', 'ac_in', 'left', POS.consumer_unit_out.cx, POS.consumer_unit_out.cy, DIM.consumer_unit.w, DIM.consumer_unit.h);
    overridePort('consumer_unit_out', 'ac_out_1', 'top', POS.consumer_unit_out.cx, POS.consumer_unit_out.cy, DIM.consumer_unit.w, DIM.consumer_unit.h, -DIM.consumer_unit.w * 0.25);
    overridePort('consumer_unit_out', 'ac_out_2', 'top', POS.consumer_unit_out.cx, POS.consumer_unit_out.cy, DIM.consumer_unit.w, DIM.consumer_unit.h, 0);
    overridePort('consumer_unit_out', 'ac_out_3', 'top', POS.consumer_unit_out.cx, POS.consumer_unit_out.cy, DIM.consumer_unit.w, DIM.consumer_unit.h, DIM.consumer_unit.w * 0.25);

    const acLoadLabels = ['Sockets', 'Heater', 'Spare'];
    for (let i = 0; i < 3; i++) {
      const alPos = i === 0 ? POS.ac_load_1 : i === 1 ? POS.ac_load_2 : POS.ac_load_3;
      svg += placeComponent(`ac_load_${i + 1}`, 'ac_load', alPos.cx, alPos.cy, DIM.ac_load.w, DIM.ac_load.h, { label: acLoadLabels[i] });
    }
  }

  // ═══ CHASSIS EARTH SYMBOLS (green tree style — like Tiny Build) ═══
  // Earth symbols on components that need chassis grounding
  const distEarth = placedPorts.distribution?.earth;
  if (distEarth) svg += earthSymbol(distEarth.x, distEarth.y + 4);
  if (hasInv) {
    const invBottom = POS.inverter.cy + DIM.multiplus.h / 2;
    svg += earthSymbol(POS.inverter.cx, invBottom + 4);
  }
  if (hasShore) {
    const cuInRight = POS.consumer_unit_in.cx + DIM.consumer_unit.w / 2;
    svg += earthSymbol(cuInRight + 4, POS.consumer_unit_in.cy);
    const cuOutRight = POS.consumer_unit_out.cx + DIM.consumer_unit.w / 2;
    svg += earthSymbol(cuOutRight + 4, POS.consumer_unit_out.cy);
  }

  void placedPorts;

  // ═══ WIRES (no verbose labels — gauge badges only) ═══

  const dirVec = (dir: 'left' | 'right' | 'up' | 'down'): Pt => {
    if (dir === 'left') return { x: -1, y: 0 };
    if (dir === 'right') return { x: 1, y: 0 };
    if (dir === 'up') return { x: 0, y: -1 };
    return { x: 0, y: 1 };
  };

  const autoRoute = (
    src: Pt,
    dst: Pt,
    srcDir: 'up' | 'down' | 'left' | 'right',
    dstDir: 'up' | 'down' | 'left' | 'right',
    obstacles: Rect[],
    hint: RouteHint = 'auto',
  ): Pt[] => {
    const lHorizontal = [{ x: dst.x, y: src.y }];
    const lVertical = [{ x: src.x, y: dst.y }];
    const lHPath = [src, ...lHorizontal, dst];
    const lVPath = [src, ...lVertical, dst];

    if ((hint === 'direct' || hint === 'auto') && !pathIntersectsAny(lHPath, obstacles)) return lHorizontal;
    if ((hint === 'direct-v' || hint === 'auto' || hint === 'direct') && !pathIntersectsAny(lVPath, obstacles)) return lVertical;

    const tryViaY = (y: number): Pt[] | null => {
      const route = [src, { x: src.x, y }, { x: dst.x, y }, dst];
      if (!pathIntersectsAny(route, obstacles)) return [{ x: src.x, y }, { x: dst.x, y }];
      return null;
    };

    const tryViaX = (x: number): Pt[] | null => {
      const route = [src, { x, y: src.y }, { x, y: dst.y }, dst];
      if (!pathIntersectsAny(route, obstacles)) return [{ x, y: src.y }, { x, y: dst.y }];
      return null;
    };

    const step = 10;
    const yMin = Math.max(20, Math.min(src.y, dst.y) - 260);
    const yMax = Math.min(820, Math.max(src.y, dst.y) + 260);
    const xMin = Math.max(20, Math.min(src.x, dst.x) - 260);
    const xMax = Math.min(1170, Math.max(src.x, dst.x) + 260);

    const obstacleTop = Math.min(...obstacles.map((r) => r.y), yMin);
    const obstacleBottom = Math.max(...obstacles.map((r) => r.y + r.h), yMax);
    const obstacleLeft = Math.min(...obstacles.map((r) => r.x), xMin);
    const obstacleRight = Math.max(...obstacles.map((r) => r.x + r.w), xMax);

    if (hint === 'top') {
      for (let y = Math.round((obstacleTop - 20) / step) * step; y >= 20; y -= step) {
        const via = tryViaY(y);
        if (via) return via;
      }
    }
    if (hint === 'bottom') {
      for (let y = Math.round((obstacleBottom + 20) / step) * step; y <= 820; y += step) {
        const via = tryViaY(y);
        if (via) return via;
      }
    }
    if (hint === 'left') {
      for (let x = Math.round((obstacleLeft - 20) / step) * step; x >= 20; x -= step) {
        const via = tryViaX(x);
        if (via) return via;
      }
    }
    if (hint === 'right') {
      for (let x = Math.round((obstacleRight + 20) / step) * step; x <= 1170; x += step) {
        const via = tryViaX(x);
        if (via) return via;
      }
    }

    // Fallback corridor scan: nearest clear horizontal first, then vertical.
    for (let d = 0; d <= 300; d += step) {
      const upY = src.y - d;
      const downY = src.y + d;
      if (upY >= yMin) {
        const via = tryViaY(upY);
        if (via) return via;
      }
      if (downY <= yMax) {
        const via = tryViaY(downY);
        if (via) return via;
      }
    }
    for (let d = 0; d <= 300; d += step) {
      const leftX = src.x - d;
      const rightX = src.x + d;
      if (leftX >= xMin) {
        const via = tryViaX(leftX);
        if (via) return via;
      }
      if (rightX <= xMax) {
        const via = tryViaX(rightX);
        if (via) return via;
      }
    }

    // Last resort: deterministic direct route.
    console.warn(`autoRoute fallback used (${srcDir}->${dstDir})`);
    return lHorizontal;
  };

  // ═══ WIRE_STRATEGIES — Fundamental Change v2 (Dan's Photoshop wiring map) ═══
  const WIRE_STRATEGIES: Record<string, RouteHint> = {
    // ── AC PATH (right side, clean vertical drops + horizontal kick) ──
    'shore_inlet:ac_line→consumer_unit_in:ac_in': 'direct',
    'consumer_unit_in:ac_out_1→inverter:ac_in': 'direct',
    'inverter:ac_out→consumer_unit_out:ac_in': 'direct',
    'consumer_unit_out:ac_out_1→ac_load_1:ac_in': 'direct',
    'consumer_unit_out:ac_out_2→ac_load_2:ac_in': 'direct',
    'consumer_unit_out:ac_out_3→ac_load_3:ac_in': 'direct',

    // ── SOLAR PATH (left side vertical, then right to MPPT) ──
    'solar_panel_1:pv_positive→pv_disconnect:pv_in_positive': 'auto',
    'solar_panel_1:pv_negative→mppt:pv_negative': 'direct',
    'pv_disconnect:pv_out_positive→dcdc:in_positive': 'direct',
    'distribution:fuse_out_1→mppt:bat_positive': 'direct',
    'distribution:neg_out_1→mppt:bat_negative': 'direct',

    // ── DC-DC PATH (starter → DC-DC → Lynx; DC-DC handles isolation) ──
    'starter_battery:positive_terminal→dcdc:in_positive': 'auto',
    'starter_battery:negative_terminal→dcdc:in_negative': 'auto',
    'dcdc:out_positive→distribution:fuse_out_2': 'direct',
    'dcdc:out_negative→distribution:neg_out_2': 'direct',

    // ── BATTERY POSITIVE CHAIN (vertical spine: bat → class T → iso → Lynx) ──
    'battery_1:positive_terminal→class_t_fuse:in_positive': 'direct',
    'class_t_fuse:out_positive→battery_isolator:in_positive': 'direct',
    'battery_isolator:out_positive→distribution:busbar_in': 'auto',

    // ── BATTERY NEGATIVE CHAIN (bat → shunt → Lynx) ──
    'battery_1:negative_terminal→smart_shunt:batt_neg_in': 'auto',
    'smart_shunt:system_neg_out→distribution:busbar_neg': 'auto',

    // ── SIGNAL ──
    'smart_shunt:aux_sense→cerbo_gx:ve_bus': 'auto',

    // ── DISTRIBUTION → LOADS (right side of Lynx) ──
    'distribution:fuse_out_3→inverter:dc_positive': 'direct',
    'distribution:neg_out_3→inverter:dc_negative': 'direct',
    'distribution:fuse_out_4→battery_protect:in_positive': 'direct',
    'battery_protect:out_positive→fuse_block:pos_in': 'auto',
    'distribution:neg_out_4→fuse_block:neg_in': 'auto',

    // ── FUSE BLOCK → DC LOADS ──
    'fuse_block:out_1→dc_load_1:in_positive': 'direct',
    'fuse_block:out_2→dc_load_2:in_positive': 'direct',
    'fuse_block:out_3→dc_load_3:in_positive': 'direct',

    // ── PARALLEL JUMPERS ──
    'battery_2:positive_terminal→battery_1:positive_terminal': 'direct',
    'battery_2:negative_terminal→battery_1:negative_terminal': 'direct',
  };

  const drawRuleWire = ({
    fromId,
    fromPort,
    toId,
    toPort,
    netClass,
    hint = 'auto',
    dashed = false,
    overrideGauge,
  }: {
    fromId: string;
    fromPort: string;
    toId: string;
    toPort: string;
    netClass: NetClass;
    hint?: RouteHint;
    dashed?: boolean;
    overrideGauge?: WireGauge;
  }) => {
    const src = placedPorts[fromId]?.[fromPort];
    const dst = placedPorts[toId]?.[toPort];
    const srcType = placedComponentTypes[fromId];
    const dstType = placedComponentTypes[toId];
    if (!src || !dst || !srcType || !dstType) return '';

    const srcRule = getPortRule(srcType, fromPort);
    const dstRule = getPortRule(dstType, toPort);
    // Check per-instance exit overrides first (Fundamental Change v2)
    const srcExitOverride = PORT_EXIT_OVERRIDES[fromId]?.[fromPort];
    const dstExitOverride = PORT_EXIT_OVERRIDES[toId]?.[toPort];
    const srcExit = (srcExitOverride ?? srcRule?.exit ?? 'right') as 'up' | 'down' | 'left' | 'right';
    const dstExit = (dstExitOverride ?? dstRule?.exit ?? 'left') as 'up' | 'down' | 'left' | 'right';
    const srcStubLen = Math.max(10, srcRule?.stubLength ?? 12);
    const dstStubLen = Math.max(10, dstRule?.stubLength ?? 12);
    const srcVec = dirVec(srcExit);
    const dstVec = dirVec(dstExit);

    const srcStubEnd = { x: src.x + srcVec.x * srcStubLen, y: src.y + srcVec.y * srcStubLen };
    const dstStubEnd = { x: dst.x + dstVec.x * dstStubLen, y: dst.y + dstVec.y * dstStubLen };
    const routeKey = `${fromId}:${fromPort}→${toId}:${toPort}`;
    const strategyHint = WIRE_STRATEGIES[routeKey] ?? hint ?? 'auto';
    const middle = autoRoute(srcStubEnd, dstStubEnd, srcExit, dstExit, usedRects, strategyHint);

    const gauge = overrideGauge ?? getEffectiveGauge(placedComponentSku[fromId], srcType, fromPort);
    const strokeWidth = (GAUGE_STROKE[gauge] ?? 2) * WIRE_THICKNESS_SCALE;
    const gaugeNum = Number.parseFloat(gauge);
    const colourKey = srcRule?.colour ?? dstRule?.colour ?? 'signal';
    const color = colourKey === 'dc_negative' ? WC.blk : WIRE_COLOURS[colourKey];

    return wire(src, dst, color, gaugeNum, [srcStubEnd, ...middle, dstStubEnd], {
      dashed,
      netClass,
      strokeWidth,
    });
  };

  // ═══ WIRING — Fundamental Change v2 (Dan's Photoshop wiring map) ═══
  const heavyGauge: WireGauge = mG >= 70 ? '70' : mG >= 50 ? '50' : mG >= 35 ? '35' : mG >= 25 ? '25' : mG >= 16 ? '16' : '10';

  // ── BATTERY POSITIVE CHAIN: bat1+ → Class T → Isolator → Lynx bus+in ──
  svg += drawRuleWire({
    fromId: 'battery_1',
    fromPort: 'positive_terminal',
    toId: 'class_t_fuse',
    toPort: 'in_positive',
    netClass: 'dc_hi',
    hint: 'direct',
    overrideGauge: heavyGauge,
  });
  svg += drawRuleWire({
    fromId: 'class_t_fuse', fromPort: 'out_positive',
    toId: 'battery_isolator', toPort: 'in_positive',
    netClass: 'dc_hi', hint: 'direct', overrideGauge: heavyGauge,
  });
  svg += drawRuleWire({
    fromId: 'battery_isolator', fromPort: 'out_positive',
    toId: 'distribution', toPort: hasLynx ? 'busbar_in' : 'pos_in',
    netClass: 'dc_hi', hint: 'auto', overrideGauge: heavyGauge,
  });

  // ── BATTERY NEGATIVE CHAIN: bat1- → Shunt → Lynx bus-in ──
  svg += drawRuleWire({
    fromId: 'battery_1', fromPort: 'negative_terminal',
    toId: 'smart_shunt', toPort: 'batt_neg_in',
    netClass: 'dc_hi', hint: 'auto', overrideGauge: heavyGauge,
  });
  svg += drawRuleWire({
    fromId: 'smart_shunt', fromPort: 'system_neg_out',
    toId: 'distribution', toPort: hasLynx ? 'busbar_neg' : 'neg_in',
    netClass: 'dc_hi', hint: 'auto', overrideGauge: heavyGauge,
  });

  // ── BATTERY PARALLEL JUMPERS (if 2 batteries) ──
  if (batteryDisplayQty > 1) {
    svg += drawRuleWire({
      fromId: 'battery_2', fromPort: 'positive_terminal',
      toId: 'battery_1', toPort: 'positive_terminal',
      netClass: 'dc_hi', hint: 'direct', overrideGauge: heavyGauge,
    });
    svg += drawRuleWire({
      fromId: 'battery_2', fromPort: 'negative_terminal',
      toId: 'battery_1', toPort: 'negative_terminal',
      netClass: 'dc_hi', hint: 'direct', overrideGauge: heavyGauge,
    });
  }

  // ── SIGNAL: Shunt aux → Cerbo VE.bus ──
  svg += drawRuleWire({
    fromId: 'smart_shunt', fromPort: 'aux_sense',
    toId: 'cerbo_gx', toPort: 've_bus',
    netClass: 'signal', hint: 'auto', dashed: true,
  });

  // ── DISTRIBUTION → INVERTER (Lynx right side: fuse3/neg3) ──
  if (hasInv && invC) {
    const heavyInvGauge: WireGauge = iG >= 70 ? '70' : iG >= 50 ? '50' : iG >= 35 ? '35' : iG >= 25 ? '25' : iG >= 16 ? '16' : '10';
    svg += drawRuleWire({
      fromId: 'distribution', fromPort: hasLynx ? 'fuse_out_3' : 'pos_out_4',
      toId: 'inverter', toPort: 'dc_positive',
      netClass: 'dc_hi', hint: 'direct', overrideGauge: heavyInvGauge,
    });
    svg += drawRuleWire({
      fromId: 'distribution', fromPort: hasLynx ? 'neg_out_3' : 'neg_out_4',
      toId: 'inverter', toPort: 'dc_negative',
      netClass: 'dc_hi', hint: 'direct', overrideGauge: heavyInvGauge,
    });
  }

  // ── DISTRIBUTION → MPPT (Lynx left side: fuse1/neg1 → MPPT right side) ──
  if (hasMPPT && mpptC) {
    const mpptGauge: WireGauge = mpG >= 16 ? '16' : mpG >= 10 ? '10' : '6';
    svg += drawRuleWire({
      fromId: 'distribution', fromPort: hasLynx ? 'fuse_out_1' : 'pos_out_2',
      toId: 'mppt', toPort: 'bat_positive',
      netClass: 'dc_lo', hint: 'direct', overrideGauge: mpptGauge,
    });
    svg += drawRuleWire({
      fromId: 'distribution', fromPort: hasLynx ? 'neg_out_1' : 'neg_out_2',
      toId: 'mppt', toPort: 'bat_negative',
      netClass: 'dc_lo', hint: 'direct', overrideGauge: mpptGauge,
    });

    // Solar panel → PV disconnect → MPPT
    svg += drawRuleWire({
      fromId: 'solar_panel_1', fromPort: 'pv_positive',
      toId: 'pv_disconnect', toPort: 'pv_in_positive',
      netClass: 'dc_lo', hint: 'auto', overrideGauge: '6',
    });
    svg += drawRuleWire({
      fromId: 'solar_panel_1', fromPort: 'pv_negative',
      toId: 'mppt', toPort: 'pv_negative',
      netClass: 'dc_lo', hint: 'direct', overrideGauge: '6',
    });
    svg += drawRuleWire({
      fromId: 'pv_disconnect', fromPort: 'pv_out_positive',
      toId: 'mppt', toPort: 'pv_positive',
      netClass: 'dc_lo', hint: 'auto', overrideGauge: '6',
    });

    // Solar panel parallel jumpers (if multiple panels)
    const panelCount = Math.min(solarCount, 3);
    if (panelCount > 1) {
      svg += drawRuleWire({
        fromId: 'solar_panel_2', fromPort: 'pv_positive',
        toId: 'solar_panel_1', toPort: 'pv_positive',
        netClass: 'dc_lo', hint: 'direct', overrideGauge: '6',
      });
      svg += drawRuleWire({
        fromId: 'solar_panel_2', fromPort: 'pv_negative',
        toId: 'solar_panel_1', toPort: 'pv_negative',
        netClass: 'dc_lo', hint: 'direct', overrideGauge: '6',
      });
    }
    if (panelCount > 2) {
      svg += drawRuleWire({
        fromId: 'solar_panel_3', fromPort: 'pv_positive',
        toId: 'solar_panel_2', toPort: 'pv_positive',
        netClass: 'dc_lo', hint: 'direct', overrideGauge: '6',
      });
      svg += drawRuleWire({
        fromId: 'solar_panel_3', fromPort: 'pv_negative',
        toId: 'solar_panel_2', toPort: 'pv_negative',
        netClass: 'dc_lo', hint: 'direct', overrideGauge: '6',
      });
    }
  }

  // ── DC-DC PATH: Starter → DC-DC → Lynx (fuse2/neg2 top) ──
  // The Orion-Tr Smart isolates internally; no external isolator in this path.
  if (hasDC && dcdcC) {
    const dcdcGaugeOut: WireGauge = doG >= 16 ? '16' : doG >= 10 ? '10' : '6';
    const dcdcGaugeIn: WireGauge = diG >= 16 ? '16' : diG >= 10 ? '10' : '6';
    // Starter + → DC-DC in+ (auto-route to avoid the solar panel obstacle)
    svg += drawRuleWire({
      fromId: 'starter_battery', fromPort: 'positive_terminal',
      toId: 'dcdc', toPort: 'in_positive',
      netClass: 'dc_lo', hint: 'auto', overrideGauge: dcdcGaugeIn,
    });
    // Starter - → DC-DC in-
    svg += drawRuleWire({
      fromId: 'starter_battery', fromPort: 'negative_terminal',
      toId: 'dcdc', toPort: 'in_negative',
      netClass: 'dc_lo', hint: 'auto', overrideGauge: dcdcGaugeIn,
    });
    // DC-DC out → Lynx fuse2/neg2 (top of Lynx)
    svg += drawRuleWire({
      fromId: 'dcdc', fromPort: 'out_positive',
      toId: 'distribution', toPort: hasLynx ? 'fuse_out_2' : 'pos_out_1',
      netClass: 'dc_lo', hint: 'direct', overrideGauge: dcdcGaugeOut,
    });
    svg += drawRuleWire({
      fromId: 'dcdc', fromPort: 'out_negative',
      toId: 'distribution', toPort: hasLynx ? 'neg_out_2' : 'neg_out_1',
      netClass: 'dc_lo', hint: 'direct', overrideGauge: dcdcGaugeOut,
    });
  }

  // ── DISTRIBUTION → BP → FUSE BLOCK (Lynx right side: fuse4/neg4) ──
  if (bpC) {
    const bpGauge: WireGauge = bG >= 16 ? '16' : '10';
    svg += drawRuleWire({
      fromId: 'distribution', fromPort: hasLynx ? 'fuse_out_4' : 'pos_out_3',
      toId: 'battery_protect', toPort: 'in_positive',
      netClass: 'dc_hi', hint: 'direct', overrideGauge: bpGauge,
    });
    svg += drawRuleWire({
      fromId: 'battery_protect', fromPort: 'out_positive',
      toId: 'fuse_block', toPort: 'pos_in',
      netClass: 'dc_hi', hint: 'auto', overrideGauge: bpGauge,
    });
    // neg4 → fuse block neg_in (shared with Cerbo neg)
    svg += drawRuleWire({
      fromId: 'distribution', fromPort: hasLynx ? 'neg_out_4' : 'neg_out_3',
      toId: 'fuse_block', toPort: 'neg_in',
      netClass: 'dc_hi', hint: 'auto', overrideGauge: bpGauge,
    });
  }

  // ── FUSE BLOCK → DC LOADS (individual paired wires) ──
  for (let i = 1; i <= 3; i++) {
    svg += drawRuleWire({
      fromId: 'fuse_block', fromPort: `out_${i}`,
      toId: `dc_load_${i}`, toPort: 'in_positive',
      netClass: 'dc_lo', hint: 'direct', overrideGauge: '2.5',
    });
  }

  // ── CERBO GX POWER (tee off fuse4/neg4 from Lynx area) ──
  svg += drawRuleWire({
    fromId: 'distribution', fromPort: hasLynx ? 'fuse_out_4' : 'pos_out_3',
    toId: 'cerbo_gx', toPort: 'pos_12v',
    netClass: 'dc_lo', hint: 'auto', overrideGauge: '2.5',
  });
  svg += drawRuleWire({
    fromId: 'distribution', fromPort: hasLynx ? 'neg_out_4' : 'neg_out_3',
    toId: 'cerbo_gx', toPort: 'neg_12v',
    netClass: 'dc_lo', hint: 'auto', overrideGauge: '2.5',
  });

  // ── AC WIRING (shore power path — right side of schematic) ──
  if (hasShore && hasInv) {
    svg += drawRuleWire({
      fromId: 'shore_inlet', fromPort: 'ac_line',
      toId: 'consumer_unit_in', toPort: 'ac_in',
      netClass: 'ac_in', hint: 'direct', overrideGauge: '2.5',
    });
    svg += drawRuleWire({
      fromId: 'consumer_unit_in', fromPort: 'ac_out_1',
      toId: 'inverter', toPort: 'ac_in',
      netClass: 'ac_in', hint: 'direct', overrideGauge: '2.5',
    });
    svg += drawRuleWire({
      fromId: 'inverter', fromPort: 'ac_out',
      toId: 'consumer_unit_out', toPort: 'ac_in',
      netClass: 'ac_out', hint: 'direct', overrideGauge: '2.5',
    });
    // CU out → individual AC loads
    svg += drawRuleWire({
      fromId: 'consumer_unit_out', fromPort: 'ac_out_1',
      toId: 'ac_load_1', toPort: 'ac_in',
      netClass: 'ac_out', hint: 'direct', overrideGauge: '2.5',
    });
    svg += drawRuleWire({
      fromId: 'consumer_unit_out', fromPort: 'ac_out_2',
      toId: 'ac_load_2', toPort: 'ac_in',
      netClass: 'ac_out', hint: 'direct', overrideGauge: '2.5',
    });
    svg += drawRuleWire({
      fromId: 'consumer_unit_out', fromPort: 'ac_out_3',
      toId: 'ac_load_3', toPort: 'ac_in',
      netClass: 'ac_out', hint: 'direct', overrideGauge: '2.5',
    });
  }

  // ═══ TERMINAL LUGS (updated for Fundamental Change v2) ═══
  const lugScale = 0.7;

  const batPos = placedPorts.battery_1?.positive_terminal;
  if (batPos) svg += drawLug(batPos.x, batPos.y, `${mG}mm²`, 'up', 8, lugScale);

  const batNegLug = placedPorts.battery_1?.negative_terminal;
  if (batNegLug) svg += drawLug(batNegLug.x, batNegLug.y, `${mG}mm²`, 'down', 8, lugScale);

  if (batteryDisplayQty > 1) {
    const bat2Pos = placedPorts.battery_2?.positive_terminal;
    if (bat2Pos) svg += drawLug(bat2Pos.x, bat2Pos.y, `${mG}mm²`, 'up', 8, lugScale);
    const bat2Neg = placedPorts.battery_2?.negative_terminal;
    if (bat2Neg) svg += drawLug(bat2Neg.x, bat2Neg.y, `${mG}mm²`, 'down', 8, lugScale);
  }

  const ctIn = placedPorts.class_t_fuse?.in_positive;
  const ctOut = placedPorts.class_t_fuse?.out_positive;
  if (ctIn) svg += drawLug(ctIn.x, ctIn.y, `${mG}mm²`, 'down', 8, lugScale);
  if (ctOut) svg += drawLug(ctOut.x, ctOut.y, `${mG}mm²`, 'right', 8, lugScale);

  const isoIn = placedPorts.battery_isolator?.in_positive;
  const isoOut = placedPorts.battery_isolator?.out_positive;
  if (isoIn) svg += drawLug(isoIn.x, isoIn.y, `${mG}mm²`, 'left', 8, lugScale);
  if (isoOut) svg += drawLug(isoOut.x, isoOut.y, `${mG}mm²`, 'up', 8, lugScale);

  const lynxIn = placedPorts.distribution?.busbar_in ?? placedPorts.distribution?.pos_in;
  if (lynxIn) svg += drawLug(lynxIn.x, lynxIn.y, `${mG}mm²`, 'down', 8, lugScale);

  const lynxNeg = placedPorts.distribution?.busbar_neg ?? placedPorts.distribution?.neg_in;
  if (lynxNeg) svg += drawLug(lynxNeg.x, lynxNeg.y, `${mG}mm²`, 'down', 8, lugScale);

  const shuntIn = placedPorts.smart_shunt?.batt_neg_in;
  const shuntOut = placedPorts.smart_shunt?.system_neg_out;
  if (shuntIn) svg += drawLug(shuntIn.x, shuntIn.y, `${mG}mm²`, 'left', 8, lugScale);
  if (shuntOut) svg += drawLug(shuntOut.x, shuntOut.y, `${mG}mm²`, 'up', 8, lugScale);

  if (hasInv) {
    const invDcPos = placedPorts.inverter?.dc_positive;
    const invDcNeg = placedPorts.inverter?.dc_negative;
    if (invDcPos) svg += drawLug(invDcPos.x, invDcPos.y, `${iG}mm²`, 'left', 8, lugScale);
    if (invDcNeg) svg += drawLug(invDcNeg.x, invDcNeg.y, `${iG}mm²`, 'left', 8, lugScale);
  }

  if (hasMPPT) {
    const mpptBatPos = placedPorts.mppt?.bat_positive;
    const mpptBatNeg = placedPorts.mppt?.bat_negative;
    if (mpptBatPos) svg += drawLug(mpptBatPos.x, mpptBatPos.y, `${mpG}mm²`, 'right', 6, lugScale);
    if (mpptBatNeg) svg += drawLug(mpptBatNeg.x, mpptBatNeg.y, `${mpG}mm²`, 'right', 6, lugScale);
  }

  if (bpC) {
    const bpIn = placedPorts.battery_protect?.in_positive;
    const bpOut = placedPorts.battery_protect?.out_positive;
    if (bpIn) svg += drawLug(bpIn.x, bpIn.y, `${bG}mm²`, 'left', 6, lugScale);
    if (bpOut) svg += drawLug(bpOut.x, bpOut.y, `${bG}mm²`, 'right', 6, lugScale);
  }

  const fbPos = placedPorts.fuse_block?.pos_in;
  const fbNeg = placedPorts.fuse_block?.neg_in;
  if (fbPos) svg += drawLug(fbPos.x, fbPos.y, `${bG}mm²`, 'up', 6, lugScale);
  if (fbNeg) svg += drawLug(fbNeg.x, fbNeg.y, `${bG}mm²`, 'up', 6, lugScale);

  // Fuse block output lugs
  for (let i = 1; i <= 3; i++) {
    const fbOut = (placedPorts.fuse_block as Record<string, Pt> | undefined)?.[`out_${i}`];
    if (fbOut) svg += drawLug(fbOut.x, fbOut.y, '2.5mm²', 'left', 5, lugScale);
  }

  // Starter battery negative lug
  if (hasDC) {
    const starterNeg = placedPorts.starter_battery?.negative_terminal;
    if (starterNeg) svg += drawLug(starterNeg.x, starterNeg.y, `${diG}mm²`, 'down', 6, lugScale);
  }

  svg += `</svg>`;
  
  // === PAGE 2: Reference Sheet ===
  let page2 = `<svg xmlns="http://www.w3.org/2000/svg" width="1190" height="842" viewBox="0 0 1190 842" style="font-family:-apple-system,BlinkMacSystemFont,'Helvetica Neue',Arial,sans-serif">`;
  page2 += `<rect x="0" y="0" width="1190" height="842" fill="#F8F9FA"/>`;
  page2 += `<rect x="0" y="0" width="1190" height="26" fill="#1A1A1A"/>`;
  page2 += `<text x="14" y="18" font-size="10" fill="#D9A05B" font-weight="800">CRAFTED CAMPER CO.</text>`;
  page2 += `<text x="200" y="18" font-size="9" fill="#fff" font-weight="600">Reference Sheet</text>`;
  page2 += `<text x="1176" y="18" text-anchor="end" font-size="7" fill="#D9A05B" font-weight="700">V4.0</text>`;
  page2 += `<line x1="0" y1="26" x2="1190" y2="26" stroke="#D9A05B" stroke-width="1.5"/>`;
  
  // Move component key to page 2 — render at x=40, full width
  page2 += componentKeyTable(40, 44, keyItems);
  
  // Wire colour legend
  const p2KeyH = 26 + keyItems.length * 15;
  page2 += colorLegend(40, 52 + p2KeyH);
  
  // Glossary
  page2 += glossaryBox(40, 52 + p2KeyH + 88);
  
  // iPhone mockup + QR
  page2 += iphoneMockup(400, 52 + p2KeyH);
  page2 += qrCodePlaceholder(520, 52 + p2KeyH);
  
  // DC Fuse Board Circuits
  page2 += dcCircuitsTable(40, 52 + p2KeyH + 88 + 98, fbCircuits);
  
  // Footer info boxes
  const p2FooterY = 680;
  const p2BoxW = Math.floor((1190 - 40 - 24) / 3);
  page2 += `<g transform="translate(16,${p2FooterY})">`;
  page2 += `<rect x="0" y="0" width="${p2BoxW}" height="48" rx="4" fill="rgba(0,0,0,0.03)" stroke="#1A1A1A" stroke-width="0.6"/>`;
  page2 += `<text x="6" y="11" font-size="6" fill="#1A1A1A" font-weight="800">COMPULSORY READING</text>`;
  page2 += `<text x="6" y="22" font-size="6.5" fill="#555">All cable &amp; fuse sizes per manufacturer specs. Qualified fitter required.</text>`;
  page2 += `<text x="6" y="32" font-size="6.5" fill="#555">EIC must be issued prior to first use.</text>`;
  page2 += `<text x="6" y="42" font-size="5.5" fill="#C0392B" font-weight="600">Crafted Camper Co (Yorkshire) LTD</text>`;
  page2 += `</g>`;
  
  // Safety banner
  page2 += `<rect x="0" y="792" width="1190" height="50" fill="#C0392B"/>`;
  page2 += `<text x="595" y="814" text-anchor="middle" font-size="11" fill="#fff" font-weight="800">⚠ 230V IS EXTREMELY HAZARDOUS — MUST BE INSTALLED BY A QUALIFIED FITTER ⚠</text>`;
  page2 += `<text x="595" y="830" text-anchor="middle" font-size="7" fill="rgba(255,255,255,0.8)">All installations must comply with BS 7671. An EIC must be issued before first use.</text>`;
  
  page2 += `</svg>`;
  
  return { page1: svg, page2 };
}

// ────────────────────────────────────────────────────────────────────────────
// 9. REGRESSION VALIDATION
// ────────────────────────────────────────────────────────────────────────────

export interface SchematicCheck {
  pass: boolean;
  failures: string[];
}

export function validateSchematicSVG(svgString: string): SchematicCheck {
  const failures: string[] = [];
  const W = 1190, H = 842;

  // Check 1: No path/polyline coordinates outside the viewBox.
  const coordPattern = /(?:points|d)="([^"]+)"/g;
  let m: RegExpExecArray | null;
  while ((m = coordPattern.exec(svgString)) !== null) {
    const nums = m[1].match(/-?\d+(\.\d+)?/g)?.map(Number) ?? [];
    for (let i = 0; i < nums.length; i += 2) {
      const x = nums[i], y = nums[i + 1];
      if (x !== undefined && (x < -5 || x > W + 5)) {
        failures.push(`Out-of-bounds X=${x} (limit 0-${W})`);
        break;
      }
      if (y !== undefined && (y < -5 || y > H + 5)) {
        failures.push(`Out-of-bounds Y=${y} (limit 0-${H})`);
        break;
      }
    }
  }

  // Check 2: AC load wire must be present when shore power components exist.
  const hasShoreInlet = svgString.includes('SHORE') || svgString.includes('shore');
  const hasACLoadsWire = svgString.includes('AC_LOADS_WIRE');
  if (hasShoreInlet && !hasACLoadsWire) {
    failures.push('Shore power present but AC loads wire missing');
  }

  // Check 3: Chassis ground symbols must be present.
  if (!svgString.includes('CHASSIS') && !svgString.includes('chassis')) {
    failures.push('Chassis ground symbols not found in schematic');
  }

  return { pass: failures.length === 0, failures };
}
