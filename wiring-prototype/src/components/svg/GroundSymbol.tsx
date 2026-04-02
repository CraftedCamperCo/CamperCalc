export const GROUND_SIZE = { w: 60, h: 50 };
export const GROUND_CONN = { GND: { x: 30, y: 0 } };

interface Props {
  x: number;
  y: number;
  label: string;
}

export function GroundSymbolSVG({ x, y, label }: Props) {
  return (
    <g transform={`translate(${x}, ${y})`} className="product-svg-placeholder">
      {/* Connection point at top - vertical line */}
      <line x1={30} y1={0} x2={30} y2={12} stroke="#1A1A1A" strokeWidth={2.5} />
      {/* Top horizontal line - widest */}
      <line x1={15} y1={12} x2={45} y2={12} stroke="#1A1A1A" strokeWidth={2} />
      {/* Middle horizontal line - medium */}
      <line x1={20} y1={20} x2={40} y2={20} stroke="#1A1A1A" strokeWidth={1.5} />
      {/* Bottom horizontal line - narrowest */}
      <line x1={25} y1={28} x2={35} y2={28} stroke="#1A1A1A" strokeWidth={1} />
      {/* VEHICLE CHASSIS label */}
      <text x={30} y={45} fontSize={6} fill="#1A1A1A" textAnchor="middle" fontWeight="bold">
        {label || 'VEHICLE CHASSIS'}
      </text>
    </g>
  );
}
