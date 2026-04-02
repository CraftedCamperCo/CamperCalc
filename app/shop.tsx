import GlassCard from '@/components/GlassCard';
import { FEATURE_FLAGS } from '@/constants/featureFlags';
import TopographicBackground from '@/components/TopographicBackground';
import { useCart } from '@/context/CartContext';
import { useProjects } from '@/context/ProjectContext';
import { useTheme } from '@/context/ThemeContext';
import { APP_CATALOG } from '@/data/catalog';
import { trackAddToBasket, trackProductViewed, trackRemoveFromBasket } from '@/utils/analytics';
import { catalogToCartProduct } from '@/utils/catalogAdapter';
import { calculate } from '@/utils/calculator';
import { goBackOrHome } from '@/utils/navigation';
import { calculateValueSaved } from '@/utils/valueSaved';
import type { CatalogProduct } from '@/utils/catalogTypes';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
  Image,
  Linking,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type AppMode = 'shop' | 'repository';
type SortKey = 'recommended' | 'price_low' | 'price_high' | 'name';

const CATEGORY_META: Record<string, { label: string; icon: string }> = {
  batteries: { label: 'Batteries', icon: 'battery-charging' },
  electrical: { label: 'Electrical', icon: 'lightning-bolt' },
  appliances: { label: 'Appliances', icon: 'fridge-outline' },
  water: { label: 'Water', icon: 'water' },
  solar: { label: 'Solar', icon: 'weather-sunny' },
  insulation: { label: 'Insulation', icon: 'home-thermometer-outline' },
  misc: { label: 'Misc', icon: 'shape-outline' },
};

function catalogCartId(p: CatalogProduct): string {
  return p.legacyId ?? p.id;
}

function ProductCard({
  product,
  inCart,
  onAdd,
  onRemove,
  onOpen,
  theme,
}: {
  product: CatalogProduct;
  inCart: boolean;
  onAdd: () => void;
  onRemove: () => void;
  onOpen: () => void;
  theme: any;
}) {
  const price = product.price.incVat ?? product.price.listPrice ?? 0;
  return (
    <GlassCard style={s.productCard}>
      <TouchableOpacity onPress={onOpen} activeOpacity={0.8}>
        <View style={s.productMetaRow}>
          <View style={[s.badge, { backgroundColor: `${theme.accent}1A`, borderColor: `${theme.accent}40` }]}>
            <Text style={[s.badgeText, { color: theme.accent }]}>CURATED</Text>
          </View>
          <View style={[s.badge, { backgroundColor: 'rgba(0,0,0,0.03)', borderColor: 'rgba(0,0,0,0.08)' }]}>
            <Text style={[s.badgeText, { color: theme.textSecondary }]}>{product.category.toUpperCase()}</Text>
          </View>
        </View>
        <View style={s.productRow}>
          <View style={s.thumb}>
            {product.imageUrl ? (
              <Image source={{ uri: product.imageUrl }} style={s.thumbImage} resizeMode="contain" />
            ) : (
              <MaterialCommunityIcons name="package-variant" size={26} color={theme.accent} />
            )}
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[s.productTitle, { color: theme.text }]} numberOfLines={2}>
              {product.name}
            </Text>
            <Text style={[s.productSub, { color: theme.textSecondary }]} numberOfLines={1}>
              {product.sku ?? product.brand ?? 'Catalog item'}
            </Text>
            <Text style={[s.productSub, { color: theme.accent }]}>
              £{Number(price).toLocaleString()} · {product.stockLabel ?? product.stockStatus}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
      <View style={s.productActions}>
        <TouchableOpacity
          onPress={onOpen}
          style={[s.linkBtn, { borderColor: `${theme.accent}35` }]}
          activeOpacity={0.8}
        >
          <Text style={[s.linkText, { color: theme.accent }]}>Details</Text>
        </TouchableOpacity>
        {inCart ? (
          <TouchableOpacity
            onPress={onRemove}
            style={[s.cartBtn, { borderColor: '#2E4C3D55', backgroundColor: '#2E4C3D22' }]}
            activeOpacity={0.8}
          >
            <Text style={[s.cartBtnText, { color: '#2E4C3D' }]}>In basket</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            onPress={onAdd}
            style={[s.cartBtn, { borderColor: `${theme.accent}40`, backgroundColor: `${theme.accent}18` }]}
            activeOpacity={0.8}
          >
            <Text style={[s.cartBtnText, { color: theme.accent }]}>Add to basket</Text>
          </TouchableOpacity>
        )}
      </View>
    </GlassCard>
  );
}

