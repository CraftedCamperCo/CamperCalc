import GlassCard from '@/components/GlassCard';
import TopographicBackground from '@/components/TopographicBackground';
import { InsulationSeason, useCamper } from '@/context/CamperContext';
import { useTheme } from '@/context/ThemeContext';
import { useScreenSlide } from '@/hooks/useScreenSlide';
import { calculateInsulation, type InsulationProduct } from '@/utils/insulationCalculator';
import { getVariant, variantLabel } from '@/utils/vanDatabase';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  LayoutAnimation,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  UIManager,
  View,
} from 'react-native';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const BAR_MAX_WIDTH = SCREEN_WIDTH - 120;

const PRODUCT_COLORS: Record<string, string> = {
  sound_deadening: '#E8A838',
  recycled_bottle: '#4A90D9',
  floor_duo: '#7B61FF',
};

function AnimatedMaterialBar({ product, maxM2, delay = 0 }: {
  product: InsulationProduct; maxM2: number; delay?: number;
}) {
  const theme = useTheme();
  const barWidth = useRef(new Animated.Value(0)).current;
  const numAnim = useRef(new Animated.Value(0)).current;
  const [displayNum, setDisplayNum] = useState(0);
  const target = maxM2 > 0 ? (product.quantityM2 / maxM2) * BAR_MAX_WIDTH : 0;
  const color = PRODUCT_COLORS[product.id] || theme.accent;

  useEffect(() => {
    const listener = numAnim.addListener(({ value: v }) => setDisplayNum(Math.round(v * 10) / 10));
    Animated.timing(barWidth, { toValue: Math.max(target, product.quantityM2 > 0 ? 4 : 0), duration: 3000, delay, useNativeDriver: false }).start();
    Animated.timing(numAnim, { toValue: product.quantityM2, duration: 3000, delay, useNativeDriver: false }).start();
    return () => numAnim.removeListener(listener);
  }, [target, product.quantityM2, delay]);

  return (
    <View style={barStyles.row}>
      <View style={barStyles.labelRow}>
        <View style={[barStyles.colorDot, { backgroundColor: color }]} />
        <Text style={[barStyles.label, { color: theme.textSecondary }]} numberOfLines={1}>{product.name}</Text>
        <Text style={[barStyles.value, { color: theme.text }]}>{displayNum} m²</Text>
      </View>
      <View style={[barStyles.track, { backgroundColor: theme.blurTint === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }]}>
        <Animated.View style={[barStyles.fill, { width: barWidth, backgroundColor: color }]} />
      </View>
    </View>
  );
}

