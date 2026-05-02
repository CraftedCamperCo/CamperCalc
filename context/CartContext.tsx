import { VICTRON_CATALOG_BY_ID } from '@/data/victronCatalog';
import type { BuildTier, MonitoringChoice } from '@/context/CamperContext';
import type { VictronProduct } from '@/utils/wiringTypes';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

export interface CartItem { product: VictronProduct; quantity: number }
export interface CartBuildSpecInput {
  recommendedBankAh: number;
  recommendedSolarW: number;
  inverterSize: number;
  dcDcChargerSize: number;
  monitoringChoice?: MonitoringChoice;
}
export interface MissingBundleAction {
  key: 'electrical' | 'insulation' | 'insulationAccessories';
  description: string;
  actionLabel: string;
  missingProductIds: string[];
}
interface CartContextType {
  items: CartItem[];
  addItem: (product: VictronProduct) => void;
  addProductsByIds: (productIds: string[]) => number;
  removeItem: (productId: string) => void;
  updateQty: (productId: string, qty: number) => void;
  clearCart: () => void;
  addInsulationBundle: (bundle: {
    soundDeadeningM2: number;
    floorAreaM2: number;
    foamBoardM2?: number;
    useVapourBarrier: boolean;
    tier?: BuildTier;
  }) => void;
  addRecommended: (buildSpec: {
    recommendedBankAh: number;
    recommendedSolarW: number;
    inverterSize: number;
    dcDcChargerSize: number;
  }, tier?: BuildTier) => void;
  /**
   * Refresh the electrical items in the cart so they match the current
   * recommendation (driven by buildSpec). Used to keep the cart in sync after
   * the user changes their appliance list, since the schematic recomputes
   * live but the cart was previously frozen at the moment items were added.
   * Returns { changed: true } when any swap actually happened.
   */
  syncElectricalToSpec: (buildSpec: CartBuildSpecInput, tier?: BuildTier) => { changed: boolean };
  count: number;
  total: number;
  updatedAt: number | null;
  getMissingBundlePrompts: () => string[];
  getMissingBundleActions: (buildSpec?: CartBuildSpecInput | null) => MissingBundleAction[];
}

const CartContext = createContext<CartContextType>({
  items: [], addItem: () => {}, removeItem: () => {}, updateQty: () => {},
  addProductsByIds: () => 0, clearCart: () => {}, addInsulationBundle: () => {}, addRecommended: () => {},
  syncElectricalToSpec: () => ({ changed: false }),
  count: 0, total: 0, updatedAt: null, getMissingBundlePrompts: () => [], getMissingBundleActions: () => [],
});

