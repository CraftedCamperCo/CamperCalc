export const LYNX_PI_SIZE = { w: 120, h: 80 };

export const LYNX_PI_CONN = {
  BAT_POS: { x: 0, y: 25 },
  BAT_NEG: { x: 0, y: 55 },
  BUS_POS: { x: 120, y: 25 },
  BUS_NEG: { x: 120, y: 55 },
};

interface Props {
  x: number;
  y: number;
}

export function LynxPowerInSVG({ x, y }: Props) {
  return (
    <g transform={`translate(${x}, ${y})`}>
      <g className="product-svg-placeholder">
        <image href="/assets/victron/lynx-power-in.png" x={5} y={2} width={110} height={76} preserveAspectRatio="xMidYMid meet" />
        {/* Battery side terminals (left) */}
        <circle cx={0} cy={25} r={5} fill="#B87333" stroke="#D9A05B" strokeWidth={1.5} />
        <circle cx={0} cy={55} r={5} fill="#666" stroke="#aaa" strokeWidth={1.5} />
        <text x={-8} y={29} fontSize={7} fill="#D9A05B" textAnchor="end">+</text>
        <text x={-8} y={59} fontSize={7} fill="#888" textAnchor="end">−</text>

        {/* Bus side terminals (right) */}
        <circle cx={120} cy={25} r={5} fill="#B87333" stroke="#D9A05B" strokeWidth={1.5} />
        <circle cx={120} cy={55} r={5} fill="#666" stroke="#aaa" strokeWidth={1.5} />

        <text x={60} y={74} fontSize={6} fill="#888" textAnchor="middle">21.0 Nm</text>
      </g>
    </g>
  );
}
