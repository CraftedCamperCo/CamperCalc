import { useCamper } from '@/context/CamperContext';
import { FEATURE_FLAGS } from '@/constants/featureFlags';
import { useProjects } from '@/context/ProjectContext';
import { useTabNav } from '@/context/TabNavContext';
import { useTheme } from '@/context/ThemeContext';
import { BuildSpec, calculate } from '@/utils/calculator';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { BlurView } from 'expo-blur';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef } from 'react';
import { Animated, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface Props {
  showEstimate?: boolean;
}

export default function AppHeader({ showEstimate = false }: Props) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { currentProject } = useProjects();
  const { state } = useCamper();
  const isDark = theme.blurTint === 'dark';

  const { currentIndex, totalTabs } = useTabNav();
  const spec = showEstimate ? calculate(state) : null;
  const flowLabels = FEATURE_FLAGS.THREE_D_KITS_ENABLED
    ? ['Camper', 'Systems', 'Insulation', 'Water', 'Furniture', 'Summary']
    : ['Camper', 'Systems', 'Insulation', 'Water', 'Summary'];
  const safeTotalTabs = Math.max(totalTabs, 1);
  const safeCurrentStep = Math.min(currentIndex + 1, safeTotalTabs);
  const progressPct = Math.round((safeCurrentStep / safeTotalTabs) * 100);
  const stageLabel = flowLabels[currentIndex] ?? 'Camper';

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      <BlurView intensity={50} tint={theme.blurTint} style={StyleSheet.absoluteFillObject} />
      <View style={[s.surfaceTint, { backgroundColor: theme.stickyHeaderBg }]} />

      <View style={s.navRow}>
        <TouchableOpacity
          style={[s.homeBtn, { backgroundColor: `${theme.accent}15`, borderColor: `${theme.accent}30` }]}
          onPress={() => { if (router.canDismiss()) router.dismissAll(); else router.replace('/'); }}
          activeOpacity={0.75}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <MaterialCommunityIcons name="home-outline" size={15} color={theme.accent} />
          <Text style={[s.homeBtnLabel, { color: theme.accent }]}>Home</Text>
          {currentProject ? (
            <Text style={[s.projectPill, { color: theme.accent }]} numberOfLines={1}>
              · {currentProject.name}
            </Text>
          ) : null}
        </TouchableOpacity>

        <Image
          source={require('../assets/images/crafted-logo.png')}
          style={s.logo}
          resizeMode="contain"
        />
      </View>

      {spec && <LiveEstimate isDark={isDark} spec={spec} daysOffGrid={state.daysOffGrid} />}
      <View style={[s.progressWrap, { borderTopColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }]}>
        <View style={s.progressHeader}>
          <Text style={[s.progressLabel, { color: theme.textSecondary }]}>
            Step {safeCurrentStep} of {safeTotalTabs} · {stageLabel}
          </Text>
          <Text style={[s.progressPct, { color: theme.accent }]}>{progressPct}% complete</Text>
        </View>
        <View style={[s.progressTrack, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)' }]}>
          <View style={[s.progressFill, { width: `${progressPct}%`, backgroundColor: theme.accent }]} />
        </View>
      </View>

      <View style={[s.bottomBorder, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }]} />
    </View>
  );
}

interface LiveEstimateProps {
  isDark: boolean;
  spec: BuildSpec;
  daysOffGrid: number;
}

