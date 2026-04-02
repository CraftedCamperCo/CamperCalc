import GlassCard from '@/components/GlassCard';
import TopographicBackground from '@/components/TopographicBackground';
import { ClimateType, useCamper } from '@/context/CamperContext';
import { useTheme } from '@/context/ThemeContext';
import { calculateInsulation } from '@/utils/insulationCalculator';
import { goBackOrHome } from '@/utils/navigation';
import { getVariant, Manufacturer, VanModel, VanVariant, VAN_DATABASE, variantLabel } from '@/utils/vanDatabase';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  LayoutAnimation,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  UIManager,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const SEASON_OPTS: { label: ClimateType; desc: string }[] = [
  { label: 'Summer', desc: 'Warm nights, minimal insulation' },
  { label: 'Spring & Autumn', desc: 'Mixed weather, moderate' },
  { label: 'Deep Winter', desc: 'Heavy insulation needed' },
];

function PickerChip({ label, selected, onPress, theme }: { label: string; selected: boolean; onPress: () => void; theme: any }) {
  const isDark = theme.blurTint === 'dark';
  return (
    <TouchableOpacity
      style={[s.chip, selected ? { backgroundColor: `${theme.accent}22`, borderColor: theme.accent } : { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)', borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)' }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text style={[s.chipText, { color: selected ? theme.accent : theme.text }]}>{label}</Text>
    </TouchableOpacity>
  );
}

export default function InsulateCalc() {
  const { state, set } = useCamper();
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const isDark = theme.blurTint === 'dark';

  const [selectedMfr, setSelectedMfr] = useState<Manufacturer | null>(null);
  const [selectedModel, setSelectedModel] = useState<VanModel | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<VanVariant | null>(null);
  const pickMfr = (m: Manufacturer) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setSelectedMfr(m); setSelectedModel(null); setSelectedVariant(null);
  };
  const pickModel = (m: VanModel) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setSelectedModel(m); setSelectedVariant(null);
    if (m.variants.length === 1) setSelectedVariant(m.variants[0]);
  };

  const toggleClimate = (c: ClimateType) => {
    const next = state.climates.includes(c) ? state.climates.filter(x => x !== c) : [...state.climates, c];
    if (next.length > 0) set('climates', next);
  };

  const variant = selectedVariant;
  const vanLabel = selectedMfr && selectedModel && variant
    ? `${selectedMfr.name} ${selectedModel.name} (${variantLabel(variant)})`
    : null;
  const result = variant ? calculateInsulation(variant, state.climates, vanLabel || '') : null;

  return (
    <View style={[s.container, { backgroundColor: theme.background }]}>
      <TopographicBackground />

      <TouchableOpacity style={[s.backBtn, { top: insets.top + 10 }]} onPress={() => goBackOrHome(router)} activeOpacity={0.7}>
        <FontAwesome name="chevron-left" size={16} color={theme.accent} />
        <Text style={[s.backText, { color: theme.accent }]}>Back</Text>
      </TouchableOpacity>

      <ScrollView style={s.scroll} contentContainerStyle={[s.content, { paddingTop: insets.top + 56 }]} showsVerticalScrollIndicator={false}>
        <Text style={[s.eyebrow, { color: theme.accent }]}>INSULATION CALCULATOR</Text>
        <Text style={[s.title, { color: theme.text }]}>Calculate your insulation</Text>
        <Text style={[s.subtitle, { color: theme.textSecondary }]}>
          Select your van and climate to get material quantities and recommendations.
        </Text>

        {/* Van Picker */}
        <GlassCard style={s.card}>
          <Text style={[s.cardLabel, { color: theme.accent }]}>YOUR VAN</Text>

          <Text style={[s.fieldTitle, { color: theme.textSecondary }]}>MANUFACTURER</Text>
          <View style={s.chipGrid}>
            {VAN_DATABASE.map(mfr => (
              <PickerChip key={mfr.id} label={mfr.name} selected={selectedMfr?.id === mfr.id} onPress={() => pickMfr(mfr)} theme={theme} />
            ))}
          </View>

          {selectedMfr && (
            <>
              <Text style={[s.fieldTitle, { color: theme.textSecondary }]}>MODEL</Text>
              <View style={s.chipGrid}>
                {selectedMfr.models.map(m => (
                  <PickerChip key={m.name} label={m.name} selected={selectedModel?.name === m.name} onPress={() => pickModel(m)} theme={theme} />
                ))}
              </View>
            </>
          )}

          {selectedModel && selectedModel.variants.length > 1 && (
            <>
              <Text style={[s.fieldTitle, { color: theme.textSecondary }]}>WHEELBASE / ROOF</Text>
              <View style={s.chipGrid}>
                {selectedModel.variants.map((v, i) => (
                  <PickerChip key={`${v.wheelbase}-${i}`} label={variantLabel(v)} selected={selectedVariant === v} onPress={() => setSelectedVariant(v)} theme={theme} />
                ))}
              </View>
            </>
          )}

          {vanLabel && (
            <View style={[s.vanBadge, { backgroundColor: `${theme.accent}10`, borderColor: `${theme.accent}30` }]}>
              <FontAwesome name="truck" size={14} color={theme.accent} />
              <Text style={[s.vanBadgeText, { color: theme.text }]}>{vanLabel}</Text>
            </View>
          )}
        </GlassCard>

        {/* Climate */}
        <GlassCard style={s.card}>
          <Text style={[s.cardLabel, { color: theme.accent }]}>CLIMATE</Text>
          <Text style={[s.cardHelper, { color: theme.textSecondary }]}>Select all seasons you'll camp in.</Text>
          {SEASON_OPTS.map(season => {
            const active = state.climates.includes(season.label);
            return (
              <TouchableOpacity key={season.label} style={[s.rowOption, { borderColor: active ? theme.accent : isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)', backgroundColor: active ? `${theme.accent}15` : isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)' }]} onPress={() => toggleClimate(season.label)} activeOpacity={0.75}>
                <View style={{ flex: 1 }}>
                  <Text style={[s.rowLabel, { color: active ? theme.accent : theme.text }]}>{season.label}</Text>
                  <Text style={[s.rowDesc, { color: theme.textSecondary }]}>{season.desc}</Text>
                </View>
                <View style={[s.checkCircle, active && { backgroundColor: theme.accent, borderColor: theme.accent }]}>
                  {active && <Text style={s.checkMark}>✓</Text>}
                </View>
              </TouchableOpacity>
            );
          })}
        </GlassCard>

        {/* Results */}
        {result && (
          <>
            <GlassCard style={s.card} float>
              <Text style={[s.cardLabel, { color: theme.accent }]}>MATERIAL OVERVIEW</Text>
              <View style={[s.areaGrid, { marginBottom: 16 }]}>
                <View style={s.areaItem}>
                  <Text style={[s.areaValue, { color: theme.text }]}>{result.surfaceAreas.ceiling}</Text>
                  <Text style={[s.areaUnit, { color: theme.textSecondary }]}>m² ceiling</Text>
                </View>
                <View style={s.areaItem}>
                  <Text style={[s.areaValue, { color: theme.text }]}>{result.surfaceAreas.walls}</Text>
                  <Text style={[s.areaUnit, { color: theme.textSecondary }]}>m² walls</Text>
                </View>
                <View style={s.areaItem}>
                  <Text style={[s.areaValue, { color: theme.text }]}>{result.surfaceAreas.floor}</Text>
                  <Text style={[s.areaUnit, { color: theme.textSecondary }]}>m² floor</Text>
                </View>
                <View style={s.areaItem}>
                  <Text style={[s.areaValue, { color: theme.accent }]}>{result.surfaceAreas.total}</Text>
                  <Text style={[s.areaUnit, { color: theme.textSecondary }]}>m² total</Text>
                </View>
              </View>

              {result.products.map(p => {
                const display = p;
                return (
                  <View key={p.id} style={[s.productRow, { borderTopColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }]}>
                    <Text style={[s.productName, { color: theme.text }]}>{display.name}</Text>
                    <Text style={[s.productQty, { color: theme.accent }]}>{display.quantityM2} m²</Text>
                    <Text style={[s.productPack, { color: theme.textSecondary }]}>{display.packEstimate}</Text>
                  </View>
                );
              })}
            </GlassCard>

            <GlassCard style={s.card}>
              <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10 }}>
                <FontAwesome name="exclamation-triangle" size={13} color={theme.accent} style={{ marginTop: 2 }} />
                <Text style={[s.disclaimer, { color: theme.textSecondary }]}>
                  We recommend purchasing 10-15% extra material to account for cutting waste and panel curvature.
                </Text>
              </View>
            </GlassCard>
          </>
        )}

        {!variant && (
          <GlassCard style={s.card}>
            <FontAwesome name="truck" size={28} color={theme.textSecondary} style={{ alignSelf: 'center', marginBottom: 12, opacity: 0.4 }} />
            <Text style={[s.emptyTitle, { color: theme.text }]}>Select your van above</Text>
            <Text style={[s.emptyDesc, { color: theme.textSecondary }]}>
              Choose your van manufacturer, model, and variant to see insulation recommendations.
            </Text>
          </GlassCard>
        )}

        <View style={{ height: 60 }} />
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flex: 1 },
  content: { padding: 24 },
  backBtn: { position: 'absolute', left: 20, zIndex: 10, flexDirection: 'row', alignItems: 'center', gap: 6 },
  backText: { fontSize: 15, fontWeight: '600' },
  eyebrow: { fontSize: 10, fontWeight: '700', letterSpacing: 2, marginBottom: 6 },
  title: { fontSize: 26, fontWeight: '800', marginBottom: 8 },
  subtitle: { fontSize: 14, lineHeight: 20, marginBottom: 28 },
  card: { marginBottom: 18 },
  cardLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 2, marginBottom: 12 },
  cardHelper: { fontSize: 12, lineHeight: 17, marginBottom: 12 },
  fieldTitle: { fontSize: 10, fontWeight: '700', letterSpacing: 1.5, marginBottom: 8, marginTop: 4 },
  chip: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 10, borderWidth: 1 },
  chipText: { fontSize: 13, fontWeight: '600' },
  chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 },
  vanBadge: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingVertical: 12, borderRadius: 10, borderWidth: 1, marginTop: 4 },
  vanBadgeText: { fontSize: 14, fontWeight: '700', flex: 1 },
  rowOption: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, paddingHorizontal: 14, borderRadius: 10, borderWidth: 1, marginBottom: 8 },
  rowLabel: { fontSize: 15, fontWeight: '600', marginBottom: 2 },
  rowDesc: { fontSize: 12 },
  checkCircle: { width: 22, height: 22, borderRadius: 11, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  checkMark: { color: '#000', fontSize: 12, fontWeight: '800' },
  areaGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  areaItem: { width: '42%', alignItems: 'center', paddingVertical: 10 },
  areaValue: { fontSize: 22, fontWeight: '800' },
  areaUnit: { fontSize: 10, fontWeight: '600', marginTop: 2 },
  productRow: { paddingTop: 12, borderTopWidth: 1, marginBottom: 8 },
  productName: { fontSize: 14, fontWeight: '700', marginBottom: 4 },
  productQty: { fontSize: 18, fontWeight: '800', marginBottom: 2 },
  productPack: { fontSize: 11, marginBottom: 6 },
  disclaimer: { fontSize: 11, lineHeight: 16, flex: 1 },
  emptyTitle: { fontSize: 18, fontWeight: '700', textAlign: 'center', marginBottom: 6 },
  emptyDesc: { fontSize: 13, lineHeight: 18, textAlign: 'center' },
});
