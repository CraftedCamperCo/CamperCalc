interface Props {
  x: number;
  y: number;
  label: string; // e.g. "70-8"
  orientation?: 'left' | 'right' | 'up' | 'down';
  color?: string;
}

const LUG_ID_PREFIX = 'lugGrad';
let lugCounter = 0;

export function TerminalLug({ x, y, label, orientation = 'right', color = '#B87333' }: Props) {
  const rotations: Record<string, number> = { right: 0, down: 90, left: 180, up: 270 };
  const rot = rotations[orientation];
  const id = `${LUG_ID_PREFIX}${lugCounter++}`;

  return (
    <g transform={`translate(${x}, ${y}) rotate(${rot})`}>
      <defs>
        <linearGradient id={`${id}-barrel`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#D4A76A" />
          <stop offset="30%" stopColor="#B87333" />
          <stop offset="70%" stopColor="#8B5A2B" />
          <stop offset="100%" stopColor="#6B4423" />
        </linearGradient>
        <linearGradient id={`${id}-ring`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#D4A76A" />
          <stop offset="50%" stopColor="#B87333" />
          <stop offset="100%" stopColor="#8B5A2B" />
        </linearGradient>
      </defs>

      {/* Ring eyelet - outer copper ring */}
      <circle cx={0} cy={0} r={6} fill={`url(#${id}-ring)`} />
      {/* Ring hole - stud hole */}
      <circle cx={0} cy={0} r={3} fill="#1A1A1A" />
      {/* Ring highlight - metallic sheen */}
      <ellipse cx={-1} cy={-1.5} rx={3.5} ry={2} fill="rgba(255,255,255,0.15)" />

      {/* Crimp barrel - copper tube connecting ring to wire */}
      <rect x={5} y={-4} width={16} height={8} rx={2} fill={`url(#${id}-barrel)`} />
      {/* Barrel crimp indent lines */}
      <line x1={10} y1={-3.5} x2={10} y2={3.5} stroke="#6B4423" strokeWidth={0.5} />
      <line x1={14} y1={-3.5} x2={14} y2={3.5} stroke="#6B4423" strokeWidth={0.5} />
      {/* Barrel highlight - metallic sheen along top edge */}
      <rect x={6} y={-3.5} width={14} height={2} rx={1} fill="rgba(255,255,255,0.18)" />

      {/* Size label pill */}
      <g transform={`rotate(${-rot})`}>
        <rect x={-14} y={8} width={28} height={12} rx={3} fill="rgba(26,26,26,0.92)" />
        <text x={0} y={16.5} fontSize={7} fill="#D9A05B" textAnchor="middle" fontWeight="bold">{label}</text>
      </g>
    </g>
  );
}
