/**
 * V3 — Zone-based layout rewrite.
 * Fixed 1190x842 landscape canvas (A4 proportions).
 * Numbered component references with a sidebar key table.
 * Clean wire routing with gauge-only labels (no verbose descriptions).
 * Regulation boxes stacked in left margin. Sidebar for key/legend/glossary.
 */
import type { WiringSpec, SystemConfig, WireConnection } from './wiringTypes';
import { drawComponent, type ComponentSpec } from './schematicComponents';
import {
  COMPONENT_RULES,
  GAUGE_STROKE,
  ROUTING,
  WIRE_COLOURS,
  getEffectiveGauge,
  getPortRule,
  type WireGauge,
} from './schematicRules';

// ────────────────────────────────────────────────────────────────────────────
// 1. HELPERS
// ────────────────────────────────────────────────────────────────────────────

interface Pt { x: number; y: number }
interface Rect { x: number; y: number; w: number; h: number }
type NetClass = 'dc_hi' | 'dc_lo' | 'ac_in' | 'ac_out' | 'earth' | 'signal';
interface Seg { a: Pt; b: Pt; cls: NetClass | 'unknown' }
type Dir = 'left' | 'right' | 'up' | 'down';

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
  if (typeof exactFromRules === 'number') return exactFromRules;

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
  if (typeof exact === 'number') return exact;

  if (g >= 70) return 11.0;
  if (g >= 50) return 9.0;
  if (g >= 35) return 7.0;
  if (g >= 25) return 8.0;
  if (g >= 16) return 6.0;
  if (g >= 10) return 4.5;
  if (g >= 6) return 3.5;
  if (g >= 4) return 2.8;
  if (g >= 2.5) return 2.0;
  return 1.5;
}

const WC = { red: '#C0392B', blk: '#2C3E50', gn: '#27AE60', brn: '#8B4513', blu: '#2980B9' };
const STUB = 20;
const COMPONENT_SCALE = 0.72;
const LEFT_EDGE_MIN_X = 60;
const MIN_ROUTING_CLEARANCE = 30;
const scaleDim = (v: number, min = 10) => Math.max(min, Math.round(v * COMPONENT_SCALE));
// Shared terminal reference maps for visual/routing alignment.
const LYNX_PORT_X = [56, 104, 152, 200] as const;
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

function pointInRect(p: Pt, r: Rect, pad = 2): boolean {
  return p.x >= r.x - pad && p.x <= r.x + r.w + pad && p.y >= r.y - pad && p.y <= r.y + r.h + pad;
}

function nearestContainingRect(p: Pt, rects: Rect[]): Rect | undefined {
  let best: Rect | undefined;
  let bestDist = Number.POSITIVE_INFINITY;
  for (const r of rects) {
    if (!pointInRect(p, r, 2)) continue;
    const dL = Math.abs(p.x - r.x);
    const dR = Math.abs((r.x + r.w) - p.x);
    const dT = Math.abs(p.y - r.y);
    const dB = Math.abs((r.y + r.h) - p.y);
    const d = Math.min(dL, dR, dT, dB);
    if (d < bestDist) { bestDist = d; best = r; }
  }
  return best;
}

function rectDistance(p: Pt, r: Rect): number {
  const dx = p.x < r.x ? r.x - p.x : p.x > r.x + r.w ? p.x - (r.x + r.w) : 0;
  const dy = p.y < r.y ? r.y - p.y : p.y > r.y + r.h ? p.y - (r.y + r.h) : 0;
  return Math.hypot(dx, dy);
}

function nearestRectNearPoint(p: Pt, rects: Rect[], maxDist = 10): Rect | undefined {
  let best: Rect | undefined;
  let bestD = Number.POSITIVE_INFINITY;
  for (const r of rects) {
    const d = rectDistance(p, r);
    if (d <= maxDist && d < bestD) {
      bestD = d;
      best = r;
    }
  }
  return best;
}

function escapeFromRect(p: Pt, target: Pt, r: Rect, len = 12): { p: Pt; dir: Dir } {
  const dL = Math.abs(p.x - r.x);
  const dR = Math.abs((r.x + r.w) - p.x);
  const dT = Math.abs(p.y - r.y);
  const dB = Math.abs((r.y + r.h) - p.y);
  const minD = Math.min(dL, dR, dT, dB);

  // If very close to an edge, use that edge direction.
  if (minD === dL) return { p: { x: r.x - len, y: p.y }, dir: 'left' };
  if (minD === dR) return { p: { x: r.x + r.w + len, y: p.y }, dir: 'right' };
  if (minD === dT) return { p: { x: p.x, y: r.y - len }, dir: 'up' };
  if (minD === dB) return { p: { x: p.x, y: r.y + r.h + len }, dir: 'down' };

  // Fallback toward target direction.
  if (Math.abs(target.x - p.x) >= Math.abs(target.y - p.y)) {
    return target.x >= p.x
      ? { p: { x: r.x + r.w + len, y: p.y }, dir: 'right' }
      : { p: { x: r.x - len, y: p.y }, dir: 'left' };
  }
  return target.y >= p.y
    ? { p: { x: p.x, y: r.y + r.h + len }, dir: 'down' }
    : { p: { x: p.x, y: r.y - len }, dir: 'up' };
}

function segmentIntersectsRect(a: Pt, b: Pt, r: Rect, pad = 6): boolean {
  const rx = r.x - pad;
  const ry = r.y - pad;
  const rw = r.w + pad * 2;
  const rh = r.h + pad * 2;

  // Orthogonal-only checks
  if (a.x === b.x) {
    const x = a.x;
    const y1 = Math.min(a.y, b.y);
    const y2 = Math.max(a.y, b.y);
    return x >= rx && x <= rx + rw && y2 >= ry && y1 <= ry + rh;
  }
  if (a.y === b.y) {
    const y = a.y;
    const x1 = Math.min(a.x, b.x);
    const x2 = Math.max(a.x, b.x);
    return y >= ry && y <= ry + rh && x2 >= rx && x1 <= rx + rw;
  }
  return false;
}

function pathCollisionCount(points: Pt[], rects: Rect[], pad = 6): number {
  const p = simplifyPolyline(points);
  let hits = 0;
  for (let i = 0; i < p.length - 1; i++) {
    const a = p[i];
    const b = p[i + 1];
    for (const r of rects) {
      if (segmentIntersectsRect(a, b, r, pad)) hits++;
    }
  }
  return hits;
}

const netPriority: Record<NetClass | 'unknown', number> = {
  dc_hi: 6,
  dc_lo: 5,
  ac_in: 4,
  ac_out: 3,
  earth: 2,
  signal: 1,
  unknown: 0,
};

function segCrowdingPenalty(a: Pt, b: Pt, existing: Seg[], currentClass: NetClass | 'unknown'): number {
  let p = 0;
  for (const s of existing) {
    const curP = netPriority[currentClass];
    const existingP = netPriority[s.cls];
    // Lower-priority nets should yield to already-routed higher-priority nets.
    const priorityMul = curP < existingP ? 1.8 : curP > existingP ? 0.75 : 1.0;

    // direct crossing penalty
    if (a.x === b.x && s.a.y === s.b.y) {
      const x = a.x;
      const y1 = Math.min(a.y, b.y);
      const y2 = Math.max(a.y, b.y);
      const sx1 = Math.min(s.a.x, s.b.x);
      const sx2 = Math.max(s.a.x, s.b.x);
      const sy = s.a.y;
      if (x >= sx1 && x <= sx2 && sy >= y1 && sy <= y2) p += 110 * priorityMul;
    } else if (a.y === b.y && s.a.x === s.b.x) {
      const y = a.y;
      const x1 = Math.min(a.x, b.x);
      const x2 = Math.max(a.x, b.x);
      const sx = s.a.x;
      const sy1 = Math.min(s.a.y, s.b.y);
      const sy2 = Math.max(s.a.y, s.b.y);
      if (y >= sy1 && y <= sy2 && sx >= x1 && sx <= x2) p += 110 * priorityMul;
    }
    // same-lane parallel crowding penalty
    if (a.x === b.x && s.a.x === s.b.x) {
      const dx = Math.abs(a.x - s.a.x);
      if (dx <= 8) {
        const y1 = Math.min(a.y, b.y), y2 = Math.max(a.y, b.y);
        const sy1 = Math.min(s.a.y, s.b.y), sy2 = Math.max(s.a.y, s.b.y);
        if (y2 >= sy1 && y1 <= sy2) p += 60 * priorityMul;
      }
    }
    if (a.y === b.y && s.a.y === s.b.y) {
      const dy = Math.abs(a.y - s.a.y);
      if (dy <= 8) {
        const x1 = Math.min(a.x, b.x), x2 = Math.max(a.x, b.x);
        const sx1 = Math.min(s.a.x, s.b.x), sx2 = Math.max(s.a.x, s.b.x);
        if (x2 >= sx1 && x1 <= sx2) p += 60 * priorityMul;
      }
    }
  }
  return p;
}

function pathCrowdingPenalty(points: Pt[], existing: Seg[], currentClass: NetClass | 'unknown'): number {
  const p = simplifyPolyline(points);
  let total = 0;
  for (let i = 0; i < p.length - 1; i++) {
    total += segCrowdingPenalty(p[i], p[i + 1], existing, currentClass);
  }
  return total;
}

