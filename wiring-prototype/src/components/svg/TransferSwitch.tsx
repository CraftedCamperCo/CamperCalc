export const TS_SIZE = { w: 120, h: 70 };

export const TS_CONN = {
  MAINS_IN: { x: 0, y: 35 },
  INVERTER_IN: { x: 120, y: 35 },
  AC_OUT: { x: 60, y: 70 },
};

interface Props {
  x: number;
  y: number;
}

export function TransferSwitchSVG({ x, y }: Props) {
  return (
    <g transform={`translate(${x}, ${y})`}>
      <g className="product-svg-placeholder">
        <rect x={0} y={0} width={120} height={70} rx={6} fill="#1A1A1A" stroke="#D9A05B" strokeWidth={2} />
        <rect x={3} y={3} width={114} height={64} rx={4} fill="#222" />

        <text x={60} y={18} fontSize={8} fill="#D9A05B" textAnchor="middle" fontWeight="bold">TRANSFER</text>
        <text x={60} y={30} fontSize={8} fill="#D9A05B" textAnchor="middle" fontWeight="bold">SWITCH</text>

        {/* 3-position lever */}
        <line x1={30} y1={50} x2={90} y2={50} stroke="#555" strokeWidth={2} />
        <circle cx={30} cy={50} r={4} fill="#555" />
        <circle cx={60} cy={50} r={4} fill="#D9A05B" />
        <circle cx={90} cy={50} r={4} fill="#555" />
        <text x={30} y={62} fontSize={6} fill="#888" textAnchor="middle">MAINS</text>
        <text x={60} y={62} fontSize={6} fill="#888" textAnchor="middle">OFF</text>
        <text x={90} y={62} fontSize={6} fill="#888" textAnchor="middle">INV</text>

        {/* Connection points */}
        <circle cx={0} cy={35} r={4} fill="#333" stroke="#D9A05B" strokeWidth={1.5} />
        <circle cx={120} cy={35} r={4} fill="#333" stroke="#D9A05B" strokeWidth={1.5} />
        <circle cx={60} cy={70} r={4} fill="#333" stroke="#D9A05B" strokeWidth={1.5} />
      </g>
    </g>
  );
}