export default function ShopScreen() {
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ cart?: string }>();
  const { currentProject } = useProjects();
  const { items, addItem, removeItem, total, count } = useCart();

  const [mode, setMode] = useState<AppMode>('shop');
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [stockOnly, setStockOnly] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>('recommended');
  const [showProjectPopup, setShowProjectPopup] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<CatalogProduct | null>(null);

  useEffect(() => {
    if (params.cart === '1') router.replace('/basket');
  }, [params.cart, router]);

  useEffect(() => {
    if (!currentProject) setShowProjectPopup(true);
  }, [currentProject]);

  useEffect(() => {
    if (!FEATURE_FLAGS.WATER_COMPONENTS_ENABLED && selectedCategory === 'water') {
      setSelectedCategory('all');
    }
  }, [selectedCategory]);

  const buildSpec = useMemo(
    () =>
      currentProject?.camper_state && (currentProject.camper_state as any).usage
        ? calculate(currentProject.camper_state as any)
        : null,
    [currentProject?.camper_state],
  );

  const cartSummary = useMemo(() => {
    if (buildSpec) {
      const value = calculateValueSaved({
        recommendedBankAh: buildSpec.recommendedBankAh,
        recommendedSolarW: buildSpec.recommendedSolarW,
        dailyAh: buildSpec.dailyAh,
        inverterSize: buildSpec.inverterSize,
        dcDcChargerSize: buildSpec.dcDcChargerSize,
      });
      return {
        poundsSaved: Math.max(40, Math.round(Math.min(value.wasteCostAvoided * 0.6, total * 0.15))),
        hoursSaved: Math.max(8, Math.round(Math.min(value.timeHoursSaved * 0.75, 42))),
      };
    }
    return {
      poundsSaved: Math.max(25, Math.round(total * 0.1)),
      hoursSaved: Math.max(6, Math.round(count * 1.4)),
    };
  }, [buildSpec, total, count]);

  const launchCatalog = useMemo(
    () => APP_CATALOG.filter((p) => FEATURE_FLAGS.WATER_COMPONENTS_ENABLED || p.category !== 'water'),
    [],
  );

  const categoryCounts = useMemo(() => {
    const map: Record<string, number> = { all: launchCatalog.length };
    for (const p of launchCatalog) map[p.category] = (map[p.category] ?? 0) + 1;
    return map;
  }, [launchCatalog]);

  const idsInCart = useMemo(() => new Set(items.map((i) => i.product.id)), [items]);

  const filteredCatalog = useMemo(() => {
    let list = launchCatalog.filter((p) => (mode === 'shop' ? p.category !== 'misc' : true));
    if (selectedCategory !== 'all') list = list.filter((p) => p.category === selectedCategory);
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      list = list.filter((p) => p.searchableText.includes(q));
    }
    if (stockOnly) list = list.filter((p) => p.stockStatus === 'in_stock');
    list = [...list];
    if (sortKey === 'name') list.sort((a, b) => a.name.localeCompare(b.name));
    if (sortKey === 'price_low') list.sort((a, b) => (a.price.incVat ?? 0) - (b.price.incVat ?? 0));
    if (sortKey === 'price_high') list.sort((a, b) => (b.price.incVat ?? 0) - (a.price.incVat ?? 0));
    if (sortKey === 'recommended') {
      list.sort((a, b) => {
        const aScore = (a.compatibility.recommendationEligible ? 2 : 0) + (a.source === 'legacy' ? 1 : 0);
        const bScore = (b.compatibility.recommendationEligible ? 2 : 0) + (b.source === 'legacy' ? 1 : 0);
        return bScore - aScore;
      });
    }
    return list;
  }, [launchCatalog, mode, selectedCategory, query, stockOnly, sortKey]);

  const openProduct = (p: CatalogProduct) => {
    setSelectedProduct(p);
    trackProductViewed(catalogCartId(p), p.name, Number(p.price.incVat ?? 0));
  };

  const addCatalogItem = (p: CatalogProduct) => {
    const cartProduct = catalogToCartProduct(p);
    addItem(cartProduct);
    trackAddToBasket(cartProduct.id, p.name, Number(p.price.incVat ?? 0), 1);
  };

  const removeCatalogItem = (p: CatalogProduct) => {
    removeItem(catalogCartId(p));
    trackRemoveFromBasket(catalogCartId(p));
  };

  const categoryKeys = ['all', ...Object.keys(categoryCounts).filter((k) => k !== 'all')];
  const featuredProducts = useMemo(
    () =>
      filteredCatalog
        .filter((p) => p.compatibility.recommendationEligible || p.source === 'legacy')
        .slice(0, 3),
    [filteredCatalog],
  );

  return (
    <View style={[s.container, { backgroundColor: theme.background }]}>
      <TopographicBackground />
      <ScrollView
        style={s.scroll}
        contentContainerStyle={[s.content, { paddingTop: insets.top + 18 }]}
        showsVerticalScrollIndicator={false}
      >
        <TouchableOpacity onPress={() => goBackOrHome(router)} style={s.backBtn} activeOpacity={0.7}>
          <FontAwesome name="chevron-left" size={14} color={theme.accent} />
          <Text style={[s.backText, { color: theme.accent }]}>Back</Text>
        </TouchableOpacity>

        <Text style={[s.heading, { color: theme.text }]}>Crafted Store</Text>
        <Text style={[s.subheading, { color: theme.textSecondary }]}>
          Bespoke commerce + build library, powered by your live supplier catalog.
        </Text>

        <GlassCard style={[s.heroCard, { borderColor: `${theme.accent}40`, borderWidth: 1 }]}>
          <Text style={[s.heroEyebrow, { color: theme.accent }]}>
            {mode === 'shop' ? 'BUILT TO BUY FAST' : 'BUILT TO RESEARCH FAST'}
          </Text>
          <Text style={[s.heroTitle, { color: theme.text }]}>
            {mode === 'shop' ? 'Shop with Build Intelligence' : 'Your Van Build Library'}
          </Text>
          <Text style={[s.heroBody, { color: theme.textSecondary }]}>
            {mode === 'shop'
              ? 'Use filters to find the right products faster, then add directly to your basket.'
              : 'Open any item to review specs, stock context, and documentation before purchasing.'}
          </Text>
        </GlassCard>

        <View style={s.modeSwitch}>
          <TouchableOpacity
            onPress={() => setMode('shop')}
            style={[s.modeBtn, mode === 'shop' && { backgroundColor: theme.accent }]}
            activeOpacity={0.8}
          >
            <Text style={[s.modeText, { color: mode === 'shop' ? '#1A1A1A' : theme.text }]}>Shop</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setMode('repository')}
            style={[s.modeBtn, mode === 'repository' && { backgroundColor: theme.accent }]}
            activeOpacity={0.8}
          >
            <Text style={[s.modeText, { color: mode === 'repository' ? '#1A1A1A' : theme.text }]}>Library</Text>
          </TouchableOpacity>
        </View>

        <GlassCard style={[s.basketCard, { borderColor: `${theme.accent}35`, borderWidth: 1 }]}>
          <View style={s.basketTop}>
            <Text style={[s.basketTitle, { color: theme.text }]}>Basket: {count} item{count === 1 ? '' : 's'}</Text>
            <Text style={[s.basketTotal, { color: theme.accent }]}>£{total.toLocaleString()}</Text>
          </View>
          <Text style={[s.basketMeta, { color: theme.textSecondary }]}>
            Estimated saving vs individual purchases: ~£{cartSummary.poundsSaved}
          </Text>
          <Text style={[s.basketMeta, { color: theme.textSecondary }]}>
            Estimated planning time saved: ~{cartSummary.hoursSaved} hours
          </Text>
          <TouchableOpacity
            style={[s.basketBtn, { backgroundColor: theme.accent }]}
            onPress={() => router.push('/basket')}
            activeOpacity={0.85}
          >
            <Text style={s.basketBtnText}>View your basket</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[s.guidedBtn, { borderColor: `${theme.accent}35` }]}
            onPress={() => router.push('/(tabs)/three')}
            activeOpacity={0.85}
          >
            <Text style={[s.guidedBtnText, { color: theme.accent }]}>Continue guided build → Summary</Text>
          </TouchableOpacity>
        </GlassCard>

        <GlassCard style={s.filtersWrap}>
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search products, SKUs, brands..."
            placeholderTextColor={theme.textSecondary}
            style={[s.searchInput, { color: theme.text, borderColor: theme.cardBorder }]}
          />
          <View style={s.chipsRow}>
            {categoryKeys.map((key) => {
              const label = key === 'all' ? 'All' : (CATEGORY_META[key]?.label ?? key);
              const isOn = key === selectedCategory;
              return (
                <TouchableOpacity
                  key={key}
                  style={[s.chip, isOn && { backgroundColor: `${theme.accent}20`, borderColor: theme.accent }]}
                  onPress={() => setSelectedCategory(key)}
                  activeOpacity={0.8}
                >
                  <Text style={[s.chipText, { color: isOn ? theme.accent : theme.text }]}>
                    {label} ({categoryCounts[key] ?? 0})
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
          <View style={s.filtersRow}>
            <TouchableOpacity
              style={[s.smallFilterBtn, stockOnly && { backgroundColor: `${theme.success}20`, borderColor: theme.success }]}
              onPress={() => setStockOnly((v) => !v)}
              activeOpacity={0.8}
            >
              <Text style={[s.smallFilterText, { color: stockOnly ? theme.success : theme.textSecondary }]}>
                In stock
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={s.smallFilterBtn}
              onPress={() => {
                const order: SortKey[] = ['recommended', 'price_low', 'price_high', 'name'];
                const idx = order.indexOf(sortKey);
                setSortKey(order[(idx + 1) % order.length]);
              }}
              activeOpacity={0.8}
            >
              <Text style={[s.smallFilterText, { color: theme.textSecondary }]}>
                Sort: {sortKey.replace('_', ' ')}
              </Text>
            </TouchableOpacity>
          </View>
        </GlassCard>

        <Text style={[s.sectionLabel, { color: theme.accent }]}>
          {mode === 'shop' ? 'SHOP PRODUCTS' : 'LIBRARY ITEMS'} ({filteredCatalog.length})
        </Text>

        {featuredProducts.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.featuredScroll} contentContainerStyle={s.featuredScrollContent}>
            {featuredProducts.map((p) => (
              <TouchableOpacity
                key={`featured_${p.id}`}
                onPress={() => openProduct(p)}
                activeOpacity={0.85}
                style={[s.featuredCard, { borderColor: `${theme.accent}30` }]}
              >
                <Text style={[s.featuredLabel, { color: theme.accent }]}>Featured</Text>
                <Text style={[s.featuredTitle, { color: theme.text }]} numberOfLines={2}>{p.name}</Text>
                <Text style={[s.featuredSub, { color: theme.textSecondary }]} numberOfLines={1}>
                  {p.brand ?? p.category}
                </Text>
                <Text style={[s.featuredPrice, { color: theme.text }]}>
                  £{Number(p.price.incVat ?? p.price.listPrice ?? 0).toLocaleString()}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {filteredCatalog.map((p) => {
          const cartId = catalogCartId(p);
          const inCart = idsInCart.has(cartId);
          return (
            <ProductCard
              key={p.id}
              product={p}
              inCart={inCart}
              onAdd={() => addCatalogItem(p)}
              onRemove={() => removeCatalogItem(p)}
              onOpen={() => openProduct(p)}
              theme={theme}
            />
          );
        })}

        <View style={{ height: 40 }} />
      </ScrollView>

      <Modal
        visible={!!selectedProduct}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedProduct(null)}
      >
        <View style={s.modalBackdrop}>
          <View style={[s.modalCard, { backgroundColor: theme.background }]}>
            {!!selectedProduct?.imageUrl && (
              <View style={s.modalImageWrap}>
                <Image source={{ uri: selectedProduct.imageUrl }} style={s.modalImage} resizeMode="contain" />
              </View>
            )}
            <Text style={[s.modalTitle, { color: theme.text }]}>{selectedProduct?.name}</Text>
            <View style={s.modalPillsRow}>
              <View style={[s.badge, { backgroundColor: `${theme.accent}1A`, borderColor: `${theme.accent}40` }]}>
                <Text style={[s.badgeText, { color: theme.accent }]}>CURATED</Text>
              </View>
              <View style={[s.badge, { backgroundColor: 'rgba(0,0,0,0.03)', borderColor: 'rgba(0,0,0,0.08)' }]}>
                <Text style={[s.badgeText, { color: theme.textSecondary }]}>{selectedProduct?.category?.toUpperCase() ?? 'MISC'}</Text>
              </View>
            </View>
            <Text style={[s.modalText, { color: theme.textSecondary }]}>
              {selectedProduct?.longDescription || selectedProduct?.shortDescription || 'No description yet.'}
            </Text>
            <Text style={[s.modalText, { color: theme.accent }]}>
              £{Number(selectedProduct?.price.incVat ?? selectedProduct?.price.listPrice ?? 0).toLocaleString()} ·{' '}
              {selectedProduct?.stockLabel ?? selectedProduct?.stockStatus}
            </Text>
            <View style={s.modalActions}>
              <TouchableOpacity
                style={[s.modalBtnGhost, { borderColor: `${theme.accent}35` }]}
                onPress={() => {
                  if (selectedProduct?.manualUrl) Linking.openURL(selectedProduct.manualUrl);
                }}
                activeOpacity={0.8}
              >
                <Text style={[s.modalBtnGhostText, { color: theme.accent }]}>Manual</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.modalBtnGhost, { borderColor: `${theme.accent}35` }]}
                onPress={() => {
                  if (selectedProduct) {
                    router.push({ pathname: '/repository-item' as never, params: { id: selectedProduct.id } } as never);
                    setSelectedProduct(null);
                  }
                }}
                activeOpacity={0.8}
              >
                <Text style={[s.modalBtnGhostText, { color: theme.accent }]}>Open page</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.modalBtnSolid, { backgroundColor: theme.accent }]}
                onPress={() => {
                  if (selectedProduct) addCatalogItem(selectedProduct);
                }}
                activeOpacity={0.85}
              >
                <Text style={s.modalBtnSolidText}>Add</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity onPress={() => setSelectedProduct(null)} style={s.closeX} activeOpacity={0.8}>
              <FontAwesome name="close" size={16} color={theme.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={showProjectPopup} transparent animationType="fade" onRequestClose={() => setShowProjectPopup(false)}>
        <View style={s.modalBackdrop}>
          <View style={[s.modalCard, { backgroundColor: theme.background }]}>
            <Text style={[s.modalTitle, { color: theme.text }]}>Want tailored recommendations?</Text>
            <Text style={[s.modalText, { color: theme.textSecondary }]}>
              Create/select your project first and we will tailor this shop to your exact van and usage profile.
            </Text>
            <View style={s.modalActions}>
              <TouchableOpacity
                style={[s.modalBtnGhost, { borderColor: `${theme.accent}35` }]}
                onPress={() => setShowProjectPopup(false)}
                activeOpacity={0.8}
              >
                <Text style={[s.modalBtnGhostText, { color: theme.accent }]}>Browse shop</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.modalBtnSolid, { backgroundColor: theme.accent }]}
                onPress={() => {
                  setShowProjectPopup(false);
                  router.push('/projects');
                }}
                activeOpacity={0.85}
              >
                <Text style={s.modalBtnSolidText}>Create project</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flex: 1 },
  content: { padding: 24 },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 20 },
  backText: { fontSize: 14, fontWeight: '600' },
  heading: { fontSize: 32, fontWeight: '800', marginBottom: 6 },
  subheading: { fontSize: 13, lineHeight: 18, marginBottom: 14 },
  heroCard: { marginBottom: 12 },
  heroEyebrow: { fontSize: 10, letterSpacing: 2, fontWeight: '800', marginBottom: 8 },
  heroTitle: { fontSize: 22, fontWeight: '800', marginBottom: 6 },
  heroBody: { fontSize: 13, lineHeight: 19 },
  modeSwitch: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  modeBtn: { flex: 1, borderWidth: 1, borderColor: 'rgba(0,0,0,0.08)', borderRadius: 10, paddingVertical: 10, alignItems: 'center' },
  modeText: { fontSize: 13, fontWeight: '800' },
  basketCard: { marginBottom: 14 },
  basketTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  basketTitle: { fontSize: 16, fontWeight: '800' },
  basketTotal: { fontSize: 18, fontWeight: '800' },
  basketMeta: { fontSize: 12, lineHeight: 17 },
  basketBtn: { marginTop: 10, borderRadius: 10, alignItems: 'center', paddingVertical: 12 },
  basketBtnText: { color: '#1A1A1A', fontSize: 14, fontWeight: '800' },
  guidedBtn: { marginTop: 8, borderRadius: 10, borderWidth: 1, alignItems: 'center', paddingVertical: 11 },
  guidedBtnText: { fontSize: 12, fontWeight: '800' },
  filtersWrap: { marginBottom: 14 },
  searchInput: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, marginBottom: 10 },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  chip: { borderWidth: 1, borderColor: 'rgba(0,0,0,0.08)', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6 },
  chipText: { fontSize: 11, fontWeight: '700' },
  filtersRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  smallFilterBtn: { borderWidth: 1, borderColor: 'rgba(0,0,0,0.08)', borderRadius: 9, paddingHorizontal: 10, paddingVertical: 7 },
  smallFilterText: { fontSize: 11, fontWeight: '700' },
  sectionLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 2, marginBottom: 10 },
  featuredScroll: { marginBottom: 10 },
  featuredScrollContent: { gap: 8, paddingRight: 8 },
  featuredCard: {
    width: 220,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: 'rgba(0,0,0,0.02)',
  },
  featuredLabel: { fontSize: 10, letterSpacing: 1.5, fontWeight: '800', marginBottom: 6 },
  featuredTitle: { fontSize: 15, fontWeight: '800', marginBottom: 4 },
  featuredSub: { fontSize: 11, marginBottom: 8 },
  featuredPrice: { fontSize: 14, fontWeight: '800' },
  productCard: { marginBottom: 10 },
  productMetaRow: { flexDirection: 'row', gap: 6, marginBottom: 8 },
  badge: { borderRadius: 999, borderWidth: 1, paddingHorizontal: 8, paddingVertical: 3 },
  badgeText: { fontSize: 9, fontWeight: '800', letterSpacing: 0.8 },
  productRow: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  thumb: { width: 58, height: 58, borderRadius: 12, backgroundColor: 'rgba(0,0,0,0.04)', alignItems: 'center', justifyContent: 'center' },
  thumbImage: { width: 54, height: 54 },
  productTitle: { fontSize: 14, fontWeight: '700' },
  productSub: { fontSize: 11, marginTop: 2 },
  productActions: { marginTop: 10, flexDirection: 'row', gap: 8 },
  linkBtn: { flex: 1, borderRadius: 8, borderWidth: 1, alignItems: 'center', paddingVertical: 9 },
  linkText: { fontSize: 12, fontWeight: '700' },
  cartBtn: { flex: 1, borderRadius: 8, borderWidth: 1, alignItems: 'center', paddingVertical: 9 },
  cartBtnText: { fontSize: 12, fontWeight: '800' },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'center', padding: 24 },
  modalCard: { borderRadius: 14, padding: 18, position: 'relative' },
  modalImageWrap: { height: 120, borderRadius: 12, backgroundColor: 'rgba(0,0,0,0.03)', marginBottom: 10, alignItems: 'center', justifyContent: 'center' },
  modalImage: { width: '92%', height: '92%' },
  modalTitle: { fontSize: 18, fontWeight: '800', marginBottom: 8, paddingRight: 18 },
  modalPillsRow: { flexDirection: 'row', gap: 6, marginBottom: 8 },
  modalText: { fontSize: 13, lineHeight: 19, marginBottom: 8 },
  modalActions: { marginTop: 10, flexDirection: 'row', gap: 8 },
  modalBtnGhost: { flex: 1, borderRadius: 10, borderWidth: 1, alignItems: 'center', paddingVertical: 11 },
  modalBtnGhostText: { fontSize: 13, fontWeight: '700' },
  modalBtnSolid: { flex: 1, borderRadius: 10, alignItems: 'center', paddingVertical: 11 },
  modalBtnSolidText: { color: '#1A1A1A', fontSize: 13, fontWeight: '800' },
  closeX: { position: 'absolute', top: 12, right: 12, padding: 4 },
});

