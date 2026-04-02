import CollapsibleSection from '@/components/CollapsibleSection';
import { FEATURE_FLAGS } from '@/constants/featureFlags';
import GlassCard from '@/components/GlassCard';
import TopographicBackground from '@/components/TopographicBackground';
import { useCamper } from '@/context/CamperContext';
import { useTheme } from '@/context/ThemeContext';
import { useScreenSlide } from '@/hooks/useScreenSlide';
import { calculateWater, WATER_FIXTURES, WaterFixture } from '@/utils/waterCalculator';
import FontAwesome from '@expo/vector-icons/FontAwesome';
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
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const BAR_MAX_WIDTH = SCREEN_WIDTH - 100;

function TankFillAnimation({ litres, maxLitres, label, color }: {
  litres: number; maxLitres: number; label: string; color: string;
}) {
  const theme = useTheme();
  const fillAnim = useRef(new Animated.Value(0)).current;
  const [displayLitres, setDisplayLitres] = useState(0);
  const numAnim = useRef(new Animated.Value(0)).current;
  const TANK_HEIGHT = 120;
  const fillHeight = maxLitres > 0 ? (litres / maxLitres) * TANK_HEIGHT : 0;

  useEffect(() => {
    const listener = numAnim.addListener(({ value }) => setDisplayLitres(Math.round(value)));
    Animated.timing(fillAnim, { toValue: fillHeight, duration: 2000, useNativeDriver: false }).start();
    Animated.timing(numAnim, { toValue: litres, duration: 2000, useNativeDriver: false }).start();
    return () => numAnim.removeListener(listener);
  }, [litres, fillHeight]);

  const isDark = theme.blurTint === 'dark';

  return (
    <View style={tank.container}>
      <View style={[tank.body, { borderColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)', backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)' }]}>
        <Animated.View style={[tank.fill, { height: fillAnim, backgroundColor: color }]}>
          <Svg width="100%" height="100%" style={StyleSheet.absoluteFillObject}>
            <Defs>
              <LinearGradient id="tankGrad" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor="rgba(255,255,255,0.25)" />
                <Stop offset="1" stopColor="rgba(255,255,255,0)" />
              </LinearGradient>
            </Defs>
            <Rect width="100%" height="100%" fill="url(#tankGrad)" />
          </Svg>
        </Animated.View>
      </View>
      <Text style={[tank.litres, { color: theme.text }]}>{displayLitres}L</Text>
      <Text style={[tank.label, { color: theme.textSecondary }]}>{label}</Text>
    </View>
  );
}

function WaterBar({ label, value, total, color, delay = 0 }: {
  label: string; value: number; total: number; color: string; delay?: number;
}) {
  const barWidth = useRef(new Animated.Value(0)).current;
  const numAnim = useRef(new Animated.Value(0)).current;
  const [displayNum, setDisplayNum] = useState(0);
  const target = total > 0 ? (value / total) * BAR_MAX_WIDTH : 0;
  const theme = useTheme();

  useEffect(() => {
    const listener = numAnim.addListener(({ value: v }) => setDisplayNum(Math.round(v * 10) / 10));
    Animated.timing(barWidth, { toValue: Math.max(target, value > 0 ? 4 : 0), duration: 3000, delay, useNativeDriver: false }).start();
    Animated.timing(numAnim, { toValue: value, duration: 3000, delay, useNativeDriver: false }).start();
    return () => numAnim.removeListener(listener);
  }, [target, value, delay]);

  if (value <= 0) return null;

  return (
    <View style={barStyles.row}>
      <View style={barStyles.labelContainer}>
        <Text style={[barStyles.label, { color: theme.textSecondary }]}>{label}</Text>
        <Text style={[barStyles.value, { color: theme.text }]}>{displayNum}L</Text>
      </View>
      <View style={[barStyles.track, { backgroundColor: theme.blurTint === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }]}>
        <Animated.View style={[barStyles.fill, { width: barWidth, backgroundColor: color }]} />
      </View>
    </View>
  );
}

