export const BATTERY_SIZE = { w: 200, h: 130 };
export const BATTERY_CONN = { POS: { x: 65, y: 0 }, NEG: { x: 135, y: 0 } };

interface Props {
  x: number;
  y: number;
  label: string;
  capacity?: string;
}

export function BatterySVG({ x, y, label, capacity }: Props) {
  return (
    <g transform={`translate(${x}, ${y})`}>
      <g className="product-svg-placeholder">
        <image
          href="/assets/third-party/fogstar-drift-230ah.png"
          x={4}
          y={10}
          width={192}
          height={116}
          preserveAspectRatio="xMidYMid meet"
        />
        {/* Semi-transparent dark overlay for text readability */}
        <rect x={4} y={10} width={192} height={116} rx={8} fill="rgba(0,0,0,0.3)" />
        {/* Positive terminal post - left, gold */}
        <rect x={55} y={0} width={20} height={20} rx={4} fill="#D9A05B" stroke="#1A1A1A" strokeWidth={1} />
        <text x={65} y={-5} fontSize={11} fill="#D9A05B" textAnchor="middle" fontWeight="bold">
          +
        </text>
        {/* Negative terminal post - right, grey */}
        <rect x={125} y={0} width={20} height={20} rx={4} fill="#555" stroke="#1A1A1A" strokeWidth={1} />
        <text x={135} y={-5} fontSize={11} fill="#888" textAnchor="middle" fontWeight="bold">
          −
        </text>
        {/* Product name label */}
        <text x={100} y={55} fontSize={14} fill="#fff" textAnchor="middle" fontWeight="bold">
          {label}
        </text>
        {/* Capacity label */}
        {capacity && (
          <text x={100} y={78} fontSize={12} fill="#D9A05B" textAnchor="middle" fontWeight="bold">
            {capacity}
          </text>
        )}
        {/* LiFePO4 12.8V label */}
        <text x={100} y={98} fontSize={10} fill="rgba(255,255,255,0.75)" textAnchor="middle">
          LiFePO4 12.8V
        </text>
      </g>
    </g>
  );
}
