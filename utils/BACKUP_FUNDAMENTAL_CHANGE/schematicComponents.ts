/**
 * schematicComponents.ts
 * ======================
 * CamperPlan Wiring Schematic — SVG Vector Component Library  v2.0
 *
 * Design language: Accurate real-life product recreation.
 * Every Victron product must be immediately recognisable to a customer
 * who has seen the physical device. This means:
 *
 *  - Victron devices: deep navy body (#1C3F6E), orange accent header stripe
 *    at top with "victron energy" in white — exactly as on the physical label.
 *    Model name uses Victron's own notation: "SmartSolar MPPT 100|30"
 *    (pipe separator, not slash). Correct terminal positions matching the
 *    actual physical hardware layout.
 *
 *  - SmartSolar MPPT: cream/beige terminal cover hoods top and bottom (very
 *    distinctive), PV+ / PV- at top, BAT+ / BAT- at bottom.
 *
 *  - MultiPlus / MultiPlus-II: landscape body, large orange stripe, LED
 *    panel (Bulk amber, Abs amber-dim, Float green), ventilation grilles,
 *    DC terminals bottom-left, AC terminals bottom-right.
 *
 *  - Orion-Tr Smart: compact landscape, INPUT side left with IN+/IN−,
 *    OUTPUT side right with OUT+/OUT−, Bluetooth logo detail.
 *
 *  - SmartShunt: flat body, two large brass shunt terminal blocks each side,
 *    "TO BATTERY MINUS" / "TO SYSTEM MINUS" labels rotated vertically.
 *
 *  - Lynx Distributor: wide flat format, Victron blue housing, 4 fuse
 *    positions with MIDI-style fuse holders, M10 bolt connections.
 *
 *  - Fogstar battery: dark navy, Fogstar blue accent bar, red dome boot (+),
 *    black dome boot (−), BMS label.
 *
 *  - Terminal lugs: copper ring terminal body, M8 hex nut, "{gauge}-M{bore}"
 *    stamped label tag — every terminal on every component.
 *
 * Colour palette
 * ─────────────────────────────────────────────────────────────────────────────
 * Victron body dark:     #1C3F6E    (nav body, all Victron devices)
 * Victron body mid:      #2968A8    (gradient detail)
 * Victron sub-panel:     #142D50    (model band, recessed areas)
 * Victron orange:        #E8750A    (header stripe — THE brand identifier)
 * Victron text white:    #FFFFFF
 * Victron text light:    #7FB8E0    (model / sub-labels)
 * Victron LED amber:     #F0A500
 * Victron LED green:     #27AE60
 * Victron LED blue:      #3B9BE8
 *
 * Fogstar body:          #152238
 * Fogstar accent blue:   #1B6FD8
 * Fogstar terminal gold: #C8A840
 *
 * Lynx housing:          #2B5EA7    (Victron blue, not charcoal)
 * Lynx fuse orange:      #D4840A
 *
 * Brass terminal:        #B8860B / #C8A840
 * Lug copper:            #D4840A
 * Lug hex nut:           #888888
 *
 * Wire DC pos (red):     #C0392B
 * Wire DC neg (black):   #1A1A1A
 * Wire AC (blue):        #2980B9
 * Wire earth (green):    #27AE60
 * Wire signal (grey):    #888888
 * ─────────────────────────────────────────────────────────────────────────────
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ComponentPorts {
  [portName: string]: { x: number; y: number };
}

export interface ComponentResult {
  svg: string;
  ports: ComponentPorts;
}

export interface ComponentSpec {
  type: string;
  cx: number;
  cy: number;
  w: number;
  h: number;
  [key: string]: unknown;
}

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function rr(
  x: number, y: number, w: number, h: number,
  rx: number, fill: string, stroke?: string, sw?: number, opacity?: number
): string {
  const s = stroke ? ` stroke="${stroke}" stroke-width="${sw ?? 1}"` : '';
  const o = opacity !== undefined ? ` opacity="${opacity}"` : '';
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${fill}"${s}${o}/>`;
}

function txt(
  x: number, y: number, content: string,
  size: number, fill: string, weight?: string, anchor?: string
): string {
  const w = weight ? ` font-weight="${weight}"` : '';
  const a = anchor ?? 'middle';
  return `<text x="${x}" y="${y}" text-anchor="${a}" dominant-baseline="central" font-family="Arial,sans-serif" font-size="${size}" fill="${fill}"${w}>${esc(content)}</text>`;
}

/** Hex nut centred at (cx,cy) — M8 bolt style */
function hexNut(cx: number, cy: number, r: number, fill = '#888', stroke = '#555'): string {
  const pts: string[] = [];
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 3) * i - Math.PI / 6;
    pts.push(`${(cx + r * Math.cos(angle)).toFixed(1)},${(cy + r * Math.sin(angle)).toFixed(1)}`);
  }
  return `<polygon points="${pts.join(' ')}" fill="${fill}" stroke="${stroke}" stroke-width="0.7"/>
<circle cx="${cx}" cy="${cy}" r="${(r * 0.45).toFixed(1)}" fill="${stroke}" opacity="0.8"/>`;
}