function FixtureSlider({ fixture, theme }: { fixture: WaterFixture; theme: any }) {
  const { state, set } = useCamper();
  const isOn = !!state.selectedWaterFixtures[fixture.id];
  const currentVal = state.fixtureOverrides[fixture.id] ?? fixture.defaultLitres;
  const isDark = theme.blurTint === 'dark';

  const toggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    set('selectedWaterFixtures', { ...state.selectedWaterFixtures, [fixture.id]: !isOn });
  };

  const adjustValue = (delta: number) => {
    let next = Math.round((currentVal + delta) * 100) / 100;
    next = Math.max(fixture.minLitres, Math.min(fixture.maxLitres, next));
    set('fixtureOverrides', { ...state.fixtureOverrides, [fixture.id]: next });
  };

  const pct = ((currentVal - fixture.minLitres) / (fixture.maxLitres - fixture.minLitres)) * 100;

  return (
    <View style={[fix.row, { borderBottomColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }]}>
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View style={fix.info}>
            <Text style={[fix.name, { color: theme.text }]}>{fixture.name}</Text>
            <Text style={[fix.desc, { color: theme.textSecondary }]}>{fixture.description}</Text>
          </View>
          <Switch value={isOn} onValueChange={toggle} trackColor={{ false: isDark ? '#2C2C2E' : '#D1D1D6', true: '#4A90D9' }} thumbColor="#fff" />
        </View>
        {isOn && (
          <View style={[fix.sliderArea, { backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)' }]}>
            <View style={fix.sliderRow}>
              <FontAwesome name="minus" size={12} color={theme.textSecondary} onPress={() => adjustValue(-fixture.step)} />
              <View style={fix.sliderTrack}>
                <View style={[fix.sliderTrackBg, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)' }]} />
                <View style={[fix.sliderFill, { width: `${pct}%`, backgroundColor: '#4A90D9' }]} />
              </View>
              <FontAwesome name="plus" size={12} color={theme.textSecondary} onPress={() => adjustValue(fixture.step)} />
            </View>
            <Text style={[fix.sliderVal, { color: theme.text }]}>{currentVal} {fixture.unit}</Text>
          </View>
        )}
      </View>
    </View>
  );
}

function ShowerFixtureSlider({ fixture, theme }: { fixture: WaterFixture; theme: any }) {
  const { state, set } = useCamper();
  const currentVal = state.fixtureOverrides[fixture.id] ?? fixture.defaultLitres;
  const isDark = theme.blurTint === 'dark';

  const adjustValue = (delta: number) => {
    let next = Math.round((currentVal + delta) * 100) / 100;
    next = Math.max(fixture.minLitres, Math.min(fixture.maxLitres, next));
    set('fixtureOverrides', { ...state.fixtureOverrides, [fixture.id]: next });
  };

  const pct = ((currentVal - fixture.minLitres) / (fixture.maxLitres - fixture.minLitres)) * 100;

  return (
    <View style={fix.row}>
      <View style={{ flex: 1 }}>
        <View style={fix.info}>
          <Text style={[fix.name, { color: theme.text }]}>{fixture.name}</Text>
          <Text style={[fix.desc, { color: theme.textSecondary }]}>{fixture.description}</Text>
        </View>
        <View style={[fix.sliderArea, { backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)' }]}>
          <View style={fix.sliderRow}>
            <FontAwesome name="minus" size={12} color={theme.textSecondary} onPress={() => adjustValue(-fixture.step)} />
            <View style={fix.sliderTrack}>
              <View style={[fix.sliderTrackBg, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)' }]} />
              <View style={[fix.sliderFill, { width: `${pct}%`, backgroundColor: '#4A90D9' }]} />
            </View>
            <FontAwesome name="plus" size={12} color={theme.textSecondary} onPress={() => adjustValue(fixture.step)} />
          </View>
          <Text style={[fix.sliderVal, { color: theme.text }]}>{currentVal} {fixture.unit}</Text>
        </View>
      </View>
    </View>
  );
}

export default function WaterScreen() {
  const { state, set } = useCamper();
  const theme = useTheme();
  const router = useRouter();
  const { style: slideStyle, panHandlers } = useScreenSlide(3);
  const waterSpec = calculateWater(state);

  const headerAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(headerAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start();
  }, []);

  const maxTank = Math.max(waterSpec.freshTankRecommended, waterSpec.greyTankRecommended, 1);
  const isDark = theme.blurTint === 'dark';

  const toggleWaterEnabled = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    set('waterEnabled', !state.waterEnabled);
  };

  return (
    <Animated.View style={[{ flex: 1, backgroundColor: theme.background, position: 'relative' }, slideStyle]} {...panHandlers}>
      <TopographicBackground />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* HERO */}
        <Animated.View style={{ opacity: headerAnim, transform: [{ translateY: headerAnim.interpolate({ inputRange: [0, 1], outputRange: [30, 0] }) }] }}>
          <Text style={[styles.eyebrow, { color: theme.accent }]}>WATER USAGE</Text>
          <Text style={[styles.title, { color: theme.text }]}>Your Water System</Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            Based on your lifestyle, we'll estimate daily water consumption and recommend tank sizes for your build.
          </Text>
        </Animated.View>

        <GlassCard style={styles.card}>
          <Text style={[styles.sectionLabel, { color: theme.accent }]}>WATER SYSTEM REQUIRED?</Text>
          <View style={styles.toggleRow}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.toggleTitle, { color: theme.text }]}>
                {state.waterEnabled ? 'Water system included in this build' : 'Dry build selected'}
              </Text>
              <Text style={[styles.toggleDesc, { color: theme.textSecondary }]}>
                Turn this off if you do not want water recommendations for this project.
              </Text>
            </View>
            <Switch
              value={state.waterEnabled}
              onValueChange={toggleWaterEnabled}
              trackColor={{ false: isDark ? '#2C2C2E' : '#D1D1D6', true: theme.success }}
              thumbColor="#fff"
            />
          </View>
        </GlassCard>

        {state.waterEnabled ? (
          <>
            {/* ANIMATED TANKS */}
            <GlassCard style={styles.card} float>
              <Text style={[styles.sectionLabel, { color: theme.accent }]}>TANK RECOMMENDATIONS</Text>
              <View style={styles.tanksRow}>
                <TankFillAnimation litres={waterSpec.freshTankRecommended} maxLitres={maxTank * 1.2} label="Fresh Water" color="#4A90D9" />
                <TankFillAnimation litres={waterSpec.greyTankRecommended} maxLitres={maxTank * 1.2} label="Grey Water" color="#7B8A8E" />
              </View>
              <View style={styles.dailySummary}>
                <Text style={[styles.dailyLabel, { color: theme.textSecondary }]}>Daily consumption</Text>
                <Text style={[styles.dailyValue, { color: theme.text }]}>{waterSpec.dailyLitres}L / day</Text>
              </View>
            </GlassCard>

            {/* CONSUMPTION BREAKDOWN */}
            <GlassCard style={styles.card}>
          <Text style={[styles.sectionLabel, { color: theme.accent }]}>DAILY BREAKDOWN</Text>
          {waterSpec.breakdown.map((item, i) => (
            <WaterBar key={item.id} label={item.label} value={item.litres} total={waterSpec.dailyLitres} color="#4A90D9" delay={i * 150} />
          ))}
            </GlassCard>

            {/* SHOWER FIXTURE (auto-managed) */}
            {state.showerType !== 'none' && (() => {
          const showerFixture = WATER_FIXTURES.find(
            f => f.id === (state.showerType === 'indoor' ? 'indoor_shower' : 'outdoor_shower')
          );
          if (!showerFixture) return null;
          return (
            <GlassCard style={styles.card}>
              <Text style={[styles.sectionLabel, { color: theme.accent }]}>
                {state.showerType === 'indoor' ? 'INDOOR SHOWER' : 'OUTDOOR SHOWER'}
              </Text>
              <Text style={[styles.sectionHelper, { color: theme.textSecondary }]}>
                {state.showerType === 'indoor'
                  ? 'Your indoor shower uses the hot water system and adds to both water consumption and electrical draw. Adjust the litres per shower below.'
                  : 'Your outdoor shower is a cold rinse for gear, pets, and quick wash-offs. Minimal electrical impact — just the water pump.'}
              </Text>
              <ShowerFixtureSlider fixture={showerFixture} theme={theme} />
            </GlassCard>
          );
            })()}

            {/* FIXTURE TOGGLES + SLIDERS */}
            <GlassCard style={styles.card}>
          <Text style={[styles.sectionLabel, { color: theme.accent }]}>WATER FIXTURES</Text>
          <Text style={[styles.sectionHelper, { color: theme.textSecondary }]}>
            Toggle fixtures on or off, then fine-tune usage with the slider.
          </Text>
          <CollapsibleSection
            title="Fine-tune your fixtures"
            badge={`${Object.keys(state.selectedWaterFixtures).filter(id => state.selectedWaterFixtures[id]).length} active`}
          >
            {WATER_FIXTURES.filter(f => f.id !== 'indoor_shower' && f.id !== 'outdoor_shower').map(fixture => (
              <FixtureSlider key={fixture.id} fixture={fixture} theme={theme} />
            ))}
          </CollapsibleSection>
            </GlassCard>

            {/* DISCLAIMER */}
            <GlassCard style={styles.card}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10 }}>
            <FontAwesome name="info-circle" size={14} color={theme.textSecondary} style={{ marginTop: 2 }} />
            <Text style={[styles.disclaimer, { color: theme.textSecondary }]}>
              These estimates are based on leisure-industry standard restricted-flow fixtures and average usage patterns. Actual consumption will vary based on individual habits, fixture brands, and water pressure. Use these recommendations as a starting point for your build.
            </Text>
          </View>
            </GlassCard>
          </>
        ) : (
          <GlassCard style={styles.card}>
            <Text style={[styles.sectionLabel, { color: theme.accent }]}>WATER SKIPPED</Text>
            <Text style={[styles.disclaimer, { color: theme.textSecondary }]}>
              Water recommendations are disabled for this project. You can enable this again at any time.
            </Text>
          </GlassCard>
        )}

        <TouchableOpacity
          style={[styles.ctaButton, { backgroundColor: theme.text }]}
          onPress={() => router.push(FEATURE_FLAGS.THREE_D_KITS_ENABLED ? '/furniture' : '/three')}
          activeOpacity={0.85}
        >
          <Text style={[styles.ctaText, { color: theme.background }]}>
            {FEATURE_FLAGS.THREE_D_KITS_ENABLED ? 'Continue to Furniture Kits →' : 'Continue to Build Summary →'}
          </Text>
        </TouchableOpacity>

        <View style={{ height: 120 }} />
      </ScrollView>
    </Animated.View>
  );
}

