export const BP_SIZE = { w: 100, h: 60 };
export const BP_CONN = { IN: { x: 0, y: 30 }, OUT: { x: 100, y: 30 } };

interface Props {
  x: number;
  y: number;
  amps: number;
}

export function BatteryProtectSVG({ x, y, amps }: Props) {
  return (
    <g transform={`translate(${x}, ${y})`} className="product-svg-placeholder">
      <image href="/assets/victron/battery-protect-65a.png" x={5} y={2} width={90} height={56} preserveAspectRatio="xMidYMid meet" />
      {/* Dark overlay strip for label text */}
      <rect x={0} y={48} width={100} height={12} fill="rgba(26,26,26,0.85)" />
      <text x={50} y={58} fontSize={10} fill="#D9A05B" textAnchor="middle" fontWeight="bold">
        {amps}A
      </text>
      {/* Input terminal - bolt circle on left */}
      <circle cx={0} cy={30} r={6} fill="#1A1A1A" stroke="#D9A05B" strokeWidth={2} />
      <circle cx={0} cy={30} r={2} fill="#D9A05B" />
      {/* Output terminal - bolt circle on right */}
      <circle cx={100} cy={30} r={6} fill="#1A1A1A" stroke="#D9A05B" strokeWidth={2} />
      <circle cx={100} cy={30} r={2} fill="#D9A05B" />
    </g>
  );
}