// Product ID prefixes that the recommendation engine controls. Any cart
// item whose id starts with one of these belongs to the engine, so it can
// be safely replaced when the appliance list changes. Anything else (manual
// adds, accessories, insulation, water) is left alone.
const RECOMMENDED_ELECTRICAL_PREFIXES = [
  'fogstar_', 'eco_',          // batteries
  'mp_', 'phx_',               // inverters / inverter-chargers
  'mppt_', 'bluesolar_',       // solar chargers
  'orion_',                    // dc-dc
  'smartshunt_',               // monitor
  'bmv_', 'cerbo_', 'gx_touch_', // monitor variants
  'bp_',                       // battery protect
  'lynx_', 'fuse_block_',      // distribution
];
function isRecommendedElectricalId(id: string): boolean {
  const lower = id.toLowerCase();
  return RECOMMENDED_ELECTRICAL_PREFIXES.some((prefix) => lower.startsWith(prefix));
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [updatedAt, setUpdatedAt] = useState<number | null>(null);
  const BESPOKE_WIRING_KIT_ID = 'wiring_kit_bespoke';
  const MAJOR_ELECTRICAL_CATEGORIES = new Set([
    'battery',
    'inverter',
    'inverterCharger',
    'mppt',
    'dcdc',
    'distributor',
    'monitor',
    'protect',
  ]);

  useEffect(() => {
    AsyncStorage.getItem('@crafted_cart').then(val => {
      if (val) { try { setItems(JSON.parse(val)); } catch {} }
    });
    AsyncStorage.getItem('@crafted_cart_updated_at').then((val) => {
      if (!val) return;
      const n = Number(val);
      if (!Number.isNaN(n)) setUpdatedAt(n);
    });
  }, []);

  const persistMeta = useCallback((next: CartItem[]) => {
    const now = Date.now();
    AsyncStorage.setItem('@crafted_cart', JSON.stringify(next)).catch(() => {});
    AsyncStorage.setItem('@crafted_cart_updated_at', String(now)).catch(() => {});
    setUpdatedAt(now);
  }, []);

  const syncBespokeWiringKit = useCallback((draft: CartItem[]): CartItem[] => {
    const hasMajorElectrical = draft.some(
      (item) =>
        item.product.id !== BESPOKE_WIRING_KIT_ID &&
        MAJOR_ELECTRICAL_CATEGORIES.has(String(item.product.category)),
    );
    const wiringKit = VICTRON_CATALOG_BY_ID[BESPOKE_WIRING_KIT_ID];
    const kitIndex = draft.findIndex((item) => item.product.id === BESPOKE_WIRING_KIT_ID);

    if (hasMajorElectrical && wiringKit) {
      if (kitIndex === -1) {
        return [...draft, { product: wiringKit, quantity: 1 }];
      }
      if (draft[kitIndex].quantity !== 1) {
        const next = [...draft];
        next[kitIndex] = { ...next[kitIndex], quantity: 1 };
        return next;
      }
      return draft;
    }

    if (!hasMajorElectrical && kitIndex !== -1) {
      return draft.filter((item) => item.product.id !== BESPOKE_WIRING_KIT_ID);
    }
    return draft;
  }, []);

  const addItem = useCallback((product: VictronProduct) => {
    setItems(prev => {
      const existing = prev.find(i => i.product.id === product.id);
      const nextDraft = existing
        ? prev.map(i => i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i)
        : [...prev, { product, quantity: 1 }];
      const next = syncBespokeWiringKit(nextDraft);
      persistMeta(next);
      return next;
    });
  }, [persistMeta, syncBespokeWiringKit]);

  const addProductsByIds = useCallback((productIds: string[]) => {
    let added = 0;
    setItems(prev => {
      let next = [...prev];
      const existingIds = new Set(next.map((item) => item.product.id));
      for (const id of productIds) {
        if (existingIds.has(id)) continue;
        const product = VICTRON_CATALOG_BY_ID[id];
        if (!product) continue;
        next.push({ product, quantity: 1 });
        existingIds.add(id);
        added += 1;
      }
      const synced = syncBespokeWiringKit(next);
      persistMeta(synced);
      return synced;
    });
    return added;
  }, [persistMeta, syncBespokeWiringKit]);

  const removeItem = useCallback((productId: string) => {
    setItems(prev => {
      const nextDraft = prev.filter(i => i.product.id !== productId);
      const next = syncBespokeWiringKit(nextDraft);
      persistMeta(next);
      return next;
    });
  }, [persistMeta, syncBespokeWiringKit]);

  const updateQty = useCallback((productId: string, qty: number) => {
    if (qty <= 0) { removeItem(productId); return; }
    setItems(prev => {
      const nextDraft = prev.map(i => i.product.id === productId ? { ...i, quantity: qty } : i);
      const next = syncBespokeWiringKit(nextDraft);
      persistMeta(next);
      return next;
    });
  }, [persistMeta, removeItem, syncBespokeWiringKit]);

  const clearCart = useCallback(() => {
    setItems([]);
    persistMeta([]);
  }, [persistMeta]);

  const addInsulationBundle = useCallback((bundle: {
    soundDeadeningM2: number;
    floorAreaM2: number;
    foamBoardM2?: number;
    useVapourBarrier: boolean;
    tier?: BuildTier;
  }) => {
    const tier = bundle.tier ?? 'premium';
    const deadeningQty = Math.max(1, Math.ceil(bundle.soundDeadeningM2 / (tier === 'budget' ? 6.5 : 3.7)));
    const floorQty = Math.max(1, Math.ceil(bundle.floorAreaM2 / 2.5));
    const closedCellQty = Math.max(1, Math.ceil((bundle.foamBoardM2 ?? 0) / 6));
    const tapeQty = 2;

    const specs = tier === 'budget'
      ? [
          { id: 'ins_budget_deadening', qty: deadeningQty },
          { id: 'ins_budget_foam', qty: closedCellQty },
          { id: 'ins_tape', qty: tapeQty },
          { id: 'ins_adhesive', qty: 2 },
          { id: 'ins_roller', qty: 1 },
        ]
      : [
          { id: 'ins_sound_deadening', qty: deadeningQty },
          { id: 'ins_floor_and_sound', qty: floorQty },
          ...(closedCellQty > 0 ? [{ id: 'ins_floor_thermal', qty: closedCellQty }] : []),
          { id: 'ins_tape', qty: tapeQty },
          { id: 'ins_adhesive', qty: 2 },
          { id: 'ins_roller', qty: 1 },
        ];

    setItems(prev => {
      let next = [...prev];
      for (const spec of specs) {
        const product = VICTRON_CATALOG_BY_ID[spec.id];
        if (!product) continue;
        const idx = next.findIndex(i => i.product.id === spec.id);
        if (idx >= 0) {
          next[idx] = { ...next[idx], quantity: next[idx].quantity + spec.qty };
        } else {
          next.push({ product, quantity: spec.qty });
        }
      }
      const synced = syncBespokeWiringKit(next);
      persistMeta(synced);
      return synced;
    });
  }, [persistMeta, syncBespokeWiringKit]);

  const resolveRecommendedIds = useCallback((buildSpec: CartBuildSpecInput, tier: BuildTier = 'premium') => {
    const {
      recommendedBankAh,
      recommendedSolarW,
      inverterSize,
      dcDcChargerSize,
      monitoringChoice = 'puck',
    } = buildSpec;
    const ids: string[] = [];

    if (tier === 'budget') {
      // Battery — Fogstar ECO range
      if (recommendedBankAh <= 100) ids.push('eco_100');
      else if (recommendedBankAh <= 314) ids.push('eco_314');
      else if (recommendedBankAh <= 460) ids.push('eco_460');
      else ids.push('eco_628');
    } else {
      // Battery — Fogstar Drift range
      if (recommendedBankAh <= 105) ids.push('fogstar_105');
      else if (recommendedBankAh <= 230) ids.push('fogstar_230');
      else if (recommendedBankAh <= 280) ids.push('fogstar_280');
      else if (recommendedBankAh <= 300) ids.push('fogstar_300');
      else if (recommendedBankAh <= 460) ids.push('fogstar_460');
      else ids.push('fogstar_608');
    }

    // Inverter/charger (same across tiers)
    if (inverterSize > 0) {
      if (inverterSize <= 800) ids.push('mp_800');
      else if (inverterSize <= 1600) ids.push('mp_1600');
      else if (inverterSize <= 2000) ids.push('mp_2000');
      else ids.push('mp_3000');
    }

    // MPPT
    if (recommendedSolarW > 0) {
      if (tier === 'budget') {
        if (recommendedSolarW <= 200) ids.push('bluesolar_75_15');
        else if (recommendedSolarW <= 290) ids.push('bluesolar_100_20');
        else if (recommendedSolarW <= 440) ids.push('bluesolar_100_30');
        else ids.push('bluesolar_150_35');
      } else {
        if (recommendedSolarW <= 200) ids.push('mppt_75_15');
        else if (recommendedSolarW <= 300) ids.push('mppt_100_20');
        else if (recommendedSolarW <= 440) ids.push('mppt_100_30');
        else ids.push('mppt_150_35');
      }
    }

    // DC-DC
    if (dcDcChargerSize > 0) {
      if (tier === 'budget') {
        ids.push('orion_18_budget');
      } else {
        if (dcDcChargerSize <= 18) ids.push('orion_18');
        else if (dcDcChargerSize <= 30) ids.push('orion_30');
        else ids.push('orion_50');
      }
    }

    if (monitoringChoice === 'smartshunt') {
      ids.push('smartshunt_500');
    } else if (monitoringChoice === 'cerbo') {
      ids.push('cerbo_gx', 'gx_touch_50', 'smartshunt_500');
    } else {
      // default: "puck" monitor
      ids.push('bmv_712_smart');
    }
    // BatteryProtect remains mandatory regardless of monitor tier.
    ids.push('bp_65');
    if (tier === 'budget') ids.push('fuse_block_12way');
    else ids.push('lynx_dist');

    return ids;
  }, []);

  const addRecommended = useCallback((buildSpec: CartBuildSpecInput, tier: BuildTier = 'premium') => {
    const ids = resolveRecommendedIds(buildSpec, tier);
    setItems(prev => {
      let next = [...prev];
      const existingIds = new Set(next.map((item) => item.product.id));
      for (const id of ids) {
        const product = VICTRON_CATALOG_BY_ID[id];
        if (!product) continue;
        if (!existingIds.has(id)) {
          next = [...next, { product, quantity: 1 }];
          existingIds.add(id);
        }
      }
      const synced = syncBespokeWiringKit(next);
      persistMeta(synced);
      return synced;
    });
  }, [persistMeta, resolveRecommendedIds, syncBespokeWiringKit]);

  // Diff the cart's recommendation-controlled electrical items against the
  // current build spec and replace them with the new recommendation. Only
  // items whose id starts with a known recommendation prefix are touched;
  // manually added items and non-electrical categories are left alone.
  const syncElectricalToSpec = useCallback(
    (buildSpec: CartBuildSpecInput, tier: BuildTier = 'premium') => {
      const recommendedIds = resolveRecommendedIds(buildSpec, tier);
      const recommendedSet = new Set(recommendedIds);
      let changed = false;

      setItems(prev => {
        // Cart items the recommendation engine no longer wants.
        const stale = prev.filter(
          (item) => isRecommendedElectricalId(item.product.id) && !recommendedSet.has(item.product.id),
        );
        // Recommended items that the cart does not yet have.
        const existingIds = new Set(prev.map((i) => i.product.id));
        const missing = recommendedIds.filter((id) => !existingIds.has(id));

        if (stale.length === 0 && missing.length === 0) {
          return prev; // nothing to do
        }
        changed = true;

        // Drop stale electricals, keep everything else (insulation, accessories,
        // manual adds, current recommendations that still match).
        let next = prev.filter(
          (item) => !(isRecommendedElectricalId(item.product.id) && !recommendedSet.has(item.product.id)),
        );

        for (const id of missing) {
          const product = VICTRON_CATALOG_BY_ID[id];
          if (!product) continue;
          next = [...next, { product, quantity: 1 }];
        }

        const synced = syncBespokeWiringKit(next);
        persistMeta(synced);
        return synced;
      });

      return { changed };
    },
    [persistMeta, resolveRecommendedIds, syncBespokeWiringKit],
  );

  const getMissingBundlePrompts = useCallback(() => {
    const ids = new Set(items.map((i) => i.product.id));
    const prompts: string[] = [];
    const hasElectrical = [
      'mp_800',
      'mp_1600',
      'mp_2000',
      'mp_3000',
      'fogstar_105',
      'fogstar_230',
      'fogstar_280',
      'fogstar_300',
      'fogstar_460',
      'fogstar_608',
      'lynx_dist',
    ].some((id) => ids.has(id));
    const hasInsulation = ['ins_sound_deadening', 'ins_floor_thermal', 'ins_floor_and_sound'].some((id) => ids.has(id));
    if (hasElectrical && !hasInsulation) prompts.push('Your insulation package is ready to add.');
    if (hasInsulation && (!ids.has('ins_tape') || !ids.has('ins_adhesive') || !ids.has('ins_roller'))) {
      prompts.push('Add installation accessories for a complete fit-out.');
    }
    return prompts;
  }, [items]);

  const getMissingBundleActions = useCallback((buildSpec?: CartBuildSpecInput | null) => {
    const ids = new Set(items.map((i) => i.product.id));
    const actions: MissingBundleAction[] = [];

    if (buildSpec) {
      const missingElectrical = resolveRecommendedIds(buildSpec).filter((id) => !ids.has(id));
      if (missingElectrical.length > 0) {
        actions.push({
          key: 'electrical',
          description: `Your bespoke electrical bundle is missing ${missingElectrical.length} key line${missingElectrical.length === 1 ? '' : 's'}.`,
          actionLabel: `Add ${missingElectrical.length} missing`,
          missingProductIds: missingElectrical,
        });
      }
    }

    const electricalIds = [
      'mp_800', 'mp_1600', 'mp_2000', 'mp_3000',
      'fogstar_105', 'fogstar_230', 'fogstar_280', 'fogstar_300', 'fogstar_460', 'fogstar_608',
      'eco_100', 'eco_314', 'eco_460', 'eco_628',
      'lynx_dist', 'fuse_block_12way',
      'mppt_75_15', 'mppt_100_20', 'mppt_100_30', 'mppt_150_35',
      'bluesolar_75_15', 'bluesolar_100_20', 'bluesolar_100_30', 'bluesolar_150_35',
      'orion_18', 'orion_30', 'orion_50', 'orion_18_budget',
      'smartshunt_500', 'bmv_712_smart', 'cerbo_gx', 'gx_touch_50', 'bp_65',
    ];
    const hasElectrical = electricalIds.some((id) => ids.has(id));
    const insulationCoreIds = ['ins_sound_deadening', 'ins_floor_thermal', 'ins_floor_and_sound'];
    const hasInsulation = insulationCoreIds.some((id) => ids.has(id));
    if (hasElectrical) {
      const missingInsulationCore = insulationCoreIds.filter((id) => !ids.has(id));
      if (missingInsulationCore.length > 0) {
        actions.push({
          key: 'insulation',
          description: 'Your insulation package is ready to add.',
          actionLabel: 'Add insulation core',
          missingProductIds: missingInsulationCore,
        });
      }
    }
    if (hasInsulation) {
      const accessoryIds = ['ins_tape', 'ins_adhesive', 'ins_roller'];
      const missingAccessories = accessoryIds.filter((id) => !ids.has(id));
      if (missingAccessories.length > 0) {
        actions.push({
          key: 'insulationAccessories',
          description: 'Add installation accessories for a complete fit-out.',
          actionLabel: 'Add accessories',
          missingProductIds: missingAccessories,
        });
      }
    }
    return actions;
  }, [items, resolveRecommendedIds]);

  const count = useMemo(() => items.reduce((s, i) => s + i.quantity, 0), [items]);
  const total = useMemo(() => items.reduce((s, i) => s + i.product.estimatedPrice * i.quantity, 0), [items]);

  return (
    <CartContext.Provider value={{ items, addItem, addProductsByIds, removeItem, updateQty, clearCart, addInsulationBundle, addRecommended, syncElectricalToSpec, count, total, updatedAt, getMissingBundlePrompts, getMissingBundleActions }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() { return useContext(CartContext); }