function intervalOverlapLen(a1: number, a2: number, b1: number, b2: number): number {
  const lo = Math.max(Math.min(a1, a2), Math.min(b1, b2));
  const hi = Math.min(Math.max(a1, a2), Math.max(b1, b2));
  return Math.max(0, hi - lo);
}

// Hard clarity rule: allow crossings, disallow "run-along" stacked segments.
function segRunAlongCount(a: Pt, b: Pt, existing: Seg[], tol = 2, minRun = 10): number {
  let hits = 0;
  for (const s of existing) {
    // Vertical collinear (or near-collinear) overlap.
    if (a.x === b.x && s.a.x === s.b.x) {
      if (Math.abs(a.x - s.a.x) <= tol) {
        const ov = intervalOverlapLen(a.y, b.y, s.a.y, s.b.y);
        if (ov >= minRun) hits++;
      }
    }
    // Horizontal collinear (or near-collinear) overlap.
    if (a.y === b.y && s.a.y === s.b.y) {
      if (Math.abs(a.y - s.a.y) <= tol) {
        const ov = intervalOverlapLen(a.x, b.x, s.a.x, s.b.x);
        if (ov >= minRun) hits++;
      }
    }
  }
  return hits;
}

function pathRunAlongCount(points: Pt[], existing: Seg[], tol = 2, minRun = 10): number {
  const p = simplifyPolyline(points);
  let total = 0;
  for (let i = 0; i < p.length - 1; i++) {
    total += segRunAlongCount(p[i], p[i + 1], existing, tol, minRun);
  }
  return total;
}

type RouteHint = 'auto' | 'top' | 'bottom' | 'left' | 'right';

interface CorridorBounds { topY: number; bottomY: number; leftX: number; rightX: number }
interface CorridorFrame { minLeft: number; maxRight: number; minTop: number; maxBottom: number }

function clampCorridors(c: CorridorBounds, f: CorridorFrame): CorridorBounds {
  return {
    leftX: Math.max(f.minLeft, Math.min(c.leftX, f.maxRight - 24)),
    rightX: Math.min(f.maxRight, Math.max(c.rightX, f.minLeft + 24)),
    topY: Math.max(f.minTop, Math.min(c.topY, f.maxBottom - 24)),
    bottomY: Math.min(f.maxBottom, Math.max(c.bottomY, f.minTop + 24)),
  };
}