function LiveEstimate({ isDark, spec, daysOffGrid }: LiveEstimateProps) {
  const theme = useTheme();

  const scaleAnim = useRef(new Animated.Value(1)).current;
  const prevCalc = useRef(spec.calculatedAh);
  const barWidth = useRef(new Animated.Value(0)).current;

  const utilisation = spec.recommendedBankAh > 0
    ? Math.min(1, spec.calculatedAh / spec.recommendedBankAh)
    : 0;

  useEffect(() => {
    if (prevCalc.current !== spec.calculatedAh) {
      prevCalc.current = spec.calculatedAh;
      Animated.sequence([
        Animated.timing(scaleAnim, { toValue: 1.08, duration: 100, useNativeDriver: true }),
        Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, friction: 5 }),
      ]).start();
    }
  }, [spec.calculatedAh, scaleAnim]);

  useEffect(() => {
    Animated.timing(barWidth, {
      toValue: utilisation,
      duration: 400,
      useNativeDriver: false,
    }).start();
  }, [utilisation, barWidth]);

  const pct = Math.round(utilisation * 100);

  return (
    <View style={[s.estimateRow, { borderTopColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }]}>
      <Text style={[s.estimateEyebrow, { color: theme.accent }]}>LIVE ESTIMATE</Text>
      <View style={s.estimateStats}>
        <Animated.View style={[s.estimateStat, { transform: [{ scale: scaleAnim }] }]}>
          <Text style={[s.estimateBig, { color: theme.accent }]}>{spec.calculatedAh}</Text>
          <Text style={[s.estimateLabel, { color: theme.textSecondary }]}>Ah Need</Text>
        </Animated.View>
        <View style={s.estimateStat}>
          <Text style={[s.estimateBig, { color: theme.text }]}>{spec.recommendedBankAh}</Text>
          <Text style={[s.estimateLabel, { color: theme.textSecondary }]}>Ah Battery</Text>
        </View>
        {spec.dailyLPG > 0 && (
          <View style={s.estimateStat}>
            <Text style={[s.estimateBig, { color: theme.text }]}>{(spec.dailyLPG * daysOffGrid).toFixed(1)}</Text>
            <Text style={[s.estimateLabel, { color: theme.textSecondary }]}>L LPG</Text>
          </View>
        )}
        {spec.dailyDiesel > 0 && (
          <View style={s.estimateStat}>
            <Text style={[s.estimateBig, { color: theme.text }]}>{(spec.dailyDiesel * daysOffGrid).toFixed(1)}</Text>
            <Text style={[s.estimateLabel, { color: theme.textSecondary }]}>
              {spec.dieselTankPct != null ? `L Diesel (${spec.dieselTankPct}% tank)` : 'L Diesel'}
            </Text>
          </View>
        )}
        <View style={s.estimateStat}>
          <Text style={[s.estimateBig, { color: theme.text }]}>{daysOffGrid}</Text>
          <Text style={[s.estimateLabel, { color: theme.textSecondary }]}>Days</Text>
        </View>
      </View>
      <View style={[s.barTrack, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)' }]}>
        <Animated.View
          style={[
            s.barFill,
            {
              backgroundColor: theme.accent,
              width: barWidth.interpolate({
                inputRange: [0, 1],
                outputRange: ['0%', '100%'],
              }),
            },
          ]}
        />
        <Text style={[s.barLabel, { color: theme.textSecondary }]}>{pct}% utilised</Text>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    zIndex: 100,
  },
  surfaceTint: {
    ...StyleSheet.absoluteFillObject,
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    height: 48,
  },
  homeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    maxWidth: 160,
  },
  homeBtnLabel: {
    fontSize: 11,
    fontWeight: '700',
  },
  projectPill: {
    fontSize: 11,
    fontWeight: '700',
    flexShrink: 1,
  },
  logo: {
    width: 100,
    height: 34,
  },
  estimateRow: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 12,
    borderTopWidth: 1,
  },
  estimateEyebrow: {
    fontSize: 8,
    fontWeight: '700',
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  estimateStats: {
    flexDirection: 'row',
    gap: 24,
  },
  estimateStat: {},
  estimateBig: {
    fontSize: 22,
    fontWeight: '800',
    lineHeight: 26,
  },
  estimateLabel: {
    fontSize: 9,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  barTrack: {
    height: 4,
    borderRadius: 2,
    marginTop: 10,
    overflow: 'hidden',
    justifyContent: 'center',
  },
  barFill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    borderRadius: 2,
  },
  barLabel: {
    position: 'absolute',
    right: 0,
    top: -14,
    fontSize: 8,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  bottomBorder: {
    height: 1,
  },
  progressWrap: {
    borderTopWidth: 1,
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 10,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  progressLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  progressPct: {
    fontSize: 11,
    fontWeight: '800',
  },
  progressTrack: {
    height: 5,
    borderRadius: 999,
    overflow: 'hidden',
  },
  progressFill: {
    height: 5,
    borderRadius: 999,
  },
});
