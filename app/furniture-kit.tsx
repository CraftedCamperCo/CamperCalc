/**
 * Crafted Camper Co. — Furniture Kit Configurator
 * 3D viewer with live cabinet colour, countertop, and cut-out configuration.
 */
import FurnitureViewer3D from '@/components/FurnitureViewer3D';
import GlassCard from '@/components/GlassCard';
import TopographicBackground from '@/components/TopographicBackground';
import { FEATURE_FLAGS } from '@/constants/featureFlags';
import type { VanSelection } from '@/context/CamperContext';
import { useProjects } from '@/context/ProjectContext';
import { useTheme } from '@/context/ThemeContext';
import { goBackOrHome } from '@/utils/navigation';
import {
  COUNTERTOP_OPTIONS,
  calculateKitPrice,
  DEFAULT_FURNITURE_CONFIG,
  FURNITURE_KIT,
  isVanFurnitureCompatible,
  type CountertopOption,
  type FurnitureKitConfig,
} from '@/utils/furnitureKits';
import { EGGER_DECORS, CUSTOM_DECOR_OPTION, type EggerDecor } from '@/utils/eggerDecors';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Linking,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width: SCREEN_W } = Dimensions.get('window');
const SWATCH_SIZE = 48;
const SWATCH_GAP = 10;

type DecorCategory = 'all' | 'woodgrain' | 'solid';
const DECOR_FILTERS: { key: DecorCategory; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'woodgrain', label: 'Woodgrain' },
  { key: 'solid', label: 'Solid Colours' },
];

