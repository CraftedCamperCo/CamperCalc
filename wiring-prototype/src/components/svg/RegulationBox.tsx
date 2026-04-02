interface Props {
  x: number;
  y: number;
  width: number;
  standard: string;
  clause: string;
  text: string;
}

function wrapText(text: string, maxWidth: number, fontSize: number): string[] {
  const charWidth = fontSize * 0.52;
  const maxChars = Math.floor(maxWidth / charWidth);
  const words = text.split(' ');
  const lines: string[] = [];
  let current = '';
  for (const word of words) {
    if ((current + ' ' + word).trim().length > maxChars) {
      if (current) lines.push(current);
      current = word;
    } else {
      current = current ? current + ' ' + word : word;
    }
  }
  if (current) lines.push(current);
  return lines;
}

export function RegulationBoxSVG({ x, y, width, standard, clause, text }: Props) {
  const lines = wrapText(text, width - 24, 8);
  const height = 44 + lines.length * 13;

  return (
    <g transform={`translate(${x}, ${y})`} className="product-svg-placeholder">
      <rect x={0} y={0} width={width} height={height} rx={6}
        fill="rgba(248,249,250,0.95)" stroke="#D9A05B" strokeWidth={1.5} strokeDasharray="6 4"/>
      <text x={12} y={18} fontSize={10} fill="#1A1A1A" fontWeight="bold">REGULATION:</text>
      <text x={12} y={34} fontSize={8.5} fill="#333">{standard} {clause}</text>
      {lines.map((line, i) => (
        <text key={i} x={12} y={50 + i * 13} fontSize={8} fill="#555" fontStyle="italic">
          "{line}"
        </text>
      ))}
    </g>
  );
}
