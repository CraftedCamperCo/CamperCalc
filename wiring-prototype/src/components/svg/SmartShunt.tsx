export const SHUNT_SIZE = { w: 140, h: 60 };
export const SHUNT_CONN = {
  BAT_NEG: { x: 0, y: 30 },
  SYS_NEG: { x: 140, y: 30 },
  AUX: { x: 70, y: 0 },
};

interface Props {
  x: number;
  y: number;
}

export function SmartShuntSVG({ x, y }: Props) {
  return (
    <g transform={`translate(${x}, ${y})`}>
      <g className="product-svg-placeholder">
        <image href="/assets/victron/smartshunt-500a.png" x={5} y={2} width={130} height={56} preserveAspectRatio="xMidYMid meet" />
        {/* BAT(-) terminal - left, M8 bolt */}
        <circle cx={0} cy={30} r={6} fill="#333" stroke="#555" strokeWidth={1.5} />
        <circle cx={0} cy={30} r={2} fill="#1A1A1A" />
        <text x={20} y={26} fontSize={7} fill="#888" textAnchor="middle">
          14Nm
        </text>
        <text x={20} y={34} fontSize={8} fill="#D9A05B" textAnchor="middle">
          BAT(−)
        </text>
        {/* SYS(-) terminal - right, M8 bolt */}
        <circle cx={140} cy={30} r={6} fill="#333" stroke="#555" strokeWidth={1.5} />
        <circle cx={140} cy={30} r={2} fill="#1A1A1A" />
        <text x={120} y={26} fontSize={7} fill="#888" textAnchor="middle">
          14Nm
        </text>
        <text x={120} y={34} fontSize={8} fill="#D9A05B" textAnchor="middle">
          SYS(−)
        </text>
        {/* AUX terminal - top center, small for 1.5mm² wire */}
        <circle cx={70} cy={0} r={4} fill="#003E7E" stroke="#D9A05B" strokeWidth={0.8} />
        <text x={70} y={-8} fontSize={6} fill="#D9A05B" textAnchor="middle">
          AUX
        </text>
      </g>
    </g>
  );
}