export default function InsulationScreen() {
  const { state, set } = useCamper();
  const theme = useTheme();
  const router = useRouter();
  const { style: slideStyle, panHandlers } = useScreenSlide(2);

  const [showMethodology, setShowMethodology] = useState(false);

  const headerAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(headerAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start();
  }, []);

  const van = state.van;
  if (!van) {
    return (
      <Animated.View style={[{ flex: 1, backgroundColor: theme.background }, slideStyle]} {...panHandlers}>
        <TopographicBackground />
        <ScrollView style={styles.scroll} contentContainerStyle={[styles.content, { justifyContent: 'center', minHeight: '100%' }]} showsVerticalScrollIndicator={false}>
          <GlassCard style={styles.card}>
            <FontAwesome name="truck" size={32} color={theme.textSecondary} style={{ alignSelf: 'center', marginBottom: 16, opacity: 0.5 }} />
            <Text style={[styles.noVanTitle, { color: theme.text }]}>No Van Selected</Text>
            <Text style={[styles.noVanDesc, { color: theme.textSecondary }]}>
              Insulation recommendations require your van details. Select your van when creating a project, or update it in your project settings.
            </Text>
          </GlassCard>
        </ScrollView>
      </Animated.View>
    );
  }

  const variant = getVariant(van.manufacturerId, van.model, van.wheelbase, van.roofHeight);
  if (!variant) {
    return (
      <Animated.View style={[{ flex: 1, backgroundColor: theme.background }, slideStyle]} {...panHandlers}>
        <TopographicBackground />
        <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
          <GlassCard style={styles.card}>
            <Text style={[styles.noVanTitle, { color: theme.text }]}>Van Not Found</Text>
            <Text style={[styles.noVanDesc, { color: theme.textSecondary }]}>
              We couldn't match your van details to our database. Please create a new project with your correct van selection.
            </Text>
          </GlassCard>
        </ScrollView>
      </Animated.View>
    );
  }

  const vanLabel = `${van.manufacturerName} ${van.model} (${variantLabel(variant)})`;
  const result = calculateInsulation(variant, state.climates, vanLabel, {
    insulationSeason: state.insulationSeason,
    useVapourBarrier: false,
    windowPlan: state.windowPlan,
  });
  const maxM2 = Math.max(...result.products.map(p => p.quantityM2));
  const isDark = theme.blurTint === 'dark';

  const toggleMethodology = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setShowMethodology(s => !s);
  };

  const setSeason = (season: InsulationSeason) => {
    set('insulationSeason', season);
  };

  const toggleInsulationEnabled = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    set('insulationEnabled', !state.insulationEnabled);
  };

  const toggleWindowPlan = (key: keyof typeof state.windowPlan) => {
    set('windowPlan', { ...state.windowPlan, [key]: !state.windowPlan[key] });
  };

  return (
    <Animated.View style={[{ flex: 1, backgroundColor: theme.background }, slideStyle]} {...panHandlers}>
      <TopographicBackground />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* HERO */}
        <Animated.View style={{ opacity: headerAnim, transform: [{ translateY: headerAnim.interpolate({ inputRange: [0, 1], outputRange: [30, 0] }) }] }}>
          <Text style={[styles.eyebrow, { color: theme.accent }]}>INSULATION GUIDE</Text>
          <Text style={[styles.title, { color: theme.text }]}>Your Insulation Spec</Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            Calculated for your {van.manufacturerName} {van.model} and {result.climateLabel.toLowerCase()} climate profile.
          </Text>
        </Animated.View>

        <GlassCard style={styles.card}>
          <Text style={[styles.sectionLabel, { color: theme.accent }]}>INSULATION REQUIRED?</Text>
          <View style={styles.toggleRow}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.toggleTitle, { color: theme.text }]}>
                {state.insulationEnabled ? 'Insulation included in this build' : 'Insulation skipped for this build'}
              </Text>
              <Text style={[styles.toggleDesc, { color: theme.textSecondary }]}>
                Turn this off if insulation is already installed and you only want electrical recommendations.
              </Text>
            </View>
            <Switch
              value={state.insulationEnabled}
              onValueChange={toggleInsulationEnabled}
              trackColor={{ false: isDark ? '#2C2C2E' : '#D1D1D6', true: theme.success }}
              thumbColor="#fff"
            />
          </View>
        </GlassCard>

        {state.insulationEnabled ? (
          <>
            {/* VAN BADGE */}
            <View style={[styles.vanBadge, { backgroundColor: `${theme.accent}10`, borderColor: `${theme.accent}30` }]}>
              <FontAwesome name="truck" size={14} color={theme.accent} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.vanBadgeText, { color: theme.text }]}>{vanLabel}</Text>
                <Text style={[styles.vanBadgeDims, { color: theme.textSecondary }]}>
                  {variant.lengthMm}mm × {variant.widthMm}mm × {variant.heightMm}mm · {result.surfaceAreas.total} m² total
                </Text>
              </View>
            </View>

            {/* INSULATION SETTINGS */}
            <GlassCard style={styles.card}>
              <Text style={[styles.sectionLabel, { color: theme.accent }]}>INSULATION SETTINGS</Text>

          <Text style={[styles.miniLabel, { color: theme.textSecondary }]}>Build season target</Text>
          <View style={styles.seasonRow}>
            {([
              { key: 'three-season' as InsulationSeason, label: '3-Season' },
              { key: 'four-season' as InsulationSeason, label: '4-Season' },
            ]).map((opt) => {
              const active = state.insulationSeason === opt.key;
              return (
                <TouchableOpacity
                  key={opt.key}
                  style={[
                    styles.seasonPill,
                    {
                      backgroundColor: active ? `${theme.accent}22` : isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
                      borderColor: active ? `${theme.accent}50` : isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
                    },
                  ]}
                  onPress={() => setSeason(opt.key)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.seasonPillText, { color: active ? theme.accent : theme.text }]}>{opt.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={[styles.miniLabel, { color: theme.textSecondary, marginTop: 12 }]}>Window cut-outs</Text>
          <Text style={[styles.toggleDesc, { color: theme.textSecondary, marginBottom: 10 }]}>
            Select windows you plan to add. More windows means less area available for insulation.
          </Text>
          {([
            { key: 'slidingDoorWindow', label: 'Sliding door window', icon: 'car-door' },
            { key: 'cabSideWindows', label: 'Cab side windows', icon: 'car-side' },
            { key: 'rearWindows', label: 'Rear windows', icon: 'car-back' },
          ] as const).map((w) => (
            <TouchableOpacity
              key={w.key}
              style={[
                styles.windowRow,
                { borderColor: state.windowPlan[w.key] ? `${theme.accent}45` : isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)', backgroundColor: state.windowPlan[w.key] ? `${theme.accent}14` : 'transparent' },
              ]}
              onPress={() => toggleWindowPlan(w.key)}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons name={w.icon as any} size={16} color={state.windowPlan[w.key] ? theme.accent : theme.textSecondary} />
              <Text style={[styles.windowRowText, { color: state.windowPlan[w.key] ? theme.accent : theme.text }]}>{w.label}</Text>
              <View style={[styles.checkDot, { backgroundColor: state.windowPlan[w.key] ? theme.accent : 'transparent', borderColor: state.windowPlan[w.key] ? theme.accent : theme.textSecondary }]} />
            </TouchableOpacity>
          ))}
            </GlassCard>

            {/* MATERIAL OVERVIEW */}
            <GlassCard style={styles.card} float>
              <Text style={[styles.sectionLabel, { color: theme.accent }]}>MATERIAL OVERVIEW</Text>
              {result.products.map((p, i) => (
                <View key={p.id} style={styles.materialRow}>
                  <AnimatedMaterialBar product={p} maxM2={maxM2} delay={i * 180} />
                  <Text style={[styles.materialDesc, { color: theme.textSecondary }]}>{p.description}</Text>
                  <Text style={[styles.materialAppliedTo, { color: theme.textSecondary }]}>
                    Applied to: {p.appliedTo} · {p.packEstimate}
                  </Text>
                </View>
              ))}
            </GlassCard>

            {/* BESPOKE INSULATION BUNDLE */}
            <GlassCard style={styles.card}>
          <Text style={[styles.sectionLabel, { color: theme.accent, marginBottom: 10 }]}>BESPOKE INSULATION BUNDLE</Text>
          <Text style={[styles.shopCopy, { color: theme.textSecondary }]}>
            Add this bespoke insulation bundle from Build Summary after you complete the guided setup.
          </Text>
          <View style={[styles.bundleRow, { borderTopColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }]}>
            <Text style={[styles.bundleLabel, { color: theme.text }]}>Sound deadening for selective body panels</Text>
            <Text style={[styles.bundleValue, { color: theme.accent }]}>Included</Text>
          </View>
          <View style={[styles.bundleRow, { borderTopColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }]}>
            <Text style={[styles.bundleLabel, { color: theme.text }]}>Dodo Fleece EVO 50mm cavity insulation</Text>
            <Text style={[styles.bundleValue, { color: theme.accent }]}>Included</Text>
          </View>
          <View style={[styles.bundleRow, { borderTopColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }]}>
            <Text style={[styles.bundleLabel, { color: theme.text }]}>Dodo DEADN DUO floor roll system</Text>
            <Text style={[styles.bundleValue, { color: theme.accent }]}>Included</Text>
          </View>
          <View style={[styles.bundleRow, { borderTopColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }]}>
            <Text style={[styles.bundleLabel, { color: theme.text }]}>Bundle includes all insulation materials, tools, and a walkthrough video package</Text>
            <Text style={[styles.bundleValue, { color: theme.accent }]}>Included</Text>
          </View>
          <View style={[styles.bundleLocked, { backgroundColor: `${theme.accent}14`, borderColor: `${theme.accent}30` }]}>
            <MaterialCommunityIcons name="lock-outline" size={16} color={theme.accent} />
            <Text style={[styles.bundleLockedText, { color: theme.accent }]}>
              Continue to Build Summary to add this bundle
            </Text>
          </View>
            </GlassCard>

            {/* METHODOLOGY */}
            <TouchableOpacity onPress={toggleMethodology} activeOpacity={0.8}>
              <GlassCard style={styles.card}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <FontAwesome name="info-circle" size={15} color={theme.accent} />
                <Text style={[styles.methTitle, { color: theme.text }]}>How We Calculate This</Text>
              </View>
              <FontAwesome name={showMethodology ? 'chevron-up' : 'chevron-down'} size={12} color={theme.textSecondary} />
            </View>
            {showMethodology && (
              <Text style={[styles.methText, { color: theme.textSecondary }]}>
                {result.methodology}
              </Text>
            )}
              </GlassCard>
            </TouchableOpacity>
          </>
        ) : (
          <GlassCard style={styles.card}>
            <Text style={[styles.sectionLabel, { color: theme.accent }]}>INSULATION SKIPPED</Text>
            <Text style={[styles.noVanDesc, { color: theme.textSecondary }]}>
              This build profile will not include insulation recommendations. You can turn insulation back on at any time.
            </Text>
          </GlassCard>
        )}

        {/* CTA */}
        <TouchableOpacity style={[styles.ctaButton, { backgroundColor: theme.text }]} onPress={() => router.push('/water')} activeOpacity={0.85}>
          <Text style={[styles.ctaText, { color: theme.background }]}>Continue to Water →</Text>
        </TouchableOpacity>

        <View style={{ height: 120 }} />
      </ScrollView>
    </Animated.View>
  );
}

