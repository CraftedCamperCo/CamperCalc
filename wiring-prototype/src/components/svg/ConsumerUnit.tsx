export const CU_SIZE = { w: 160, h: 100 };
export const CU_CONN = {
  MAIN_IN: { x: 80, y: 0 },
  MCB_OUT: { x: 80, y: 100 },
  EARTH: { x: 140, y: 100 },
};

interface Props {
  x: number;
  y: number;
  label: string;
  type: 'ac_in' | 'ac_out';
}

export function ConsumerUnitSVG({ x, y, label, type }: Props) {
  const displayLabel = label || (type === 'ac_in' ? 'AC-In Consumer Unit' : 'AC-Out Consumer Unit');
  return (
    <g transform={`translate(${x}, ${y})`} className="product-svg-placeholder">
      {/* Metal enclosure - grey */}
      <rect
        x={0}
        y={0}
        width={160}
        height={100}
        rx={4}
        fill="#5a5a5a"
        stroke="#444"
        strokeWidth={2}
      />
      {/* Inner darker area */}
      <rect
        x={4}
        y={4}
        width={152}
        height={92}
        rx={2}
        fill="#4a4a4a"
        stroke="#3a3a3a"
        strokeWidth={1}
      />
      {/* DIN rail */}
      <rect x={20} y={50} width={120} height={8} rx={2} fill="#6a6a6a" stroke="#555" strokeWidth={1} />
      {/* RCD module */}
      <rect
        x={28}
        y={58}
        width={32}
        height={24}
        rx={2}
        fill="#3a3a3a"
        stroke="#D9A05B"
        strokeWidth={1}
      />
      <text x={44} y={73} fontSize={5} fill="#D9A05B" textAnchor="middle">
        RCD
      </text>
      {/* MCB modules */}
      {[0, 1, 2].map((i) => (
        <rect
          key={i}
          x={68 + i * 28}
          y={58}
          width={22}
          height={24}
          rx={2}
          fill="#3a3a3a"
          stroke="#888"
          strokeWidth={1}
        />
      ))}
      <text x={79} y={73} fontSize={5} fill="#ccc" textAnchor="middle">
        MCB
      </text>
      <text x={107} y={73} fontSize={5} fill="#ccc" textAnchor="middle">
        MCB
      </text>
      <text x={135} y={73} fontSize={5} fill="#ccc" textAnchor="middle">
        MCB
      </text>
      {/* Labels */}
      <text x={80} y={22} fontSize={9} fill="#fff" textAnchor="middle" fontWeight="bold">
        {displayLabel}
      </text>
      <text x={80} y={38} fontSize={6} fill="#D9A05B" textAnchor="middle">
        Type A 30mA RCD
      </text>
      <text x={80} y={45} fontSize={5} fill="#888" textAnchor="middle">
        MCB 6A / 16A / 32A
      </text>
      {/* Cable entry points - top and bottom */}
      <rect x={70} y={-2} width={20} height={6} fill="#333" stroke="#555" strokeWidth={1} />
      <rect x={70} y={96} width={20} height={6} fill="#333" stroke="#555" strokeWidth={1} />
      {/* Earth connection point */}
      <circle cx={140} cy={100} r={4} fill="none" stroke="#D9A05B" strokeWidth={1.5} />
      <line x1={137} y1={97} x2={143} y2={103} stroke="#D9A05B" strokeWidth={1} />
      <line x1={143} y1={97} x2={137} y2={103} stroke="#D9A05B" strokeWidth={1} />
      <text x={140} y={112} fontSize={5} fill="#888" textAnchor="middle">
        EARTH
      </text>
    </g>
  );
}
