export const LYNX_DIST_SIZE = { w: 360, h: 180 };

export const LYNX_DIST_CONN = {
  BUS_POS_IN: { x: 0, y: 40 },
  BUS_NEG_IN: { x: 0, y: 140 },
  FUSE_1_POS: { x: 100, y: 0 },
  FUSE_1_NEG: { x: 100, y: 180 },
  FUSE_2_POS: { x: 170, y: 0 },
  FUSE_2_NEG: { x: 170, y: 180 },
  FUSE_3_POS: { x: 240, y: 0 },
  FUSE_3_NEG: { x: 240, y: 180 },
  FUSE_4_POS: { x: 310, y: 0 },
  FUSE_4_NEG: { x: 310, y: 180 },
};

interface Props {
  x: number;
  y: number;
  fuseLabels?: string[];
  fuseAssignments?: string[];
}

export function LynxDistributorSVG({ x, y, fuseLabels = [], fuseAssignments = [] }: Props) {
  const W = LYNX_DIST_SIZE.w;
  const H = LYNX_DIST_SIZE.h;
  const slotXPositions = [80, 150, 220, 290];
  const fuseW = 50;
  const fuseH = 60;

  return (
    <g transform={`translate(${x}, ${y})`}>
      <g className="product-svg-placeholder">
        <image href="/assets/victron/lynx-distributor.png" x={5} y={5} width={350} height={170} preserveAspectRatio="xMidYMid meet" />
        {/* Semi-transparent overlays behind text labels for readability */}
        <rect x={W / 2 - 60} y={10} width={120} height={18} rx={3} fill="rgba(26,26,26,0.75)" />
        <text x={W / 2} y={22} fontSize={11} fill="#D9A05B" textAnchor="middle" fontWeight="bold">
          LYNX DISTRIBUTOR
        </text>

        <rect x={30} y={26} width={W - 60} height={18} rx={3} fill="rgba(26,26,26,0.75)" />
        <text x={50} y={39} fontSize={7} fill="#fff" fontWeight="bold">POSITIVE BUSBAR</text>

        <rect x={30} y={H - 50} width={W - 60} height={18} rx={3} fill="rgba(26,26,26,0.75)" />
        <text x={50} y={H - 37} fontSize={7} fill="#ddd" fontWeight="bold">NEGATIVE BUSBAR</text>

        {slotXPositions.map((sx, i) => {
          const fuseY = 56;
          return (
            <g key={i} transform={`translate(${sx}, ${fuseY})`}>
              <circle cx={fuseW / 2} cy={-6} r={5} fill="#B87333" stroke="#8B5A2B" strokeWidth={1.5}/>
              <circle cx={fuseW / 2} cy={-6} r={2} fill="#8B5A2B"/>

              <circle cx={fuseW / 2} cy={fuseH + 16} r={5} fill="#777" stroke="#555" strokeWidth={1.5}/>
              <circle cx={fuseW / 2} cy={fuseH + 16} r={2} fill="#555"/>

              <rect x={5} y={8} width={fuseW - 10} height={fuseH - 16} rx={3} fill="rgba(26,26,26,0.75)" />
              <text x={fuseW / 2} y={32} fontSize={10} fill="#fff" textAnchor="middle" fontWeight="bold">
                {fuseLabels[i] || '---'}
              </text>
              <text x={fuseW / 2} y={44} fontSize={7} fill="rgba(255,255,255,0.8)" textAnchor="middle">MEGA</text>

              {fuseAssignments[i] && (
                <g transform={`translate(${fuseW / 2}, -20)`}>
                  <rect x={-28} y={-9} width={56} height={14} rx={3} fill="rgba(26,26,26,0.85)"/>
                  <text x={0} y={2} fontSize={8} fill="#D9A05B" textAnchor="middle" fontWeight="bold">
                    {fuseAssignments[i]}
                  </text>
                </g>
              )}
            </g>
          );
        })}

        <rect x={W - 55} y={38} width={48} height={14} rx={2} fill="rgba(26,26,26,0.75)" />
        <text x={W - 14} y={48} fontSize={6} fill="#888" textAnchor="end">13.56 Nm</text>
        <rect x={2} y={38} width={55} height={14} rx={2} fill="rgba(26,26,26,0.75)" />
        <text x={14} y={48} fontSize={6} fill="#B87333">Brass 21.0Nm</text>

        <circle cx={0} cy={40} r={6} fill="#B87333" stroke="#D9A05B" strokeWidth={2}/>
        <text x={-10} y={44} fontSize={8} fill="#D9A05B" textAnchor="end" fontWeight="bold">+</text>
        <circle cx={0} cy={140} r={6} fill="#666" stroke="#aaa" strokeWidth={2}/>
        <text x={-10} y={144} fontSize={8} fill="#888" textAnchor="end" fontWeight="bold">−</text>

        <rect x={W / 2 - 100} y={H - 18} width={200} height={12} rx={2} fill="rgba(26,26,26,0.75)" />
        <text x={W / 2} y={H - 8} fontSize={7} fill="#888" textAnchor="middle">Integrated Slow Blow Fuses</text>
      </g>
    </g>
  );
}