/** Screw-head circle with cross marks */
function screw(cx: number, cy: number, r: number): string {
  const d = r * 0.6;
  return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="#888" stroke="#555" stroke-width="0.5"/>
<line x1="${cx - d}" y1="${cy}" x2="${cx + d}" y2="${cy}" stroke="#444" stroke-width="0.8"/>
<line x1="${cx}" y1="${cy - d}" x2="${cx}" y2="${cy + d}" stroke="#444" stroke-width="0.8"/>`;
}

/**
 * Victron orange header stripe — THE definitive Victron visual identifier.
 * Used on every Victron device. Contains "victron energy" in white bold,
 * with the model/product type on the second line.
 */
function victronHeader(
  x: number, y: number, w: number, rx: number,
  productLine: string, modelStr: string, scale: number = 1
): string {
  const stripeH = 20 * scale;
  const f1 = Math.round(7 * scale);
  const f2 = Math.round(5.5 * scale);
  const cx = x + w / 2;
  return `${rr(x, y, w, stripeH, rx, '#E8750A')}
${txt(cx, y + stripeH * 0.38, 'victron energy', f1, '#FFFFFF', 'bold')}
${txt(cx, y + stripeH * 0.78, esc(modelStr), f2, '#FFE0B2')}`;
}

/** Victron sub-header band — dark panel below orange stripe for model detail */
function victronModelBand(
  x: number, y: number, w: number, modelText: string, fontSize: number = 5.5
): string {
  return `${rr(x + 3, y, w - 6, 12, 2, '#142D50')}
${txt(x + w / 2, y + 6, esc(modelText), fontSize, '#7FB8E0', 'bold')}`;
}

/** Standard screw terminal block for Victron devices */
function screwTerminal(
  cx: number, cy: number, w: number, h: number,
  fill: string, label: string, labelFill: string, fontSize: number = 4.5,
  labelPos: 'above' | 'below' = 'above'
): string {
  const x = cx - w / 2;
  const y = cy - h / 2;
  const labelY = labelPos === 'above' ? cy - h / 2 - 5 : cy + h / 2 + 5;
  return `${rr(x, y, w, h, 1.5, fill, '#111', 0.8)}
${hexNut(cx, cy, Math.min(w, h) * 0.35)}
${txt(cx, labelY, esc(label), fontSize, labelFill, 'bold')}`;
}

/** Victron LED indicator circle */
function led(cx: number, cy: number, colour: string, label?: string, labelSize = 4): string {
  const glow = colour !== '#555' ? ` filter="url(#glow)"` : '';
  let s = `<circle cx="${cx}" cy="${cy}" r="2.8" fill="${colour}" opacity="0.95"/>`;
  if (label) s += `\n${txt(cx, cy + 8, label, labelSize, '#5A9AC8')}`;
  return s;
}

/**
 * Terminal cover hood — the distinctive cream/beige hinged cover on MPPT
 * and some Victron devices. Cable exits through a slot in this cover.
 */
function terminalCoverHood(
  x: number, y: number, w: number, h: number,
  labels: string[], labelColours: string[]
): string {
  const nTerms = labels.length;
  const slotW = (w - 6) / nTerms - 3;
  const slots = labels.map((lbl, i) => {
    const sx = x + 3 + i * (slotW + 3);
    return `${rr(sx, y + h * 0.25, slotW, h * 0.5, 1.5, '#AAA8A0', '#888', 0.7)}
${txt(sx + slotW / 2, y + h * 0.5, lbl, 4.5, labelColours[i], 'bold')}`;
  }).join('');
  return `${rr(x, y, w, h, 2, '#E8E0D0', '#CCC', 0.8)}
${slots}`;
}

/** PE protective earth symbol */
export function drawEarthSymbol(cx: number, cy: number, scale: number = 1): string {
  const lw = 1.2 * scale;
  return `<g class="earth-symbol">
  <circle cx="${cx}" cy="${cy}" r="${6 * scale}" fill="none" stroke="#27AE60" stroke-width="${lw}"/>
  <line x1="${cx}" y1="${cy + 6 * scale}" x2="${cx}" y2="${cy + 10 * scale}" stroke="#27AE60" stroke-width="${lw}"/>
  <line x1="${cx - 7 * scale}" y1="${cy + 10 * scale}" x2="${cx + 7 * scale}" y2="${cy + 10 * scale}" stroke="#27AE60" stroke-width="${lw}"/>
  <line x1="${cx - 4.5 * scale}" y1="${cy + 13 * scale}" x2="${cx + 4.5 * scale}" y2="${cy + 13 * scale}" stroke="#27AE60" stroke-width="${lw}"/>
  <line x1="${cx - 2 * scale}" y1="${cy + 16 * scale}" x2="${cx + 2 * scale}" y2="${cy + 16 * scale}" stroke="#27AE60" stroke-width="${lw}"/>
</g>`;
}

/**
 * TinyBuild-style copper ring terminal lug.
 *
 * Flat from above: orange/copper barrel + ring eyelet + M8 hex nut.
 * "{gauge}-M{bore}" label tag stamped on the lug body.
 *
 * @param cx       Centre X of the stud bolt hole (port coordinate)
 * @param cy       Centre Y of the stud bolt hole
 * @param gauge    Cable gauge string, e.g. "70mm²", "16mm²"
 * @param dir      Direction the cable exits: 'up'|'down'|'left'|'right'
 * @param bore     Ring bore in mm (default 8 = M8)
 * @param scale    Scale multiplier
 */
export function drawLug(
  cx: number, cy: number,
  gauge: string = '16mm²',
  dir: 'up' | 'down' | 'left' | 'right' = 'up',
  bore: number = 8,
  scale: number = 1
): string {
  const r   = 7  * scale;
  const bW  = 8  * scale;
  const bL  = 14 * scale;
  const nutR = 5 * scale;
  const gaugeNum = gauge.replace(/[^0-9]/g, '');
  const tag = `${gaugeNum}-M${bore}`;

  const offsets: Record<string, [number, number]> = {
    up:    [0, bL],
    down:  [0, -bL],
    left:  [bL, 0],
    right: [-bL, 0],
  };
  const [dx, dy] = offsets[dir];
  const barCx = cx + dx;
  const barCy = cy + dy;

  const eyelet = `<circle cx="${cx}" cy="${cy}" r="${r}" fill="#C8902A" stroke="#8B5E0A" stroke-width="${0.8 * scale}"/>
<circle cx="${cx}" cy="${cy}" r="${(r * 0.38).toFixed(1)}" fill="#666" stroke="#444" stroke-width="${0.6 * scale}"/>`;

  let barrel: string;
  if (dir === 'up' || dir === 'down') {
    barrel = `<rect x="${cx - bW / 2}" y="${Math.min(cy, barCy)}" width="${bW}" height="${bL}" rx="${1.5 * scale}" fill="#D4840A" stroke="#8B5200" stroke-width="${0.7 * scale}"/>`;
  } else {
    barrel = `<rect x="${Math.min(cx, barCx)}" y="${cy - bW / 2}" width="${bL}" height="${bW}" rx="${1.5 * scale}" fill="#D4840A" stroke="#8B5200" stroke-width="${0.7 * scale}"/>`;
  }

  const nut = hexNut(cx, cy, nutR);

  // Label centred on the barrel body itself (not floating to the side)
  // For up/down lugs the barrel is vertical — label sits flat in the centre
  // For left/right lugs the barrel is horizontal — label rotates 90° so it
  // reads along the barrel, same as TinyBuild's lug style
  const tagW = Math.max(tag.length * 4.2 * scale, 14 * scale);
  const tagH = 8 * scale;
  let labelSvg: string;

  if (dir === 'up' || dir === 'down') {
    // Barrel mid-point for vertical lug
    const midY = dir === 'up'   ? cy + bL * 0.5
                                : cy - bL * 0.5;
    labelSvg = `<rect x="${cx - tagW / 2}" y="${midY - tagH / 2}" width="${tagW}" height="${tagH}" rx="${1.5 * scale}" fill="#8B5200" opacity="0.85"/>
<text x="${cx}" y="${midY}" text-anchor="middle" dominant-baseline="central" font-family="Arial,sans-serif" font-size="${5.5 * scale}" fill="#FFD080" font-weight="bold">${tag}</text>`;
  } else {
    // Barrel mid-point for horizontal lug — rotate label 90°
    const midX = dir === 'left'  ? cx + bL * 0.5
                                 : cx - bL * 0.5;
    labelSvg = `<g transform="rotate(-90,${midX},${cy})">
  <rect x="${midX - tagW / 2}" y="${cy - tagH / 2}" width="${tagW}" height="${tagH}" rx="${1.5 * scale}" fill="#8B5200" opacity="0.85"/>
  <text x="${midX}" y="${cy}" text-anchor="middle" dominant-baseline="central" font-family="Arial,sans-serif" font-size="${5.5 * scale}" fill="#FFD080" font-weight="bold">${tag}</text>
</g>`;
  }

  return `<g class="lug">
  ${barrel}
  ${eyelet}
  ${nut}
  ${labelSvg}
</g>`;
}

// ---------------------------------------------------------------------------
// 1. LiFePO4 Battery (Fogstar Drift)
// ---------------------------------------------------------------------------

/**
 * Fogstar Drift LiFePO4 auxiliary battery.
 *
 * Distinctive features:
 *  - Dark navy Fogstar body (#152238)
 *  - Bright blue accent bar across upper area with "FOGSTAR DRIFT" in white
 *  - RED insulating dome boot on + terminal (right of centre)
 *  - BLACK insulating dome boot on − terminal (left of centre)
 *  - Capacity displayed prominently in Fogstar blue
 *  - "BMS PROTECTED" footer bar
 *
 * Ports: positive_terminal (top-right), negative_terminal (top-left)
 */
export function drawBattery(
  cx: number, cy: number, w: number, h: number,
  capacityAh: number = 100
): ComponentResult {
  const x = cx - w / 2;
  const y = cy - h / 2;
  const f = (n: number) => Math.round(n * (w < 65 ? 0.85 : 1));

  // Fogstar Drift terminal layout — + is offset right, − offset left
  const posX = cx + w * 0.24;
  const negX = cx - w * 0.26;
  const termY = y;
  const stubH = 8;
  const stubW = 11;
  const bootR = 7.5;

  const wattHours = capacityAh * 12;

  const svg = `<g id="battery-${cx}-${cy}">
  <!-- Drop shadow -->
  <rect x="${x + 3}" y="${y + 3}" width="${w}" height="${h}" rx="3" fill="#000" opacity="0.18"/>
  <!-- Main body — Fogstar dark navy -->
  ${rr(x, y, w, h, 3, '#152238', '#0A1520', 1.5)}

  <!-- Top grip ridge (physical feature of the Fogstar Drift) -->
  ${rr(x + w * 0.1, y + stubH + 2, w * 0.8, 5, 1, '#0A1520', undefined, undefined, 0.7)}

  <!-- Fogstar blue accent band -->
  ${rr(x, y + stubH + 9, w, 16, 0, '#1B6FD8')}
  ${txt(cx, y + stubH + 17, 'FOGSTAR DRIFT', f(6.5), '#FFFFFF', 'bold')}

  <!-- LiFePO4 chemistry label -->
  ${txt(cx, y + stubH + 32, 'LiFePO\u2084 Leisure Battery', f(5), '#7EB5E6')}

  <!-- Capacity badge — large, central -->
  ${rr(cx - 22, y + stubH + 40, 44, 20, 3, '#0A1520')}
  ${txt(cx, y + stubH + 50, `${capacityAh}Ah`, f(12), '#1B6FD8', 'bold')}

  <!-- Wh spec line -->
  ${txt(cx, y + h - 28, '12.8V  ' + wattHours + 'Wh', f(5), '#4A7FAA')}

  <!-- BMS PROTECTED footer bar -->
  ${rr(x + 4, y + h - 18, w - 8, 14, 2, '#0A1520')}
  ${txt(cx, y + h - 11, 'SMART BMS PROTECTED', f(5), '#1B6FD8', 'bold')}

  <!-- Corner locating studs (physical feature) -->
  <circle cx="${x + 6}" cy="${y + h - 6}" r="2.5" fill="#0A1520" stroke="#222" stroke-width="0.5"/>
  <circle cx="${x + w - 6}" cy="${y + h - 6}" r="2.5" fill="#0A1520" stroke="#222" stroke-width="0.5"/>

  <!-- Positive terminal stub (brass) -->
  ${rr(posX - stubW / 2, termY - stubH, stubW, stubH + 3, 2, '#C8A840', '#8B6914', 1)}
  <!-- Positive boot — red insulating dome cover -->
  <ellipse cx="${posX}" cy="${termY - stubH}" rx="${bootR}" ry="${bootR * 0.56}" fill="#CC2200" stroke="#991500" stroke-width="0.9"/>
  <ellipse cx="${posX}" cy="${termY - stubH}" rx="${bootR * 0.52}" ry="${bootR * 0.32}" fill="#E03020" opacity="0.55"/>
  ${txt(posX, termY - stubH + 1, '+', f(7.5), '#FFFFFF', 'bold')}

  <!-- Negative terminal stub (dark) -->
  ${rr(negX - stubW / 2, termY - stubH, stubW, stubH + 3, 2, '#3A3A3A', '#1A1A1A', 1)}
  <!-- Negative boot — black dome cover -->
  <ellipse cx="${negX}" cy="${termY - stubH}" rx="${bootR}" ry="${bootR * 0.56}" fill="#1A1A1A" stroke="#111" stroke-width="0.9"/>
  <ellipse cx="${negX}" cy="${termY - stubH}" rx="${bootR * 0.52}" ry="${bootR * 0.32}" fill="#333" opacity="0.6"/>
  ${txt(negX, termY - stubH + 1, '\u2212', f(7.5), '#AAAAAA', 'bold')}
</g>`;

  return {
    svg,
    ports: {
      positive_terminal: { x: posX, y: termY - stubH },
      negative_terminal: { x: negX, y: termY - stubH },
    },
  };
}

// ---------------------------------------------------------------------------
// 2. Starter Battery (engine / vehicle)
// ---------------------------------------------------------------------------

export function drawStarterBattery(
  cx: number, cy: number, w: number, h: number
): ComponentResult {
  const x = cx - w / 2;
  const y = cy - h / 2;
  const f = (n: number) => Math.round(n * (w < 55 ? 0.8 : 1));

  const posX = cx - w * 0.22;
  const negX = cx + w * 0.22;
  const termY = y;
  const stubH = 6; const stubW = 9; const bootR = 5;

  const svg = `<g id="starter-batt-${cx}-${cy}">
  ${rr(x, y, w, h, 3, '#2A2A2A', '#111', 1.5)}
  <!-- Handle -->
  ${rr(cx - w * 0.25, y + 3, w * 0.5, 4, 1, '#1A1A1A')}
  <!-- Top label band -->
  ${rr(x + 1, y + stubH + 6, w - 2, 10, 0, '#3A3A3A')}
  ${txt(cx, y + stubH + 11, 'STARTER BATTERY', f(5), '#CCCCCC', 'bold')}
  <!-- Sub-label -->
  ${txt(cx, y + stubH + 22, '12V Lead Acid', f(4), '#888')}
  <!-- Type badge -->
  ${rr(cx - 16, y + h - 18, 32, 12, 2, '#1A1A1A')}
  ${txt(cx, y + h - 12, 'AGM/EFB', f(5), '#666', 'bold')}
  <!-- + terminal -->
  ${rr(posX - stubW / 2, termY - stubH, stubW, stubH + 2, 1.5, '#C8A840', '#8B6914', 1)}
  <ellipse cx="${posX}" cy="${termY - stubH}" rx="${bootR}" ry="${bootR * 0.5}" fill="#CC2200" stroke="#991500" stroke-width="0.8"/>
  ${txt(posX, termY - stubH + 1, '+', f(6), '#FFF', 'bold')}
  <!-- − terminal -->
  ${rr(negX - stubW / 2, termY - stubH, stubW, stubH + 2, 1.5, '#444', '#222', 1)}
  <ellipse cx="${negX}" cy="${termY - stubH}" rx="${bootR}" ry="${bootR * 0.5}" fill="#222" stroke="#111" stroke-width="0.8"/>
  ${txt(negX, termY - stubH + 1, '\u2212', f(6), '#BBB', 'bold')}
</g>`;

  return {
    svg,
    ports: {
      positive_terminal: { x: posX, y: termY - stubH },
      negative_terminal: { x: negX, y: termY - stubH },
    },
  };
}

// ---------------------------------------------------------------------------
// 3. Victron SmartShunt
// ---------------------------------------------------------------------------

/**
 * Victron SmartShunt 500A / 50mV
 *
 * Real-life appearance:
 *  - Flat narrow Victron navy body
 *  - TWO large brass/copper terminal blocks protruding each side
 *  - LEFT block = "TO BATTERY" / "MINUS" (rotated text on block)
 *  - RIGHT block = "TO SYSTEM" / "MINUS"
 *  - Shunt resistor visible as a metallic bar between blocks
 *  - M8 hex bolt on each block top
 *  - Orange header at top with "victron energy" + "SmartShunt 500A"
 *  - Green status LED
 *
 * Ports: batt_neg_in (left block outer edge), system_neg_out (right block outer edge)
 */
export function drawSmartShunt(
  cx: number, cy: number, w: number, h: number
): ComponentResult {
  const x = cx - w / 2;
  const y = cy - h / 2;
  const f = (n: number) => Math.round(n * (w < 56 ? 0.82 : 1));

  // Large brass terminal blocks — match real device proportions
  const blockW = Math.max(18, w * 0.28);
  const blockH = h * 0.72;
  const blockY = cy - blockH / 2;

  // Shunt copper bar (the actual shunt element between the two blocks)
  const shuntBarH = h * 0.18;

  const svg = `<g id="shunt-${cx}-${cy}">
  <!-- Left brass terminal block -->
  ${rr(x - blockW, blockY, blockW, blockH, 2, '#B8860B', '#7A5600', 1.5)}
  <!-- Brass texture detail -->
  ${rr(x - blockW + 2, blockY + 3, blockW - 4, blockH - 6, 1, '#C8A020', undefined, undefined, 0.3)}
  <!-- M8 bolt on left block -->
  ${hexNut(x - blockW / 2, cy - blockH * 0.2, 5.5)}
  <!-- Clamping bolt below -->
  ${hexNut(x - blockW / 2, cy + blockH * 0.2, 4.5, '#777', '#444')}
  <!-- "TO BATTERY" rotated label on block -->
  <text transform="rotate(-90,${x - blockW / 2},${cy - blockH * 0.08})"
    x="${x - blockW / 2}" y="${cy - blockH * 0.08}"
    text-anchor="middle" dominant-baseline="central"
    font-family="Arial,sans-serif" font-size="${f(4.5)}" fill="#1A1200" font-weight="bold">TO BATTERY</text>
  <text transform="rotate(-90,${x - blockW / 2},${cy + blockH * 0.12})"
    x="${x - blockW / 2}" y="${cy + blockH * 0.12}"
    text-anchor="middle" dominant-baseline="central"
    font-family="Arial,sans-serif" font-size="${f(4.5)}" fill="#1A1200" font-weight="bold">MINUS</text>

  <!-- Shunt copper resistor bar (visible between blocks) -->
  ${rr(x - 3, cy - shuntBarH / 2, w + 6, shuntBarH, 1, '#B8860B', '#8B6914', 0.8)}
  <line x1="${x - 3}" y1="${cy}" x2="${x + w + 3}" y2="${cy}"
    stroke="#D4A820" stroke-width="1" opacity="0.5"/>

  <!-- Main body -->
  ${rr(x, y, w, h, 3, '#1C3F6E', '#0D2647', 1.2)}

  <!-- Orange header stripe -->
  ${rr(x, y, w, 16, 3, '#E8750A')}
  ${txt(cx, y + 6, 'victron energy', f(5.5), '#FFF', 'bold')}
  ${txt(cx, y + 12.5, 'SmartShunt', f(4.5), '#FFE0B2')}

  <!-- Model / spec band -->
  ${rr(x + 3, y + 19, w - 6, 11, 2, '#142D50')}
  ${txt(cx, y + 24.5, '500A / 50mV', f(6), '#7FB8E0', 'bold')}

  <!-- Bluetooth symbol detail -->
  ${txt(cx - w * 0.28, y + h - 10, '\u2318', f(8), '#3B9BE8')}

  <!-- Status LED (green = connected) -->
  ${led(x + w - 8, y + 9, '#27AE60')}

  <!-- Aux sense terminal (small, top centre) -->
  ${rr(cx - 8, y - 6, 16, 6, 1.5, '#2A2A2A', '#111', 0.8)}
  ${txt(cx, y - 3, 'AUX', f(4), '#AAA')}

  <!-- Right brass terminal block -->
  ${rr(x + w, blockY, blockW, blockH, 2, '#B8860B', '#7A5600', 1.5)}
  ${rr(x + w + 2, blockY + 3, blockW - 4, blockH - 6, 1, '#C8A020', undefined, undefined, 0.3)}
  ${hexNut(x + w + blockW / 2, cy - blockH * 0.2, 5.5)}
  ${hexNut(x + w + blockW / 2, cy + blockH * 0.2, 4.5, '#777', '#444')}
  <text transform="rotate(-90,${x + w + blockW / 2},${cy - blockH * 0.08})"
    x="${x + w + blockW / 2}" y="${cy - blockH * 0.08}"
    text-anchor="middle" dominant-baseline="central"
    font-family="Arial,sans-serif" font-size="${f(4.5)}" fill="#1A1200" font-weight="bold">TO SYSTEM</text>
  <text transform="rotate(-90,${x + w + blockW / 2},${cy + blockH * 0.12})"
    x="${x + w + blockW / 2}" y="${cy + blockH * 0.12}"
    text-anchor="middle" dominant-baseline="central"
    font-family="Arial,sans-serif" font-size="${f(4.5)}" fill="#1A1200" font-weight="bold">MINUS</text>
</g>`;

  return {
    svg,
    ports: {
      batt_neg_in:    { x: x - blockW,          y: cy },
      system_neg_out: { x: x + w + blockW,       y: cy },
      aux_sense:      { x: cx,                   y: y - 6 },
    },
  };
}

// ---------------------------------------------------------------------------
// 4. Victron Lynx Distributor
// ---------------------------------------------------------------------------

/**
 * Victron Lynx Distributor (LYN060102010)
 *
 * Real-life appearance:
 *  - Wide flat housing, Victron dark-blue body
 *  - 4 fuse positions across the top — MIDI fuse holders (orange/amber)
 *    with visible fuse window and fuse rating label
 *  - Two M10 bus-in bolts at left (from Lynx Power In module)
 *  - Four M10 output bolt positions below each fuse (circuit outputs)
 *  - "LYNX DISTRIBUTOR" label in white on dark body
 *  - Orange Victron footer stripe
 *
 * Ports: busbar_in (left), fuse_out_1..4 (bottom of fuse holders)
 */
export function drawLynxDistributor(
  cx: number, cy: number, w: number, h: number
): ComponentResult {
  const x = cx - w / 2;
  const y = cy - h / 2;
  const f = (n: number) => Math.round(n * (w < 160 ? 0.75 : 1));

  // Core layout zones
  const metalTop = y + h * 0.06;
  const metalH = h * 0.72;
  const fuseTop = metalTop + h * 0.02;
  const fuseH = h * 0.30;
  const busbarY = fuseTop + fuseH + 2;
  const busbarH = Math.max(8, h * 0.065);
  const negBarY = busbarY + busbarH + h * 0.18;
  const negBarH = Math.max(6, h * 0.05);

  const fuseAreaX = x + w * 0.10;
  const fuseAreaW = w * 0.84;
  const fuseSpacing = fuseAreaW / 4;
  const fuseW = Math.min(fuseSpacing - 6, w * 0.14);
  const fuseRatings = ['60A', '60A', '60A', '175A'];
  const outLugH = Math.max(9, h * 0.11);
  const negLugH = Math.max(8, h * 0.10);
  const leftStubX = x - w * 0.07;
  const earthCy = y + h + 8;
  const earthPadY = y + h - 20;

  const gradId = `lynx-${Math.round(cx)}-${Math.round(cy)}`;

  let fuseSVG = '';
  let outLugSVG = '';
  let negLugSVG = '';
  let posBoltSVG = '';
  let negBoltSVG = '';
  for (let i = 0; i < 4; i++) {
    const fx = fuseAreaX + i * fuseSpacing;
    const midX = fx + fuseW / 2;
    fuseSVG += `
  ${rr(fx, fuseTop, fuseW, fuseH, 2, `url(#${gradId}-fuse)`, '#8A4F00', 0.8)}
  ${rr(midX - fuseW * 0.23, fuseTop + fuseH * 0.24, fuseW * 0.46, fuseH * 0.34, 1.5, '#FFD060', '#CC9B2D', 0.6)}
  ${hexNut(midX, fuseTop + 4, 4.2, '#999', '#666')}
  ${hexNut(midX, fuseTop + fuseH - 4, 4.2, '#999', '#666')}
  <text transform="rotate(-90,${midX},${fuseTop + fuseH * 0.62})"
    x="${midX}" y="${fuseTop + fuseH * 0.62}"
    text-anchor="middle" dominant-baseline="central"
    font-family="Arial,sans-serif" font-size="${f(5.2)}" fill="#FFF" font-weight="700">${fuseRatings[i]}</text>`;

    outLugSVG += `
  ${rr(midX - 4.5, y - outLugH, 9, outLugH + 1.5, 1.2, 'url(#' + gradId + '-lug-pos)', '#A88020', 0.8)}
  <circle cx="${midX}" cy="${y - outLugH + 2.8}" r="2.1" fill="#7A7A7A"/>
  <circle cx="${midX}" cy="${y - outLugH + 2.8}" r="1.1" fill="#666"/>`;

    negLugSVG += `
  ${rr(midX - 4.2, y + h - 1, 8.4, negLugH + 1.5, 1.2, '#4A4A4A', '#333', 0.8)}
  <circle cx="${midX}" cy="${y + h + negLugH - 1.8}" r="2.0" fill="#666"/>
  <circle cx="${midX}" cy="${y + h + negLugH - 1.8}" r="1.0" fill="#444"/>`;

    posBoltSVG += `${hexNut(midX, busbarY + busbarH / 2, 4.2, '#999', '#666')}`;
    negBoltSVG += `${hexNut(midX, negBarY + negBarH / 2, 4.0, '#666', '#444')}`;
  }

  const svg = `<g id="${gradId}">
  <defs>
    <linearGradient id="${gradId}-body" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#4A9AD4"/>
      <stop offset="52%" stop-color="#2E7AB8"/>
      <stop offset="100%" stop-color="#1B5A8C"/>
    </linearGradient>
    <linearGradient id="${gradId}-metal" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#ABABAB"/>
      <stop offset="55%" stop-color="#929292"/>
      <stop offset="100%" stop-color="#7A7A7A"/>
    </linearGradient>
    <linearGradient id="${gradId}-posbar" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#DDB545"/>
      <stop offset="52%" stop-color="#C8A030"/>
      <stop offset="100%" stop-color="#A07A1A"/>
    </linearGradient>
    <linearGradient id="${gradId}-lug-pos" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#D4A840"/>
      <stop offset="100%" stop-color="#A88020"/>
    </linearGradient>
    <linearGradient id="${gradId}-fuse" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#E89020"/>
      <stop offset="100%" stop-color="#C06A00"/>
    </linearGradient>
    <linearGradient id="${gradId}-negbar" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#555"/>
      <stop offset="100%" stop-color="#3A3A3A"/>
    </linearGradient>
  </defs>

  <rect x="${x + 2.5}" y="${y + 2.5}" width="${w}" height="${h}" rx="5" fill="#000" opacity="0.16"/>
  ${rr(x, y, w, h, 5, `url(#${gradId}-body)`, '#14466A', 1.2)}
  ${rr(x + w * 0.05, metalTop, w * 0.90, metalH, 3, `url(#${gradId}-metal)`, '#6A6A6A', 0.7)}

  ${rr(leftStubX, busbarY, w * 0.92, busbarH, 2, `url(#${gradId}-posbar)`, '#8F6A1A', 0.8)}
  ${posBoltSVG}
  ${fuseSVG}
  ${outLugSVG}

  ${rr(leftStubX, negBarY, w * 0.92, negBarH, 2, `url(#${gradId}-negbar)`, '#2A2A2A', 0.8)}
  ${negBoltSVG}
  ${negLugSVG}

  ${rr(leftStubX - 2.5, busbarY - 3.2, 7.5, busbarH + 6.4, 1.3, `url(#${gradId}-lug-pos)`, '#A88020', 0.8)}
  ${hexNut(leftStubX + 1.4, busbarY + busbarH / 2, 3.8, '#999', '#666')}

  ${rr(leftStubX - 2.5, negBarY - 3.0, 7.5, negBarH + 6.0, 1.3, '#4A4A4A', '#333', 0.8)}
  ${hexNut(leftStubX + 1.4, negBarY + negBarH / 2, 3.6, '#666', '#444')}

  ${rr(cx - 9, earthPadY, 18, 9, 2, '#2A7A2A', '#1C5A1C', 0.8)}
  ${hexNut(cx, earthCy, 3.8, '#2A7A2A', '#1C5A1C')}

  ${txt(cx, y + h - 10, 'LYNX DISTRIBUTOR', f(6), '#EAF4FF', 'bold')}
  ${txt(cx, y + h - 4, 'victron energy', f(4.5), '#D7EAF8')}
</g>`;

  const ports: ComponentPorts = {
    busbar_in: { x: leftStubX, y: busbarY + busbarH / 2 },
    busbar_neg: { x: leftStubX, y: negBarY + negBarH / 2 },
    earth: { x: cx, y: y + h + 8 },
  };

  for (let i = 0; i < 4; i++) {
    const fx = fuseAreaX + i * fuseSpacing + fuseW / 2;
    ports[`fuse_out_${i + 1}`] = { x: fx, y: y - 6 };
  }
  for (let i = 0; i < 4; i++) {
    const fx = fuseAreaX + i * fuseSpacing + fuseW / 2;
    ports[`neg_out_${i + 1}`] = { x: fx, y: y + h + 6 };
  }

  return { svg, ports };
}

// ---------------------------------------------------------------------------
// 5. Copper Dual Busbar pair
// ---------------------------------------------------------------------------

export function drawDualBusbar(
  cx: number, cy: number, w: number, h: number
): ComponentResult {
  const x = cx - w / 2;
  const y = cy - h / 2;
  const barH = h * 0.38;
  const posY = y + 4;
  const negY = y + h - barH - 4;
  const ports: ComponentPorts = {};

  const boltXs: number[] = [];
  for (let i = 0; i < 5; i++) boltXs.push(x + 8 + i * ((w - 16) / 4));

  boltXs.forEach((bx, i) => {
    if (i === 0) {
      ports['pos_in'] = { x: bx, y: posY };
      ports['neg_in'] = { x: bx, y: negY + barH };
    } else {
      ports[`pos_out_${i}`] = { x: bx, y: posY };
      ports[`neg_out_${i}`] = { x: bx, y: negY + barH };
    }
  });

  const posBolts = boltXs.map((bx) => hexNut(bx, posY + barH / 2, 4.5, '#C8A840', '#8B6914')).join('');
  const negBolts = boltXs.map((bx) => hexNut(bx, negY + barH / 2, 4.5, '#666', '#444')).join('');

  const svg = `<g id="busbar-${cx}-${cy}">
  <!-- Positive copper bar -->
  ${rr(x, posY, w, barH, 2.5, '#C8A840', '#8B6914', 1.3)}
  <rect x="${x + 2}" y="${posY + 2}" width="${w - 4}" height="${barH - 4}" rx="1.5" fill="#D4B830" opacity="0.3"/>
  ${txt(cx, posY + barH / 2, '+  BUS', 6, '#3A2A00', 'bold')}
  ${posBolts}
  <!-- Negative copper bar -->
  ${rr(x, negY, w, barH, 2.5, '#3A3A3A', '#1A1A1A', 1.3)}
  <rect x="${x + 2}" y="${negY + 2}" width="${w - 4}" height="${barH - 4}" rx="1.5" fill="#555" opacity="0.3"/>
  ${txt(cx, negY + barH / 2, '\u2212  BUS', 6, '#CCCCCC', 'bold')}
  ${negBolts}
  <!-- Centre label panel -->
  <rect x="${x + 14}" y="${cy - 8}" width="${w - 28}" height="16" rx="2" fill="#E8E8E0" stroke="#CCC" stroke-width="0.8"/>
  ${txt(cx, cy, 'DC DISTRIBUTION', 5.5, '#333')}
</g>`;

  return { svg, ports };
}

// ---------------------------------------------------------------------------
// 6. Victron MultiPlus (Inverter-Charger)
// ---------------------------------------------------------------------------

/**
 * Victron MultiPlus 12/3000/120 or MultiPlus-II
 *
 * Real-life appearance:
 *  - ORANGE header stripe with "victron energy" — immediately recognisable
 *  - Large navy blue body — portrait or landscape depending on schematic
 *  - Model band: "MultiPlus-II 12/3000/120-16 230V"
 *  - Left section: VENTILATION grilles (horizontal slots)
 *  - Right section: LED panel — BULK (amber), ABSORPTION (amber-dim),
 *    FLOAT (green), INVERTER ON (blue), MAINS (green)
 *  - LED labels below each LED
 *  - Bottom terminal block (left→right): PE | L-OUT | N-OUT | L-IN | N-IN | DC+ | DC−
 *  - Coloured terminal stubs: blue for AC, red/black for DC, green for PE
 *
 * Terminal physical layout (looking at bottom of device):
 *   DC+ and DC− are on the LEFT half
 *   AC IN and AC OUT are on the RIGHT half
 *   PE (earth) is between them
 *
 * Ports: dc_positive, dc_negative, ac_in, ac_out, earth_terminal
 */
export function drawMultiPlus(
  cx: number, cy: number, w: number, h: number
): ComponentResult {
  const x = cx - w / 2;
  const y = cy - h / 2;
  const f = (n: number) => Math.round(n * (w < 72 ? 0.82 : 1));

  // Terminal block — bottom of device
  // DC+ and DC− at left, PE in middle, AC OUT then AC IN at right
  const termY = y + h;
  const termH = 10;
  // Distribute 5 terminals across the body width with some padding
  const termPad = w * 0.06;
  const termSpan = w - termPad * 2;
  const termStep = termSpan / 4;

  const terminals: Array<{ name: string; label: string; fill: string; ratio: number }> = [
    { name: 'dc_positive',    label: 'DC+', fill: '#C0392B', ratio: 0.00 },
    { name: 'dc_negative',    label: 'DC\u2212', fill: '#2A2A2A', ratio: 0.25 },
    { name: 'earth_terminal', label: 'PE',  fill: '#27AE60', ratio: 0.50 },
    { name: 'ac_out',         label: 'L\u2192', fill: '#2980B9', ratio: 0.75 },
    { name: 'ac_in',          label: 'L\u2190', fill: '#5B5BDB', ratio: 1.00 },
  ];

  const termSVG = terminals.map(({ label, fill, ratio }) => {
    const tx = x + termPad + ratio * termSpan;
    return `${rr(tx - 4.5, termY, 9, termH, 1.5, fill, '#111', 0.8)}
${hexNut(tx, termY + 5, 3.2)}
${txt(tx, termY + termH + 5, label, f(4.5), fill, 'bold')}`;
  }).join('');

  // Ventilation grilles — left 52% of body, below header
  const ventX = x + 5;
  const ventW = w * 0.50;
  const vents = [...Array(7)].map((_, i) =>
    `<rect x="${ventX}" y="${y + 42 + i * 9}" width="${ventW}" height="5" rx="1.5" fill="#0D1E3A" opacity="0.8"/>`
  ).join('');

  // LED panel — right section
  const ledPanelX = x + w * 0.58;
  const ledPanelW = w * 0.38;
  const ledPanelY = y + 38;
  const ledPanelH = h * 0.44;

  const leds = [
    { label: 'BULK',  colour: '#F0A500', dy: 0.15 },
    { label: 'ABS',   colour: '#E87000', dy: 0.38 },
    { label: 'FLOAT', colour: '#27AE60', dy: 0.61 },
    { label: 'INV',   colour: '#3B9BE8', dy: 0.84 },
  ];

  const ledSVG = leds.map(({ label, colour, dy }) => {
    const lx = ledPanelX + ledPanelW * 0.35;
    const ly = ledPanelY + ledPanelH * dy;
    return `<circle cx="${lx}" cy="${ly}" r="2.8" fill="${colour}" opacity="0.9"/>
${txt(lx + 8, ly, label, f(4), '#7FB8E0', undefined, 'start')}`;
  }).join('');

  const svg = `<g id="multiplus-${cx}-${cy}">
  <!-- Drop shadow -->
  <rect x="${x + 3}" y="${y + 3}" width="${w}" height="${h}" rx="4" fill="#000" opacity="0.22"/>
  <!-- Main body -->
  ${rr(x, y, w, h, 4, '#1C3F6E', '#0D2647', 1.5)}

  <!-- ORANGE header stripe — THE Victron identifier -->
  ${rr(x, y, w, 22, 4, '#E8750A')}
  ${txt(cx, y + 8.5, 'victron energy', f(7.5), '#FFFFFF', 'bold')}
  ${txt(cx, y + 17, 'MultiPlus', f(5.5), '#FFE0B2')}

  <!-- Model band -->
  ${rr(x + 4, y + 25, w - 8, 12, 2, '#142D50')}
  ${txt(cx, y + 31, 'MultiPlus  12/3000/120', f(5.5), '#7FB8E0', 'bold')}

  <!-- Vent grilles (left panel) -->
  ${rr(x + 3, y + 40, w * 0.54, h * 0.48, 2, '#0F1E38', undefined, undefined, 0.7)}
  ${vents}

  <!-- LED panel (right section) -->
  ${rr(ledPanelX, ledPanelY, ledPanelW, ledPanelH, 2, '#0A1525')}
  ${ledSVG}

  <!-- Bottom DC terminal section label -->
  ${rr(x + 4, y + h - 24, w * 0.44, 10, 1, '#0D1E3A')}
  ${txt(x + 4 + w * 0.22, y + h - 19, 'DC TERMINALS', f(4), '#4A7FAA')}

  <!-- Bottom AC terminal section label -->
  ${rr(x + w * 0.5, y + h - 24, w * 0.46, 10, 1, '#0D1E3A')}
  ${txt(x + w * 0.73, y + h - 19, 'AC TERMINALS', f(4), '#4A7FAA')}

  <!-- Terminal housing -->
  <rect x="${x + termPad - 6}" y="${termY - 1}" width="${termSpan + 12}" height="${termH + 2}" rx="1.5" fill="#0A0A0A" stroke="#333" stroke-width="0.8"/>
  ${termSVG}
</g>`;

  const ports: ComponentPorts = {};
  terminals.forEach(({ name, ratio }) => {
    ports[name] = { x: x + termPad + ratio * termSpan, y: termY + termH };
  });

  return { svg, ports };
}

// ---------------------------------------------------------------------------
// 7. Victron SmartSolar MPPT
// ---------------------------------------------------------------------------

/**
 * Victron SmartSolar MPPT charge controller.
 *
 * Real-life appearance:
 *  - Portrait body (taller than wide)
 *  - ORANGE header stripe: "victron energy" + "SmartSolar MPPT"
 *  - Model band uses Victron's pipe notation: "SmartSolar MPPT 100|30"
 *  - CREAM/BEIGE terminal cover hoods top and bottom — very distinctive.
 *    The top hood covers PV input terminals (PV+ right, PV− left).
 *    The bottom hood covers battery terminals (BAT+ right, BAT− left).
 *  - Each terminal slot shows label (PV+/PV−/BAT+/BAT−)
 *  - LED row bottom-right: 3 indicators (green=bulk/connected,
 *    amber=absorption, amber-dim=float)
 *  - "SOLAR INPUT" text on body, "BATTERY OUTPUT" on body
 *  - Bluetooth module detail
 *
 * Port positions match the physical device:
 *   PV+ is right of centre (top), PV− is left
 *   BAT+ is right of centre (bottom), BAT− is left
 */
export function drawMPPT(
  cx: number, cy: number, w: number, h: number,
  model: string = '100/30'
): ComponentResult {
  const x = cx - w / 2;
  const y = cy - h / 2;
  const f = (n: number) => Math.round(n * (w < 60 ? 0.82 : 1));

  // Use Victron's pipe notation for model display
  const displayModel = 'SmartSolar MPPT ' + model.replace('/', '|');

  // Terminal cover hood dimensions
  const hoodH = 12;
  const hoodW = w * 0.84;
  const hoodX = cx - hoodW / 2;

  // Terminal positions: PV+ right of centre, PV− left
  const pvPosX  = cx + w * 0.20;
  const pvNegX  = cx - w * 0.24;
  const batPosX = cx + w * 0.20;
  const batNegX = cx - w * 0.24;

  // Terminal stub dimensions
  const termW = 9; const termH = 7;

  // Vent slots
  const ventW = w * 0.62;
  const vents = [...Array(4)].map((_, i) =>
    `<rect x="${x + w * 0.12}" y="${y + 46 + i * 8}" width="${ventW}" height="4" rx="1" fill="#0D1E3A" opacity="0.8"/>`
  ).join('');

  // LED row
  const ledXs = [x + w * 0.6, x + w * 0.72, x + w * 0.84];
  const ledCols = ['#27AE60', '#F0A500', '#555'];
  const ledLabels = ['BULK', 'ABS', 'FLT'];
  const ledSVG = ledXs.map((lx, i) =>
    `<circle cx="${lx}" cy="${y + h - 16}" r="2.5" fill="${ledCols[i]}" opacity="0.9"/>
${txt(lx, y + h - 8, ledLabels[i], f(3.8), '#5A9AC8')}`
  ).join('');

  const svg = `<g id="mppt-${cx}-${cy}">
  <!-- Drop shadow -->
  <rect x="${x + 2}" y="${y + 2}" width="${w}" height="${h}" rx="3" fill="#000" opacity="0.18"/>
  <!-- Main body -->
  ${rr(x, y, w, h, 3, '#1C3F6E', '#0D2647', 1.2)}

  <!-- ORANGE header stripe -->
  ${rr(x, y, w, 20, 3, '#E8750A')}
  ${txt(cx, y + 8, 'victron energy', f(6.5), '#FFF', 'bold')}
  ${txt(cx, y + 16, 'SmartSolar MPPT', f(4.5), '#FFE0B2')}

  <!-- Model band -->
  ${rr(x + 3, y + 23, w - 6, 12, 2, '#142D50')}
  ${txt(cx, y + 29, esc(displayModel), f(5.5), '#7FB8E0', 'bold')}

  <!-- SOLAR INPUT section label -->
  ${rr(x + 4, y + 38, w - 8, 9, 1, '#0D1E3A', undefined, undefined, 0.8)}
  ${txt(cx, y + 42.5, 'SOLAR INPUT', f(4.5), '#5A9AC8')}

  <!-- Body detail — vent grilles -->
  ${vents}

  <!-- BATTERY OUTPUT section label -->
  ${rr(x + 4, y + h - 32, w - 8, 9, 1, '#0D1E3A', undefined, undefined, 0.8)}
  ${txt(cx, y + h - 27.5, 'BATTERY OUTPUT', f(4.5), '#5A9AC8')}

  <!-- LED status row -->
  ${ledSVG}

  <!-- Bluetooth detail (very small logo mark) -->
  ${txt(x + w * 0.14, y + h - 13, 'BT', f(4), '#3B9BE8')}

  <!-- ─── PV INPUT terminal cover hood (top) ─── -->
  <!-- Hood housing -->
  ${rr(hoodX - 2, y - hoodH - 2, hoodW + 4, hoodH + 2, 2, '#CCCCBB', '#AAA', 0.8)}
  <!-- PV− slot (left) -->
  ${rr(pvNegX - termW / 2, y - hoodH + 1, termW, hoodH * 0.6, 1.5, '#AAA8A0', '#888', 0.8)}
  ${txt(pvNegX, y - hoodH * 0.65, 'PV\u2212', f(4.5), '#1A1A1A', 'bold')}
  <!-- PV+ slot (right) -->
  ${rr(pvPosX - termW / 2, y - hoodH + 1, termW, hoodH * 0.6, 1.5, '#AAA8A0', '#888', 0.8)}
  ${txt(pvPosX, y - hoodH * 0.65, 'PV+', f(4.5), '#1A1A1A', 'bold')}

  <!-- PV+ terminal stub below hood -->
  ${rr(pvPosX - termW / 2, y - termH, termW, termH, 1.5, '#C0392B', '#8B0000', 0.9)}
  ${hexNut(pvPosX, y - termH / 2, 3)}

  <!-- PV− terminal stub below hood -->
  ${rr(pvNegX - termW / 2, y - termH, termW, termH, 1.5, '#222', '#111', 0.9)}
  ${hexNut(pvNegX, y - termH / 2, 3)}

  <!-- ─── BATTERY OUTPUT terminal cover hood (bottom) ─── -->
  <!-- Hood housing -->
  ${rr(hoodX - 2, y + h, hoodW + 4, hoodH + 2, 2, '#CCCCBB', '#AAA', 0.8)}
  <!-- BAT− slot (left) -->
  ${rr(batNegX - termW / 2, y + h + 1, termW, hoodH * 0.6, 1.5, '#AAA8A0', '#888', 0.8)}
  ${txt(batNegX, y + h + hoodH + 5, 'BAT\u2212', f(4.5), '#1A1A1A', 'bold')}
  <!-- BAT+ slot (right) -->
  ${rr(batPosX - termW / 2, y + h + 1, termW, hoodH * 0.6, 1.5, '#AAA8A0', '#888', 0.8)}
  ${txt(batPosX, y + h + hoodH + 5, 'BAT+', f(4.5), '#1A1A1A', 'bold')}

  <!-- BAT+ terminal stub above hood -->
  ${rr(batPosX - termW / 2, y + h + termH * 0.4, termW, termH, 1.5, '#C0392B', '#8B0000', 0.9)}
  ${hexNut(batPosX, y + h + termH, 3)}

  <!-- BAT− terminal stub -->
  ${rr(batNegX - termW / 2, y + h + termH * 0.4, termW, termH, 1.5, '#222', '#111', 0.9)}
  ${hexNut(batNegX, y + h + termH, 3)}
</g>`;

  return {
    svg,
    ports: {
      pv_positive:  { x: pvPosX,  y: y - termH },
      pv_negative:  { x: pvNegX,  y: y - termH },
      bat_positive: { x: batPosX, y: y + h + termH },
      bat_negative: { x: batNegX, y: y + h + termH },
    },
  };
}

// ---------------------------------------------------------------------------
// 8. Victron Orion-Tr Smart (DC-DC Charger)
// ---------------------------------------------------------------------------

/**
 * Victron Orion-Tr Smart 12/12-30A Isolated DC-DC Charger
 *
 * Real-life appearance:
 *  - Compact landscape rectangular unit
 *  - Orange header stripe: "victron energy" + "Orion-Tr Smart"
 *  - Model band: "12|12-30A  Isolated"
 *  - LEFT end: INPUT terminal block — IN+ (red) / IN− (black) / ON-OFF
 *  - RIGHT end: OUTPUT terminal block — OUT+ (red) / OUT− (black)
 *  - Terminal blocks are clearly separated from body
 *  - Bluetooth + LED status on body
 *  - Vent slots on bottom half of body
 *
 * Ports: in_positive, in_negative (left), out_positive, out_negative (right)
 */
export function drawOrionDCDC(
  cx: number, cy: number, w: number, h: number,
  model: string = '12/12-30'
): ComponentResult {
  const x = cx - w / 2;
  const y = cy - h / 2;
  const f = (n: number) => Math.round(n * (w < 70 ? 0.7 : 1));

  // Victron pipe notation for model display
  const displayModel = model.replace(/\//g, ' | ');

  // Terminal block at bottom — all 4 screw terminals in a row
  const termBlockH = Math.round(h * 0.18);
  const termBlockY = y + h - termBlockH;
  const termR = Math.max(3, Math.round(w * 0.04));
  // Terminal X positions: IN+, IN−, OUT−, OUT+ (left to right, matching real product)
  const tSpacing = w / 5;
  const t1x = x + tSpacing * 1; // IN+
  const t2x = x + tSpacing * 2; // IN−
  const t3x = x + tSpacing * 3; // OUT−
  const t4x = x + tSpacing * 4; // OUT+
  const termCy = termBlockY + termBlockH / 2;

  // Orange accent bar
  const barY = y + h * 0.58;
  const barH = Math.max(4, Math.round(h * 0.06));

  // Mounting holes
  const mhR = Math.max(1.5, Math.round(w * 0.02));

  const svg = `<g id="orion-${cx}-${cy}">
  <!-- Drop shadow -->
  <rect x="${x + 2}" y="${y + 2}" width="${w}" height="${h}" rx="4" fill="#000" opacity="0.15"/>

  <!-- Main body — Victron blue (lighter than MultiPlus, matches real Orion-Tr) -->
  ${rr(x, y, w, h, 4, '#2E86C1', '#1A6FA0', 1.2)}

  <!-- Mounting holes top corners -->
  <circle cx="${x + 8}" cy="${y + 8}" r="${mhR}" fill="#D5D5D5" stroke="#AAA" stroke-width="0.5"/>
  <circle cx="${x + w - 8}" cy="${y + 8}" r="${mhR}" fill="#D5D5D5" stroke="#AAA" stroke-width="0.5"/>

  <!-- Bluetooth icon area -->
  <circle cx="${x + 12}" cy="${y + h * 0.15}" r="${Math.max(3, f(4))}" fill="#1A5A8A" opacity="0.7"/>
  ${txt(x + 12, y + h * 0.15, 'BT', f(3.5), '#7FB8E0', 'bold')}

  <!-- Brand: "victron energy" -->
  ${txt(cx, y + h * 0.12, 'victron energy', f(6), '#FFF', 'bold')}

  <!-- Product name large -->
  ${txt(cx, y + h * 0.24, 'Orion-Tr Smart', f(7), '#FFF', 'bold')}

  <!-- Model number -->
  ${txt(cx, y + h * 0.34, esc(displayModel), f(6.5), '#E8F4FD', 'bold')}

  <!-- "isolated DC-DC charger" -->
  ${txt(cx, y + h * 0.43, 'isolated DC-DC charger', f(4.5), '#B0D4F1')}

  <!-- Orange accent bar (the distinctive Orion stripe) -->
  ${rr(x + w * 0.08, barY, w * 0.84, barH, 2, '#E8750A')}

  <!-- On/off label + LED -->
  ${txt(x + w * 0.78, y + h * 0.70, 'on/off', f(3.5), '#B0D4F1')}
  <circle cx="${x + w * 0.78}" cy="${y + h * 0.75}" r="${Math.max(2, f(2.5))}" fill="#27AE60" opacity="0.9"/>

  <!-- ═══ TERMINAL BLOCK (bottom) ═══ -->
  ${rr(x + 3, termBlockY, w - 6, termBlockH, 2, '#2A2A2A', '#1A1A1A', 0.9)}

  <!-- INPUT / OUTPUT labels -->
  ${txt((t1x + t2x) / 2, termBlockY - 4, 'INPUT', f(4), '#B0D4F1', 'bold')}
  ${txt((t3x + t4x) / 2, termBlockY - 4, 'OUTPUT', f(4), '#B0D4F1', 'bold')}

  <!-- Divider line between INPUT and OUTPUT -->
  <line x1="${(t2x + t3x) / 2}" y1="${termBlockY + 2}" x2="${(t2x + t3x) / 2}" y2="${termBlockY + termBlockH - 2}" stroke="#444" stroke-width="0.6"/>

  <!-- IN+ screw terminal (red) -->
  <circle cx="${t1x}" cy="${termCy}" r="${termR}" fill="#C0392B" stroke="#8B0000" stroke-width="0.6"/>
  <circle cx="${t1x}" cy="${termCy}" r="${termR * 0.5}" fill="#E05555"/>

  <!-- IN− screw terminal (dark) -->
  <circle cx="${t2x}" cy="${termCy}" r="${termR}" fill="#333" stroke="#222" stroke-width="0.6"/>
  <circle cx="${t2x}" cy="${termCy}" r="${termR * 0.5}" fill="#555"/>

  <!-- OUT− screw terminal (dark) -->
  <circle cx="${t3x}" cy="${termCy}" r="${termR}" fill="#333" stroke="#222" stroke-width="0.6"/>
  <circle cx="${t3x}" cy="${termCy}" r="${termR * 0.5}" fill="#555"/>

  <!-- OUT+ screw terminal (red) -->
  <circle cx="${t4x}" cy="${termCy}" r="${termR}" fill="#C0392B" stroke="#8B0000" stroke-width="0.6"/>
  <circle cx="${t4x}" cy="${termCy}" r="${termR * 0.5}" fill="#E05555"/>
</g>`;

  // Port positions — all at the bottom of the terminal block, exiting DOWN
  const portY = termBlockY + termBlockH;
  return {
    svg,
    ports: {
      in_positive: { x: t1x, y: portY },
      in_negative: { x: t2x, y: portY },
      out_positive: { x: t4x, y: portY },
      out_negative: { x: t3x, y: portY },
    },
  };
}

// ---------------------------------------------------------------------------
// 9. Victron BatteryProtect
// ---------------------------------------------------------------------------

/**
 * Victron SmartBatteryProtect 12/24V-100A
 *
 * Real-life appearance:
 *  - Compact vertical Victron blue body
 *  - Orange header: "victron energy" + "SmartBatteryProtect"
 *  - Model band: "100A  12/24V"
 *  - IN+ and OUT+ terminals at top (positive only — protection device)
 *  - LED and load disconnect label
 */
export function drawBatteryProtect(
  cx: number, cy: number, w: number, h: number,
  amps: number = 100
): ComponentResult {
  const x = cx - w / 2;
  const y = cy - h / 2;
  const f = (n: number) => n;

  const termW = 9; const termH = 7;
  const inX  = cx - w * 0.22;
  const outX = cx + w * 0.22;

  const svg = `<g id="bp-${cx}-${cy}">
  ${rr(x, y, w, h, 3, '#1C3F6E', '#0D2647', 1.2)}
  ${rr(x, y, w, 18, 3, '#E8750A')}
  ${txt(cx, y + 7, 'victron energy', f(6), '#FFF', 'bold')}
  ${txt(cx, y + 14, 'BatteryProtect', f(4.5), '#FFE0B2')}
  ${rr(x + 4, y + 21, w - 8, 11, 2, '#142D50')}
  ${txt(cx, y + 26.5, `${amps}A  12/24V`, f(5.5), '#7FB8E0', 'bold')}
  ${rr(x + 6, y + 35, w - 12, h * 0.38, 2, '#0D1E3A', undefined, undefined, 0.8)}
  ${txt(cx, y + 35 + h * 0.19, 'LOAD DISCONNECT', f(5), '#5A9AC8')}
  <circle cx="${x + w - 8}" cy="${y + 11}" r="2.5" fill="#27AE60" opacity="0.9"/>

  <!-- IN+ terminal (top left) -->
  ${rr(inX - termW / 2, y - termH, termW, termH, 1.5, '#C0392B', '#8B0000', 0.9)}
  ${hexNut(inX, y - termH / 2, 3)}
  ${txt(inX, y - termH - 5, 'IN+', f(4.5), '#C0392B', 'bold')}

  <!-- OUT+ terminal (top right) -->
  ${rr(outX - termW / 2, y - termH, termW, termH, 1.5, '#C0392B', '#8B0000', 0.9)}
  ${hexNut(outX, y - termH / 2, 3)}
  ${txt(outX, y - termH - 5, 'OUT+', f(4.5), '#C0392B', 'bold')}
</g>`;

  return {
    svg,
    ports: {
      in_positive:  { x: inX,  y: y - termH },
      out_positive: { x: outX, y: y - termH },
    },
  };
}

// ---------------------------------------------------------------------------
// 10. Isolator Switch
// ---------------------------------------------------------------------------

export function drawIsolatorSwitch(
  cx: number, cy: number, w: number, h: number
): ComponentResult {
  const x = cx - w / 2;
  const y = cy - h / 2;

  const svg = `<g id="isolator-${cx}-${cy}">
  ${rr(x, y, w, h, 3, '#2C2C2C', '#111', 1.5)}
  ${rr(x, y, w, 12, 2, '#3A3A3A')}
  ${txt(cx, y + 6, 'ISOLATOR', 6, '#CCCCCC', 'bold')}
  <!-- Rotary knob — orange = Victron accent -->
  <circle cx="${cx}" cy="${cy + 4}" r="${w * 0.32}" fill="#E8750A" stroke="#A05C00" stroke-width="1.5"/>
  <circle cx="${cx}" cy="${cy + 4}" r="${w * 0.32 * 0.55}" fill="#222"/>
  <!-- Switch indicator line -->
  <line x1="${cx}" y1="${cy + 4 - w * 0.32 * 0.55}" x2="${cx}" y2="${cy + 4 - w * 0.32 * 0.82}" stroke="#DDD" stroke-width="2" stroke-linecap="round"/>
  ${txt(cx, y + h - 7, 'ON / OFF', 5, '#888')}
</g>`;

  return {
    svg,
    ports: {
      in_positive:  { x: cx, y: y },
      out_positive: { x: cx, y: y + h },
    },
  };
}

// ---------------------------------------------------------------------------
// 11. MIDI / ANL Fuse Holder
// ---------------------------------------------------------------------------

/**
 * MIDI fuse holder with visible fuse element.
 *
 * Real-life appearance:
 *  - Black plastic housing, top and bottom M8 bolt connections
 *  - Transparent window showing yellow/red fuse element
 *  - Rating stamped on fuse body
 */
export function drawMIDIFuse(
  cx: number, cy: number, w: number, h: number,
  amps: number = 300
): ComponentResult {
  const x = cx - w / 2;
  const y = cy - h / 2;

  const svg = `<g id="fuse-${cx}-${cy}">
  <!-- Fuse holder outer body -->
  ${rr(x, y, w, h, 4, '#1A1A1A', '#333', 1.2)}
  ${rr(x + 2, y + 2, w - 4, h - 4, 3, '#282828')}
  <!-- Fuse window (transparent yellow — shows element inside) -->
  ${rr(cx - w * 0.32, cy - h * 0.18, w * 0.64, h * 0.36, 2, '#CC9900', '#9A7000', 0.8)}
  <!-- Fuse element visible inside window -->
  <line x1="${cx - w * 0.22}" y1="${cy}" x2="${cx + w * 0.22}" y2="${cy}" stroke="#FFD060" stroke-width="1.5"/>
  <!-- Rating label on fuse body -->
  ${txt(cx, cy, `${amps}A`, 7, '#FFFFFF', 'bold')}
  ${txt(cx, y + h - 7, 'MIDI', 5, '#888')}
  <!-- M8 bolt top and bottom (connection points) -->
  ${hexNut(cx, y + 5, 5, '#888', '#555')}
  ${hexNut(cx, y + h - 5, 5, '#888', '#555')}
</g>`;

  return {
    svg,
    ports: {
      in_positive:  { x: cx, y: y },
      out_positive: { x: cx, y: y + h },
    },
  };
}

// ---------------------------------------------------------------------------
// 12. Blade/ANL Fuse Block
// ---------------------------------------------------------------------------

export function drawFuseBlock(
  cx: number, cy: number, w: number, h: number
): ComponentResult {
  const x = cx - w / 2;
  const y = cy - h / 2;

  const nFuses = 6;
  const fW = (w - 12) / nFuses - 2;
  const fuses = [...Array(nFuses)].map((_, i) => {
    const fx = x + 6 + i * (fW + 2);
    const fCx = fx + fW / 2;
    return `${rr(fx, cy - 9, fW, 18, 1.5, '#C0392B', '#8B0000', 0.7)}
    <!-- Fuse element visible area -->
    ${rr(fx + 1, cy - 4, fW - 2, 8, 1, '#E04030', undefined, undefined, 0.5)}
    ${txt(fCx, cy, '10A', 4, '#FFF', 'bold')}`;
  }).join('');

  const svg = `<g id="fuseblock-${cx}-${cy}">
  ${rr(x, y, w, h, 3, '#1A1A1A', '#111', 1.2)}
  ${rr(x, y, w, 11, 2, '#2A2A2A')}
  ${txt(cx, y + 5.5, 'FUSE BLOCK', 5.5, '#CCCCCC', 'bold')}
  ${fuses}
  ${txt(cx, y + h - 5, '6-way  12V', 4.5, '#666')}
  <!-- Input positive stud top-centre -->
  ${hexNut(cx, y, 4.5, '#C8A840', '#8B6914')}
  <!-- Negative rail bottom -->
  ${rr(x + 4, y + h - 3, w - 8, 2, 0, '#333')}
</g>`;

  return {
    svg,
    ports: {
      pos_in: { x: cx,     y: y },
      neg_in: { x: cx,     y: y + h },
      out_1:  { x: x + 6,  y: y + h },
      out_2:  { x: x + 17, y: y + h },
    },
  };
}

// ---------------------------------------------------------------------------
// 13. Earth Bar (chassis grounding)
// ---------------------------------------------------------------------------

export function drawEarthBar(
  cx: number, cy: number, w: number, h: number
): ComponentResult {
  const x = cx - w / 2;
  const y = cy - h / 2;
  const nBolts = 5;
  const spacing = (w - 10) / (nBolts - 1);

  const bolts = [...Array(nBolts)].map((_, i) =>
    hexNut(x + 5 + i * spacing, cy, 4.5, '#888', '#555')
  ).join('');

  const svg = `<g id="earthbar-${cx}-${cy}">
  <!-- Bar body — bare copper/aluminium -->
  ${rr(x, y, w, h, 2, '#555', '#333', 1.2)}
  ${rr(x + 2, y + 2, w - 4, h - 4, 1, '#484848')}
  ${bolts}
  ${txt(cx, y + h + 7, 'EARTH BAR', 5, '#27AE60', 'bold')}
  ${drawEarthSymbol(cx, y - 15, 0.85)}
</g>`;

  return {
    svg,
    ports: {
      chassis: { x: cx, y: y + h },
      in_1:    { x: x + 5,                   y: y },
      in_2:    { x: x + 5 + spacing,          y: y },
      in_3:    { x: x + 5 + 2 * spacing,      y: y },
      in_4:    { x: x + 5 + 3 * spacing,      y: y },
      in_5:    { x: x + 5 + 4 * spacing,      y: y },
    },
  };
}

// ---------------------------------------------------------------------------
// 14. Shore Power Inlet (CEE 16A / IEC 309)
// ---------------------------------------------------------------------------

/**
 * Shore power inlet plug socket — CEE 16A blue 230V connector.
 * Circular face, 3-phase contact pattern with earth.
 */
export function drawShoreInlet(
  cx: number, cy: number, w: number, h: number
): ComponentResult {
  const r = Math.min(w, h) * 0.44;

  const svg = `<g id="shore-${cx}-${cy}">
  <!-- Outer flange ring (blue — CEE connector colour) -->
  <circle cx="${cx}" cy="${cy}" r="${r}" fill="#2060C0" stroke="#1040A0" stroke-width="2"/>
  <!-- Inner socket face -->
  <circle cx="${cx}" cy="${cy}" r="${r * 0.80}" fill="#1A4A9E" stroke="#1040A0" stroke-width="0.8"/>
  <!-- Centre socket recess -->
  <circle cx="${cx}" cy="${cy}" r="${r * 0.46}" fill="#111" stroke="#333" stroke-width="1"/>
  <!-- 3 phase + earth contact pattern (IEC 309 CEE 16A) -->
  <!-- Phase 1 — top -->
  <circle cx="${cx}" cy="${cy - r * 0.26}" r="${r * 0.09}" fill="#EEE"/>
  <!-- Phase 2 — bottom-left -->
  <circle cx="${cx - r * 0.22}" cy="${cy + r * 0.14}" r="${r * 0.09}" fill="#EEE"/>
  <!-- Neutral — bottom-right -->
  <circle cx="${cx + r * 0.22}" cy="${cy + r * 0.14}" r="${r * 0.09}" fill="#EEE"/>
  <!-- Earth (PE) — bottom centre, green -->
  <circle cx="${cx}" cy="${cy + r * 0.26}" r="${r * 0.08}" fill="#27AE60"/>
  <!-- "16A" label on socket face -->
  ${txt(cx, cy - r * 0.02, '16A', r * 0.22, '#DDD', 'bold')}
  <!-- Victron / shore label below -->
  ${txt(cx, cy + r + 8, 'Shore Power', 6, '#5A9AC8')}
  ${txt(cx, cy + r + 15, '230V  CEE', 5, '#888')}
  <!-- Mounting screws -->
  ${screw(cx - r * 0.72, cy - r * 0.72, 2)}
  ${screw(cx + r * 0.72, cy - r * 0.72, 2)}
  ${screw(cx - r * 0.72, cy + r * 0.72, 2)}
  ${screw(cx + r * 0.72, cy + r * 0.72, 2)}
</g>`;

  return {
    svg,
    ports: {
      ac_line:    { x: cx - r * 0.18, y: cy - r },
      ac_neutral: { x: cx + r * 0.18, y: cy - r },
      earth:      { x: cx,            y: cy - r },
    },
  };
}

// ---------------------------------------------------------------------------
// 15. AC Consumer Unit (mains CU / fuse board)
// ---------------------------------------------------------------------------

export function drawConsumerUnit(
  cx: number, cy: number, w: number, h: number,
  label: string = 'Consumer Unit'
): ComponentResult {
  const x = cx - w / 2;
  const y = cy - h / 2;
  const f = (n: number) => n;

  const nBreakers = 4;
  const bkW = (w - 10) / nBreakers - 2;
  const breakers = [...Array(nBreakers)].map((_, i) => {
    const bx = x + 5 + i * (bkW + 2);
    const bLabel = i === 0 ? 'RCD' : `C${(i) * 6}`;
    return `${rr(bx, cy - 15, bkW, 30, 2, '#2C2C2C', '#111', 0.8)}
    ${rr(bx + 2, cy - 11, bkW - 4, 9, 1, '#444')}
    <rect x="${bx + (bkW - 5) / 2}" y="${cy - 7}" width="5" height="9" rx="1.5" fill="#EEEEEE"/>
    ${txt(bx + bkW / 2, cy + 10, bLabel, f(4.5), '#AAAAAA')}`;
  }).join('');

  const svg = `<g id="cu-${cx}-${cy}">
  ${rr(x, y, w, h, 3, '#EFEFEF', '#CCC', 1.2)}
  ${rr(x, y, w, 12, 2, '#E0E0E0')}
  ${txt(cx, y + 6, esc(label), f(6), '#333', 'bold')}
  <!-- DIN rail -->
  ${rr(x + 4, cy - 17, w - 8, 2, 0, '#BBBBBB')}
  ${breakers}
  ${txt(cx, y + h - 6, '230V AC', f(5), '#888')}
</g>`;

  return {
    svg,
    ports: {
      ac_in:    { x: cx, y: y },
      ac_out_1: { x: x + 5 + bkW / 2,               y: y + h },
      ac_out_2: { x: x + 5 + (bkW + 2) + bkW / 2,   y: y + h },
    },
  };
}

// ---------------------------------------------------------------------------
// 16. Solar Panel
// ---------------------------------------------------------------------------

/**
 * Solar panel — monocrystalline cell grid with watt rating.
 * Portrait orientation by default.
 */
export function drawSolarPanel(
  cx: number, cy: number, w: number, h: number,
  watts: number = 200
): ComponentResult {
  const x = cx - w / 2;
  const y = cy - h / 2;

  const cols = 3; const rows = 4;
  const cW = (w - 8) / cols - 2;
  const cH = (h - 22) / rows - 2;

  const cells = [...Array(rows)].flatMap((_, r) =>
    [...Array(cols)].map((_, c) =>
      `<rect x="${x + 4 + c * (cW + 2)}" y="${y + 12 + r * (cH + 2)}" width="${cW}" height="${cH}" rx="0.5" fill="#1B3A6B" stroke="#2968A8" stroke-width="0.4"/>
      <line x1="${x + 4 + c * (cW + 2) + cW / 2}" y1="${y + 12 + r * (cH + 2)}" x2="${x + 4 + c * (cW + 2) + cW / 2}" y2="${y + 12 + r * (cH + 2) + cH}" stroke="#2968A8" stroke-width="0.3" opacity="0.4"/>`
    )
  ).join('');

  // Output junction box (bottom centre) — very visible on real panels
  const jboxW = w * 0.32;
  const jboxH = 8;
  const jboxX = cx - jboxW / 2;
  const jboxY = y + h - jboxH - 1;

  const svg = `<g id="solar-${cx}-${cy}">
  <!-- Aluminium frame -->
  ${rr(x, y, w, h, 2, '#3A3A3A', '#1A1A1A', 1.5)}
  <!-- Cell backsheet -->
  ${rr(x + 2, y + 2, w - 4, h - 4, 1, '#1A2840')}
  ${cells}
  <!-- Watt rating label on frame -->
  ${txt(cx, y + 6, `${watts}W`, 7, '#3D8BD4', 'bold')}
  <!-- Junction box -->
  ${rr(jboxX, jboxY, jboxW, jboxH, 1, '#2A2A2A', '#444', 0.8)}
  ${txt(cx, jboxY + jboxH / 2, 'J-BOX', 3.5, '#888')}
  <!-- PV+ / PV− cable exits from junction box -->
  ${txt(cx + w * 0.18, y + h - 2, 'PV+', 4, '#C0392B', 'bold')}
  ${txt(cx - w * 0.18, y + h - 2, 'PV\u2212', 4, '#888', 'bold')}
</g>`;

  return {
    svg,
    ports: {
      pv_positive: { x: cx + w * 0.18, y: y + h },
      pv_negative: { x: cx - w * 0.18, y: y + h },
    },
  };
}

// ---------------------------------------------------------------------------
// 17. PV Isolator / DC Disconnect
// ---------------------------------------------------------------------------

/**
 * DC Isolator / PV isolator switch.
 * Red housing (safety device — must be visually distinctive).
 * "PV ISOLATOR" label, ON/OFF position indicators.
 */
export function drawPVDisconnect(
  cx: number, cy: number, w: number, h: number
): ComponentResult {
  const x = cx - w / 2;
  const y = cy - h / 2;

  const svg = `<g id="pvdisconnect-${cx}-${cy}">
  <!-- Red safety housing -->
  ${rr(x, y, w, h, 3, '#B02020', '#7A0000', 1.5)}
  ${rr(x + 2, y + 2, w - 4, h - 4, 2, '#CC2020')}
  <!-- Safety warning stripe at top -->
  ${rr(x, y, w, 6, 2, '#F39C12')}
  ${txt(cx, y + 3, '\u26a0', 5, '#1A1A1A')}
  <!-- Labels -->
  ${txt(cx, cy - 5, 'PV', 9, '#FFFFFF', 'bold')}
  ${txt(cx, cy + 6, 'ISOLATOR', 5.5, '#FFB0B0')}
  <!-- ON / OFF indicators -->
  <circle cx="${x + 8}" cy="${y + h - 8}" r="3" fill="#27AE60"/>
  ${txt(x + 8, y + h - 8, 'I', 4, '#FFF', 'bold')}
  <circle cx="${x + w - 8}" cy="${y + h - 8}" r="3" fill="#C0392B" stroke="#800" stroke-width="0.5"/>
  ${txt(x + w - 8, y + h - 8, 'O', 4, '#FFF', 'bold')}
</g>`;

  return {
    svg,
    ports: {
      pv_in_positive:  { x: cx, y: y },
      pv_out_positive: { x: cx, y: y + h },
    },
  };
}

// ---------------------------------------------------------------------------
// Dispatch function — single integration point for schematicSVG.ts
// ---------------------------------------------------------------------------

export function drawComponent(spec: ComponentSpec): ComponentResult {
  const { type, cx, cy, w, h } = spec;
  switch (type) {
    case 'battery':         return drawBattery(cx, cy, w, h, (spec.capacityAh as number) ?? 100);
    case 'starter_battery': return drawStarterBattery(cx, cy, w, h);
    case 'smartshunt':      return drawSmartShunt(cx, cy, w, h);
    case 'lynx':            return drawLynxDistributor(cx, cy, w, h);
    case 'busbar':          return drawDualBusbar(cx, cy, w, h);
    case 'multiplus':       return drawMultiPlus(cx, cy, w, h);
    case 'mppt':            return drawMPPT(cx, cy, w, h, (spec.model as string) ?? '100/30');
    case 'orion':           return drawOrionDCDC(cx, cy, w, h, (spec.model as string) ?? '12/12-30');
    case 'battery_protect': return drawBatteryProtect(cx, cy, w, h, (spec.amps as number) ?? 100);
    case 'isolator':        return drawIsolatorSwitch(cx, cy, w, h);
    case 'midi_fuse':       return drawMIDIFuse(cx, cy, w, h, (spec.amps as number) ?? 300);
    case 'fuse_block':      return drawFuseBlock(cx, cy, w, h);
    case 'earth_bar':       return drawEarthBar(cx, cy, w, h);
    case 'shore_inlet':     return drawShoreInlet(cx, cy, w, h);
    case 'consumer_unit':   return drawConsumerUnit(cx, cy, w, h, (spec.label as string) ?? 'Consumer Unit');
    case 'solar_panel':     return drawSolarPanel(cx, cy, w, h, (spec.watts as number) ?? 200);
    case 'pv_disconnect':   return drawPVDisconnect(cx, cy, w, h);
    default:
      // Fallback — blue labelled box
      return {
        svg: `<g><rect x="${cx - w/2}" y="${cy - h/2}" width="${w}" height="${h}" rx="2" fill="#1C3F6E" stroke="#E8750A" stroke-width="1.5"/>
<text x="${cx}" y="${cy}" text-anchor="middle" dominant-baseline="central" font-family="Arial,sans-serif" font-size="6" fill="#7FB8E0">${esc(type)}</text></g>`,
        ports: { centre: { x: cx, y: cy } },
      };
  }
}
