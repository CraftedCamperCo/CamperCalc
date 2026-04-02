export const FUSEBLOCK_SIZE = { w: 100, h: 180 };
export const FUSEBLOCK_CONN = {
  POS_IN: { x: 50, y: 0 },
  NEG_BUS: { x: 20, y: 0 },
  LOADS: { x: 50, y: 180 },
};

interface Props {
  x: number;
  y: number;
}

export function FuseBlockSVG({ x, y }: Props) {
  return (
    <g transform={`translate(${x}, ${y})`} className="product-svg-placeholder">
      {/* Vertical rectangular body */}
      <rect x={0} y={0} width={100} height={180} rx={6} fill="#1A1A1A" stroke="#333" strokeWidth={1.5} />

      {/* Blue Sea ST Blade label */}
      <text x={50} y={20} fontSize={9} fill="#fff" textAnchor="middle" fontWeight="bold">Blue Sea</text>
      <text x={50} y={33} fontSize={8} fill="#D9A05B" textAnchor="middle">ST Blade (5026)</text>

      {/* 2 columns x 6 rows of blade fuse slots (portrait) */}
      {[0, 1, 2, 3, 4, 5].map((row) =>
        [0, 1].map((col) => (
          <rect
            key={`${row}-${col}`}
            x={18 + col * 32}
            y={42 + row * 20}
            width={26}
            height={14}
            rx={2}
            fill="#2a2a2a"
            stroke="#D9A05B"
            strokeWidth={0.8}
          />
        ))
      )}

      {/* Positive input terminal on top */}
      <circle cx={50} cy={0} r={5} fill="#1A1A1A" stroke="#D9A05B" strokeWidth={2} />
      <text x={64} y={4} fontSize={7} fill="#D9A05B" fontWeight="bold">+</text>

      {/* Negative bus terminal on top-left */}
      <circle cx={20} cy={0} r={4} fill="#1A1A1A" stroke="#888" strokeWidth={1.5} />
      <text x={8} y={4} fontSize={6} fill="#888" textAnchor="end">−</text>

      {/* 12V DC Loads label at bottom */}
      <text x={50} y={170} fontSize={8} fill="#888" textAnchor="middle">12V DC Loads</text>
      <text x={50} y={180} fontSize={6} fill="#D9A05B" textAnchor="middle">▼</text>
    </g>
  );
}