const barStyles = StyleSheet.create({
  row: { marginBottom: 14 },
  labelRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6, gap: 8 },
  colorDot: { width: 8, height: 8, borderRadius: 4 },
  label: { fontSize: 12, fontWeight: '600', flex: 1 },
  value: { fontSize: 12, fontWeight: '700' },
  track: { height: 7, borderRadius: 4, overflow: 'hidden' },
  fill: { height: 7, borderRadius: 4 },
});

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: { padding: 24, paddingTop: 24 },
  eyebrow: { fontSize: 10, fontWeight: '700', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 6 },
  title: { fontSize: 28, fontWeight: '800', marginBottom: 8 },
  subtitle: { fontSize: 14, lineHeight: 20, marginBottom: 24 },
  vanBadge: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 14, borderRadius: 12, borderWidth: 1, marginBottom: 24 },
  vanBadgeText: { fontSize: 14, fontWeight: '700' },
  vanBadgeDims: { fontSize: 11, marginTop: 2 },
  card: { marginBottom: 20 },
  sectionLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 2, marginBottom: 16 },
  materialRow: { marginBottom: 14, borderBottomWidth: 1, borderBottomColor: 'rgba(128,128,128,0.12)', paddingBottom: 10 },
  materialDesc: { fontSize: 12, lineHeight: 17, marginTop: 2 },
  materialAppliedTo: { fontSize: 11, lineHeight: 16, marginTop: 5, fontStyle: 'italic' },
  areaGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  areaItem: { width: '45%', alignItems: 'center', paddingVertical: 12 },
  areaValue: { fontSize: 24, fontWeight: '800' },
  areaUnit: { fontSize: 11, fontWeight: '600', marginTop: 2 },
  miniLabel: { fontSize: 11, fontWeight: '700', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 },
  seasonRow: { flexDirection: 'row', gap: 10, marginBottom: 8 },
  seasonPill: { flex: 1, borderRadius: 10, borderWidth: 1, paddingVertical: 10, alignItems: 'center' },
  seasonPillText: { fontSize: 13, fontWeight: '700' },
  toggleRow: { flexDirection: 'row', alignItems: 'center', gap: 12, borderTopWidth: 1, paddingTop: 12, marginTop: 6 },
  toggleTitle: { fontSize: 14, fontWeight: '700', marginBottom: 2 },
  toggleDesc: { fontSize: 11, lineHeight: 16 },
  windowRow: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, marginBottom: 8 },
  windowRowText: { flex: 1, marginLeft: 10, fontSize: 13, fontWeight: '600' },
  checkDot: { width: 14, height: 14, borderRadius: 7, borderWidth: 1.5 },
  productDot: { width: 10, height: 10, borderRadius: 5 },
  productName: { fontSize: 16, fontWeight: '800' },
  productDesc: { fontSize: 13, lineHeight: 19, marginBottom: 14 },
  specGrid: { flexDirection: 'row', paddingTop: 14, borderTopWidth: 1, gap: 20, marginBottom: 12 },
  specCol: { alignItems: 'center' },
  specValue: { fontSize: 22, fontWeight: '800' },
  specUnit: { fontSize: 10, fontWeight: '600', marginTop: 2 },
  specEstimate: { fontSize: 12, fontWeight: '600', textAlign: 'center' },
  appliedTo: { fontSize: 11, fontStyle: 'italic' },
  methTitle: { fontSize: 14, fontWeight: '700' },
  methText: { fontSize: 12, lineHeight: 18, marginTop: 14 },
  disclaimer: { fontSize: 11, lineHeight: 16, flex: 1 },
  shopCopy: { fontSize: 12, lineHeight: 18, marginBottom: 12 },
  bundleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, paddingTop: 10, marginTop: 10 },
  bundleLabel: { fontSize: 13, fontWeight: '600', flex: 1, paddingRight: 10 },
  bundleValue: { fontSize: 12, fontWeight: '800' },
  bundleLocked: { marginTop: 14, borderRadius: 10, borderWidth: 1, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  bundleLockedText: { fontSize: 13, fontWeight: '700' },
  ctaButton: { paddingVertical: 18, borderRadius: 12, alignItems: 'center', marginTop: 12 },
  ctaText: { fontSize: 17, fontWeight: '800', letterSpacing: 0.5 },
  noVanTitle: { fontSize: 20, fontWeight: '800', textAlign: 'center', marginBottom: 8 },
  noVanDesc: { fontSize: 14, lineHeight: 20, textAlign: 'center' },
});
