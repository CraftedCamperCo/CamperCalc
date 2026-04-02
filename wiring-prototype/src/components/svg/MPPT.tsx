export const MPPT_SIZE = { w: 140, h: 160 };
export const MPPT_CONN = {
  PV_POS: { x: 40, y: 0 },
  PV_NEG: { x: 100, y: 0 },
  BAT_POS: { x: 40, y: 160 },
  BAT_NEG: { x: 100, y: 160 },
  CHASSIS_GND: { x: 70, y: 160 },
};

interface Props {
  x: number;
  y: number;
  label: string;
  model?: string;
}

export function MPPTSVG({ x, y, label, model = "SmartSolar MPPT 100|30" }: Props) {
  return (
    <g transform={`translate(${x}, ${y})`}>
      <g className="product-svg-placeholder">
        {/* Product image */}
        <image href="/assets/victron/mppt-100-30.png" x={5} y={10} width={130} height={130} preserveAspectRatio="xMidYMid meet" />
        {/* Name strip overlay */}
        <rect x={0} y={0} width={140} height={20} fill="rgba(26,26,26,0.85)" />
        <text x={70} y={14} fontSize={9} fill="#FFFFFF" textAnchor="middle" fontWeight="bold">
          {model}
        </text>
        {/* PV terminals - top */}
        <circle cx={40} cy={8} r={6} fill="#1A1A1A" stroke="#E67E22" strokeWidth={2} />
        <circle cx={40} cy={8} r={2} fill="#E67E22" />
        <circle cx={100} cy={8} r={6} fill="#1A1A1A" stroke="#333333" strokeWidth={2} />
        <circle cx={100} cy={8} r={2} fill="#333333" />
        <text x={40} y={-2} fontSize={7} fill="#E67E22" textAnchor="middle">PV+</text>
        <text x={100} y={-2} fontSize={7} fill="#FFFFFF" textAnchor="middle">PV−</text>
        <text x={70} y={-8} fontSize={6} fill="#D9A05B" textAnchor="middle">2.03 Nm</text>
        {/* Battery terminals - bottom */}
        <circle cx={40} cy={152} r={6} fill="#1A1A1A" stroke="#C0392B" strokeWidth={2} />
        <circle cx={40} cy={152} r={2} fill="#C0392B" />
        <circle cx={100} cy={152} r={6} fill="#1A1A1A" stroke="#333333" strokeWidth={2} />
        <circle cx={100} cy={152} r={2} fill="#333333" />
        <text x={40} y={168} fontSize={7} fill="#C0392B" textAnchor="middle">BAT+</text>
        <text x={100} y={168} fontSize={7} fill="#FFFFFF" textAnchor="middle">BAT−</text>
        <text x={70} y={178} fontSize={6} fill="#D9A05B" textAnchor="middle">2.71 Nm</text>
        {/* Chassis ground - bottom-center */}
        <circle cx={70} cy={152} r={5} fill="#1A1A1A" stroke="#D9A05B" strokeWidth={1.5} />
        <text x={70} y={156} fontSize={5} fill="#D9A05B" textAnchor="middle">GND</text>
      </g>
    </g>
  );
}
