export const DCDC_SIZE = { w: 160, h: 100 };
export const DCDC_CONN = {
  IN_POS: { x: 0, y: 30 },
  IN_NEG: { x: 0, y: 70 },
  OUT_POS: { x: 160, y: 30 },
  OUT_NEG: { x: 160, y: 70 },
  IGN: { x: 80, y: 100 },
};

interface Props {
  x: number;
  y: number;
  label: string;
  model?: string;
}

export function DCDCChargerSVG({ x, y, label, model = "Orion-Tr Smart 12|12|30" }: Props) {
  return (
    <g transform={`translate(${x}, ${y})`}>
      <g className="product-svg-placeholder">
        <image href="/assets/victron/orion-tr-smart-30.png" x={5} y={5} width={150} height={90} preserveAspectRatio="xMidYMid meet" />
        {/* Dark overlay strip at bottom for label text */}
        <rect x={0} y={80} width={160} height={20} fill="rgba(26,26,26,0.85)" />
        <text x={80} y={92} fontSize={8} fill="#D9A05B" textAnchor="middle">
          {label}
        </text>
        {/* Input terminals - left */}
        <circle cx={8} cy={30} r={6} fill="#1A1A1A" stroke="#E67E22" strokeWidth={2} />
        <circle cx={8} cy={30} r={2} fill="#E67E22" />
        <circle cx={8} cy={70} r={6} fill="#1A1A1A" stroke="#333333" strokeWidth={2} />
        <circle cx={8} cy={70} r={2} fill="#333333" />
        <text x={-4} y={33} fontSize={7} fill="#E67E22" textAnchor="end">IN+</text>
        <text x={-4} y={73} fontSize={7} fill="#FFFFFF" textAnchor="end">IN−</text>
        {/* Output terminals - right */}
        <circle cx={152} cy={30} r={6} fill="#1A1A1A" stroke="#C0392B" strokeWidth={2} />
        <circle cx={152} cy={30} r={2} fill="#C0392B" />
        <circle cx={152} cy={70} r={6} fill="#1A1A1A" stroke="#333333" strokeWidth={2} />
        <circle cx={152} cy={70} r={2} fill="#333333" />
        <text x={164} y={33} fontSize={7} fill="#C0392B" textAnchor="start">OUT+</text>
        <text x={164} y={73} fontSize={7} fill="#FFFFFF" textAnchor="start">OUT−</text>
        {/* Ignition sense - bottom-center */}
        <circle cx={80} cy={94} r={5} fill="#1A1A1A" stroke="#D9A05B" strokeWidth={1.5} />
        <circle cx={80} cy={94} r={1.5} fill="#D9A05B" />
        <text x={80} y={105} fontSize={6} fill="#D9A05B" textAnchor="middle">IGN</text>
      </g>
    </g>
  );
}
