/**
 * Crafted Camper Co. — Flat Pack Van Life
 * Furniture tab in the project journey. Shows the configurator for compatible
 * vans, or a coming-soon message otherwise.
 */
import FurnitureViewer3D from '@/components/FurnitureViewer3D';
import GlassCard from '@/components/GlassCard';
import TopographicBackground from '@/components/TopographicBackground';
import { FEATURE_FLAGS } from '@/constants/featureFlags';
import { useCamper } from '@/context/CamperContext';
import { useTheme } from '@/context/ThemeContext';
import { useScreenSlide } from '@/hooks/useScreenSlide';
import {
  COUNTERTOP_OPTIONS,
  calculateKitPrice,
  DEFAULT_FURNITURE_CONFIG,
  FURNITURE_KIT,
  isVanFurnitureCompatible,
  type CountertopOption,
  type FurnitureKitConfig,
} from '@/utils/furnitureKits';
import { EGGER_DECORS, type EggerDecor } from '@/utils/eggerDecors';
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

const SWATCH_SIZE = 48;
const SWATCH_GAP = 10;

type DecorCategory = 'all' | 'woodgrain' | 'solid';
const DECOR_FILTERS: { key: DecorCategory; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'woodgrain', label: 'Woodgrain' },
  { key: 'solid', label: 'Solid Colours' },
];

function getContrastColor(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return 0.299 * r + 0.587 * g + 0.114 * b > 140 ? '#1A1A1A' : '#FFFFFF';
}

