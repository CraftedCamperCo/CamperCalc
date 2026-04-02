export const SOLAR_SIZE = { w: 180, h: 100 };
export const SOLAR_CONN = {
  PV_POS: { x: 60, y: 100 },
  PV_NEG: { x: 120, y: 100 },
};

interface Props {
  x: number;
  y: number;
  watts: number;
  panelCount: number;
}

export function SolarPanelSVG({ x, y, watts, panelCount }: Props) {
  const count = Math.max(1, Math.min(3, panelCount));
  const panelWidth = 180 / count - 8;
  const panelHeight = 80;
  const gradId = `solarGrad-${x}-${y}`;

  return (
    <g transform={`translate(${x}, ${y})`}>
      <defs>
        <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#4A6FA5" />
          <stop offset="50%" stopColor="#3D5A80" />
          <stop offset="100%" stopColor="#6B4E91" />
        </linearGradient>
      </defs>
      <g className="product-svg-placeholder">
        {/* Watts label */}
        <text x={90} y={-6} fontSize={10} fill="#D9A05B" textAnchor="middle" fontWeight="bold">
          {count}x {Math.round(watts / count)}W
        </text>
        {/* Panel rectangles with blue-purple gradient cells */}
        {Array.from({ length: count }).map((_, i) => {
          const px = 4 + i * (panelWidth + 4);
          return (
            <g key={i}>
              <rect
                x={px}
                y={4}
                width={panelWidth}
                height={panelHeight}
                rx={4}
                fill="#1A1A1A"
                stroke="#003E7E"
                strokeWidth={2}
              />
              <rect
                x={px + 4}
                y={12}
                width={panelWidth - 8}
                height={panelHeight - 16}
                rx={2}
                fill={`url(#${gradId})`}
                stroke="#2A3F5F"
                strokeWidth={0.5}
              />
              {/* Grid lines simulating solar cells */}
              {[0, 1, 2, 3, 4].map((row) =>
                [0, 1, 2, 3, 4].map((col) => (
                  <rect
                    key={`${row}-${col}`}
                    x={px + 8 + col * ((panelWidth - 24) / 5)}
                    y={16 + row * ((panelHeight - 24) / 5)}
                    width={(panelWidth - 24) / 5 - 2}
                    height={(panelHeight - 24) / 5 - 2}
                    rx={1}
                    fill="none"
                    stroke="#2A3F5F"
                    strokeWidth={0.5}
                  />
                ))
              )}
            </g>
          );
        })}
        {/* MC4 connectors at bottom - small circles */}
        <circle cx={50} cy={90} r={4} fill="#1A1A1A" stroke="#003E7E" strokeWidth={1} />
        <circle cx={80} cy={90} r={4} fill="#1A1A1A" stroke="#003E7E" strokeWidth={1} />
        <circle cx={100} cy={90} r={4} fill="#1A1A1A" stroke="#003E7E" strokeWidth={1} />
        <circle cx={130} cy={90} r={4} fill="#1A1A1A" stroke="#003E7E" strokeWidth={1} />
        {/* PV+ and PV- outputs */}
        <circle cx={60} cy={96} r={5} fill="#1A1A1A" stroke="#C0392B" strokeWidth={2} />
        <circle cx={60} cy={96} r={2} fill="#C0392B" />
        <circle cx={120} cy={96} r={5} fill="#1A1A1A" stroke="#333333" strokeWidth={2} />
        <circle cx={120} cy={96} r={2} fill="#333333" />
        <text x={60} y={108} fontSize={7} fill="#C0392B" textAnchor="middle">PV+</text>
        <text x={120} y={108} fontSize={7} fill="#FFFFFF" textAnchor="middle">PV−</text>
      </g>
    </g>
  );
}
