import { TerminalLug } from './TerminalLug';
import { InlineFuse } from './InlineFuse';

interface Point { x: number; y: number }

interface LugSpec {
  label: string; // e.g. "70-8"
  orientation?: 'left' | 'right' | 'up' | 'down';
}

interface FuseSpec {
  rating: string;
  type?: string;
  position?: number; // 0-1 along wire, default 0.25
}

interface Props {
  from: Point;
  to: Point;
  color: string;
  gauge?: number;
  gaugeLabel?: string;
  strokeWidth?: number;
  lugFrom?: LugSpec;
  lugTo?: LugSpec;
  fuse?: FuseSpec;
  label?: string;
  dashed?: boolean;
  waypoints?: Point[];
}

function gaugeToStrokeWidth(gauge?: number): number {
  if (!gauge) return 2;
  if (gauge <= 6) return 1.5;
  if (gauge <= 16) return 2.5;
  if (gauge <= 35) return 3.5;
  if (gauge <= 70) return 4.5;
  return 5.5;
}

function buildOrthogonalPath(from: Point, to: Point, waypoints?: Point[]): Point[] {
  if (waypoints && waypoints.length > 0) {
    return [from, ...waypoints, to];
  }

  const dx = to.x - from.x;
  const dy = to.y - from.y;

  if (Math.abs(dx) < 2) return [from, to]; // vertical line
  if (Math.abs(dy) < 2) return [from, to]; // horizontal line

  // Route: go horizontal first, then vertical (H-V pattern)
  // Choose based on which direction has more distance
  if (Math.abs(dx) >= Math.abs(dy)) {
    const midX = from.x + dx / 2;
    return [from, { x: midX, y: from.y }, { x: midX, y: to.y }, to];
  } else {
    const midY = from.y + dy / 2;
    return [from, { x: from.x, y: midY }, { x: to.x, y: midY }, to];
  }
}

function longestSegmentMidpoint(points: Point[]): { point: Point; isVertical: boolean } {
  let bestLen = 0;
  let bestMid: Point = points[0];
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

export function WireSVG({
  from, to, color, gauge, gaugeLabel, strokeWidth, lugFrom, lugTo,
  fuse, label, dashed, waypoints,
}: Props) {
  const sw = strokeWidth ?? gaugeToStrokeWidth(gauge);
  const points = buildOrthogonalPath(from, to, waypoints);
  const d = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const { point: labelPt, isVertical } = longestSegmentMidpoint(points);

  const fusePos = fuse?.position ?? 0.3;
  let fusePt: Point | null = null;
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
    <g>
      <path
        d={d}
        fill="none"
        stroke={color}
        strokeWidth={sw}
        strokeDasharray={dashed ? '8 4' : undefined}
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Gauge label on longest segment */}
      {gaugeLabelText && (
        <g transform={`translate(${labelPt.x}, ${labelPt.y})`}>
          <rect
            x={isVertical ? 6 : -24}
            y={isVertical ? -7 : -16}
            width={48}
            height={14}
            rx={3}
            fill="rgba(26,26,26,0.9)"
          />
          <text
            x={isVertical ? 30 : 0}
            y={isVertical ? 4 : -5}
            fontSize={8}
            fill="#D9A05B"
            textAnchor="middle"
            fontWeight="bold"
          >
            {gaugeLabelText}
          </text>
        </g>
      )}

      {/* Inline fuse */}
      {fuse && fusePt && (
        <InlineFuse
          x={fusePt.x}
          y={fusePt.y}
          rating={fuse.rating}
          type={fuse.type}
          orientation={fuseOrientation}
        />
      )}

      {/* Terminal lugs */}
      {lugFrom && (
        <TerminalLug
          x={from.x}
          y={from.y}
          label={lugFrom.label}
          orientation={lugFrom.orientation}
          color={color === '#333' || color === '#000' ? '#aaa' : '#D9A05B'}
        />
      )}
      {lugTo && (
        <TerminalLug
          x={to.x}
          y={to.y}
          label={lugTo.label}
          orientation={lugTo.orientation}
          color={color === '#333' || color === '#000' ? '#aaa' : '#D9A05B'}
        />
      )}

      {/* Optional text label */}
      {label && (
        <text
          x={labelPt.x}
          y={labelPt.y + (isVertical ? 0 : 22)}
          fontSize={7}
          fill="#888"
          textAnchor="middle"
        >
          {label}
        </text>
      )}
    </g>
  );
}
