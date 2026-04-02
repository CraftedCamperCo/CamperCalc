interface Props {
  x: number;
  y: number;
  rating: string; // e.g. "175A"
  type?: string;  // e.g. "MEGA", "MIDI", "BLADE"
  orientation?: 'horizontal' | 'vertical';
}

export function InlineFuse({ x, y, rating, type, orientation = 'horizontal' }: Props) {
  const isVert = orientation === 'vertical';
  const w = isVert ? 24 : 44;
  const h = isVert ? 44 : 24;

  return (
    <g transform={`translate(${x}, ${y})`}>
      <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={4} fill="#C0392B" />
      <rect x={-w / 2 + 2} y={-h / 2 + 2} width={w - 4} height={h - 4} rx={3} fill="#E74C3C" />
      {isVert ? (
        <>
          <text x={0} y={-2} fontSize={8} fill="#fff" textAnchor="middle" fontWeight="bold">{rating}</text>
          {type && <text x={0} y={10} fontSize={6} fill="rgba(255,255,255,0.8)" textAnchor="middle">{type}</text>}
        </>
      ) : (
        <>
          <text x={type ? -4 : 0} y={4} fontSize={8} fill="#fff" textAnchor="middle" fontWeight="bold">{rating}</text>
          {type && <text x={16} y={4} fontSize={6} fill="rgba(255,255,255,0.8)" textAnchor="start">{type}</text>}
        </>
      )}
      {/* Connection stubs */}
      {isVert ? (
        <>
          <line x1={0} y1={-h / 2 - 4} x2={0} y2={-h / 2} stroke="#C0392B" strokeWidth={3} />
          <line x1={0} y1={h / 2} x2={0} y2={h / 2 + 4} stroke="#C0392B" strokeWidth={3} />
        </>
      ) : (
        <>
          <line x1={-w / 2 - 4} y1={0} x2={-w / 2} y2={0} stroke="#C0392B" strokeWidth={3} />
          <line x1={w / 2} y1={0} x2={w / 2 + 4} y2={0} stroke="#C0392B" strokeWidth={3} />
        </>
      )}
    </g>
  );
}
