export const STARTER_SIZE = { w: 140, h: 80 };
export const STARTER_CONN = { POS: { x: 50, y: 0 }, NEG: { x: 90, y: 0 } };

interface Props {
  x: number;
  y: number;
}

export function StarterBatterySVG({ x, y }: Props) {
  return (
    <g transform={`translate(${x}, ${y})`}>
      <g className="product-svg-placeholder">
        {/* Dark grey rectangular body */}
        <rect
          x={4}
          y={18}
          width={132}
          height={58}
          rx={8}
          ry={8}
          fill="#3a3a3a"
          stroke="#1A1A1A"
          strokeWidth={1.5}
        />
        {/* Positive terminal post - left */}
        <rect x={40} y={0} width={20} height={18} rx={3} fill="#D9A05B" stroke="#1A1A1A" strokeWidth={1} />
        {/* Negative terminal post - right */}
        <rect x={80} y={0} width={20} height={18} rx={3} fill="#555" stroke="#1A1A1A" strokeWidth={1} />
        {/* STARTER BATTERY label */}
        <text x={70} y={42} fontSize={11} fill="#fff" textAnchor="middle" fontWeight="bold">
          STARTER BATTERY
        </text>
        {/* 12V label */}
        <text x={70} y={55} fontSize={10} fill="#D9A05B" textAnchor="middle">
          12V
        </text>
        {/* Engine Alternator sub-label */}
        <text x={70} y={68} fontSize={8} fill="rgba(255,255,255,0.6)" textAnchor="middle">
          Engine Alternator
        </text>
      </g>
    </g>
  );
}
