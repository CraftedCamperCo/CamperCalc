/**
 * schematicRules.ts
 * =================
 * CamperPlan Wiring Schematic — Component Rules & Wire Routing Constraints
 *
 * This file defines THREE rule systems that the schematic engine must enforce:
 *
 *   1. COMPONENT RULES    — per-type port directions, wire colours, gauges,
 *                           default sizes, and bounding-box padding
 *   2. WIRE ROUTING RULES — orthogonal-only routing, stub exits, channel
 *                           spacing, bend behaviour, label placement
 *   3. PRODUCT CATALOGUE  — maps every SKU / product from the CamperPlan
 *                           store to its schematic component type so the
 *                           engine knows what to draw for any user config
 *
 * Integration:
 *   import { COMPONENT_RULES, ROUTING, PRODUCT_MAP } from './schematicRules';
 *   import { drawComponent } from './schematicComponents';
 *
 * The engine should:
 *   1. Look up the component type via PRODUCT_MAP
 *   2. Call drawComponent() to get the SVG + port coordinates
 *   3. Read COMPONENT_RULES[type] to get exit directions & keep-out box
 *   4. Route wires using ROUTING constraints, respecting all keep-out zones
 *
 * Canvas: 1190 x 842 px (A4 landscape). Schematic area: x 52–922, y 52–734.
 */

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 1 — TYPE DEFINITIONS
// ═══════════════════════════════════════════════════════════════════════════

/** Cardinal direction a wire must exit from a port */
export type ExitDirection = 'up' | 'down' | 'left' | 'right';

/** Wire colour on the schematic */
export type WireColour =
  | 'dc_positive'    // #C0392B red
  | 'dc_negative'    // #1A1A1A black (with #555 centre stripe for visibility)
  | 'ac_live'        // #2980B9 blue
  | 'ac_neutral'     // #888888 grey
  | 'earth'          // #4CAF50 lime green
  | 'signal';        // #888888 grey dashed

/** Hex values for rendering */
export const WIRE_COLOURS: Record<WireColour, string> = {
  dc_positive:  '#C0392B',
  dc_negative:  '#1A1A1A',
  ac_live:      '#2980B9',
  ac_neutral:   '#888888',
  earth:        '#4CAF50',
  signal:       '#888888',
};

/** Wire gauge in mm² — determines rendered thickness */
export type WireGauge =
  | '1.5'   // signal / light loads
  | '2.5'   // 12V circuits up to 15A
  | '4'     // 12V circuits up to 25A
  | '6'     // solar runs, DC-DC input
  | '10'    // MPPT to battery, mid loads
  | '16'    // main DC runs up to 80A
  | '25'    // inverter feeds
  | '35'    // inverter / large battery
  | '50'    // heavy battery interconnects
  | '70';   // very large battery banks

/**
 * Rendered stroke width per gauge (px).
 *
 * Deliberately scaled so the visual difference between a signal wire and a
 * 70mm² battery cable is immediately obvious — customers must be able to
 * read the schematic and understand which runs carry high current.
 *
 * Visual reference (on A4 canvas at 1190×842px):
 *   1.5mm²  → hairline (BMS sense, VE.Direct)
 *   16mm²   → clearly visible run
 *   70mm²   → bold cable that dominates the schematic
 */
export const GAUGE_STROKE: Record<WireGauge, number> = {
  '1.5': 1.5,
  '2.5': 2.0,
  '4':   2.8,
  '6':   3.5,
  '10':  4.5,
  '16':  6.0,
  '25':  8.0,
  '35':  7.0,
  '50':  9.0,
  '70':  11.0,
};

/** Rules for a single port on a component */
export interface PortRule {
  /** Direction the wire MUST exit before it can turn */
  exit: ExitDirection;
  /** Minimum straight-line distance (px) from port before first bend */
  stubLength: number;
  /** Wire colour for this connection */
  colour: WireColour;
  /** Default cable gauge (can be overridden by wiringRules for specific runs) */
  defaultGauge: WireGauge;
}

/** Full rule set for one component type */
export interface ComponentRule {
  /** Human-readable name for labels / legend */
  displayName: string;
  /** Default width on canvas (px) — engine can scale */
  defaultW: number;
  /** Default height on canvas (px) */
  defaultH: number;
  /**
   * Keep-out padding around the bounding box (px).
   * No wire segment, label, or other component may enter this zone
   * except at a declared port.
   */
  keepOutPadding: number;
  /** Port rules keyed by port name (must match schematicComponents.ts port names) */
  ports: Record<string, PortRule>;
}

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 2 — COMPONENT RULES
// ═══════════════════════════════════════════════════════════════════════════