const tank = StyleSheet.create({
  container: { alignItems: 'center', flex: 1 },
  body: { width: 80, height: 120, borderRadius: 12, borderWidth: 1.5, overflow: 'hidden', justifyContent: 'flex-end' },
  fill: { width: '100%', borderRadius: 0 },
  litres: { fontSize: 22, fontWeight: '800', marginTop: 10 },
  label: { fontSize: 11, fontWeight: '600', marginTop: 2, letterSpacing: 0.5 },
});

const fix = StyleSheet.create({
  row: { paddingVertical: 12, borderBottomWidth: 1 },
  info: { flex: 1, marginRight: 12 },
  name: { fontSize: 14, fontWeight: '600' },
  desc: { fontSize: 11, marginTop: 2, lineHeight: 15 },
  sliderArea: { marginTop: 10, padding: 12, borderRadius: 8 },
  sliderRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  sliderTrack: { flex: 1, height: 6, borderRadius: 3, overflow: 'hidden', position: 'relative' },
  sliderTrackBg: { ...StyleSheet.absoluteFillObject, borderRadius: 3 },
  sliderFill: { height: 6, borderRadius: 3 },
  sliderVal: { textAlign: 'center', fontSize: 13, fontWeight: '700', marginTop: 8 },
});

const barStyles = StyleSheet.create({
  row: { marginBottom: 14 },
  labelContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  label: { fontSize: 12, fontWeight: '600' },
  value: { fontSize: 12, fontWeight: '700' },
  track: { height: 7, borderRadius: 4, overflow: 'hidden' },
  fill: { height: 7, borderRadius: 4 },
});

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: { padding: 24, paddingTop: 24 },
  eyebrow: { fontSize: 10, fontWeight: '700', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8 },
  title: { fontSize: 28, fontWeight: '800', marginBottom: 10 },
  subtitle: { fontSize: 14, lineHeight: 20, marginBottom: 32 },
  card: { marginBottom: 28 },
  sectionLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 2, marginBottom: 14 },
  toggleRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  toggleTitle: { fontSize: 14, fontWeight: '700', marginBottom: 3 },
  toggleDesc: { fontSize: 12, lineHeight: 17 },
  sectionHelper: { fontSize: 12, lineHeight: 17, marginBottom: 12 },
  tanksRow: { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 20 },
  dailySummary: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 14, paddingTop: 14, borderTopWidth: 1, borderTopColor: 'rgba(128,128,128,0.15)' },
  dailyLabel: { fontSize: 12, fontWeight: '500' },
  dailyValue: { fontSize: 16, fontWeight: '800' },
  disclaimer: { fontSize: 11, lineHeight: 16, flex: 1 },
  ctaButton: { paddingVertical: 18, borderRadius: 12, alignItems: 'center', marginTop: 12 },
  ctaText: { fontSize: 17, fontWeight: '800', letterSpacing: 0.5 },
});
