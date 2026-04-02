# Migration Path: Wiring Prototype → Expo App

## Overview

This document describes how to integrate the wiring diagram generator prototype into the main CamperPlan Expo app.

## What Transfers Directly (Pure TypeScript — No Changes Needed)

The following files contain zero DOM or browser dependencies and can be copied directly into the Expo app:

- `src/types.ts` → `utils/wiringTypes.ts`
- `src/data/victronCatalog.ts` → `data/victronCatalog.ts`
- `src/data/accessoryCatalog.ts` → `data/accessoryCatalog.ts`
- `src/data/regulations.ts` → `data/regulations.ts`
- `src/data/cableSizingTable.ts` → `data/cableSizingTable.ts`
- `src/engine/wiringRules.ts` → `utils/wiringRules.ts`
- `src/engine/shoppingList.ts` → `utils/shoppingList.ts`
- `src/engine/installationGuide.ts` → `utils/installationGuide.ts`

## SVG Component Conversion

The SVG components need minor renaming to work with `react-native-svg` (already a dependency in the app):

| Browser SVG | react-native-svg |
|-------------|-----------------|
| `<svg>` | `<Svg>` |
| `<rect>` | `<Rect>` |
| `<circle>` | `<Circle>` |
| `<line>` | `<Line>` |
| `<text>` | `<Text>` (from react-native-svg, not react-native) |
| `<path>` | `<Path>` |
| `<g>` | `<G>` |

All imports come from `react-native-svg`:

```typescript
import Svg, { Rect, Circle, Line, Text, Path, G } from 'react-native-svg';
```

## Connecting to CamperContext

Replace the ConfigPanel inputs with data from `CamperContext` and the `calculate()` function:

```typescript
import { useCamper } from '../context/CamperContext';
import { calculate } from '../utils/calculator';
import { generateWiringSpec } from '../utils/wiringRules';

function WiringScreen() {
  const { state } = useCamper();
  const buildSpec = calculate(state);

  const wiringConfig: SystemConfig = {
    batteryAh: buildSpec.recommendedBankAh,
    inverterVA: buildSpec.inverterSize,
    solarWatts: buildSpec.recommendedSolarW,
    dcDcAmps: buildSpec.dcDcChargerSize,
    hasShore: userSelectedShore,      // new toggle on this screen
    cableRunLength: userSelectedLength, // new selector on this screen
    useLynx: userSelectedLynx,         // new toggle on this screen
  };

  const wiringSpec = generateWiringSpec(wiringConfig);
  // render...
}
```

## New Screen/Tab

Add as a new tab or a modal screen in `app/(tabs)/`:

- Option A: New tab `app/(tabs)/wiring.tsx` — if it should be a permanent part of the flow
- Option B: Modal from the Build tab `app/wiring-modal.tsx` — if it's an optional deep-dive

## UI Components

Replace Tailwind classes with React Native `StyleSheet` using the existing theme from `constants/Colors.ts`:

- Use `GlassCard` component for section containers
- Use the existing `FloatingTabBar` pattern for the schematic/shopping/guide tabs
- Use `ScrollView` for the shopping list and installation guide
- Use `react-native-svg` `Svg` component with `viewBox` for the schematic (supports pinch-to-zoom)

## Export Functionality

For the React Native app:

- SVG export: Use `react-native-svg` + `expo-file-system` to save SVG string
- PNG export: Use `react-native-view-shot` to capture the SVG view as an image
- PDF export: Use `expo-print` to generate a PDF from HTML containing the SVG
- Share: Use `expo-sharing` to share the exported files

## Additional Dependencies Needed

```bash
npx expo install react-native-view-shot expo-print expo-sharing expo-file-system
```

## Testing Checklist

- [ ] All system archetypes generate valid wiring specs
- [ ] Cable gauges match Victron Wiring Unlimited recommendations
- [ ] Fuse ratings are correct for each circuit
- [ ] Terminal lug sizes match cable gauge and terminal stud size
- [ ] Shopping list quantities are accurate (especially lug counts — 2 per cable)
- [ ] Installation guide steps are in correct order
- [ ] Regulation references are accurate
- [ ] SVG schematic renders correctly on different screen sizes
- [ ] Export/share functionality works on iOS and Android
