# Wiring Schematic — Full Context Brief for CamperPlan

> **Who this document is for**  
> This brief is for AI project management collaborators (Claude Projects, etc.) and any developer working on the wiring schematic feature. It is the complete, unambiguous source of truth for what the schematic is, what it currently does, what is broken, what needs building, and the rules it must follow.
>
> **Last updated:** 2026-02-24  
> **Maintained by:** Dan Andrews / Crafted Camper Co  
> **Update instructions:** Refresh this file whenever the schematic engine or integration changes.

---

## 1. What the Wiring Schematic Is

The wiring schematic is a programmatically generated, A4-landscape SVG diagram that shows the complete electrical wiring layout for a customer's bespoke campervan build. Every diagram is unique to the customer's configuration — no two are the same.

### What it shows
- Battery bank (Fogstar Drift LiFePO4) with polarity labeling
- Battery monitor (Victron SmartShunt 500A)
- Main isolator switch and MIDI fuse
- DC distribution hub (Victron Lynx Distributor or dual busbar pair)
- Inverter or inverter-charger (Victron MultiPlus — various sizes)
- Solar panels, PV disconnect isolator, and solar charge controller (Victron SmartSolar MPPT)
- DC-DC alternator charger (Victron Orion-Tr Smart or Orion XS) and starter battery
- Battery protect (Victron SmartBatteryProtect) and 12V DC fuse block
- Earth bar with chassis bonding and LPG bonding (if applicable)
- Shore power inlet (CEE 16A), AC consumer unit (grid side), inverter AC consumer unit (loads side), and 240V sockets — when mains is selected
- Wire routing with colour coding, cable gauge labels (mm²), lug size markers, polarity markers
- Numbered component badges with a full component key table in the right sidebar
- Wire colour legend, glossary, regulation boxes, safety banner
- CamperPlan branded header (logo, date, system spec summary)

### What it does NOT show
- Heating or hot water wiring (out of scope — this is electrical system only)
- Internal 12V wiring from fuse block to individual appliances (circuit-level detail)
- Vehicle CAN/OBD wiring

---

## 2. Technical Architecture

### 2.1 File Locations

| File | Purpose |
|---|---|
| `utils/schematicSVG.ts` | **Main SVG engine (V3)** — 2,000+ lines. Generates the full schematic as an SVG string from a `WiringSpec` + `SystemConfig`. This is the only file that should be edited to fix rendering bugs. |
| `utils/wiringTypes.ts` | TypeScript type definitions for `WiringSpec`, `SystemConfig`, `WireConnection`, `VictronProduct`, etc. |
| `utils/wiringRules.ts` | Business logic engine — takes a `SystemConfig` and returns a complete `WiringSpec` (components, connections, fuse ratings, cable gauges, cable run lengths, earthing spec). |
| `utils/shoppingList.ts` | Generates a full shopping list of cables, lugs, fuses, busbars, and accessories from a `WiringSpec`. |
| `utils/installationGuide.ts` | Generates step-by-step installation instructions from a `WiringSpec`. |
| `utils/schematicPDF.ts` | Converts the SVG string to a printable PDF using `expo-print`. |
| `utils/schematicWebview.ts` | Wraps the SVG in an HTML envelope for display in a `WebView` (used for in-app preview with pinch-to-zoom). |
| `components/svg/SchematicDiagram.tsx` | React Native component that renders the schematic using `react-native-svg`. |
| `components/svg/SchematicRenderer.tsx` | Wrapper component (loading states, error boundary, zoom controls). |
| `app/schematic-detail.tsx` | In-app screen for viewing, exporting, and sharing the schematic. |
| `app/wiring.tsx` | Entry screen for the wiring/schematic feature (Sales Suite gated). |
| `data/victronCatalog.ts` | Product catalog (used by rules engine to select components and their specs/prices). |
| `data/cableSizingTable.ts` | Lookup table for cable gauge → fuse rating → voltage drop per meter. |
| `data/regulations.ts` | BS 7671 and BS EN 1949 regulation references used in footer boxes. |
| `data/accessoryCatalog.ts` | Cable accessories catalog (lugs, fuses, heat shrink, connectors). |
| `wiring-prototype/` | **Standalone Vite/React web prototype** used for rapid iteration outside of the Expo environment. Does NOT need to be deployed — it is a dev tool only. |

