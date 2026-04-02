export const ISOLATOR_SIZE = { w: 70, h: 70 };
export const ISOLATOR_CONN = { IN: { x: 0, y: 35 }, OUT: { x: 70, y: 35 } };

interface Props {
  x: number;
  y: number;
  label: string;
}

export function IsolatorSVG({ x, y, label }: Props) {
  return (
    <g transform={`translate(${x}, ${y})`}>
      <g className="product-svg-placeholder">
        {/* Round rotary switch body */}
        <circle
          cx={35}
          cy={35}
          r={28}
          fill="#1A1A1A"
          stroke="#003E7E"
          strokeWidth={2}
        />
        {/* Inner ring - Victron blue */}
        <circle cx={35} cy={35} r={22} fill="none" stroke="#003E7E" strokeWidth={1.5} />
        {/* Rotary handle/pointer - pointing up-right */}
        <line x1={35} y1={35} x2={48} y2={22} stroke="#D9A05B" strokeWidth={3} strokeLinecap="round" />
        <circle cx={48} cy={22} r={4} fill="#D9A05B" stroke="#fff" strokeWidth={0.5} />
        {/* Position marker on dial */}
        <circle cx={35} cy={13} r={2} fill="#D9A05B" />
        {/* Input terminal - left */}
        <circle cx={0} cy={35} r={5} fill="#333" stroke="#003E7E" strokeWidth={1} />
        {/* Output terminal - right */}
        <circle cx={70} cy={35} r={5} fill="#333" stroke="#003E7E" strokeWidth={1} />
        {/* BAT ISO label below */}
        <rect x={7} y={58} width={56} height={14} rx={3} fill="rgba(26,26,26,0.9)"/>
        <text x={35} y={69} fontSize={9} fill="#D9A05B" textAnchor="middle" fontWeight="bold">
          {label}
        </text>
      </g>
    </g>
  );
}