function routeOrthogonal(
  from: Pt,
  to: Pt,
  rects: Rect[],
  corridors: { topY: number; bottomY: number; leftX: number; rightX: number },
  hint: RouteHint = 'auto',
  existingSegs: Seg[] = [],
  netClass: NetClass | 'unknown' = 'unknown',
  hardNoCrossRects: Rect[] = []
): Pt[] {
  // ═══ PERIMETER-FIRST ROUTING STRATEGY ═══
  // Professional schematics route around component clusters, not through them.
  const candidates: Pt[][] = [];
  const a = from;
  const b = to;
  const topHighwayY = corridors.topY;
  const bottomHighwayY = corridors.bottomY;
  const leftHighwayX = corridors.leftX;
  const rightHighwayX = corridors.rightX;

  // Tier 1: perimeter routes (preferred)
  const perimTop = [{ x: a.x, y: topHighwayY }, { x: b.x, y: topHighwayY }];
  const perimBottom = [{ x: a.x, y: bottomHighwayY }, { x: b.x, y: bottomHighwayY }];
  const perimLeft = [{ x: leftHighwayX, y: a.y }, { x: leftHighwayX, y: b.y }];
  const perimRight = [{ x: rightHighwayX, y: a.y }, { x: rightHighwayX, y: b.y }];

  // Tier 2: direct routes (only when reasonably aligned)
  const sameRow = Math.abs(a.y - b.y) < 80;
  const sameCol = Math.abs(a.x - b.x) < 80;
  const directH = [{ x: b.x, y: a.y }];
  const directV = [{ x: a.x, y: b.y }];

  // Tier 3: L routes
  const hv = [{ x: b.x, y: a.y }];
  const vh = [{ x: a.x, y: b.y }];

  // Tier 4: combined perimeter detours
  const topRight = [{ x: a.x, y: topHighwayY }, { x: rightHighwayX, y: topHighwayY }, { x: rightHighwayX, y: b.y }];
  const topLeft = [{ x: a.x, y: topHighwayY }, { x: leftHighwayX, y: topHighwayY }, { x: leftHighwayX, y: b.y }];
  const bottomRight = [{ x: a.x, y: bottomHighwayY }, { x: rightHighwayX, y: bottomHighwayY }, { x: rightHighwayX, y: b.y }];
  const bottomLeft = [{ x: a.x, y: bottomHighwayY }, { x: leftHighwayX, y: bottomHighwayY }, { x: leftHighwayX, y: b.y }];

  if (hint === 'top') candidates.push(perimTop, perimRight, perimLeft, perimBottom);
  else if (hint === 'bottom') candidates.push(perimBottom, perimRight, perimLeft, perimTop);
  else if (hint === 'left') candidates.push(perimLeft, perimTop, perimBottom, perimRight);
  else if (hint === 'right') candidates.push(perimRight, perimTop, perimBottom, perimLeft);
  else candidates.push(perimTop, perimBottom, perimLeft, perimRight);

  if (sameRow) candidates.push(directH);
  if (sameCol) candidates.push(directV);
  candidates.push(hv, vh, topRight, topLeft, bottomRight, bottomLeft);

  let best = hv;
  let bestH = Infinity, bestS = Infinity, bestK = Infinity, bestC = Infinity, bestD = Infinity;
  for (const waypoints of candidates) {
    const pts = simplifyPolyline([from, ...waypoints, to]);
    const h = pathCollisionCount(pts, hardNoCrossRects, 4);
    const s = pathCollisionCount(pts, rects, 6);
    const k = pathRunAlongCount(pts, existingSegs, 2, 10);
    const c = pathCrowdingPenalty(pts, existingSegs, netClass);
    const bends = Math.max(0, pts.length - 2);
    const dist = pts.slice(0, -1).reduce((acc, p, i) => acc + Math.abs(p.x - pts[i + 1].x) + Math.abs(p.y - pts[i + 1].y), 0);
    const d = bends * 40 + dist + c;
    // Strict lexicographic: hard > soft > run-along > rest
    if (
      h < bestH ||
      (h === bestH && s < bestS) ||
      (h === bestH && s === bestS && k < bestK) ||
      (h === bestH && s === bestS && k === bestK && d < bestD)
    ) {
      bestH = h; bestS = s; bestK = k; bestD = d;
      best = pts.slice(1, -1);
      if (h === 0 && s === 0 && k === 0) break;
    }
  }
  return best;
}

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
      const labelW = gLabel.length * 3.2 + 4;
      const labelH = 7;
      const bgFill = color === WC.red ? 'rgba(192,57,43,0.85)'
                   : color === WC.blk ? 'rgba(44,62,80,0.85)'
                   : color === WC.gn ? 'rgba(39,174,96,0.85)'
                   : color === WC.blu ? 'rgba(41,128,185,0.85)'
                   : 'rgba(80,80,80,0.85)';
      if (bestIsVert) {
        svg += `<g transform="rotate(-90, ${midX}, ${midY})">`;
        svg += `<rect x="${midX - labelW / 2}" y="${midY - labelH / 2}" width="${labelW}" height="${labelH}" rx="2" fill="${bgFill}"/>`;
        svg += `<text x="${midX}" y="${midY}" text-anchor="middle" dominant-baseline="central" font-size="4" fill="#FFF" font-weight="600" font-family="Arial,sans-serif">${gLabel}</text>`;
        svg += `</g>`;
      } else {
        svg += `<rect x="${midX - labelW / 2}" y="${midY - labelH / 2}" width="${labelW}" height="${labelH}" rx="2" fill="${bgFill}"/>`;
        svg += `<text x="${midX}" y="${midY}" text-anchor="middle" dominant-baseline="central" font-size="4" fill="#FFF" font-weight="600" font-family="Arial,sans-serif">${gLabel}</text>`;
      }
      usedRects.push({ x: midX - labelW / 2, y: midY - labelH / 2, w: labelW, h: labelH });
      shownGaugeLabels.set(gaugeKey, shownCount + 1);
    }
  }

  // Register laid segments for subsequent route avoidance.
  for (let i = 0; i < finalPts.length - 1; i++) {
    routedSegs.push({ a: finalPts[i], b: finalPts[i + 1], cls: netClass });
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

  // ═══ ZONE BOUNDARIES ═══
  // Structural step: explicit bands (main schematic + right sidebar) for predictable scaling.
  const PAGE_PAD_X = 20;
  const SIDEBAR_W = 0;
  const RIGHT_SIDEBAR_X = W - 20;
  const FOOTER_Y = 820;

  // ═══ ADAPTIVE LAYOUT ENGINE ═══
  // All positions computed from feature flags — no hardcoded pixel values.
  // When components are absent, remaining components spread to fill the space.

  const solarCount = Math.ceil(config.solarWatts / 200);
  const earthCount = 3 + (hasInv ? 1 : 0) + (hasLPG ? 1 : 0);

  const S_L = Math.max(PAGE_PAD_X, LEFT_EDGE_MIN_X), S_R = W - 40, S_T = 34, S_B = FOOTER_Y - 8;
  const S_W = S_R - S_L, S_H = S_B - S_T;
  const GAP = 85;
  // ═══ PERIMETER WIRE HIGHWAYS ═══
  // Dedicated routing corridors along canvas edges.
  const HIGHWAY_TOP = S_T;
  const HIGHWAY_TOP_END = S_T + 50;
  const HIGHWAY_BOTTOM_START = S_B - 50;
  const HIGHWAY_BOTTOM = S_B;
  const HIGHWAY_LEFT = S_L;
  const HIGHWAY_LEFT_END = S_L + 40;
  const HIGHWAY_RIGHT_START = S_R - 40;
  const HIGHWAY_RIGHT = S_R;
  // Component safe area — keep components inside this frame.
  const COMP_AREA_TOP = HIGHWAY_TOP_END + 10;
  const COMP_AREA_BOTTOM = HIGHWAY_BOTTOM_START - 10;
  const COMP_AREA_LEFT = HIGHWAY_LEFT_END + 10;
  const COMP_AREA_RIGHT = HIGHWAY_RIGHT_START - 10;
  const ROW1_CENTER_Y = COMP_AREA_TOP + 60;
  const ROW2_CENTER_Y = Math.floor((COMP_AREA_TOP + COMP_AREA_BOTTOM) / 2);
  const ROW3_CENTER_Y = COMP_AREA_BOTTOM - 60;
  const MIN_COMP_GAP = 80;

  // Scaled component geometry (~62%) to create whitespace for routing.
  const BAT_UNIT_W = scaleDim(140, 64);
  const BAT_H = scaleDim(90, 44);
  const BAT_PAIR_GAP = scaleDim(12, 8);
  const SHUNT_W = scaleDim(120, 56);
  const SHUNT_H = scaleDim(45, 24);
  const ISO_W = scaleDim(60, 30);
  const ISO_H = scaleDim(54, 26);
  const MIDI_W = scaleDim(46, 24);
  const MIDI_H = scaleDim(28, 16);
  const DIST_W = hasLynx ? scaleDim(280, 132) : scaleDim(260, 124);
  const DIST_H = hasLynx ? scaleDim(130, 60) : scaleDim(38, 22);
  const INV_W = scaleDim(200, 96);
  const INV_H = scaleDim(138, 66);
  const MPPT_W = scaleDim(100, 52);
  const MPPT_H = scaleDim(100, 52);
  const PVDISC_W = scaleDim(56, 30);
  const PVDISC_H = scaleDim(50, 28);
  const DCDC_W = scaleDim(120, 56);
  const DCDC_H = scaleDim(65, 34);
  const STARTER_W = scaleDim(80, 40);
  const STARTER_H = scaleDim(48, 26);
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

  const batW = BAT_UNIT_W * Math.min(batQty, 2) + (batQty > 1 ? BAT_PAIR_GAP : 0);
  const distW = DIST_W;
  const distH = DIST_H;
  const invPortX = (ratio: number) => Math.round(INV_W * ratio);
  const lynxPosX = LYNX_PORT_X[0];
  const lynxMpptX = LYNX_PORT_X[1];
  const lynxDcdcX = LYNX_PORT_X[2];
  const lynxLoadsX = LYNX_PORT_X[3];

  // ── Horizontal columns: compute based on which groups exist ──
  const cols: { id: string; w: number }[] = [];
  cols.push({ id: 'bat', w: batW });
  cols.push({ id: 'chain', w: scaleDim(70, 36) });
  cols.push({ id: 'dist', w: distW });
  if (hasInv) cols.push({ id: 'inv', w: INV_W });
  if (hasShore) cols.push({ id: 'ac', w: CU_W });

  // ENGINE RULE: Column layout must ALWAYS fit inside S_L..S_R.
  // The old algorithm blindly shifted all columns left on overflow, which pushed
  // the battery column to negative coordinates. This is the root cause of the
  // left-boundary wire issue.
  //
  // New algorithm:
  // 1. Try ideal spacing. If it fits, use it.
  // 2. If it overflows, shrink gaps down to minimum (4px).
  // 3. If still overflows, allow columns to overlap slightly rather than go off-screen.
  // 4. HARD GUARANTEE: first column starts at S_L + 4, nothing goes negative.
  const totalColW = cols.reduce((s, c) => s + c.w, 0);
  const minGap = 16;
  const idealGap = Math.floor((S_W - totalColW) / (cols.length + 1));
  const colGap = Math.max(minGap, idealGap);

  const colX: Record<string, number> = {};
  let _cx = S_L + Math.max(minGap, colGap);
  for (const c of cols) {
    colX[c.id] = Math.max(S_L, _cx);
    _cx += c.w + colGap;
  }

  // If layout still exceeds S_R, compress from right side only.
  // Shift rightmost columns inward but NEVER push leftmost columns off-screen.
  const lastRight = _cx - colGap;
  if (lastRight > S_R) {
    const excess = lastRight - S_R;
    const n = cols.length;
    // Distribute excess compression across all gaps, biased toward right side.
    for (let i = 0; i < n; i++) {
      const shift = Math.floor(excess * (i / Math.max(1, n - 1)));
      colX[cols[i].id] = Math.max(S_L, colX[cols[i].id] - shift);
    }
  }

  // Explicit layout zones with generous breathing lanes.
  const zoneLeftX = COMP_AREA_LEFT;
  const zoneCenterLeftX = COMP_AREA_LEFT + Math.floor((COMP_AREA_RIGHT - COMP_AREA_LEFT) * 0.20);
  const zoneCenterX = COMP_AREA_LEFT + Math.floor((COMP_AREA_RIGHT - COMP_AREA_LEFT) * 0.40);
  const zoneCenterRightX = COMP_AREA_LEFT + Math.floor((COMP_AREA_RIGHT - COMP_AREA_LEFT) * 0.60);
  const zoneRightX = COMP_AREA_LEFT + Math.floor((COMP_AREA_RIGHT - COMP_AREA_LEFT) * 0.78);
  colX.bat = Math.max(COMP_AREA_LEFT + 10, zoneLeftX);
  colX.chain = Math.max(zoneCenterLeftX, colX.bat + batW + Math.floor(GAP / 2));
  colX.dist = Math.max(zoneCenterX, colX.chain + scaleDim(70, 36) + Math.floor(GAP / 2));
  if (hasInv) {
    colX.inv = Math.max(zoneCenterRightX, colX.dist + distW + Math.floor(GAP / 2));
  }
  if (hasShore) {
    const acFloor = hasInv ? colX.inv + INV_W + Math.floor(GAP / 2) : colX.dist + distW + Math.floor(GAP / 2);
    colX.ac = Math.min(COMP_AREA_RIGHT - CU_W, Math.max(zoneRightX, acFloor));
  }

  // ── Vertical: compute hub Y so charging is above, loads below ──
  const chargingH = Math.max(
    hasMPPT ? (SOLAR_PANEL_H + 12 + PVDISC_H + 12 + MPPT_H + GAP) : 0,
    hasDC ? (DCDC_H + GAP) : 0
  );
  const loadsH = BP_H + GAP + FB_H + GAP + 16 + 10 + 25;
  const totalV = chargingH + distH + GAP + loadsH;
  const vPad = Math.max(0, Math.floor((S_H - totalV) / 3));

  const distY = Math.max(ROW1_CENTER_Y, Math.min(ROW2_CENTER_Y, S_T + vPad + chargingH));
  const distX = colX['dist'];

  // ── Battery + Shunt (left column, vertically centered on hub) ──
  const batX = COMP_AREA_LEFT + 10;
  const batY = Math.max(COMP_AREA_TOP, Math.min(COMP_AREA_BOTTOM - BAT_H, distY + Math.floor(distH / 2) - Math.floor(BAT_H / 2)));
  // ENGINE RULE: Shunt (battery monitor) is placed well below the battery
  // to leave clear wiring space around both components.
  const shuntX = batX;
  const shuntY = Math.min(ROW3_CENTER_Y - Math.floor(SHUNT_H / 2), batY + BAT_H + GAP + 20);

  // ── Iso + MIDI (stacked, between battery and hub) ──
  const isoX = Math.min(COMP_AREA_RIGHT - ISO_W, batX + batW + MIN_COMP_GAP);
  const isoY = distY + (hasLynx ? 5 : 0);
  const midiX = isoX;
  const midiY = isoY + ISO_H + 12;

  // ── Inverter (if present, vertically centered on hub) ──
  const invX = hasInv ? Math.min(COMP_AREA_RIGHT - INV_W, distX + distW + MIN_COMP_GAP + 20) : 0;
  const invY = hasInv ? distY + Math.floor((distH - INV_H) / 2) : 0;

  // ── AC chain (right column — stacked vertically) ──
  const shoreX = hasShore ? S_R - SHORE_W - 40 : 0;
  const shoreY = hasShore ? S_T + 8 : 0;
  const cuInX = hasShore ? Math.min(COMP_AREA_RIGHT - CU_W, (hasInv ? invX + INV_W + MIN_COMP_GAP : distX + distW + MIN_COMP_GAP + 40)) : 0;
  const cuInY = hasShore ? distY + 10 : 0;
  const cuOutX = hasShore ? cuInX : 0;
  const cuOutY = hasShore ? cuInY + CU_H + GAP : 0;
  const acLoadsX = hasShore ? Math.min(COMP_AREA_RIGHT - AC_LOADS_W, cuInX + Math.floor((CU_W - AC_LOADS_W) / 2)) : 0;
  const acLoadsY = hasShore ? cuOutY + CU_H + Math.floor(GAP / 2) : 0;

  // ── Solar/MPPT chain (left → right row: Solar → PV Isolator → MPPT) ──
  const solarPanelW = Math.max(SOLAR_PANEL_W, Math.min(solarCount, 3) * (SOLAR_PANEL_W + 4) - 4);
  const solarChainW = solarPanelW + 42 + PVDISC_W + 42 + MPPT_W;
  const solarChainCenter = hasMPPT
    ? (hasInv ? Math.floor((distX + distW / 2 + invX + Math.floor(INV_W / 2)) / 2) : distX + Math.floor(distW / 2))
    : 0;
  const solarChainStartX = hasMPPT
    ? Math.max(S_L + 16, Math.min(S_R - solarChainW - 12, solarChainCenter - Math.floor(solarChainW / 2)))
    : 0;
  const solarY = hasMPPT ? Math.max(COMP_AREA_TOP, distY - GAP - MPPT_H - 24) : 0;
  const pvDiscY = hasMPPT ? solarY + Math.floor((MPPT_H - PVDISC_H) / 2) : 0;
  const mpptY = hasMPPT ? solarY : 0;
  const solarX = hasMPPT ? solarChainStartX : 0;
  const pvDiscX = hasMPPT ? solarX + solarPanelW + 42 : 0;
  const mpptX = hasMPPT ? pvDiscX + PVDISC_W + 42 : 0;

  // ── DC-DC + Starter (lifted higher to reduce mid-field intersections) ──
  const dcdcX = hasDC ? colX['bat'] : 0;
  const dcdcY = hasDC ? Math.max(COMP_AREA_TOP, distY - GAP - DCDC_H - 24) : 0;
  const starterX = hasDC ? dcdcX + DCDC_W + GAP : 0;
  const starterY = hasDC ? dcdcY + Math.floor((DCDC_H - STARTER_H) / 2) : 0;

  // ── BP + Fuse Block (below hub, centered under distribution) ──
  const bpX = bpC ? distX + Math.floor(distW / 4) - Math.floor(BP_W / 2) : 0;
  const bpY = distY + distH + GAP;
  const fbX = distX + Math.floor(distW * 3 / 4) - Math.floor(FB_W / 2);
  const fbY = bpY;

  // ── Earth bar + ground (bottom of schematic) ──
  const earthBarW = Math.max(scaleDim(140, 90), earthCount * 24 + 20);
  const earthBarXBase = Math.max(
    S_L + 20,
    Math.min(S_R - earthBarW - 20, hasLynx ? distX + distW - earthBarW - 10 : distX + Math.floor(distW * 0.72))
  );
  const earthBarX = hasShore ? Math.max(earthBarXBase, S_R - earthBarW - 220) : earthBarXBase;
  const earthBarY = Math.max(bpY + FB_H + GAP, S_B - 16 - 10 - 25 - 5);
  // ═══ VERTICAL SAFETY CLAMP ═══
  // Ensure no component is placed below S_B or above S_T
  const clampY = (y: number, h: number) => Math.min(S_B - h - 10, Math.max(S_T + 10, y));
  const earthBarYClamped = clampY(Math.min(S_B - 30, earthBarY), 16);
  const groundX = earthBarX + Math.floor(earthBarW / 2) - 20;
  const groundY = Math.min(S_B - 10, earthBarYClamped + 16 + 8);

  // Routing corridors + keep-out zones (used by adaptive wire routing)
  const corridors = {
    topY: HIGHWAY_TOP + 8,
    bottomY: HIGHWAY_BOTTOM - 8,
    leftX: HIGHWAY_LEFT + 6,
    rightX: HIGHWAY_RIGHT - 6,
  };
  const routingRects: Rect[] = [];
  const hardNoCrossRects: Rect[] = [];
  const pushRect = (x: number, y: number, w: number, h: number) => routingRects.push({ x, y, w, h });
  const pushHardRect = (x: number, y: number, w: number, h: number, padX = MIN_ROUTING_CLEARANCE, padY = MIN_ROUTING_CLEARANCE) =>
    hardNoCrossRects.push({
      x: x - Math.max(MIN_ROUTING_CLEARANCE, padX),
      y: y - Math.max(MIN_ROUTING_CLEARANCE, padY),
      w: w + Math.max(MIN_ROUTING_CLEARANCE, padX) * 2,
      h: h + Math.max(MIN_ROUTING_CLEARANCE, padY) * 2,
    });
  // Main obstacles (full nameplates/component bodies; keep wires off text/plates)
  pushRect(batX, batY - 8, batW, BAT_H + 8);
  pushHardRect(batX, batY - 8, batW, BAT_H + 8);
  pushRect(shuntX, shuntY, SHUNT_W, SHUNT_H);
  pushHardRect(shuntX, shuntY, SHUNT_W, SHUNT_H);
  pushRect(isoX + 2, isoY + 2, ISO_W - 4, ISO_H - 4);
  pushHardRect(isoX + 2, isoY + 2, ISO_W - 4, ISO_H - 4);
  pushRect(midiX, midiY, MIDI_W, MIDI_H);
  pushHardRect(midiX, midiY, MIDI_W, MIDI_H);
  if (hasLynx) {
    pushRect(distX, distY, DIST_W, DIST_H);
    pushHardRect(distX, distY, DIST_W, DIST_H);
  } else {
    pushRect(distX, distY, DIST_W, DIST_H);
    pushHardRect(distX, distY, DIST_W, DIST_H);
  }
  if (hasInv) {
    pushRect(invX, invY, INV_W, INV_H);
    pushHardRect(invX, invY, INV_W, INV_H, 10, 8);
  }
  if (hasMPPT) {
    pushRect(solarX, solarY, solarPanelW, SOLAR_PANEL_H + 7);
    pushRect(pvDiscX, pvDiscY, PVDISC_W, PVDISC_H);
    pushRect(mpptX, mpptY, MPPT_W, MPPT_H);
    pushHardRect(pvDiscX, pvDiscY, PVDISC_W, PVDISC_H);
    pushHardRect(mpptX, mpptY, MPPT_W, MPPT_H);
  }
  if (hasDC) {
    pushRect(dcdcX, dcdcY, DCDC_W, DCDC_H);
    pushRect(starterX, starterY, STARTER_W, STARTER_H);
    pushHardRect(dcdcX, dcdcY, DCDC_W, DCDC_H);
    pushHardRect(starterX, starterY, STARTER_W, STARTER_H);
  }
  if (bpC) {
    pushRect(bpX, bpY, BP_W, BP_H);
    pushHardRect(bpX, bpY, BP_W, BP_H);
  }
  pushRect(fbX, fbY, FB_W, FB_H);
  pushHardRect(fbX, fbY, FB_W, FB_H);
  if (hasShore) {
    pushRect(shoreX, shoreY, SHORE_W, SHORE_H);
    pushHardRect(shoreX, shoreY, SHORE_W, SHORE_H);
    pushRect(cuInX, cuInY, CU_W, CU_H);
    pushRect(cuOutX, cuOutY, CU_W, CU_H);
    pushRect(acLoadsX, acLoadsY, AC_LOADS_W, AC_LOADS_H);
    pushHardRect(cuInX, cuInY, CU_W, CU_H);
    pushHardRect(cuOutX, cuOutY, CU_W, CU_H);
    pushHardRect(acLoadsX, acLoadsY, AC_LOADS_W, AC_LOADS_H);
  }

  const routeNet = (from: Pt, to: Pt, kind: NetClass, hint: RouteHint = 'auto'): Pt[] => {
    const corridorByNet: Record<NetClass, { topY: number; bottomY: number; leftX: number; rightX: number }> = {
      dc_hi:   { topY: HIGHWAY_TOP + 8,  bottomY: HIGHWAY_BOTTOM - 8,  leftX: HIGHWAY_LEFT + 6,  rightX: HIGHWAY_RIGHT - 6 },
      dc_lo:   { topY: HIGHWAY_TOP + 16, bottomY: HIGHWAY_BOTTOM - 16, leftX: HIGHWAY_LEFT + 12, rightX: HIGHWAY_RIGHT - 12 },
      ac_in:   { topY: HIGHWAY_TOP + 24, bottomY: HIGHWAY_BOTTOM - 24, leftX: HIGHWAY_LEFT + 18, rightX: HIGHWAY_RIGHT - 18 },
      ac_out:  { topY: HIGHWAY_TOP + 30, bottomY: HIGHWAY_BOTTOM - 30, leftX: HIGHWAY_LEFT + 24, rightX: HIGHWAY_RIGHT - 24 },
      earth:   { topY: HIGHWAY_TOP + 36, bottomY: HIGHWAY_BOTTOM - 4,  leftX: HIGHWAY_LEFT + 30, rightX: HIGHWAY_RIGHT - 30 },
      signal:  { topY: HIGHWAY_TOP + 42, bottomY: HIGHWAY_BOTTOM - 36, leftX: HIGHWAY_LEFT + 34, rightX: HIGHWAY_RIGHT - 34 },
    };
    const local = { ...corridorByNet[kind] };
    // Deterministic lane spread to avoid stacking parallel runs in same corridor.
    const seed = Math.abs((from.x * 31 + from.y * 17 + to.x * 13 + to.y * 7 + kind.length * 19) | 0);
    const jitter = (seed % 7) - 3; // -3..+3 to increase lane diversity
    const spread = jitter * (kind === 'earth' ? 12 : kind.startsWith('ac_') ? 10 : 8);
    local.topY += spread;
    local.bottomY += spread;
    local.leftX += spread;
    local.rightX -= spread;
    const frame: CorridorFrame = { minLeft: HIGHWAY_LEFT + 6, maxRight: HIGHWAY_RIGHT - 6, minTop: HIGHWAY_TOP + 4, maxBottom: HIGHWAY_BOTTOM - 4 };
    Object.assign(local, clampCorridors(local, frame));
    // Enforce short straight exit/entry at component ports before first bend.
    // Ports can sit a few px outside a body image; still treat them as attached.
    const fromRect = nearestContainingRect(from, routingRects) ?? nearestRectNearPoint(from, routingRects, 10);
    const toRect = nearestContainingRect(to, routingRects) ?? nearestRectNearPoint(to, routingRects, 10);
    const escLen = kind === 'dc_hi' ? 35
                 : kind === 'dc_lo' ? 30
                 : kind === 'earth' ? 28
                 : kind.startsWith('ac_') ? 32
                 : 25;
    // ENGINE RULE: Escape points are clamped to the schematic frame.
    // Prevents wires from starting/ending outside the drawing area.
    const clampPt = (p: Pt): Pt => ({
      x: Math.max(S_L + 4, Math.min(S_R - 4, p.x)),
      y: Math.max(S_T + 2, Math.min(S_B - 2, p.y)),
    });
    const fromEsc = clampPt(fromRect ? escapeFromRect(from, to, fromRect, escLen).p : from);
    const toEsc = clampPt(toRect ? escapeFromRect(to, from, toRect, escLen).p : to);

    // ENGINE RULE: ALL component bodies are soft keep-outs for ALL net classes.
    // This is not selective — every wire avoids every component. Only the
    // source and target bodies are exempted (handled below via startHard/endHard).
    const hardRects: Rect[] = [];
    const addHalo = (r: Rect, padX = MIN_ROUTING_CLEARANCE, padY = MIN_ROUTING_CLEARANCE) => {
      const hx = Math.max(MIN_ROUTING_CLEARANCE, padX);
      const hy = Math.max(MIN_ROUTING_CLEARANCE, padY);
      hardRects.push({ x: r.x - hx, y: r.y - hy, w: r.w + hx * 2, h: r.h + hy * 2 });
    };

    // Universal halos — apply to ALL nets, ALL configurations
    if (hasLynx) addHalo({ x: distX, y: distY, w: DIST_W, h: DIST_H }, 22, 18);
    else addHalo({ x: distX, y: distY, w: DIST_W, h: DIST_H }, 12, 10);
    if (hasInv) addHalo({ x: invX, y: invY, w: INV_W, h: INV_H }, 24, 18);
    if (hasMPPT) {
      addHalo({ x: mpptX, y: mpptY, w: MPPT_W, h: MPPT_H }, 16, 14);
      addHalo({ x: solarX, y: solarY, w: solarPanelW, h: SOLAR_PANEL_H + 7 }, 8, 8);
      addHalo({ x: pvDiscX, y: pvDiscY, w: PVDISC_W, h: PVDISC_H }, 8, 8);
    }
    addHalo({ x: fbX, y: fbY, w: FB_W, h: FB_H }, 14, 12);
    addHalo({ x: batX, y: batY - 8, w: batW, h: BAT_H + 8 }, 14, 12);
    addHalo({ x: shuntX, y: shuntY, w: SHUNT_W, h: SHUNT_H }, 10, 8);
    addHalo({ x: isoX, y: isoY, w: ISO_W, h: ISO_H }, 8, 8);
    addHalo({ x: midiX, y: midiY, w: MIDI_W, h: MIDI_H }, 6, 6);
    if (hasDC) {
      addHalo({ x: dcdcX, y: dcdcY, w: DCDC_W, h: DCDC_H }, 12, 10);
      addHalo({ x: starterX, y: starterY, w: STARTER_W, h: STARTER_H }, 10, 8);
    }
    if (bpC) addHalo({ x: bpX, y: bpY, w: BP_W, h: BP_H }, 10, 8);
    if (hasShore) {
      addHalo({ x: shoreX, y: shoreY, w: SHORE_W, h: SHORE_H }, 6, 6);
      addHalo({ x: cuInX, y: cuInY, w: CU_W, h: CU_H }, 12, 10);
      addHalo({ x: cuOutX, y: cuOutY, w: CU_W, h: CU_H }, 12, 10);
      addHalo({ x: acLoadsX, y: acLoadsY, w: AC_LOADS_W, h: AC_LOADS_H }, 8, 8);
    }
    let routeRects = [...routingRects, ...hardRects];
    // Soft keep-out for already placed labels/pills to avoid running over text.
    if (usedRects.length > 0) {
      routeRects = [
        ...routeRects,
        ...usedRects.map(r => ({ x: r.x - 4, y: r.y - 4, w: r.w + 8, h: r.h + 8 })),
      ];
    }
    // Default class route bias when caller does not force a hint.
    const effectiveHint: RouteHint =
      hint !== 'auto'
        ? hint
        : kind === 'earth'
          ? 'bottom'
          : kind === 'ac_in' || kind === 'ac_out'
            ? 'right'
            : 'auto';
    // Keep hard keep-outs active, but ignore only the source/target appliance bodies.
    // Tight source/target matching avoids accidentally exempting the wrong body.
    const startHard = nearestContainingRect(from, hardNoCrossRects) ?? nearestRectNearPoint(from, hardNoCrossRects, 4);
    const endHard = nearestContainingRect(to, hardNoCrossRects) ?? nearestRectNearPoint(to, hardNoCrossRects, 4);
    const hardForThisRun = hardNoCrossRects.filter(r => r !== startHard && r !== endHard);
    // ENGINE RULE: All component body halos from `hardRects` are already in the
    // universal set. No per-net-class additions needed — the source/target
    // exemption (startHard/endHard filter above) handles connection points.
    // The sidebar exclusion zone is also already in hardRects.

    // ENGINE RULE: Rendered labels/lugs are hard keep-outs for subsequent wires.
    if (usedRects.length > 0) {
      hardForThisRun.push(
        ...usedRects.map(r => ({ x: r.x - 2, y: r.y - 2, w: r.w + 4, h: r.h + 4 }))
      );
    }
    let mid = routeOrthogonal(fromEsc, toEsc, routeRects, local, effectiveHint, routedSegs, kind, hardForThisRun);
    let bestPath = simplifyPolyline([from, fromEsc, ...mid, toEsc, to]);
    let bestHard = pathCollisionCount(bestPath, hardForThisRun, 4);
    let bestSoft = pathCollisionCount(bestPath, routeRects, 6);
    let bestStack = pathRunAlongCount(bestPath, routedSegs, 2, 10);

    // Lexicographic comparison helper for reroute candidates.
    const isBetter = (aH: number, aS: number, aK: number) =>
      aH < bestHard ||
      (aH === bestHard && aS < bestSoft) ||
      (aH === bestHard && aS === bestSoft && aK < bestStack);

    // Second-pass reroute with clamped corridors so alternatives never escape frame.
    if (bestHard > 0 || bestSoft > 0 || bestStack > 0) {
      const hints: RouteHint[] = ['top', 'bottom', 'left', 'right'];
      const shifts = [0, -18, 18, -30, 30];
      for (const h of hints) {
        for (const s of shifts) {
          const alt = { ...local };
          if (h === 'top' || h === 'bottom') { alt.topY += s; alt.bottomY += s; }
          else { alt.leftX += s; alt.rightX -= s; }
          Object.assign(alt, clampCorridors(alt, frame));
          const altMid = routeOrthogonal(fromEsc, toEsc, routeRects, alt, h, routedSegs, kind, hardForThisRun);
          const altPath = simplifyPolyline([from, fromEsc, ...altMid, toEsc, to]);
          const aH = pathCollisionCount(altPath, hardForThisRun, 4);
          const aS = pathCollisionCount(altPath, routeRects, 6);
          const aK = pathRunAlongCount(altPath, routedSegs, 2, 10);
          if (isBetter(aH, aS, aK)) {
            bestHard = aH; bestSoft = aS; bestStack = aK; bestPath = altPath;
            if (aH === 0 && aS === 0 && aK === 0) break;
          }
        }
        if (bestHard === 0 && bestSoft === 0 && bestStack === 0) break;
      }
    }

    // Clamped perimeter fallback: guarantees clean lanes inside the frame.
    if (bestHard > 0 || bestStack > 0) {
      const cl = clampCorridors(local, frame);
      const fenceCandidates: Pt[][] = kind === 'earth'
        ? [
            // Earth fallback should stay local and avoid giant page-width loops.
            [{ x: fromEsc.x, y: cl.bottomY }, { x: toEsc.x, y: cl.bottomY }],
            [{ x: fromEsc.x, y: cl.topY }, { x: toEsc.x, y: cl.topY }],
          ]
        : [
            [{ x: fromEsc.x, y: cl.topY }, { x: toEsc.x, y: cl.topY }],
            [{ x: fromEsc.x, y: cl.bottomY }, { x: toEsc.x, y: cl.bottomY }],
            [{ x: cl.leftX, y: fromEsc.y }, { x: cl.leftX, y: toEsc.y }],
            [{ x: cl.rightX, y: fromEsc.y }, { x: cl.rightX, y: toEsc.y }],
          ];
      for (const fence of fenceCandidates) {
        const altPath = simplifyPolyline([from, fromEsc, ...fence, toEsc, to]);
        const aH = pathCollisionCount(altPath, hardForThisRun, 4);
        const aS = pathCollisionCount(altPath, routeRects, 6);
        const aK = pathRunAlongCount(altPath, routedSegs, 2, 10);
        if (isBetter(aH, aS, aK)) {
          bestHard = aH; bestSoft = aS; bestStack = aK; bestPath = altPath;
          if (aH === 0 && aK === 0) break;
        }
      }
    }

    // ENGINE RULE: Hard bounds clamp. Every single waypoint in the final path
    // is clamped inside the schematic frame. No wire can EVER exit the drawing area.
    // This is the last gate before the path is returned and cannot be bypassed.
    for (let i = 0; i < bestPath.length; i++) {
      bestPath[i] = {
        x: Math.max(S_L + 4, Math.min(S_R - 4, bestPath[i].x)),
        y: Math.max(S_T + 2, Math.min(S_B - 2, bestPath[i].y)),
      };
    }

    return bestPath;
  };

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
  const N_EARTH = ++compNum; keyItems.push({ num: N_EARTH, name: 'Earth Bar + Chassis', detail: 'Bonding' });
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

  // ═══ HEADER BAR ═══
  svg += `<rect x="0" y="0" width="${W}" height="26" fill="#1A1A1A"/>`;
  if (imageMap.logo) svg += `<image href="${imageMap.logo}" x="14" y="3" width="90" height="20" preserveAspectRatio="xMidYMid meet"/>`;
  else svg += `<text x="14" y="18" font-size="8" fill="#D9A05B" font-weight="800">CRAFTED CAMPER CO.</text>`;
  svg += `<text x="112" y="18" font-size="6" fill="#fff" font-weight="600">Wiring Schematic</text>`;
  svg += `<text x="${W / 2}" y="18" text-anchor="middle" font-size="6" fill="#D9A05B" font-weight="600">${spec.archetype.replace(/_/g, ' ')}</text>`;
  svg += `<text x="${W - 70}" y="18" text-anchor="end" font-size="6" fill="#888">${today}</text>`;
  svg += `<text x="${W - 14}" y="18" text-anchor="end" font-size="6" fill="#D9A05B" font-weight="700">V4.0</text>`;
  svg += `<line x1="0" y1="26" x2="${W}" y2="26" stroke="#D9A05B" stroke-width="1.5"/>`;

  // ═══ PLACE COMPONENTS + NUMBERED BADGES ═══
  const mainFuseRating = mW?.fuseRating ? `${mW.fuseRating}A` : (mG >= 50 ? '200A' : '125A');
  const mainFuseAmps = Number.parseInt(mainFuseRating, 10) || (mG >= 50 ? 200 : 125);

  const batteryDisplayQty = Math.min(batQty, 2);
  for (let i = 0; i < batteryDisplayQty; i++) {
    const bx = batX + i * (BAT_UNIT_W + BAT_PAIR_GAP);
    svg += placeComponent(
      `battery_${i + 1}`,
      'battery',
      bx + Math.floor(BAT_UNIT_W / 2),
      batY + Math.floor(BAT_H / 2),
      BAT_UNIT_W,
      BAT_H,
      { capacityAh: config.batteryAh },
      bat?.model,
    );
  }
  svg += componentNumber(batX + 22, batY + 16, N_BAT);

  svg += placeComponent('smart_shunt', 'smartshunt', shuntX + Math.floor(SHUNT_W / 2), shuntY + Math.floor(SHUNT_H / 2), SHUNT_W, SHUNT_H, {}, shuntC?.product.model);
  svg += componentNumber(shuntX + 12, shuntY + 13, N_SHUNT);

  svg += placeComponent('battery_isolator', 'isolator', isoX + Math.floor(ISO_W / 2), isoY + Math.floor(ISO_H / 2), ISO_W, ISO_H);
  svg += componentNumber(isoX + 14, isoY + 14, N_ISO);

  svg += placeComponent('main_midi_fuse', 'midi_fuse', midiX + Math.floor(MIDI_W / 2), midiY + Math.floor(MIDI_H / 2), MIDI_W, MIDI_H, { amps: mainFuseAmps });
  svg += componentNumber(midiX + 10, midiY + 12, N_MIDI);

  if (hasLynx) {
    svg += placeComponent('distribution', 'lynx', distX + Math.floor(DIST_W / 2), distY + Math.floor(DIST_H / 2), DIST_W, DIST_H, {}, 'LYN060102010');
  } else {
    svg += placeComponent('distribution', 'busbar', distX + Math.floor(DIST_W / 2), distY + Math.floor(DIST_H / 2), DIST_W, DIST_H, {}, 'BUSBAR-POS');
  }
  svg += componentNumber(distX + 18, distY + 16, N_DIST);

  if (hasInv && invC) {
    svg += placeComponent('inverter', 'multiplus', invX + INV_W / 2, invY + INV_H / 2, INV_W, INV_H, { model: invC.product.model }, invC.product.model);
    svg += componentNumber(invX + 18, invY + 18, N_INV);
  }
  if (hasMPPT && mpptC) {
    svg += placeComponent('mppt', 'mppt', mpptX + Math.floor(MPPT_W / 2), mpptY + Math.floor(MPPT_H / 2), MPPT_W, MPPT_H, { model: mpptC.product.model }, mpptC.product.model);
    svg += componentNumber(mpptX + 14, mpptY + 14, N_MPPT);
    const panelCount = Math.min(solarCount, 3);
    const panelW = SOLAR_PANEL_W;
    const panelH = SOLAR_PANEL_H;
    for (let i = 0; i < panelCount; i++) {
      const px = solarX + i * (panelW + 4);
      svg += placeComponent(`solar_panel_${i + 1}`, 'solar_panel', px + panelW / 2, solarY + panelH / 2, panelW, panelH, { watts: Math.round(config.solarWatts / panelCount) });
    }
    svg += componentNumber(solarX + 14, solarY + 14, N_SOLAR);
    svg += placeComponent('pv_disconnect', 'pv_disconnect', pvDiscX + Math.floor(PVDISC_W / 2), pvDiscY + Math.floor(PVDISC_H / 2), PVDISC_W, PVDISC_H);
    svg += componentNumber(pvDiscX + 14, pvDiscY + 14, N_PVDISC);
  }
  if (hasDC && dcdcC) {
    svg += placeComponent('dcdc', 'orion', dcdcX + Math.floor(DCDC_W / 2), dcdcY + Math.floor(DCDC_H / 2), DCDC_W, DCDC_H, { model: dcdcC.product.model }, dcdcC.product.model);
    svg += componentNumber(dcdcX + 14, dcdcY + 14, N_DCDC);
    svg += placeComponent('starter_battery', 'starter_battery', starterX + Math.floor(STARTER_W / 2), starterY + Math.floor(STARTER_H / 2), STARTER_W, STARTER_H);
    svg += componentNumber(starterX + 14, starterY + 14, N_STARTER);
  }
  if (bpC) {
    svg += placeComponent(
      'battery_protect',
      'battery_protect',
      bpX + Math.floor(BP_W / 2),
      bpY + Math.floor(BP_H / 2),
      BP_W,
      BP_H,
      { amps: Number(bpC.product.specs.maxCurrent) || 100 },
    );
    svg += componentNumber(bpX + 14, bpY + 14, N_BP);
  }
  svg += placeComponent('fuse_block', 'fuse_block', fbX + Math.floor(FB_W / 2), fbY + Math.floor(FB_H / 2), FB_W, FB_H);
  svg += componentNumber(fbX + 14, fbY + 14, N_FB);

  svg += placeComponent('earth_bar', 'earth_bar', earthBarX + earthBarW / 2, earthBarYClamped + 8, earthBarW, 16);
  svg += groundSymbol(groundX, groundY);
  svg += componentNumber(earthBarX + 14, earthBarYClamped + 8, N_EARTH);

  if (hasShore) {
    svg += placeComponent('shore_inlet', 'shore_inlet', shoreX + Math.floor(SHORE_W / 2), shoreY + Math.floor(SHORE_H / 2), SHORE_W, SHORE_H);
    svg += componentNumber(shoreX + 10, shoreY + 10, N_SHORE);
    svg += placeComponent('consumer_unit_in', 'consumer_unit', cuInX + Math.floor(CU_W / 2), cuInY + Math.floor(CU_H / 2), CU_W, CU_H, { label: 'AC-In Consumer Unit' });
    svg += componentNumber(cuInX + 14, cuInY + 14, N_CUIN);
    svg += placeComponent('consumer_unit_out', 'consumer_unit', cuOutX + Math.floor(CU_W / 2), cuOutY + Math.floor(CU_H / 2), CU_W, CU_H, { label: 'AC-Out Consumer Unit' });
    svg += componentNumber(cuOutX + 14, cuOutY + 14, N_CUOUT);
    svg += acLoadsSocket(acLoadsX, acLoadsY);
    placedPorts.ac_loads = { ac_in: { x: acLoadsX + Math.floor(AC_LOADS_W / 2), y: acLoadsY + 1 } };
    placedComponentTypes.ac_loads = 'consumer_ac';
    placedComponentSku.ac_loads = undefined;
    svg += componentNumber(acLoadsX + 12, acLoadsY + 12, N_ACLOADS);
  }

  void placedPorts;

  // ═══ ZONE HEADERS ═══
  svg += `<text x="${batX + batW / 2}" y="${Math.min(batY, shuntY) - 24}" text-anchor="middle" font-size="8" fill="#1A1A1A" font-weight="700" letter-spacing="1">BATTERY BANK</text>`;

  svg += `<text x="${distX + distW / 2}" y="${distY - 24}" text-anchor="middle" font-size="8" fill="#1A1A1A" font-weight="700" letter-spacing="1">DC DISTRIBUTION</text>`;

  if (hasInv) {
    svg += `<text x="${invX + INV_W / 2}" y="${invY - 24}" text-anchor="middle" font-size="8" fill="#1A1A1A" font-weight="700" letter-spacing="1">INVERTER / CHARGER</text>`;
  }

  if (hasShore) {
    svg += `<text x="${shoreX + SHORE_W / 2}" y="${shoreY - 10}" text-anchor="middle" font-size="7" fill="#3498DB" font-weight="700">MAINS / GRID INPUT</text>`;
  }

  if (hasMPPT) {
    const solarCenterX = solarX + Math.floor((mpptX + MPPT_W - solarX) / 2);
    svg += `<text x="${solarCenterX}" y="${solarY - 24}" text-anchor="middle" font-size="8" fill="#1A1A1A" font-weight="700" letter-spacing="1">SOLAR SYSTEM</text>`;
  }

  if (hasDC) {
    const dcdcCenterX = dcdcX + Math.floor((starterX + STARTER_W - dcdcX) / 2);
    svg += `<text x="${dcdcCenterX}" y="${dcdcY - 24}" text-anchor="middle" font-size="8" fill="#1A1A1A" font-weight="700" letter-spacing="1">ALTERNATOR CHARGING</text>`;
  }

  svg += `<text x="${earthBarX + earthBarW / 2}" y="${earthBarYClamped - 10}" text-anchor="middle" font-size="7" fill="#27AE60" font-weight="700">EARTH / CHASSIS BOND</text>`;

  // ═══ WIRES (no verbose labels — gauge badges only) ═══

  const dirVec = (dir: 'left' | 'right' | 'up' | 'down'): Pt => {
    if (dir === 'left') return { x: -1, y: 0 };
    if (dir === 'right') return { x: 1, y: 0 };
    if (dir === 'up') return { x: 0, y: -1 };
    return { x: 0, y: 1 };
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
    const srcExit = srcRule?.exit ?? 'right';
    const dstExit = dstRule?.exit ?? 'left';
    const srcStubLen = srcRule?.stubLength ?? 12;
    const dstStubLen = dstRule?.stubLength ?? 12;
    const srcVec = dirVec(srcExit);
    const dstVec = dirVec(dstExit);

    const srcStubEnd = { x: src.x + srcVec.x * srcStubLen, y: src.y + srcVec.y * srcStubLen };
    const dstStubEnd = { x: dst.x + dstVec.x * dstStubLen, y: dst.y + dstVec.y * dstStubLen };
    const routed = routeNet(srcStubEnd, dstStubEnd, netClass, hint);
    const middle = routed.slice(1, -1);

    const gauge = overrideGauge ?? getEffectiveGauge(placedComponentSku[fromId], srcType, fromPort);
    const strokeWidth = GAUGE_STROKE[gauge] ?? 2;
    const gaugeNum = Number.parseFloat(gauge);
    const colourKey = srcRule?.colour ?? dstRule?.colour ?? 'signal';
    const color = colourKey === 'dc_negative' ? WC.blk : WIRE_COLOURS[colourKey];

    return wire(src, dst, color, gaugeNum, [srcStubEnd, ...middle, dstStubEnd], {
      dashed,
      netClass,
      strokeWidth,
    });
  };

  // Battery POS → MIDI
  const batteryLeadId = `battery_${Math.min(Math.max(1, batteryDisplayQty), 2)}`;
  svg += drawRuleWire({
    fromId: 'battery_1',
    fromPort: 'positive_terminal',
    toId: 'main_midi_fuse',
    toPort: 'in_positive',
    netClass: 'dc_hi',
    hint: 'top',
    overrideGauge: mG >= 70 ? '70' : mG >= 50 ? '50' : mG >= 35 ? '35' : mG >= 25 ? '25' : mG >= 16 ? '16' : '10',
  });
  const batPosOut = placedPorts.battery_1?.positive_terminal;
  if (batPosOut) svg += polarityMarker(batPosOut.x + 10, batPosOut.y - STUB, '+');

  // MIDI → Isolator → Distribution
  svg += drawRuleWire({
    fromId: 'main_midi_fuse',
    fromPort: 'out_positive',
    toId: 'battery_isolator',
    toPort: 'in_positive',
    netClass: 'dc_hi',
    hint: 'auto',
    overrideGauge: mG >= 70 ? '70' : mG >= 50 ? '50' : mG >= 35 ? '35' : mG >= 25 ? '25' : mG >= 16 ? '16' : '10',
  });
  svg += drawRuleWire({
    fromId: 'battery_isolator',
    fromPort: 'out_positive',
    toId: 'distribution',
    toPort: hasLynx ? 'busbar_in' : 'pos_in',
    netClass: 'dc_hi',
    hint: 'top',
    overrideGauge: mG >= 70 ? '70' : mG >= 50 ? '50' : mG >= 35 ? '35' : mG >= 25 ? '25' : mG >= 16 ? '16' : '10',
  });

  // Battery NEG → Shunt → Distribution
  svg += drawRuleWire({
    fromId: batteryLeadId,
    fromPort: 'negative_terminal',
    toId: 'smart_shunt',
    toPort: 'batt_neg_in',
    netClass: 'dc_hi',
    hint: 'bottom',
    overrideGauge: mG >= 70 ? '70' : mG >= 50 ? '50' : mG >= 35 ? '35' : mG >= 25 ? '25' : mG >= 16 ? '16' : '10',
  });
  const batNeg = placedPorts[batteryLeadId]?.negative_terminal;
  if (batNeg) svg += polarityMarker(batNeg.x + 10, batNeg.y - STUB, '−');

  svg += drawRuleWire({
    fromId: 'smart_shunt',
    fromPort: 'system_neg_out',
    toId: 'distribution',
    toPort: hasLynx ? 'busbar_neg' : 'neg_in',
    netClass: 'dc_hi',
    hint: 'bottom',
    overrideGauge: mG >= 70 ? '70' : mG >= 50 ? '50' : mG >= 35 ? '35' : mG >= 25 ? '25' : mG >= 16 ? '16' : '10',
  });

  // AUX sense wire
  svg += drawRuleWire({
    fromId: 'smart_shunt',
    fromPort: 'aux_sense',
    toId: 'battery_1',
    toPort: 'positive_terminal',
    netClass: 'signal',
    hint: 'left',
    dashed: true,
  });

  // Distribution → Inverter (route around Lynx right edge)
  if (hasInv && invC) {
    const heavyInvGauge: WireGauge = iG >= 70 ? '70' : iG >= 50 ? '50' : iG >= 35 ? '35' : iG >= 25 ? '25' : iG >= 16 ? '16' : '10';
    svg += drawRuleWire({
      fromId: 'distribution',
      fromPort: hasLynx ? 'fuse_out_1' : 'pos_out_4',
      toId: 'inverter',
      toPort: 'dc_positive',
      netClass: 'dc_hi',
      hint: 'bottom',
      overrideGauge: heavyInvGauge,
    });
    svg += drawRuleWire({
      fromId: 'distribution',
      fromPort: hasLynx ? 'busbar_neg' : 'neg_out_4',
      toId: 'inverter',
      toPort: 'dc_negative',
      netClass: 'dc_hi',
      hint: 'bottom',
      overrideGauge: heavyInvGauge,
    });
    svg += drawRuleWire({
      fromId: 'inverter',
      fromPort: 'earth_terminal',
      toId: 'earth_bar',
      toPort: 'in_1',
      netClass: 'earth',
      hint: 'bottom',
      dashed: true,
      overrideGauge: '16',
    });
    const invGnd = placedPorts.inverter?.earth_terminal;
    if (invGnd) svg += polarityMarker(invGnd.x + 10, invGnd.y + STUB, 'E');
  }

  // Distribution → MPPT (MPPT bottom output → down to Lynx top fuse slot)
  if (hasMPPT && mpptC) {
    const mpptGauge: WireGauge = mpG >= 70 ? '70' : mpG >= 50 ? '50' : mpG >= 35 ? '35' : mpG >= 25 ? '25' : mpG >= 16 ? '16' : mpG >= 10 ? '10' : '6';
    svg += drawRuleWire({
      fromId: 'distribution',
      fromPort: hasLynx ? 'fuse_out_2' : 'pos_out_2',
      toId: 'mppt',
      toPort: 'bat_positive',
      netClass: 'dc_lo',
      hint: 'top',
      overrideGauge: mpptGauge,
    });
    svg += drawRuleWire({
      fromId: 'distribution',
      fromPort: hasLynx ? 'busbar_neg' : 'neg_out_2',
      toId: 'mppt',
      toPort: 'bat_negative',
      netClass: 'dc_lo',
      hint: 'top',
      overrideGauge: mpptGauge,
    });
    svg += drawRuleWire({
      fromId: 'solar_panel_1',
      fromPort: 'pv_positive',
      toId: 'pv_disconnect',
      toPort: 'pv_in_positive',
      netClass: 'dc_lo',
      hint: 'top',
      overrideGauge: '6',
    });
    const pvPosOut = placedPorts.solar_panel_1?.pv_positive;
    if (pvPosOut) svg += polarityMarker(pvPosOut.x + 10, pvPosOut.y + STUB, '+');
    svg += drawRuleWire({
      fromId: 'solar_panel_1',
      fromPort: 'pv_negative',
      toId: 'mppt',
      toPort: 'pv_negative',
      netClass: 'dc_lo',
      hint: 'top',
      overrideGauge: '6',
    });
    const pvNegOut = placedPorts.solar_panel_1?.pv_negative;
    if (pvNegOut) svg += polarityMarker(pvNegOut.x + 10, pvNegOut.y + STUB, '−');
    svg += drawRuleWire({
      fromId: 'pv_disconnect',
      fromPort: 'pv_out_positive',
      toId: 'mppt',
      toPort: 'pv_positive',
      netClass: 'dc_lo',
      hint: 'top',
      overrideGauge: '6',
    });
  }

  // Distribution → DC-DC (DC-DC output right side → down to Lynx top fuse slot)
  if (hasDC && dcdcC) {
    const dcdcGaugeOut: WireGauge = doG >= 70 ? '70' : doG >= 50 ? '50' : doG >= 35 ? '35' : doG >= 25 ? '25' : doG >= 16 ? '16' : doG >= 10 ? '10' : '6';
    const dcdcGaugeIn: WireGauge = diG >= 70 ? '70' : diG >= 50 ? '50' : diG >= 35 ? '35' : diG >= 25 ? '25' : diG >= 16 ? '16' : diG >= 10 ? '10' : '6';
    svg += drawRuleWire({
      fromId: 'dcdc',
      fromPort: 'out_positive',
      toId: 'distribution',
      toPort: hasLynx ? 'fuse_out_3' : 'pos_out_1',
      netClass: 'dc_lo',
      hint: 'top',
      overrideGauge: dcdcGaugeOut,
    });
    svg += drawRuleWire({
      fromId: 'dcdc',
      fromPort: 'out_negative',
      toId: 'distribution',
      toPort: hasLynx ? 'busbar_neg' : 'neg_out_1',
      netClass: 'dc_lo',
      hint: 'top',
      overrideGauge: dcdcGaugeOut,
    });
    svg += drawRuleWire({
      fromId: 'starter_battery',
      fromPort: 'positive_terminal',
      toId: 'dcdc',
      toPort: 'in_positive',
      netClass: 'dc_lo',
      hint: 'top',
      overrideGauge: dcdcGaugeIn,
    });
    svg += drawRuleWire({
      fromId: 'starter_battery',
      fromPort: 'negative_terminal',
      toId: 'dcdc',
      toPort: 'in_negative',
      netClass: 'dc_lo',
      hint: 'top',
      overrideGauge: dcdcGaugeIn,
    });
  }

  // Distribution → BP → Fuse Block
  if (bpC) {
    const bpGauge: WireGauge = bG >= 70 ? '70' : bG >= 50 ? '50' : bG >= 35 ? '35' : bG >= 25 ? '25' : bG >= 16 ? '16' : '10';
    svg += drawRuleWire({
      fromId: 'distribution',
      fromPort: hasLynx ? 'fuse_out_4' : 'pos_out_3',
      toId: 'battery_protect',
      toPort: 'in_positive',
      netClass: 'dc_hi',
      hint: 'bottom',
      overrideGauge: bpGauge,
    });
    svg += drawRuleWire({
      fromId: 'battery_protect',
      fromPort: 'out_positive',
      toId: 'fuse_block',
      toPort: 'pos_in',
      netClass: 'dc_hi',
      hint: 'bottom',
      overrideGauge: bpGauge,
    });
    svg += drawRuleWire({
      fromId: 'distribution',
      fromPort: hasLynx ? 'busbar_neg' : 'neg_out_3',
      toId: 'fuse_block',
      toPort: 'neg_in',
      netClass: 'dc_hi',
      hint: 'bottom',
      overrideGauge: bpGauge,
    });
  }

  // Chassis bond — route along LEFT edge to avoid crossing components
  svg += drawRuleWire({
    fromId: 'earth_bar',
    fromPort: 'chassis',
    toId: 'distribution',
    toPort: hasLynx ? 'busbar_neg' : 'neg_in',
    netClass: 'earth',
    hint: 'bottom',
    dashed: true,
    overrideGauge: '35',
  });
  const earthChassis = placedPorts.earth_bar?.chassis;
  if (earthChassis) svg += polarityMarker(earthChassis.x + 10, earthChassis.y - STUB, 'E');

  // LPG earthing
  if (hasLPG) {
    placedPorts.lpg_node = { earth: { x: groundX + 101, y: groundY + 5 } };
    placedComponentTypes.lpg_node = 'shore_inlet';
    placedComponentSku.lpg_node = undefined;
    svg += `<g transform="translate(${groundX + 80},${groundY - 5})">
      <rect x="0" y="0" width="42" height="20" rx="3" fill="#FFF3E0" stroke="#E67E22"/>
      <text x="21" y="14" text-anchor="middle" font-size="6" fill="#E67E22" font-weight="700">LPG</text>
    </g>`;
    placedPorts.earth_bar.lpg_bond = { x: earthBarX + 12 + (earthCount - 1) * 24, y: earthBarYClamped + 8 };
    svg += drawRuleWire({
      fromId: 'lpg_node',
      fromPort: 'earth',
      toId: 'earth_bar',
      toPort: 'lpg_bond',
      netClass: 'earth',
      hint: 'bottom',
      dashed: true,
      overrideGauge: '4',
    });
    svg += polarityMarker(groundX + 90, groundY, 'E');
  }

  // ═══ AC WIRING (shore power) — standardized AC ports ═══
  // Ports are defined once and used for both routing + drawing to prevent drift.
  const AC_PORT = {
    shoreOut:     { x: shoreX + Math.floor(SHORE_W / 2),  y: shoreY + SHORE_H - 4 },
    cuInTop:      { x: cuInX + Math.floor(CU_W / 2),   y: cuInY },
    cuInBot:      { x: cuInX + Math.floor(CU_W / 2),   y: cuInY + CU_H },
    cuInEarth:    { x: cuInX + Math.floor(CU_W * 0.87),  y: cuInY + CU_H },
    cuOutTop:     { x: cuOutX + Math.floor(CU_W / 2),  y: cuOutY },
    cuOutBot:     { x: cuOutX + Math.floor(CU_W / 2),  y: cuOutY + CU_H },
    cuOutEarth:   { x: cuOutX + Math.floor(CU_W * 0.87), y: cuOutY + CU_H },
    acLoadsEntry: { x: acLoadsX + Math.floor(AC_LOADS_W / 2), y: acLoadsY - 14 },
    acLoadsPort:  { x: acLoadsX + Math.floor(AC_LOADS_W / 2), y: acLoadsY + 1 },
    invAcIn:      { x: invX + invPortX(INV_PORT_RATIO.acIn),  y: invY + INV_H + 5 },
    invAcOut:     { x: invX + invPortX(INV_PORT_RATIO.acOut), y: invY + INV_H + 5 },
  };

  if (hasShore && hasInv) {
    svg += drawRuleWire({
      fromId: 'shore_inlet',
      fromPort: 'ac_line',
      toId: 'consumer_unit_in',
      toPort: 'ac_in',
      netClass: 'ac_in',
      hint: 'right',
      overrideGauge: '2.5',
    });
    svg += drawRuleWire({
      fromId: 'consumer_unit_in',
      fromPort: 'ac_out_1',
      toId: 'inverter',
      toPort: 'ac_in',
      netClass: 'ac_in',
      hint: 'right',
      overrideGauge: '2.5',
    });
    svg += drawRuleWire({
      fromId: 'inverter',
      fromPort: 'ac_out',
      toId: 'consumer_unit_out',
      toPort: 'ac_in',
      netClass: 'ac_out',
      hint: 'right',
      overrideGauge: '2.5',
    });
    svg += drawRuleWire({
      fromId: 'consumer_unit_out',
      fromPort: 'ac_out_1',
      toId: 'ac_loads',
      toPort: 'ac_in',
      netClass: 'ac_out',
      hint: 'right',
      overrideGauge: '2.5',
    });
    svg += `<!-- AC_LOADS_WIRE -->`;

    svg += drawRuleWire({
      fromId: 'shore_inlet',
      fromPort: 'earth',
      toId: 'earth_bar',
      toPort: 'in_2',
      netClass: 'earth',
      hint: 'bottom',
      dashed: true,
      overrideGauge: '4',
    });
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

  // Check 3: Earth bar must be present.
  if (!svgString.includes('EARTH BAR') && !svgString.includes('earth-bar')) {
    failures.push('Earth bar not found in schematic');
  }

  return { pass: failures.length === 0, failures };
}
