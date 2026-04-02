export const INVERTER_SIZE = { w: 200, h: 180 };
export const INVERTER_CONN = {
  DC_POS: { x: 40, y: 180 },
  DC_NEG: { x: 70, y: 180 },
  AC_IN: { x: 150, y: 180 },
  AC_OUT: { x: 180, y: 180 },
  CHASSIS_GND: { x: 100, y: 180 },
};

interface Props {
  x: number;
  y: number;
  label: string;
  model?: string;
  isCharger?: boolean;
}

export function InverterSVG({ x, y, label, model = "MultiPlus 3000", isCharger = true }: Props) {
  return (
    <g transform={`translate(${x}, ${y})`}>
      <g className="product-svg-placeholder">
        {/* Product image */}
        <image href="/assets/victron/multiplus-2000.png" x={10} y={2} width={180} height={150} preserveAspectRatio="xMidYMid meet" />
        {/* Semi-transparent overlay for text */}
        <rect x={0} y={140} width={200} height={40} fill="rgba(26,26,26,0.85)" />
        {/* Model label on overlay */}
        <text x={100} y={165} fontSize={12} fill="#FFFFFF" textAnchor="middle">
          {model}
        </text>
        {/* DC terminals - bottom-left, bolt circles */}
        <circle cx={40} cy={165} r={6} fill="#1A1A1A" stroke="#C0392B" strokeWidth={2} />
        <circle cx={40} cy={165} r={2} fill="#C0392B" />
        <circle cx={70} cy={165} r={6} fill="#1A1A1A" stroke="#333333" strokeWidth={2} />
        <circle cx={70} cy={165} r={2} fill="#333333" />
        <text x={40} y={178} fontSize={8} fill="#FFFFFF" textAnchor="middle">DC+</text>
        <text x={70} y={178} fontSize={8} fill="#FFFFFF" textAnchor="middle">DC−</text>
        <text x={55} y={148} fontSize={7} fill="#D9A05B" textAnchor="middle">9 Nm</text>
        {/* AC terminals - bottom-right, terminal strip (AC-IN only for charger) */}
        {isCharger && (
          <>
            <rect x={130} y={155} width={50} height={22} rx={4} fill="#1A1A1A" stroke="#003E7E" strokeWidth={1} />
            <circle cx={142} cy={166} r={3} fill="#3498DB" />
            <circle cx={158} cy={166} r={3} fill="#3498DB" />
            <circle cx={174} cy={166} r={3} fill="#3498DB" />
            <text x={142} y={178} fontSize={6} fill="#FFFFFF" textAnchor="middle">L</text>
            <text x={158} y={178} fontSize={6} fill="#FFFFFF" textAnchor="middle">N</text>
            <text x={174} y={178} fontSize={6} fill="#FFFFFF" textAnchor="middle">E</text>
            <text x={155} y={148} fontSize={7} fill="#D9A05B" textAnchor="middle">AC-IN</text>
          </>
        )}
        {/* AC-OUT - always present */}
        <rect x={175} y={155} width={25} height={22} rx={4} fill="#1A1A1A" stroke="#003E7E" strokeWidth={1} />
        <circle cx={185} cy={166} r={3} fill="#3498DB" />
        <circle cx={195} cy={166} r={3} fill="#3498DB" />
        <text x={190} y={148} fontSize={7} fill="#D9A05B" textAnchor="middle">AC-OUT</text>
        {/* Chassis ground bolt - bottom-center */}
        <circle cx={100} cy={165} r={6} fill="#1A1A1A" stroke="#D9A05B" strokeWidth={2} />
        <text x={100} y={170} fontSize={6} fill="#D9A05B" textAnchor="middle">GND</text>
      </g>
    </g>
  );
}