### 2.2 How Data Flows

```
CamperContext (user answers)
    ↓
calculate() in utils/calculator.ts
    ↓
SystemConfig object
{
  batteryAh: number,
  inverterVA: number,
  solarWatts: number,
  dcDcAmps: number,
  hasShore: boolean,
  hasLPG: boolean,
  cableRunLength: 'short' | 'medium' | 'long',
  useLynx: boolean,
  selectedDcAppliances: string[],
  customApplianceNames: string[]
}
    ↓
wiringRules.ts → generateWiringSpec(config)
    ↓
WiringSpec object
{
  archetype: string,
  components: ComponentInstance[],
  connections: WireConnection[],
  earthingSpec: EarthingSpec
}
    ↓
schematicSVG.ts → generateSchematicSVG(spec, config, imageMap)
    ↓
SVG string (A4 landscape, 1190×842px, self-contained)
    ↓
schematicWebview.ts / schematicPDF.ts / react-native-svg
    ↓
In-app display / PDF export / share
```

### 2.3 Canvas

- Fixed dimensions: **1190 × 842px** (A4 landscape proportions)
- Coordinate origin: top-left (0,0)
- Layout zones: header bar (0–52px), schematic area (52–734px), footer boxes (734–788px), safety banner (788–842px, red, only when 230V present)
- Right sidebar: 268px wide, right edge — contains component key, legend, glossary, DC circuit table, phone mockup, QR placeholder

---

## 3. Layout Engine (How Components Are Positioned)

The layout is **fully adaptive** — positions are computed from feature flags (`hasInv`, `hasMPPT`, `hasDC`, `hasShore`, etc.), not hardcoded.

### Column layout (horizontal)
Components are arranged in columns, left to right:
1. **Battery + Shunt** (left)
2. **Chain** (Isolator + MIDI fuse)
3. **Distribution** (Lynx Distributor or dual busbar)
4. **Inverter** (if present)
5. **AC chain** (if shore power)

Column widths are summed and gaps are distributed to fill the schematic width. If they overflow, gaps compress to a minimum of 4px before columns begin to overlap. The leftmost column is guaranteed to start at `S_L + 4` — it can never go negative or off-screen.

### Row layout (vertical)
- **Charging sources** (Solar chain and DC-DC) sit above the distribution hub
- **Distribution hub** is in the vertical midpoint
- **Loads** (Battery Protect, Fuse Block, Earth Bar) sit below

### Routing

Wires are routed using `routeOrthogonal()` — an orthogonal path router that:
1. Tries 18+ candidate paths (horizontal-first, vertical-first, top corridor, bottom corridor, left corridor, right corridor, 3-bend perimeter detours, inner rails)
2. Scores each path by: hard keep-out violations, soft keep-out violations, run-along stacking, crowding penalty, total path length
3. Picks the lowest-cost path lexicographically (hard violations take priority over soft, etc.)
4. If best path still has violations, attempts a second pass with shifted corridor bounds
5. Falls back to clamped perimeter routes as a last resort
6. **Every waypoint is hard-clamped to the schematic frame before being returned** — no wire can exit the drawing area

Net classes control corridor assignments:
- `dc_hi` — main battery + inverter cables (thick red/black)
- `dc_lo` — solar and DC-DC charging cables (thinner red/black)
- `ac_in` — shore power input (blue)
- `ac_out` — inverter output / 240V loads (brown)
- `earth` — chassis bonding (green/yellow, dashed)
- `signal` — SmartShunt AUX sense (thin red, dashed)

Component bodies are registered as:
- **Wire mask rects** — SVG mask layer that hides any wire passing over a component body (visual clarity)
- **Soft keep-out rects** — router penalises paths through these
- **Hard keep-out rects** — router strongly avoids these (second-order penalty)

---

## 4. Known Issues and History

These are the recurring problems that have been patched multiple times. Every fix should be documented here so we do not repeat the same approach.