export default function FurnitureKitScreen() {
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { currentProject } = useProjects();
  const van = (currentProject?.camper_state as any)?.van as VanSelection | null ?? null;
  const isDark = theme.blurTint === 'dark';

  const [config, setConfig] = useState<FurnitureKitConfig>({
    ...DEFAULT_FURNITURE_CONFIG,
    cabinetDecor: EGGER_DECORS[0],
  });
  const [decorFilter, setDecorFilter] = useState<DecorCategory>('all');

  const headerAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(headerAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start();
  }, []);
  useEffect(() => {
    if (!FEATURE_FLAGS.THREE_D_KITS_ENABLED) {
      router.replace('/shop');
    }
  }, [router]);

  const isCompatible = isVanFurnitureCompatible(van);
  const price = useMemo(() => calculateKitPrice(config), [config]);
  const cabinetHex = config.cabinetDecor?.hexColor ?? '#C4A882';

  const filteredDecors = useMemo(() => {
    if (decorFilter === 'all') return EGGER_DECORS;
    return EGGER_DECORS.filter((d) => d.category === decorFilter);
  }, [decorFilter]);

  const selectDecor = useCallback((decor: EggerDecor) => {
    setConfig((prev) => ({ ...prev, cabinetDecor: decor }));
  }, []);

  const setCountertop = useCallback((ct: CountertopOption) => {
    setConfig((prev) => ({ ...prev, countertop: ct }));
  }, []);

  const toggleSink = useCallback(() => {
    setConfig((prev) => ({ ...prev, sinkCutout: !prev.sinkCutout }));
  }, []);

  const toggleFridge = useCallback(() => {
    setConfig((prev) => ({ ...prev, fridgeCutout: !prev.fridgeCutout }));
  }, []);

  const handleEnquire = useCallback(() => {
    const vanLabel = van
      ? `${van.manufacturerName} ${van.model} ${van.wheelbase}`
      : 'Not specified';
    const decorLabel = config.cabinetDecor
      ? `${config.cabinetDecor.name} (${config.cabinetDecor.code})`
      : 'Custom — please discuss';
    const ctLabel = COUNTERTOP_OPTIONS.find((o) => o.key === config.countertop)?.label ?? config.countertop;
    const cutouts = [
      config.sinkCutout ? 'Sink cut-out' : null,
      config.fridgeCutout ? 'Fridge cut-out' : null,
    ]
      .filter(Boolean)
      .join(', ') || 'None';

    const body = `Hi Dan,\n\nI'd like to enquire about a CNC furniture kit:\n\nVan: ${vanLabel}\nCabinet Finish: ${decorLabel}\nCountertop: ${ctLabel}\nCut-outs: ${cutouts}\n\nPlease can you confirm pricing and lead time?\n\nThanks`;
    Linking.openURL(
      `mailto:dan@craftedcamper.co?subject=Furniture Kit Enquiry&body=${encodeURIComponent(body)}`,
    );
  }, [van, config]);

  if (!FEATURE_FLAGS.THREE_D_KITS_ENABLED) {
    return null;
  }

  return (
    <View style={[s.container, { backgroundColor: theme.background }]}>
      <TopographicBackground />
      <ScrollView
        style={s.scroll}
        contentContainerStyle={[s.content, { paddingTop: insets.top + 16 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Back */}
        <TouchableOpacity onPress={() => goBackOrHome(router)} style={s.backBtn} activeOpacity={0.7}>
          <FontAwesome name="chevron-left" size={14} color={theme.accent} />
          <Text style={[s.backText, { color: theme.accent }]}>Back</Text>
        </TouchableOpacity>

        {/* Header */}
        <Animated.View
          style={{
            opacity: headerAnim,
            transform: [{ translateY: headerAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }],
          }}
        >
          <Text style={[s.eyebrow, { color: theme.accent }]}>FLAT PACK VAN LIFE</Text>
          <Text style={[s.heading, { color: theme.text }]}>Bespoke Camper Furniture</Text>
          <Text style={[s.subheading, { color: theme.textSecondary }]}>
            {FURNITURE_KIT.description}
          </Text>
        </Animated.View>

        {/* Van badge */}
        {van && (
          <View
            style={[
              s.vanBadge,
              {
                backgroundColor: `${isCompatible ? theme.success : theme.danger}12`,
                borderColor: `${isCompatible ? theme.success : theme.danger}35`,
              },
            ]}
          >
            <MaterialCommunityIcons
              name={isCompatible ? 'check-circle' : 'alert-circle'}
              size={16}
              color={isCompatible ? theme.success : theme.danger}
            />
            <Text style={[s.vanBadgeText, { color: theme.text }]}>
              {van.manufacturerName} {van.model} {van.wheelbase}
              {isCompatible ? ' — Kit available' : ' — Coming soon for this van'}
            </Text>
          </View>
        )}

        {/* 3D Viewer */}
        <View style={s.viewerWrap}>
          <FurnitureViewer3D
            cabinetHex={cabinetHex}
            countertop={config.countertop}
            sinkCutout={config.sinkCutout}
            fridgeCutout={config.fridgeCutout}
          />
        </View>

        {/* ── Cabinet Colour ── */}
        <GlassCard style={s.section}>
          <Text style={[s.sectionLabel, { color: theme.accent }]}>CABINET FINISH</Text>
          <Text style={[s.sectionDesc, { color: theme.textSecondary }]}>
            Select from our curated Egger laminate range, or request any Egger decor for a fully bespoke finish.
          </Text>

          {/* Category filter */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={s.filterRow}
            style={{ marginBottom: 14 }}
          >
            {DECOR_FILTERS.map((f) => (
              <TouchableOpacity
                key={f.key}
                style={[
                  s.filterChip,
                  {
                    backgroundColor: decorFilter === f.key ? `${theme.accent}22` : isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
                    borderColor: decorFilter === f.key ? `${theme.accent}60` : 'transparent',
                  },
                ]}
                onPress={() => setDecorFilter(f.key)}
                activeOpacity={0.7}
              >
                <Text
                  style={[s.filterChipText, { color: decorFilter === f.key ? theme.accent : theme.textSecondary }]}
                >
                  {f.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Swatch grid */}
          <View style={s.swatchGrid}>
            {filteredDecors.map((decor) => {
              const isSelected = config.cabinetDecor?.code === decor.code;
              return (
                <TouchableOpacity key={decor.code} onPress={() => selectDecor(decor)} activeOpacity={0.8}>
                  <View
                    style={[
                      s.swatch,
                      { backgroundColor: decor.hexColor },
                      isSelected && { borderColor: theme.accent, borderWidth: 2.5 },
                    ]}
                  >
                    {isSelected && (
                      <MaterialCommunityIcons name="check" size={18} color={getContrastColor(decor.hexColor)} />
                    )}
                  </View>
                  <Text
                    style={[s.swatchLabel, { color: isSelected ? theme.accent : theme.textSecondary }]}
                    numberOfLines={2}
                  >
                    {decor.name}
                  </Text>
                </TouchableOpacity>
              );
            })}

            {/* Custom option */}
            <TouchableOpacity onPress={handleEnquire} activeOpacity={0.8}>
              <View
                style={[
                  s.swatch,
                  s.swatchCustom,
                  {
                    borderColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.12)',
                    backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
                  },
                ]}
              >
                <MaterialCommunityIcons name="plus" size={20} color={theme.textSecondary} />
              </View>
              <Text style={[s.swatchLabel, { color: theme.textSecondary }]} numberOfLines={2}>
                Custom
              </Text>
            </TouchableOpacity>
          </View>

          {/* Selected name */}
          {config.cabinetDecor && (
            <View style={[s.selectedBadge, { backgroundColor: `${theme.accent}12`, borderColor: `${theme.accent}25` }]}>
              <View style={[s.selectedDot, { backgroundColor: config.cabinetDecor.hexColor }]} />
              <View style={{ flex: 1 }}>
                <Text style={[s.selectedName, { color: theme.text }]}>{config.cabinetDecor.name}</Text>
                <Text style={[s.selectedCode, { color: theme.textSecondary }]}>Egger {config.cabinetDecor.code.replace('_', ' ')}</Text>
              </View>
              <TouchableOpacity
                onPress={() => Linking.openURL(config.cabinetDecor!.productUrl)}
                activeOpacity={0.7}
              >
                <MaterialCommunityIcons name="open-in-new" size={16} color={theme.accent} />
              </TouchableOpacity>
            </View>
          )}
        </GlassCard>

        {/* ── Countertop ── */}
        <GlassCard style={s.section}>
          <Text style={[s.sectionLabel, { color: theme.accent }]}>COUNTERTOP</Text>
          <View style={s.optionRow}>
            {COUNTERTOP_OPTIONS.map((opt) => {
              const isSelected = config.countertop === opt.key;
              return (
                <TouchableOpacity
                  key={opt.key}
                  style={[
                    s.optionCard,
                    {
                      backgroundColor: isSelected
                        ? `${theme.accent}15`
                        : isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
                      borderColor: isSelected ? `${theme.accent}50` : isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
                    },
                  ]}
                  onPress={() => setCountertop(opt.key)}
                  activeOpacity={0.8}
                >
                  <View style={[s.optionSwatch, { backgroundColor: opt.hexColor }]} />
                  <Text style={[s.optionLabel, { color: isSelected ? theme.accent : theme.text }]}>
                    {opt.label}
                  </Text>
                  {isSelected && (
                    <MaterialCommunityIcons name="check-circle" size={16} color={theme.accent} style={{ marginLeft: 'auto' }} />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </GlassCard>

        {/* ── Cut-outs ── */}
        <GlassCard style={s.section}>
          <Text style={[s.sectionLabel, { color: theme.accent }]}>CUT-OUTS</Text>
          <Text style={[s.sectionDesc, { color: theme.textSecondary }]}>
            Pre-cut holes for a standard sink and fridge unit, ready for drop-in installation.
          </Text>

          <View style={[s.toggleRow, { borderBottomColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }]}>
            <MaterialCommunityIcons name="water-pump" size={20} color={theme.textSecondary} />
            <View style={{ flex: 1 }}>
              <Text style={[s.toggleLabel, { color: theme.text }]}>Sink Cut-out</Text>
              <Text style={[s.toggleHint, { color: theme.textSecondary }]}>Standard undermount sink</Text>
            </View>
            <Switch
              value={config.sinkCutout}
              onValueChange={toggleSink}
              trackColor={{ false: isDark ? '#2C2C2E' : '#D1D1D6', true: theme.success }}
              thumbColor="#fff"
            />
          </View>

          <View style={s.toggleRow}>
            <MaterialCommunityIcons name="fridge-outline" size={20} color={theme.textSecondary} />
            <View style={{ flex: 1 }}>
              <Text style={[s.toggleLabel, { color: theme.text }]}>Fridge Cut-out</Text>
              <Text style={[s.toggleHint, { color: theme.textSecondary }]}>Standard compressor fridge</Text>
            </View>
            <Switch
              value={config.fridgeCutout}
              onValueChange={toggleFridge}
              trackColor={{ false: isDark ? '#2C2C2E' : '#D1D1D6', true: theme.success }}
              thumbColor="#fff"
            />
          </View>
        </GlassCard>

        {/* ── Features ── */}
        <GlassCard style={s.section}>
          <Text style={[s.sectionLabel, { color: theme.accent }]}>WHAT'S INCLUDED</Text>
          {FURNITURE_KIT.features.map((feat, i) => (
            <View key={i} style={s.featureRow}>
              <MaterialCommunityIcons name="check" size={14} color={theme.success} style={{ marginTop: 2 }} />
              <Text style={[s.featureText, { color: theme.text }]}>{feat}</Text>
            </View>
          ))}
        </GlassCard>

        {/* ── Price / CTA ── */}
        <GlassCard style={[s.section, { borderColor: `${theme.accent}35`, borderWidth: 1 }]} float>
          <Text style={[s.sectionLabel, { color: theme.accent }]}>YOUR CONFIGURATION</Text>

          <View style={s.summaryRow}>
            <Text style={[s.summaryKey, { color: theme.textSecondary }]}>Cabinet finish</Text>
            <Text style={[s.summaryVal, { color: theme.text }]}>{config.cabinetDecor?.name ?? 'Custom'}</Text>
          </View>
          <View style={s.summaryRow}>
            <Text style={[s.summaryKey, { color: theme.textSecondary }]}>Countertop</Text>
            <Text style={[s.summaryVal, { color: theme.text }]}>
              {COUNTERTOP_OPTIONS.find((o) => o.key === config.countertop)?.label}
            </Text>
          </View>
          <View style={s.summaryRow}>
            <Text style={[s.summaryKey, { color: theme.textSecondary }]}>Sink cut-out</Text>
            <Text style={[s.summaryVal, { color: theme.text }]}>{config.sinkCutout ? 'Yes' : 'No'}</Text>
          </View>
          <View style={s.summaryRow}>
            <Text style={[s.summaryKey, { color: theme.textSecondary }]}>Fridge cut-out</Text>
            <Text style={[s.summaryVal, { color: theme.text }]}>{config.fridgeCutout ? 'Yes' : 'No'}</Text>
          </View>

          {price > 0 && (
            <View style={[s.priceBlock, { borderTopColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }]}>
              <Text style={[s.priceLabel, { color: theme.textSecondary }]}>ESTIMATED PRICE</Text>
              <Text style={[s.priceValue, { color: theme.accent }]}>
                £{price.toLocaleString()}
              </Text>
            </View>
          )}

          <TouchableOpacity
            style={[s.ctaBtn, { backgroundColor: theme.accent }]}
            onPress={handleEnquire}
            activeOpacity={0.85}
          >
            <MaterialCommunityIcons name="email-outline" size={16} color="#1A1A1A" />
            <Text style={s.ctaBtnText}>Enquire About This Kit</Text>
          </TouchableOpacity>

          <Text style={[s.ctaNote, { color: theme.textSecondary }]}>
            Prices confirmed on enquiry. Lead time typically 3–4 weeks from order.
          </Text>
        </GlassCard>

        <View style={{ height: 50 }} />
      </ScrollView>
    </View>
  );
}

function getContrastColor(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const luma = 0.299 * r + 0.587 * g + 0.114 * b;
  return luma > 140 ? '#1A1A1A' : '#FFFFFF';
}

const s = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flex: 1 },
  content: { padding: 24 },

  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 24 },
  backText: { fontSize: 15, fontWeight: '600' },

  eyebrow: { fontSize: 10, fontWeight: '700', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 6 },
  heading: { fontSize: 28, fontWeight: '800', marginBottom: 8 },
  subheading: { fontSize: 14, lineHeight: 21, marginBottom: 20 },

  vanBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 14, paddingVertical: 12, borderRadius: 12, borderWidth: 1, marginBottom: 20,
  },
  vanBadgeText: { fontSize: 13, fontWeight: '600', flex: 1 },

  viewerWrap: { marginBottom: 24, borderRadius: 16, overflow: 'hidden' },

  section: { marginBottom: 20 },
  sectionLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 2, marginBottom: 10 },
  sectionDesc: { fontSize: 13, lineHeight: 19, marginBottom: 14 },

  filterRow: { gap: 8 },
  filterChip: {
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1,
  },
  filterChipText: { fontSize: 12, fontWeight: '700' },

  swatchGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: SWATCH_GAP,
  },
  swatch: {
    width: SWATCH_SIZE, height: SWATCH_SIZE, borderRadius: 12, borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
    justifyContent: 'center', alignItems: 'center',
  },
  swatchCustom: { borderStyle: 'dashed', borderWidth: 1.5 },
  swatchLabel: { width: SWATCH_SIZE, fontSize: 9, fontWeight: '600', marginTop: 4, textAlign: 'center', lineHeight: 12 },

  selectedBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10, borderWidth: 1, marginTop: 16,
  },
  selectedDot: { width: 24, height: 24, borderRadius: 6 },
  selectedName: { fontSize: 13, fontWeight: '700' },
  selectedCode: { fontSize: 11, marginTop: 1, fontFamily: 'SpaceMono' },

  optionRow: { gap: 10 },
  optionCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 14, paddingVertical: 14, borderRadius: 12, borderWidth: 1,
  },
  optionSwatch: { width: 32, height: 32, borderRadius: 8 },
  optionLabel: { fontSize: 14, fontWeight: '700' },

  toggleRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: 'transparent',
  },
  toggleLabel: { fontSize: 14, fontWeight: '600' },
  toggleHint: { fontSize: 11, marginTop: 2 },

  featureRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 10 },
  featureText: { fontSize: 13, lineHeight: 19, flex: 1 },

  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 },
  summaryKey: { fontSize: 12 },
  summaryVal: { fontSize: 13, fontWeight: '700' },

  priceBlock: { borderTopWidth: 1, paddingTop: 14, marginTop: 8, marginBottom: 16 },
  priceLabel: { fontSize: 9, fontWeight: '700', letterSpacing: 1 },
  priceValue: { fontSize: 32, fontWeight: '800' },

  ctaBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    paddingVertical: 16, borderRadius: 12,
  },
  ctaBtnText: { color: '#1A1A1A', fontSize: 16, fontWeight: '800' },
  ctaNote: { fontSize: 11, textAlign: 'center', marginTop: 10, lineHeight: 16 },
});