export default function FurnitureTab() {
  const theme = useTheme();
  const router = useRouter();
  const { state } = useCamper();
  const { style: slideStyle, panHandlers } = useScreenSlide(4, false);
  const isDark = theme.blurTint === 'dark';
  const van = state.van;
  const isCompatible = isVanFurnitureCompatible(van);

  const [config, setConfig] = useState<FurnitureKitConfig>({
    ...DEFAULT_FURNITURE_CONFIG,
    cabinetDecor: EGGER_DECORS[0],
  });
  const [decorFilter, setDecorFilter] = useState<DecorCategory>('all');

  const headerAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(headerAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start();
  }, []);

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
    const vanLabel = van ? `${van.manufacturerName} ${van.model} ${van.wheelbase}` : 'Not specified';
    const decorLabel = config.cabinetDecor ? `${config.cabinetDecor.name} (${config.cabinetDecor.code})` : 'Custom';
    const ctLabel = COUNTERTOP_OPTIONS.find((o) => o.key === config.countertop)?.label ?? config.countertop;
    const cutouts = [config.sinkCutout ? 'Sink' : null, config.fridgeCutout ? 'Fridge' : null].filter(Boolean).join(', ') || 'None';
    const body = `Hi Dan,\n\nI'd like to enquire about a Flat Pack Van Life furniture kit:\n\nVan: ${vanLabel}\nCabinet Finish: ${decorLabel}\nCountertop: ${ctLabel}\nCut-outs: ${cutouts}\n\nPlease confirm pricing and lead time.\n\nThanks`;
    Linking.openURL(`mailto:dan@craftedcamper.co?subject=Flat Pack Van Life Enquiry&body=${encodeURIComponent(body)}`);
  }, [van, config]);

  useEffect(() => {
    if (!FEATURE_FLAGS.THREE_D_KITS_ENABLED) {
      router.replace('/three');
    }
  }, [router]);

  if (!FEATURE_FLAGS.THREE_D_KITS_ENABLED) return null;

  // Not compatible — show coming soon
  if (!isCompatible) {
    return (
      <Animated.View style={[{ flex: 1, backgroundColor: theme.background }, slideStyle]} {...panHandlers}>
        <TopographicBackground />
        <ScrollView style={s.scroll} contentContainerStyle={[s.content, { justifyContent: 'center', minHeight: '100%' }]} showsVerticalScrollIndicator={false}>
          <GlassCard style={s.section}>
            <View style={{ alignItems: 'center', paddingVertical: 20 }}>
              <MaterialCommunityIcons name="sofa-outline" size={48} color={theme.textSecondary} style={{ opacity: 0.4, marginBottom: 16 }} />
              <Text style={[{ fontSize: 22, fontWeight: '800', marginBottom: 8, textAlign: 'center' }, { color: theme.text }]}>
                Flat Pack Van Life
              </Text>
              <Text style={[{ fontSize: 14, lineHeight: 21, textAlign: 'center', marginBottom: 20 }, { color: theme.textSecondary }]}>
                Bespoke CNC-cut camper furniture kits are currently available for VW Crafter MWB and Mercedes Sprinter MWB.
                {van ? `\n\nYour ${van.manufacturerName} ${van.model} kit is coming soon.` : '\n\nSelect a van in your project to check availability.'}
              </Text>
              <View style={[{ paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, borderWidth: 1 }, { backgroundColor: `${theme.accent}12`, borderColor: `${theme.accent}25` }]}>
                <Text style={[{ fontSize: 10, fontWeight: '800', letterSpacing: 1.5 }, { color: theme.accent }]}>COMING SOON</Text>
              </View>
            </View>
          </GlassCard>
        </ScrollView>
      </Animated.View>
    );
  }

  // Compatible — full configurator
  return (
    <Animated.View style={[{ flex: 1, backgroundColor: theme.background }, slideStyle]} {...panHandlers}>
      <TopographicBackground />
      <ScrollView style={s.scroll} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <Animated.View style={{ opacity: headerAnim, transform: [{ translateY: headerAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }}>
          <Text style={[s.eyebrow, { color: theme.accent }]}>FLAT PACK VAN LIFE</Text>
          <Text style={[s.heading, { color: theme.text }]}>Bespoke Camper Furniture</Text>
          <Text style={[s.subheading, { color: theme.textSecondary }]}>
            {FURNITURE_KIT.description}
          </Text>
        </Animated.View>

        {/* Van badge */}
        <View style={[s.vanBadge, { backgroundColor: `${theme.success}12`, borderColor: `${theme.success}35` }]}>
          <MaterialCommunityIcons name="check-circle" size={16} color={theme.success} />
          <Text style={[s.vanBadgeText, { color: theme.text }]}>
            {van!.manufacturerName} {van!.model} {van!.wheelbase} — Kit available
          </Text>
        </View>

        {/* 3D Viewer */}
        <View style={s.viewerWrap}>
          <FurnitureViewer3D
            cabinetHex={cabinetHex}
            countertop={config.countertop}
            sinkCutout={config.sinkCutout}
            fridgeCutout={config.fridgeCutout}
          />
        </View>

        {/* Cabinet Colour */}
        <GlassCard style={s.section}>
          <Text style={[s.sectionLabel, { color: theme.accent }]}>CABINET FINISH</Text>
          <Text style={[s.sectionDesc, { color: theme.textSecondary }]}>
            Choose from any Egger laminate finish for a fully bespoke look.
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.filterRow} style={{ marginBottom: 14 }}>
            {DECOR_FILTERS.map((f) => (
              <TouchableOpacity
                key={f.key}
                style={[s.filterChip, { backgroundColor: decorFilter === f.key ? `${theme.accent}22` : isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)', borderColor: decorFilter === f.key ? `${theme.accent}60` : 'transparent' }]}
                onPress={() => setDecorFilter(f.key)} activeOpacity={0.7}
              >
                <Text style={[s.filterChipText, { color: decorFilter === f.key ? theme.accent : theme.textSecondary }]}>{f.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          <View style={s.swatchGrid}>
            {filteredDecors.map((decor) => {
              const sel = config.cabinetDecor?.code === decor.code;
              return (
                <TouchableOpacity key={decor.code} onPress={() => selectDecor(decor)} activeOpacity={0.8}>
                  <View style={[s.swatch, { backgroundColor: decor.hexColor }, sel && { borderColor: theme.accent, borderWidth: 2.5 }]}>
                    {sel && <MaterialCommunityIcons name="check" size={18} color={getContrastColor(decor.hexColor)} />}
                  </View>
                  <Text style={[s.swatchLabel, { color: sel ? theme.accent : theme.textSecondary }]} numberOfLines={2}>{decor.name}</Text>
                </TouchableOpacity>
              );
            })}
            <TouchableOpacity onPress={handleEnquire} activeOpacity={0.8}>
              <View style={[s.swatch, s.swatchCustom, { borderColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.12)', backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)' }]}>
                <MaterialCommunityIcons name="plus" size={20} color={theme.textSecondary} />
              </View>
              <Text style={[s.swatchLabel, { color: theme.textSecondary }]} numberOfLines={2}>Custom</Text>
            </TouchableOpacity>
          </View>
          {config.cabinetDecor && (
            <View style={[s.selectedBadge, { backgroundColor: `${theme.accent}12`, borderColor: `${theme.accent}25` }]}>
              <View style={[s.selectedDot, { backgroundColor: config.cabinetDecor.hexColor }]} />
              <View style={{ flex: 1 }}>
                <Text style={[s.selectedName, { color: theme.text }]}>{config.cabinetDecor.name}</Text>
                <Text style={[s.selectedCode, { color: theme.textSecondary }]}>Egger {config.cabinetDecor.code.replace('_', ' ')}</Text>
              </View>
              <TouchableOpacity onPress={() => Linking.openURL(config.cabinetDecor!.productUrl)} activeOpacity={0.7}>
                <MaterialCommunityIcons name="open-in-new" size={16} color={theme.accent} />
              </TouchableOpacity>
            </View>
          )}
        </GlassCard>

        {/* Countertop */}
        <GlassCard style={s.section}>
          <Text style={[s.sectionLabel, { color: theme.accent }]}>COUNTERTOP</Text>
          <View style={s.optionRow}>
            {COUNTERTOP_OPTIONS.map((opt) => {
              const sel = config.countertop === opt.key;
              return (
                <TouchableOpacity key={opt.key} style={[s.optionCard, { backgroundColor: sel ? `${theme.accent}15` : isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)', borderColor: sel ? `${theme.accent}50` : isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }]} onPress={() => setCountertop(opt.key)} activeOpacity={0.8}>
                  <View style={[s.optionSwatch, { backgroundColor: opt.hexColor }]} />
                  <Text style={[s.optionLabel, { color: sel ? theme.accent : theme.text }]}>{opt.label}</Text>
                  {sel && <MaterialCommunityIcons name="check-circle" size={16} color={theme.accent} style={{ marginLeft: 'auto' }} />}
                </TouchableOpacity>
              );
            })}
          </View>
        </GlassCard>

        {/* Cut-outs */}
        <GlassCard style={s.section}>
          <Text style={[s.sectionLabel, { color: theme.accent }]}>CUT-OUTS</Text>
          <View style={[s.toggleRow, { borderBottomColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }]}>
            <MaterialCommunityIcons name="water-pump" size={20} color={theme.textSecondary} />
            <View style={{ flex: 1 }}>
              <Text style={[s.toggleLabel, { color: theme.text }]}>Sink Cut-out</Text>
              <Text style={[s.toggleHint, { color: theme.textSecondary }]}>Standard undermount sink</Text>
            </View>
            <Switch value={config.sinkCutout} onValueChange={toggleSink} trackColor={{ false: isDark ? '#2C2C2E' : '#D1D1D6', true: theme.success }} thumbColor="#fff" />
          </View>
          <View style={s.toggleRow}>
            <MaterialCommunityIcons name="fridge-outline" size={20} color={theme.textSecondary} />
            <View style={{ flex: 1 }}>
              <Text style={[s.toggleLabel, { color: theme.text }]}>Fridge Cut-out</Text>
              <Text style={[s.toggleHint, { color: theme.textSecondary }]}>Standard compressor fridge</Text>
            </View>
            <Switch value={config.fridgeCutout} onValueChange={toggleFridge} trackColor={{ false: isDark ? '#2C2C2E' : '#D1D1D6', true: theme.success }} thumbColor="#fff" />
          </View>
        </GlassCard>

        {/* Features */}
        <GlassCard style={s.section}>
          <Text style={[s.sectionLabel, { color: theme.accent }]}>WHAT'S INCLUDED</Text>
          {FURNITURE_KIT.features.map((f, i) => (
            <View key={i} style={s.featureRow}>
              <MaterialCommunityIcons name="check" size={14} color={theme.success} style={{ marginTop: 2 }} />
              <Text style={[s.featureText, { color: theme.text }]}>{f}</Text>
            </View>
          ))}
        </GlassCard>

        {/* CTA */}
        <GlassCard style={[s.section, { borderColor: `${theme.accent}35`, borderWidth: 1 }]} float>
          <Text style={[s.sectionLabel, { color: theme.accent }]}>YOUR CONFIGURATION</Text>
          <View style={s.summaryRow}><Text style={[s.summaryKey, { color: theme.textSecondary }]}>Cabinet finish</Text><Text style={[s.summaryVal, { color: theme.text }]}>{config.cabinetDecor?.name ?? 'Custom'}</Text></View>
          <View style={s.summaryRow}><Text style={[s.summaryKey, { color: theme.textSecondary }]}>Countertop</Text><Text style={[s.summaryVal, { color: theme.text }]}>{COUNTERTOP_OPTIONS.find(o => o.key === config.countertop)?.label}</Text></View>
          <View style={s.summaryRow}><Text style={[s.summaryKey, { color: theme.textSecondary }]}>Sink cut-out</Text><Text style={[s.summaryVal, { color: theme.text }]}>{config.sinkCutout ? 'Yes' : 'No'}</Text></View>
          <View style={s.summaryRow}><Text style={[s.summaryKey, { color: theme.textSecondary }]}>Fridge cut-out</Text><Text style={[s.summaryVal, { color: theme.text }]}>{config.fridgeCutout ? 'Yes' : 'No'}</Text></View>

          {price > 0 && (
            <View style={[s.priceBlock, { borderTopColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }]}>
              <Text style={[s.priceLabel, { color: theme.textSecondary }]}>ESTIMATED PRICE</Text>
              <Text style={[s.priceValue, { color: theme.accent }]}>£{price.toLocaleString()}</Text>
            </View>
          )}

          <TouchableOpacity style={[s.ctaBtn, { backgroundColor: theme.accent }]} onPress={handleEnquire} activeOpacity={0.85}>
            <MaterialCommunityIcons name="email-outline" size={16} color="#1A1A1A" />
            <Text style={s.ctaBtnText}>Enquire About This Kit</Text>
          </TouchableOpacity>
          <Text style={[s.ctaNote, { color: theme.textSecondary }]}>Prices confirmed on enquiry. Lead time typically 3–4 weeks.</Text>
        </GlassCard>

        <View style={{ height: 120 }} />
      </ScrollView>
    </Animated.View>
  );
}

const s = StyleSheet.create({
  scroll: { flex: 1 },
  content: { padding: 24, paddingTop: 24 },
  eyebrow: { fontSize: 10, fontWeight: '700', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 6 },
  heading: { fontSize: 28, fontWeight: '800', marginBottom: 8 },
  subheading: { fontSize: 14, lineHeight: 21, marginBottom: 20 },
  vanBadge: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingVertical: 12, borderRadius: 12, borderWidth: 1, marginBottom: 20 },
  vanBadgeText: { fontSize: 13, fontWeight: '600', flex: 1 },
  viewerWrap: { marginBottom: 24, borderRadius: 16, overflow: 'hidden' },
  section: { marginBottom: 20 },
  sectionLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 2, marginBottom: 10 },
  sectionDesc: { fontSize: 13, lineHeight: 19, marginBottom: 14 },
  filterRow: { gap: 8 },
  filterChip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1 },
  filterChipText: { fontSize: 12, fontWeight: '700' },
  swatchGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SWATCH_GAP },
  swatch: { width: SWATCH_SIZE, height: SWATCH_SIZE, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(0,0,0,0.1)', justifyContent: 'center', alignItems: 'center' },
  swatchCustom: { borderStyle: 'dashed', borderWidth: 1.5 },
  swatchLabel: { width: SWATCH_SIZE, fontSize: 9, fontWeight: '600', marginTop: 4, textAlign: 'center', lineHeight: 12 },
  selectedBadge: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10, borderWidth: 1, marginTop: 16 },
  selectedDot: { width: 24, height: 24, borderRadius: 6 },
  selectedName: { fontSize: 13, fontWeight: '700' },
  selectedCode: { fontSize: 11, marginTop: 1, fontFamily: 'SpaceMono' },
  optionRow: { gap: 10 },
  optionCard: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, paddingVertical: 14, borderRadius: 12, borderWidth: 1 },
  optionSwatch: { width: 32, height: 32, borderRadius: 8 },
  optionLabel: { fontSize: 14, fontWeight: '700' },
  toggleRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: 'transparent' },
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
  ctaBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 16, borderRadius: 12 },
  ctaBtnText: { color: '#1A1A1A', fontSize: 16, fontWeight: '800' },
  ctaNote: { fontSize: 11, textAlign: 'center', marginTop: 10, lineHeight: 16 },
});