### Issue 1: Wires going off the left edge of the canvas
**Root cause:** Old column layout algorithm blindly shifted all columns left when total width overflowed, pushing the battery column to negative X coordinates.  
**Current fix:** Column layout now has a hard guarantee that nothing goes left of `S_L`. Overflow compression starts from the right. All wire waypoints are hard-clamped at the end of `routeNet()`.  
**Status:** Fixed in V3. Regression check added to `validateSchematicSVG()`.

### Issue 2: Wires overlapping component bodies
**Root cause:** Component bodies were not registered as keep-out zones, so the router could route through them.  
**Current fix:** Every component is registered as a soft + hard keep-out with halos. A wire body mask (SVG `<mask>`) clips any wire that accidentally passes over a component body as a final visual safety net.  
**Status:** Significantly improved in V3. Still not 100% clean in dense configurations (e.g., shore power + MPPT + DC-DC simultaneously). This is the primary active quality issue.

### Issue 3: Wires stacking on top of each other (parallel runs)
**Root cause:** Router placed multiple wires in the same lane because it had no penalty for doing so.  
**Current fix:** `segRunAlongCount()` and `segCrowdingPenalty()` functions penalise routes that run alongside already-routed segments. Deterministic lane jitter added based on wire coordinate hash to spread parallel wires.  
**Status:** Improved but still visible in medium-complexity layouts. Continuing work needed.

### Issue 4: Wire routing restarts on each generate call
**Root cause:** Global state (`usedRects`, `routedSegs`, `shownGaugeLabels`, `wireIdCounter`) was not being reset.  
**Current fix:** All global state is reset at the top of `generateSchematicSVG()`.  
**Status:** Fixed.

### Issue 5: AC wires not appearing for shore power configurations
**Root cause:** Shore power section relied on indirect feature detection.  
**Current fix:** Feature detection now driven directly by `config.hasShore && (hasMP || hasInv)`. AC port positions defined in a single `AC_PORT` object to prevent drift between port declaration and wire routing.  
**Status:** Fixed. Regression check added: `validateSchematicSVG()` checks for `AC_LOADS_WIRE` marker.

### Issue 6: MultiPlus port positions not matching real product
**Root cause:** Port positions were spread evenly across the full unit width, but the real MultiPlus has all DC/AC ports clustered in the right ~40% of the bottom edge.  
**Current fix:** `INV_PORT_RATIO` constants (`acOut: 0.38, acIn: 0.48, earth: 0.58, dcNeg: 0.70, dcPos: 0.82`) applied consistently across all inverter-related wires.  
**Status:** Fixed.

### Issue 7: Text labels (gauge labels) going in the wrong direction
**Root cause:** SVG `<textPath>` renders text in the direction of the path — for wires going right-to-left or bottom-to-top, text appeared backwards.  
**Current fix:** Wire renderer detects direction of the longest segment. If it goes right-to-left or bottom-to-top, a reversed copy of the path is generated and used for the `<textPath>`.  
**Status:** Fixed.

---

## 5. What Still Needs to Be Built

These are the outstanding tasks, in priority order.

### P0 — Must fix before Sales Suite release

- [ ] **Wire overlap reduction in dense configs**: When Solar + DC-DC + Shore are all enabled simultaneously, the routing area becomes crowded and wires still overlap in 15–20% of cases. Need smarter pre-allocation of vertical corridors so DC-hi, DC-lo, AC, and earth are guaranteed separate horizontal lanes.
- [ ] **Validation and retry loop**: `validateSchematicSVG()` exists but is not wired into the generate call. Should run automatically; if it fails, try re-generating with wider corridor margins before returning the result.
- [ ] **Regression test suite**: A set of known configurations (battery-only, MPPT-only, full-shore, full-house) that can be run to detect regressions when the engine changes.

### P1 — Sales Suite quality

- [ ] **Image map integration (real product photos)**: The engine supports an `imageMap` parameter with URLs for each component. Currently no image URLs are being passed. Need to either: (a) map Victron/Fogstar product image URLs from the catalog, or (b) use embedded base64 images. Without this, components render as placeholder rectangles.
- [ ] **Pinch-to-zoom in-app**: The schematic is A4 landscape on a phone screen. The WebView version supports zoom via browser rendering. The react-native-svg version needs `react-native-gesture-handler` + zoom gestures.
- [ ] **Download as PDF**: `schematicPDF.ts` and `expo-print` are already in place. Needs a working button on `schematic-detail.tsx` and permission handling.
- [ ] **Share as PNG**: `react-native-view-shot` capture of the SVG view needs implementing on the share screen.

