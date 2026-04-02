interface Props {
  x: number;
  y: number;
  width: number;
  text: string;
  priority: 'critical' | 'important' | 'info';
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

export function ActionBoxSVG({ x, y, width, text, priority }: Props) {
  const borderColor =
    priority === 'critical' ? '#C0392B' : priority === 'important' ? '#D9A05B' : '#3498DB';
  const bgColor =
    priority === 'critical' ? 'rgba(192,57,43,0.08)'
      : priority === 'important' ? 'rgba(217,160,91,0.1)'
        : 'rgba(52,152,219,0.08)';
  const textColor =
    priority === 'critical' ? '#C0392B' : priority === 'important' ? '#1A1A1A' : '#2980B9';

  const lines = wrapText(text, width - 24, 8);
  const height = 28 + lines.length * 13;

  return (
    <g transform={`translate(${x}, ${y})`} className="product-svg-placeholder">
      <rect x={0} y={0} width={width} height={height} rx={6}
        fill={bgColor} stroke={borderColor} strokeWidth={2}/>
      <text x={12} y={18} fontSize={10} fill={borderColor} fontWeight="bold">ACTION:</text>
      {lines.map((line, i) => (
        <text key={i} x={12} y={34 + i * 13} fontSize={8} fill={textColor}>{line}</text>
      ))}
    </g>
  );
}