export const COMPONENT_RULES: Record<string, ComponentRule> = {

  // ─────────────────────────────────────────────────────────────
  // BATTERIES
  // ─────────────────────────────────────────────────────────────

  battery: {
    displayName: 'Leisure Battery',
    defaultW: 110,
    defaultH: 95,
    keepOutPadding: 20,
    ports: {
      positive_terminal: {
        exit: 'up',
        stubLength: 14,
        colour: 'dc_positive',
        defaultGauge: '35',
      },
      negative_terminal: {
        exit: 'up',
        stubLength: 14,
        colour: 'dc_negative',
        defaultGauge: '35',
      },
    },
  },

  starter_battery: {
    displayName: 'Starter Battery',
    defaultW: 90,
    defaultH: 70,
    keepOutPadding: 16,
    ports: {
      positive_terminal: {
        exit: 'up',
        stubLength: 12,
        colour: 'dc_positive',
        defaultGauge: '16',
      },
      negative_terminal: {
        exit: 'up',
        stubLength: 12,
        colour: 'dc_negative',
        defaultGauge: '16',
      },
    },
  },

  // ─────────────────────────────────────────────────────────────
  // VICTRON DEVICES
  // ─────────────────────────────────────────────────────────────

  smartshunt: {
    displayName: 'SmartShunt',
    defaultW: 80,
    defaultH: 48,
    keepOutPadding: 16,
    ports: {
      batt_neg_in: {
        exit: 'left',
        stubLength: 16,
        colour: 'dc_negative',
        defaultGauge: '35',
      },
      system_neg_out: {
        exit: 'right',
        stubLength: 16,
        colour: 'dc_negative',
        defaultGauge: '35',
      },
      aux_sense: {
        exit: 'up',
        stubLength: 10,
        colour: 'signal',
        defaultGauge: '1.5',
      },
    },
  },

  multiplus: {
    displayName: 'MultiPlus Inverter-Charger',
    defaultW: 130,
    defaultH: 122,
    keepOutPadding: 24,
    ports: {
      // All MultiPlus ports exit DOWNWARD (terminal block is on the bottom)
      earth_terminal: {
        exit: 'down',
        stubLength: 16,
        colour: 'earth',
        defaultGauge: '6',
      },
      ac_out: {
        exit: 'down',
        stubLength: 16,
        colour: 'ac_live',
        defaultGauge: '2.5',
      },
      ac_in: {
        exit: 'down',
        stubLength: 16,
        colour: 'ac_live',
        defaultGauge: '2.5',
      },
      dc_negative: {
        exit: 'down',
        stubLength: 16,
        colour: 'dc_negative',
        defaultGauge: '35',
      },
      dc_positive: {
        exit: 'down',
        stubLength: 16,
        colour: 'dc_positive',
        defaultGauge: '35',
      },
    },
  },

  mppt: {
    displayName: 'MPPT Charge Controller',
    defaultW: 100,
    defaultH: 100,
    keepOutPadding: 18,
    ports: {
      // PV input terminals on top
      pv_positive: {
        exit: 'up',
        stubLength: 14,
        colour: 'dc_positive',
        defaultGauge: '6',
      },
      pv_negative: {
        exit: 'up',
        stubLength: 14,
        colour: 'dc_negative',
        defaultGauge: '6',
      },
      // Battery output terminals on bottom
      bat_positive: {
        exit: 'down',
        stubLength: 14,
        colour: 'dc_positive',
        defaultGauge: '10',
      },
      bat_negative: {
        exit: 'down',
        stubLength: 14,
        colour: 'dc_negative',
        defaultGauge: '10',
      },
    },
  },

  orion: {
    displayName: 'DC-DC Charger',
    defaultW: 80,
    defaultH: 120,
    keepOutPadding: 18,
    ports: {
      // Input from starter battery on left
      in_positive: {
        exit: 'down',
        stubLength: 10,
        colour: 'dc_positive',
        defaultGauge: '6',
      },
      in_negative: {
        exit: 'down',
        stubLength: 10,
        colour: 'dc_negative',
        defaultGauge: '6',
      },
      // Output to leisure battery on right
      out_positive: {
        exit: 'down',
        stubLength: 10,
        colour: 'dc_positive',
        defaultGauge: '6',
      },
      out_negative: {
        exit: 'down',
        stubLength: 10,
        colour: 'dc_negative',
        defaultGauge: '6',
      },
    },
  },

  battery_protect: {
    displayName: 'Battery Protect',
    defaultW: 85,
    defaultH: 72,
    keepOutPadding: 16,
    ports: {
      in_positive: {
        exit: 'up',
        stubLength: 12,
        colour: 'dc_positive',
        defaultGauge: '10',
      },
      out_positive: {
        exit: 'up',
        stubLength: 12,
        colour: 'dc_positive',
        defaultGauge: '10',
      },
    },
  },

  // ─────────────────────────────────────────────────────────────
  // DC DISTRIBUTION
  // ─────────────────────────────────────────────────────────────

  lynx: {
    displayName: 'Lynx Distributor',
    defaultW: 280,
    defaultH: 180,
    keepOutPadding: 24,
    ports: {
      // Lynx has dynamic fuse-position ports (fuse_out_1..N)
      // Plus pos_in / neg_in on the busbar rails.
      // The engine generates port names dynamically.
      // Rules here cover the PATTERN — the engine applies them
      // to however many fuse slots are populated.
      // Port names MUST match drawLynxDistributor() return value
      busbar_in: {
        exit: 'left',
        stubLength: 16,
        colour: 'dc_positive',
        defaultGauge: '35',
      },
      busbar_neg: {
        exit: 'left',
        stubLength: 16,
        colour: 'dc_negative',
        defaultGauge: '35',
      },
      earth: {
        exit: 'down',
        stubLength: 10,
        colour: 'earth',
        defaultGauge: '6',
      },
      // Template for fuse outputs — engine clones for each fuse_out_N
      _fuse_out_template: {
        exit: 'up',
        stubLength: 14,
        colour: 'dc_positive',
        defaultGauge: '16',
      },
      _neg_out_template: {
        exit: 'down',
        stubLength: 12,
        colour: 'dc_negative',
        defaultGauge: '16',
      },
    },
  },

  busbar: {
    displayName: 'Dual Busbar',
    defaultW: 120,
    defaultH: 36,
    keepOutPadding: 16,
    ports: {
      // Dynamic ports: pos_in, neg_in, pos_out_0..N, neg_out_0..N
      pos_in: {
        exit: 'up',
        stubLength: 12,
        colour: 'dc_positive',
        defaultGauge: '35',
      },
      neg_in: {
        exit: 'down',
        stubLength: 12,
        colour: 'dc_negative',
        defaultGauge: '35',
      },
      // Template for busbar bolt outputs
      _pos_out_template: {
        exit: 'up',
        stubLength: 12,
        colour: 'dc_positive',
        defaultGauge: '16',
      },
      _neg_out_template: {
        exit: 'down',
        stubLength: 12,
        colour: 'dc_negative',
        defaultGauge: '16',
      },
    },
  },

  midi_fuse: {
    displayName: 'MIDI/MEGA Fuse',
    defaultW: 56,
    defaultH: 32,
    keepOutPadding: 12,
    ports: {
      in_positive: {
        exit: 'up',
        stubLength: 10,
        colour: 'dc_positive',
        defaultGauge: '35',
      },
      out_positive: {
        exit: 'down',
        stubLength: 10,
        colour: 'dc_positive',
        defaultGauge: '35',
      },
    },
  },

  isolator: {
    displayName: 'Isolator Switch',
    defaultW: 52,
    defaultH: 52,
    keepOutPadding: 14,
    ports: {
      in_positive: {
        exit: 'up',
        stubLength: 10,
        colour: 'dc_positive',
        defaultGauge: '35',
      },
      out_positive: {
        exit: 'down',
        stubLength: 10,
        colour: 'dc_positive',
        defaultGauge: '35',
      },
    },
  },

  fuse_block: {
    displayName: 'Blade Fuse Block',
    defaultW: 140,
    defaultH: 52,
    keepOutPadding: 18,
    ports: {
      pos_in: {
        exit: 'up',
        stubLength: 12,
        colour: 'dc_positive',
        defaultGauge: '10',
      },
      neg_in: {
        exit: 'down',
        stubLength: 12,
        colour: 'dc_negative',
        defaultGauge: '10',
      },
      // Dynamic: out_1..out_N (one per fused circuit)
      _out_template: {
        exit: 'down',
        stubLength: 12,
        colour: 'dc_positive',
        defaultGauge: '2.5',
      },
    },
  },

  earth_bar: {
    displayName: 'Earth Bar',
    defaultW: 100,
    defaultH: 16,
    keepOutPadding: 14,
    ports: {
      // Single chassis connection downward
      chassis: {
        exit: 'down',
        stubLength: 10,
        colour: 'earth',
        defaultGauge: '6',
      },
      // Dynamic bolt ports for incoming earth wires connect from above
      // Engine generates bolt_0..bolt_N, all exit UP
      _bolt_template: {
        exit: 'up',
        stubLength: 10,
        colour: 'earth',
        defaultGauge: '2.5',
      },
    },
  },

  // ─────────────────────────────────────────────────────────────
  // SOLAR & SHORE POWER
  // ─────────────────────────────────────────────────────────────

  solar_panel: {
    displayName: 'Solar Panel',
    defaultW: 70,
    defaultH: 88,
    keepOutPadding: 12,
    ports: {
      // Cables exit from the bottom of the panel (junction box)
      pv_positive: {
        exit: 'down',
        stubLength: 14,
        colour: 'dc_positive',
        defaultGauge: '6',
      },
      pv_negative: {
        exit: 'down',
        stubLength: 14,
        colour: 'dc_negative',
        defaultGauge: '6',
      },
    },
  },

  pv_disconnect: {
    displayName: 'PV Isolator',
    defaultW: 42,
    defaultH: 36,
    keepOutPadding: 12,
    ports: {
      pv_in_positive: {
        exit: 'up',
        stubLength: 10,
        colour: 'dc_positive',
        defaultGauge: '6',
      },
      pv_out_positive: {
        exit: 'down',
        stubLength: 10,
        colour: 'dc_positive',
        defaultGauge: '6',
      },
    },
  },

  shore_inlet: {
    displayName: 'Shore Power Inlet',
    defaultW: 80,
    defaultH: 80,
    keepOutPadding: 12,
    ports: {
      // Shore inlet cables exit upward toward the consumer unit
      ac_line: {
        exit: 'up',
        stubLength: 14,
        colour: 'ac_live',
        defaultGauge: '2.5',
      },
      ac_neutral: {
        exit: 'up',
        stubLength: 14,
        colour: 'ac_neutral',
        defaultGauge: '2.5',
      },
      earth: {
        exit: 'up',
        stubLength: 14,
        colour: 'earth',
        defaultGauge: '2.5',
      },
    },
  },

  consumer_unit: {
    displayName: 'Consumer Unit',
    defaultW: 130,
    defaultH: 62,
    keepOutPadding: 18,
    ports: {
      // Single AC input from top
      ac_in: {
        exit: 'up',
        stubLength: 14,
        colour: 'ac_live',
        defaultGauge: '2.5',
      },
      // Dynamic outputs: ac_out_1..N (one per MCB)
      _ac_out_template: {
        exit: 'down',
        stubLength: 14,
        colour: 'ac_live',
        defaultGauge: '2.5',
      },
    },
  },

  // ─────────────────────────────────────────────────────────────
  // CONSUMER APPLIANCES (downstream loads)
  // ─────────────────────────────────────────────────────────────

  consumer: {
    displayName: 'Consumer Appliance',
    defaultW: 60,
    defaultH: 40,
    keepOutPadding: 12,
    ports: {
      // DC consumers connect via positive (from fuse block) and negative
      positive_in: {
        exit: 'up',
        stubLength: 10,
        colour: 'dc_positive',
        defaultGauge: '2.5',
      },
      negative_in: {
        exit: 'up',
        stubLength: 10,
        colour: 'dc_negative',
        defaultGauge: '2.5',
      },
    },
  },

  consumer_ac: {
    displayName: 'AC Consumer Appliance',
    defaultW: 60,
    defaultH: 40,
    keepOutPadding: 12,
    ports: {
      ac_in: {
        exit: 'up',
        stubLength: 10,
        colour: 'ac_live',
        defaultGauge: '2.5',
      },
    },
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// SECTION 3 — WIRE ROUTING RULES
// ═══════════════════════════════════════════════════════════════════════════

export const ROUTING = {

  // ─── CORE CONSTRAINTS ─────────────────────────────────────────

  /** Wires may only travel horizontally or vertically. No diagonals. */
  orthogonalOnly: true,

  /** All bends must be exactly 90 degrees */
  rightAngleBendsOnly: true,

  /**
   * Global minimum stub length (px).
   * Every wire must travel at least this far in the port's exit direction
   * before its first bend. Per-port stubLength in COMPONENT_RULES overrides
   * this if it is larger.
   */
  minStubLength: 10,

  /**
   * When two or more parallel wires share the same routing channel,
   * offset each subsequent wire by this many px.
   * This prevents overlapping positive/negative runs.
   */
  parallelWireSpacing: 12,

  /**
   * When a positive and negative wire run together (e.g. battery to busbar),
   * maintain this fixed centre-to-centre spacing between the pair.
   */
  pairedWireSpacing: 16,

  // ─── KEEP-OUT ZONE ENFORCEMENT ────────────────────────────────

  /**
   * No wire segment may pass through any component's keep-out zone.
   * The keep-out zone = component bounding box expanded by keepOutPadding.
   * The ONLY exception is at a declared port on that component.
   *
   * Enforcement algorithm:
   *   1. For each proposed wire segment (a horizontal or vertical line),
   *      test intersection with every component's keep-out rectangle.
   *   2. If it intersects, reroute AROUND the keep-out zone by adding
   *      extra bends (staying orthogonal).
   *   3. The reroute should go around the nearest edge of the keep-out
   *      zone, adding parallelWireSpacing offset from the zone boundary.
   */
  enforceKeepOutZones: true,

  /**
   * Minimum clearance (px) a rerouted wire must maintain from a
   * keep-out zone boundary when going around a component.
   */
  keepOutClearance: 6,

  // ─── WIRE EXIT BEHAVIOUR ──────────────────────────────────────

  /**
   * Wire exit sequence:
   *   1. Wire starts at the port's exact (x, y) coordinate
   *   2. Wire travels in the port's exit direction for stubLength px
   *   3. Wire may now bend 90° toward its destination
   *   4. Wire continues orthogonally, adding bends as needed to avoid
   *      keep-out zones
   *   5. When approaching the destination port, the wire must arrive
   *      from the destination port's exit direction (reversed)
   *   6. Final straight segment into the destination port = destination
   *      port's stubLength
   *
   * This ensures wires always enter and leave appliances cleanly,
   * like real cable management.
   */

  // ─── WIRE-TO-WIRE OVERLAP PREVENTION ──────────────────────────

  /**
   * No two wire segments may occupy the same pixel space unless they
   * are part of the same logical connection.
   * When the router detects a proposed segment overlaps an existing wire,
   * it offsets the new segment by parallelWireSpacing in the perpendicular
   * direction.
   */
  preventWireOverlap: true,

  // ─── BEND LIMITS ──────────────────────────────────────────────

  /**
   * Maximum number of bends (direction changes) in a single wire run.
   * If the router would exceed this, it indicates a layout problem and
   * the engine should flag it for manual review.
   * Typical clean routes: 2 to 4 bends. More than 6 looks messy.
   */
  maxBendsPerWire: 6,

  // ─── LABEL PLACEMENT ──────────────────────────────────────────

  /**
   * Wire gauge labels are rendered ON the wire, not beside it.
   *
   * Technique (must be implemented in schematicSVG.ts):
   *   1. Find the longest segment in the wire run.
   *   2. Place label at the midpoint of that segment.
   *   3. Draw a "pill" background rect filled with the wire's own colour
   *      (rx = labelFontSize * 0.7, width = label text width + 8px padding,
   *      height = labelFontSize + 4px). This gives the label a coloured
   *      badge that sits visually on the wire.
   *   4. Render white bold text centred in the pill.
   *   5. For vertical segments rotate the entire pill+text group -90°
   *      around the midpoint so it reads bottom-to-top along the wire.
   *   6. Keep-out rule: if the midpoint falls inside a component keep-out
   *      zone, walk outward along the segment until clear.
   *
   * Result: the label looks "stamped" onto the cable — exactly as TinyBuild
   * and professional installation schematics render it.
   *
   * Label format: "{gauge}mm²" e.g. "35mm²", "70mm²", "1.5mm²"
   */
  labelOffset: 0,       // labels are ON the wire (no offset needed)
  labelFontSize: 5.5,   // px — white text on coloured pill
  labelColour: '#FFFFFF', // white text, pill fill = wire colour

  // ─── ROUTING PRIORITY ─────────────────────────────────────────

  /**
   * When multiple wires need routing, process them in this order:
   *   1. High-current DC positive (battery to distribution)
   *   2. High-current DC negative (battery to shunt to distribution)
   *   3. Inverter DC feeds
   *   4. Solar PV runs
   *   5. DC-DC charger runs
   *   6. AC mains (shore, consumer unit, MultiPlus AC)
   *   7. Earth / PE connections
   *   8. Low-current consumer circuits (fridge, lights, USB)
   *   9. Signal wires (SmartShunt sense, VE.Direct, etc.)
   *
   * Higher priority wires get first pick of routing channels.
   * Lower priority wires route around them.
   */
  routingPriority: [
    'battery_to_distribution',
    'battery_negative_bus',
    'inverter_dc',
    'solar_pv',
    'dcdc_charger',
    'ac_mains',
    'earth',
    'consumer_dc',
    'signal',
  ] as const,

  // ─── WIRE CHANNEL SYSTEM ──────────────────────────────────────

  /**
   * The schematic area is divided into implicit horizontal and vertical
   * "channels" for wire routing. These are not drawn but are used by the
   * router to keep wires neat and evenly spaced.
   *
   * Horizontal channels run left-right across the schematic.
   * Vertical channels run top-bottom.
   * When a wire needs to traverse empty space between components, it
   * should snap to the nearest available channel.
   *
   * Channel grid spacing (px):
   */
  channelGridSpacing: 8,

  /**
   * Minimum distance (px) between any wire and the edge of the
   * schematic drawing area (x: 52–922, y: 52–734).
   */
  edgeMargin: 10,

} as const;


// ═══════════════════════════════════════════════════════════════════════════
// SECTION 4 — PRODUCT CATALOGUE TO COMPONENT TYPE MAPPING
// ═══════════════════════════════════════════════════════════════════════════
//
// Every product from the CamperPlan store that appears on the schematic
// maps to a component type defined in COMPONENT_RULES above.
// Products that don't appear on the schematic (insulation, brackets,
// adhesive, tanks, cable ties) are excluded.
//
// The engine uses this to determine:
//   - What component type to draw
//   - What size to draw it at
//   - What extra parameters to pass (amps, watts, model string)
// ═══════════════════════════════════════════════════════════════════════════

export interface ProductSchematicMapping {
  /** Component type key (matches COMPONENT_RULES key) */
  componentType: string;
  /** Extra params passed to drawComponent() */
  params?: Record<string, string | number>;
  /** Override default gauge for specific connections */
  gaugeOverrides?: Record<string, WireGauge>;
}

export const PRODUCT_MAP: Record<string, ProductSchematicMapping> = {

  // ─── BATTERIES ────────────────────────────────────────────────

  // Budget — Fogstar Drift ECO
  'DRIFT-ECO-100':  { componentType: 'battery', params: { capacityAh: 100 } },
  'DRIFT-ECO-314':  { componentType: 'battery', params: { capacityAh: 314 } },
  'DRIFT-ECO-460':  { componentType: 'battery', params: { capacityAh: 460 }, gaugeOverrides: { positive_terminal: '50', negative_terminal: '50' } },
  'DRIFT-ECO-628':  { componentType: 'battery', params: { capacityAh: 628 }, gaugeOverrides: { positive_terminal: '50', negative_terminal: '50' } },

  // Premium — Fogstar Drift Standard
  'DRIFT-12-105':   { componentType: 'battery', params: { capacityAh: 105 } },
  'DRIFT-12-230':   { componentType: 'battery', params: { capacityAh: 230 } },
  'DRIFT-12-280':   { componentType: 'battery', params: { capacityAh: 280 } },
  'DRIFT-12-300':   { componentType: 'battery', params: { capacityAh: 300 } },
  'DRIFT-12-460':   { componentType: 'battery', params: { capacityAh: 460 }, gaugeOverrides: { positive_terminal: '50', negative_terminal: '50' } },
  'DRIFT-12-608':   { componentType: 'battery', params: { capacityAh: 608 }, gaugeOverrides: { positive_terminal: '70', negative_terminal: '70' } },

  // Premium — Fogstar Drift PRO Gen2
  'DRIFT-PRO-230':  { componentType: 'battery', params: { capacityAh: 230 } },
  'DRIFT-PRO-280':  { componentType: 'battery', params: { capacityAh: 280 } },
  'DRIFT-PRO-300':  { componentType: 'battery', params: { capacityAh: 300 } },
  'DRIFT-PRO-460':  { componentType: 'battery', params: { capacityAh: 460 }, gaugeOverrides: { positive_terminal: '50', negative_terminal: '50' } },

  // ─── SOLAR PANELS ─────────────────────────────────────────────

  'STP100':         { componentType: 'solar_panel', params: { watts: 100 } },
  'STPU200':        { componentType: 'solar_panel', params: { watts: 200 } },
  'STPT200':        { componentType: 'solar_panel', params: { watts: 200 } },
  'STPVFU200':      { componentType: 'solar_panel', params: { watts: 200 } },
  // Generic entries for request items
  'SOLAR-160W':     { componentType: 'solar_panel', params: { watts: 160 } },
  'SOLAR-250W':     { componentType: 'solar_panel', params: { watts: 250 } },
  'SOLAR-320W':     { componentType: 'solar_panel', params: { watts: 320 } },
  'SOLAR-400W':     { componentType: 'solar_panel', params: { watts: 400 }, gaugeOverrides: { pv_positive: '10', pv_negative: '10' } },

  // ─── MPPT CONTROLLERS ─────────────────────────────────────────

  // Budget — BlueSolar
  'SCC010015050R':  { componentType: 'mppt', params: { model: '75/15' } },
  'SCC010015200R':  { componentType: 'mppt', params: { model: '100/15' } },
  'SCC110020170R':  { componentType: 'mppt', params: { model: '100/20' } },
  'SCC020030200':   { componentType: 'mppt', params: { model: '100/30' } },
  'SCC020035000':   { componentType: 'mppt', params: { model: '150/35' } },

  // Premium — SmartSolar
  'SCC075015060R':  { componentType: 'mppt', params: { model: '75/15' } },
  'SCC110015060R':  { componentType: 'mppt', params: { model: '100/15' } },
  'SCC110020160R':  { componentType: 'mppt', params: { model: '100/20' } },
  'SCC110030210':   { componentType: 'mppt', params: { model: '100/30' } },
  'SCC115035210':   { componentType: 'mppt', params: { model: '150/35' } },
  'SCC110050210':   { componentType: 'mppt', params: { model: '100/50' }, gaugeOverrides: { bat_positive: '16', bat_negative: '16' } },

  // ─── INVERTER-CHARGERS ────────────────────────────────────────

  // Budget — MultiPlus
  'PMP121800000':   { componentType: 'multiplus', params: { model: '12/800' }, gaugeOverrides: { dc_positive: '16', dc_negative: '16' } },
  'PMP122120000':   { componentType: 'multiplus', params: { model: '12/1200' }, gaugeOverrides: { dc_positive: '25', dc_negative: '25' } },
  'PMP122160000':   { componentType: 'multiplus', params: { model: '12/1600' }, gaugeOverrides: { dc_positive: '25', dc_negative: '25' } },

  // Premium — MultiPlus-II
  'MULTIPLUS2-2000': { componentType: 'multiplus', params: { model: '12/2000' }, gaugeOverrides: { dc_positive: '35', dc_negative: '35' } },
  'MULTIPLUS2-3000': { componentType: 'multiplus', params: { model: '12/3000' }, gaugeOverrides: { dc_positive: '50', dc_negative: '50' } },

  // ─── DC-DC CHARGERS ───────────────────────────────────────────

  'ORION-18A':      { componentType: 'orion', params: { model: '12/12-18' } },
  'ORION-30A':      { componentType: 'orion', params: { model: '12/12-30' }, gaugeOverrides: { in_positive: '10', in_negative: '10', out_positive: '10', out_negative: '10' } },
  'ORION-XS-50A':   { componentType: 'orion', params: { model: '12/12-50' }, gaugeOverrides: { in_positive: '16', in_negative: '16', out_positive: '16', out_negative: '16' } },

  // ─── DC DISTRIBUTION ──────────────────────────────────────────

  // Premium — Lynx
  'LYN020102010':   { componentType: 'lynx', params: { label: 'Lynx Power In' } },
  'LYN060102010':   { componentType: 'lynx', params: { label: 'Lynx Distributor' } },

  // Budget — Busbars & fuse blocks
  'BUSBAR-POS':     { componentType: 'busbar' },
  'BUSBAR-NEG':     { componentType: 'busbar' },
  'FUSE-BLOCK-12':  { componentType: 'fuse_block' },

  // ─── BATTERY MONITOR ──────────────────────────────────────────

  'SHU050130050':   { componentType: 'smartshunt', params: { model: '300A' } },
  'SHU050150050':   { componentType: 'smartshunt', params: { model: '500A' } },

  // ─── BATTERY PROTECTION ───────────────────────────────────────

  'SBP-65A':        { componentType: 'battery_protect', params: { amps: 65 } },
  'SBP-100A':       { componentType: 'battery_protect', params: { amps: 100 } },

  // ─── CONSUMER APPLIANCES (12V DC) ─────────────────────────────

  'FRIDGE-50L':     { componentType: 'consumer', params: { label: 'Fridge 50L', maxAmps: 6 } },
  'FRIDGE-85L':     { componentType: 'consumer', params: { label: 'Fridge 85L', maxAmps: 8 } },
  'FRIDGE-115L':    { componentType: 'consumer', params: { label: 'Fridge 115L', maxAmps: 8 } },
  'ROOF-FAN':       { componentType: 'consumer', params: { label: 'Roof Fan', maxAmps: 3 } },
  'ROOF-FAN-PREM':  { componentType: 'consumer', params: { label: 'MaxxAir Fan', maxAmps: 4 } },
  'USB-PANEL':      { componentType: 'consumer', params: { label: 'USB Outlets', maxAmps: 4 } },
  'DIESEL-HEATER':  { componentType: 'consumer', params: { label: 'Diesel Heater', maxAmps: 10 }, gaugeOverrides: { positive_in: '4', negative_in: '4' } },
  'WATER-PUMP':     { componentType: 'consumer', params: { label: 'Water Pump', maxAmps: 5 } },
  'WATER-PUMP-HF':  { componentType: 'consumer', params: { label: 'High Flow Pump', maxAmps: 8 } },

  // Lighting — each lighting circuit gets one consumer entry
  'LED-STRIP':      { componentType: 'consumer', params: { label: 'LED Lights', maxAmps: 3 } },

  // ─── CONSUMER APPLIANCES (230V AC) ────────────────────────────
  // These connect to the consumer unit MCB outputs, not the fuse block

  'AC-SOCKETS':     { componentType: 'consumer_ac', params: { label: '230V Sockets' } },
};


// ═══════════════════════════════════════════════════════════════════════════
// SECTION 5 — HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Get the PortRule for a specific port on a component.
 * Handles dynamic ports (fuse_out_3, pos_out_2, bolt_4, ac_out_2)
 * by falling back to the template rule.
 */
export function getPortRule(
  componentType: string,
  portName: string
): PortRule | undefined {
  const rules = COMPONENT_RULES[componentType];
  if (!rules) return undefined;

  // Direct match
  if (rules.ports[portName]) return rules.ports[portName];

  // Template fallback for dynamic ports
  // e.g. "fuse_out_3" → "_fuse_out_template"
  //      "pos_out_2"  → "_pos_out_template"
  //      "bolt_4"     → "_bolt_template"
  //      "ac_out_2"   → "_ac_out_template"
  const base = portName.replace(/_\d+$/, '');
  const templateKey = `_${base}_template`;
  if (rules.ports[templateKey]) return rules.ports[templateKey];

  return undefined;
}

/**
 * Get the effective wire gauge for a connection, considering product-level
 * gauge overrides.
 */
export function getEffectiveGauge(
  productSku: string | undefined,
  componentType: string,
  portName: string
): WireGauge {
  // Check product-level override first
  if (productSku && PRODUCT_MAP[productSku]?.gaugeOverrides?.[portName]) {
    return PRODUCT_MAP[productSku].gaugeOverrides![portName];
  }
  // Fall back to component rule default
  const rule = getPortRule(componentType, portName);
  return rule?.defaultGauge ?? '2.5';
}

/**
 * Calculate the keep-out rectangle for a placed component.
 * Returns { x, y, w, h } in canvas coordinates.
 */
export function getKeepOutRect(
  componentType: string,
  cx: number,
  cy: number,
  w: number,
  h: number
): { x: number; y: number; w: number; h: number } {
  const padding = COMPONENT_RULES[componentType]?.keepOutPadding ?? 10;
  return {
    x: cx - w / 2 - padding,
    y: cy - h / 2 - padding,
    w: w + padding * 2,
    h: h + padding * 2,
  };
}

/**
 * Check if a point is inside any component's keep-out zone.
 * placedComponents should be an array of { type, cx, cy, w, h }.
 */
export function isInKeepOutZone(
  px: number,
  py: number,
  placedComponents: Array<{ type: string; cx: number; cy: number; w: number; h: number }>
): boolean {
  return placedComponents.some(comp => {
    const rect = getKeepOutRect(comp.type, comp.cx, comp.cy, comp.w, comp.h);
    return px >= rect.x && px <= rect.x + rect.w &&
           py >= rect.y && py <= rect.y + rect.h;
  });
}

/**
 * Check if a line segment (horizontal or vertical) intersects a rectangle.
 * Used for wire routing collision detection.
 */
export function segmentIntersectsRect(
  x1: number, y1: number, x2: number, y2: number,
  rect: { x: number; y: number; w: number; h: number }
): boolean {
  const minX = Math.min(x1, x2);
  const maxX = Math.max(x1, x2);
  const minY = Math.min(y1, y2);
  const maxY = Math.max(y1, y2);

  // Axis-aligned line segment vs axis-aligned rectangle
  return !(maxX < rect.x || minX > rect.x + rect.w ||
           maxY < rect.y || minY > rect.y + rect.h);
}