### P2 — Enhancement (after launch)

- [ ] **Per-wire installation instructions**: Shopping list and installation guide (`shoppingList.ts`, `installationGuide.ts`) are built but not surfaced in the app. Should be shown as a collapsible section below the schematic.
- [ ] **Multi-battery parallel wiring**: Currently only 2 batteries are drawn (max). For 3+ battery banks (e.g., 608Ah × 2), the diagram should show proper inter-battery parallel linking with fuses.
- [ ] **Split-charge relay fallback**: For simpler vans without a Victron DC-DC charger, a VSR (voltage sensitive relay) option should be offered.
- [ ] **Schematic versioning**: Each generated schematic should get a build hash so if the customer re-generates, a "new version available" can be shown vs. their saved version.

---

## 6. Constraints and Rules the Engine Must Always Respect

These are non-negotiable design rules. Any change to the engine must preserve all of these.

### Visual rules
1. All wires are **orthogonal only** (90-degree turns, no diagonal lines). Never use diagonal routing.
2. Wire colours are fixed: DC positive = red (`#C0392B`), DC negative = black (`#333`), earth = green (`#27AE60`) dashed, AC in = blue (`#3498DB`), AC out = brown (`#8B4513`), signal = red thin dashed.
3. Cable gauge labels appear **on the wire**, not next to it. Only on the longest segment. Only once per net class per gauge (up to the `maxLabels` limit per class).
4. Component numbers are **amber badges** (`#D9A05B`) with dark number text. Numbered sequentially in order of first appearance.
5. No text labels should appear directly on component bodies — only the number badge.
6. The right sidebar must never be overwritten by wires or component bodies.

### Electrical correctness rules
7. Fuse always goes on the **positive wire, closest to the battery** (MIDI fuse between battery positive and isolator).
8. Negative always goes through the **shunt** (battery negative → shunt → distribution negative busbar).
9. The shunt AUX sense wire must always be shown (dashed, thin red, from shunt AUX to battery positive).
10. Earth/chassis bond goes from the negative busbar to the chassis (35mm² green/yellow).
11. All LPG metallic pipework must be bonded to chassis (4mm² green/yellow) when `hasLPG` is true.
12. DC-DC charger input must come from the **starter (vehicle) battery**, not the leisure battery.
13. Solar panels → PV Disconnect Isolator → MPPT (in that order, never directly panel to MPPT).
14. MultiPlus AC-in wires connect via the **grid-side consumer unit (RCD)**. AC-out wires connect via the **loads-side consumer unit (RCD)**. Never directly shore-to-inverter or inverter-to-socket.

### Technical rules
15. The canvas is always `1190 × 842` (A4 landscape). Never change this.
16. Nothing may be rendered outside the viewBox. All coordinates are clamped before use.
17. The SVG must be self-contained (no external font or image URLs that could fail to load in offline PDF export) — except for the `imageMap` product images which are optional.
18. The `generateSchematicSVG()` function must be pure (no side effects) except for module-level state that is reset at the start of every call.

---

## 7. Prototype vs App

There are two parallel environments for the schematic:

### `wiring-prototype/` (Vite + React web app)
- Fast iteration environment — changes render instantly in a browser
- Has `ConfigPanel.tsx` for manually setting all `SystemConfig` values
- Shows schematic, shopping list, and installation guide side by side
- **Not deployed anywhere** — dev tool only
- To run: `cd wiring-prototype && npm install && npm run dev`

### Main Expo app (`app/wiring.tsx`, `app/schematic-detail.tsx`)
- Production environment — the version customers see
- Gated behind Sales Suite entitlement check (`hasEntitlement('sales_suite_access')`)
- Uses the same `schematicSVG.ts` engine
- Renders via WebView (HTML wrapper) for in-app preview
- Exports via `expo-print` (PDF) and `expo-sharing`

### Sync rule
The files that are shared between both environments and must stay in sync:
- `utils/schematicSVG.ts` ← the engine (edit this, test in prototype, deploy to app)
- `utils/wiringRules.ts`
- `utils/wiringTypes.ts`
- `data/victronCatalog.ts`
- `data/cableSizingTable.ts`

---

## 8. How to Work on the Schematic (Developer Instructions)

### Recommended workflow
1. Open the wiring prototype in a browser (`cd wiring-prototype && npm run dev`)
2. Use the ConfigPanel to reproduce the failing configuration
3. Edit `utils/schematicSVG.ts` (this is shared via file path — changes appear immediately in the prototype)
4. Fix the rendering issue
5. Run `validateSchematicSVG()` against the output to check for regressions
6. Test the same config in the Expo app
7. Update this document if the issue/fix changes any of the constraints or known issues above

### Key functions to know

| Function | What it does |
|---|---|
| `generateSchematicSVG(spec, config, imageMap)` | Main entry point — returns SVG string |
| `routeOrthogonal(from, to, rects, corridors, hint, existingSegs, netClass, hardNoCrossRects)` | Wire router — returns array of waypoints |
| `routeNet(from, to, kind, hint)` | Convenience wrapper for `routeOrthogonal` with per-net-class corridor config |
| `wire(from, to, color, gauge, waypoints, opts)` | Draws a wire and registers its segments for future avoidance |
| `validateSchematicSVG(svgString)` | Regression checker — returns pass/fail + failure list |
| `generateWiringSpec(config)` | In `wiringRules.ts` — turns SystemConfig into WiringSpec |

### Adding a new component to the diagram
1. Define its position variables in the layout section (follow existing pattern)
2. Register its bounding box in `pushRect`, `pushWireMaskRect`, and `pushHardRect`
3. Add an `addHalo()` call in the `routeNet()` function's universal halo block
4. Draw the component with its renderer function
5. Add its numbered badge
6. Add it to the `keyItems` array for the component key table
7. Add its wire connections using `routeNet()` + `wire()`
8. Test in prototype with multiple configurations to check it doesn't crowd other components

---

## 9. Questions / Decisions Pending

These need input from Dan before implementation:

1. **Image map source**: Should product images come from Batteries & Solar URLs (live, could break), or should we embed base64 thumbnails in the catalog? If live URLs — do we have a stable CDN path?
2. **Schematic access model**: Currently gated behind Sales Suite (£1,500 spend). Should it also be purchasable standalone for £75 (with the wiring kit)? The current code supports this path but the entitlement logic needs confirming.
3. **Schematic file format on delivery**: When a bespoke wiring kit order is fulfilled — does the customer get: (a) in-app view only, (b) downloadable PDF only, (c) both? Currently both are being built.
4. **Supplier prep inputs**: When the supplier crimps and prepares the wiring kit, what exact data do they need from the schematic? We need to define the minimum export format (probably the shopping list from `shoppingList.ts` as a formatted CSV or PDF).
5. **Schematic revision policy**: If a customer changes their build configuration after purchasing, do they get a revised schematic for free? Or is it a new purchase?

---

## 10. Glossary

| Term | Meaning |
|---|---|
| WiringSpec | The computed data model for a customer's full electrical system |
| SystemConfig | Input parameters that drive the rules engine and layout engine |
| Net class | The electrical type of a wire (DC hi, DC lo, AC in, AC out, earth, signal) |
| MPPT | Maximum Power Point Tracker — solar charge controller |
| DC-DC / Orion | Alternator-to-battery charger (isolated or non-isolated) |
| MultiPlus | Victron inverter-charger (converts 12V DC to 230V AC and handles shore power) |
| Lynx Distributor | Victron fused DC busbar unit (premium option over simple copper busbars) |
| SmartShunt | Victron battery monitor — every electron in and out goes through it |
| BatteryProtect | Victron low-voltage disconnect device — protects battery from deep discharge |
| Shore power | 230V mains hookup at campsites (CEE 16A blue socket) |
| LPG bonding | Mandatory earthing of all metallic gas pipework to chassis (BS EN 1949) |
| Sales Suite | Premium unlock triggered at £1,500 cumulative spend in the app |
| Bespoke Wiring Kit | Pre-crimped, heat-shrunk, labelled cable set prepared by supplier to customer's exact spec |

---

*This document is confidential to Crafted Camper Co. and authorised project collaborators.*  
*For questions: hello@craftedcamper.co*
