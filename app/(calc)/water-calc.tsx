import GlassCard from '@/components/GlassCard';
import TopographicBackground from '@/components/TopographicBackground';
import { ShowerFrequency, ShowerType, useCamper } from '@/context/CamperContext';
import { useTheme } from '@/context/ThemeContext';
import { calculateWater, WATER_FIXTURES } from '@/utils/waterCalculator';
import { goBackOrHome } from '@/utils/navigation';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const SHOWER_OPTS: { key: ShowerFrequency; label: string; desc: string }[] = [
  { key: 'daily', label: 'Every day', desc: 'Full comfort' },
  { key: 'every2', label: 'Every 2 days', desc: 'Most common' },
  { key: 'every3', label: 'Every 3 days', desc: 'Water-saving' },
];

export default function WaterCalc() {
  const { state, set } = useCamper();
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const isDark = theme.blurTint === 'dark';

  const [daysText, setDaysText] = useState(String(state.daysOffGrid));
  const result = calculateWater(state);

  const handleDaysChange = (v: string) => {
    const digits = v.replace(/[^0-9]/g, '');
    setDaysText(digits);
    const n = parseInt(digits);
    if (!isNaN(n) && n > 0) set('daysOffGrid', n);
  };

  const handleDaysBlur = () => {
    const n = parseInt(daysText);
    if (isNaN(n) || n <= 0) setDaysText(String(state.daysOffGrid));
  };

  const toggleFixture = (id: string) => {
    set('selectedWaterFixtures', { ...state.selectedWaterFixtures, [id]: !state.selectedWaterFixtures[id] });
  };

  return (
    <View style={[s.container, { backgroundColor: theme.background }]}>
      <TopographicBackground />

      <TouchableOpacity style={[s.backBtn, { top: insets.top + 10 }]} onPress={() => goBackOrHome(router)} activeOpacity={0.7}>
        <FontAwesome name="chevron-left" size={16} color={theme.accent} />
        <Text style={[s.backText, { color: theme.accent }]}>Back</Text>
      </TouchableOpacity>

      <ScrollView style={s.scroll} contentContainerStyle={[s.content, { paddingTop: insets.top + 56 }]} showsVerticalScrollIndicator={false}>
        <Text style={[s.eyebrow, { color: theme.accent }]}>WATER CALCULATOR</Text>
        <Text style={[s.title, { color: theme.text }]}>Size your water system</Text>
        <Text style={[s.subtitle, { color: theme.textSecondary }]}>
          Configure your water fixtures and usage to calculate tank sizes.
        </Text>

        {/* Days off grid */}
        <GlassCard style={s.card}>
          <Text style={[s.cardLabel, { color: theme.accent }]}>DAYS OFF-GRID</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <TextInput
              style={[s.daysInput, { color: theme.text, backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)', borderColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.12)' }]}
              value={daysText}
              onChangeText={handleDaysChange}
              onBlur={handleDaysBlur}
              keyboardType="numeric"
              maxLength={2}
              placeholder="3"
              placeholderTextColor={theme.textSecondary}
              selectTextOnFocus
            />
            <Text style={{ fontSize: 18, color: theme.textSecondary, fontWeight: '500' }}>days</Text>
          </View>
        </GlassCard>

        {/* Shower Type */}
        <GlassCard style={s.card}>
          <Text style={[s.cardLabel, { color: theme.accent }]}>SHOWER SETUP</Text>
          <View style={{ flexDirection: 'row', gap: 8, marginBottom: state.showerType === 'indoor' ? 16 : 0 }}>
            {([
              { key: 'indoor' as ShowerType, label: 'Indoor', desc: 'Hot water' },
              { key: 'outdoor' as ShowerType, label: 'Outdoor', desc: 'Cold rinse' },
              { key: 'none' as ShowerType, label: 'None', desc: 'No shower' },
            ]).map(opt => {
              const active = state.showerType === opt.key;
              return (
                <TouchableOpacity key={opt.key} style={[s.choicePill, { borderColor: active ? theme.accent : isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)', backgroundColor: active ? theme.accent : isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)' }]} onPress={() => set('showerType', opt.key)} activeOpacity={0.75}>
                  <Text style={[s.choiceLabel, { color: active ? '#fff' : theme.text }]}>{opt.label}</Text>
                  <Text style={[s.choiceDesc, { color: active ? 'rgba(255,255,255,0.7)' : theme.textSecondary }]}>{opt.desc}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
          {state.showerType === 'indoor' && (
            <>
              <Text style={[s.cardLabel, { color: theme.accent }]}>SHOWER FREQUENCY</Text>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {SHOWER_OPTS.map(opt => {
                  const active = state.showerFrequency === opt.key;
                  return (
                    <TouchableOpacity key={opt.key} style={[s.choicePill, { borderColor: active ? theme.accent : isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)', backgroundColor: active ? theme.accent : isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)' }]} onPress={() => set('showerFrequency', opt.key)} activeOpacity={0.75}>
                      <Text style={[s.choiceLabel, { color: active ? '#fff' : theme.text }]}>{opt.label}</Text>
                      <Text style={[s.choiceDesc, { color: active ? 'rgba(255,255,255,0.7)' : theme.textSecondary }]}>{opt.desc}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </>
          )}
        </GlassCard>

        {/* Fixtures */}
        <GlassCard style={s.card}>
          <Text style={[s.cardLabel, { color: theme.accent }]}>WATER FIXTURES</Text>
          <Text style={[s.cardHelper, { color: theme.textSecondary }]}>Toggle the fixtures in your build.</Text>
          {WATER_FIXTURES.filter(f => f.id !== 'indoor_shower' && f.id !== 'outdoor_shower').map(fixture => {
            const isOn = !!state.selectedWaterFixtures[fixture.id];
            return (
              <View key={fixture.id} style={[s.fixtureRow, { borderBottomColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }]}>
                <View style={{ flex: 1 }}>
                  <Text style={[s.fixtureName, { color: theme.text }]}>{fixture.name}</Text>
                  <Text style={[s.fixtureSub, { color: theme.textSecondary }]}>{fixture.defaultLitres}L {fixture.unit}</Text>
                </View>
                <Switch value={isOn} onValueChange={() => toggleFixture(fixture.id)} trackColor={{ false: isDark ? '#2C2C2E' : '#D1D1D6', true: theme.success }} thumbColor="#fff" />
              </View>
            );
          })}
        </GlassCard>

        {/* Results */}
        <GlassCard style={s.card} float>
          <Text style={[s.cardLabel, { color: theme.accent }]}>YOUR WATER SPEC</Text>
          <View style={s.specGrid}>
            <View style={s.specItem}>
              <Text style={[s.specBig, { color: theme.accent }]}>{result.freshTankRecommended}</Text>
              <Text style={[s.specUnit, { color: theme.textSecondary }]}>L Fresh Tank</Text>
            </View>
            <View style={s.specItem}>
              <Text style={[s.specBig, { color: theme.text }]}>{result.greyTankRecommended}</Text>
              <Text style={[s.specUnit, { color: theme.textSecondary }]}>L Grey Tank</Text>
            </View>
            <View style={s.specItem}>
              <Text style={[s.specBig, { color: theme.text }]}>{result.dailyLitres}</Text>
              <Text style={[s.specUnit, { color: theme.textSecondary }]}>L / Day</Text>
            </View>
          </View>
        </GlassCard>

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
  daysInput: { width: 80, height: 56, borderRadius: 10, borderWidth: 1, fontSize: 28, fontWeight: '800', textAlign: 'center' },
  choicePill: { flex: 1, paddingVertical: 12, paddingHorizontal: 8, borderRadius: 10, borderWidth: 1, alignItems: 'center' },
  choiceLabel: { fontSize: 11, fontWeight: '700', marginBottom: 2, textAlign: 'center' },
  choiceDesc: { fontSize: 9, textAlign: 'center' },
  fixtureRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1 },
  fixtureName: { fontSize: 14, fontWeight: '500' },
  fixtureSub: { fontSize: 11, marginTop: 1 },
  specGrid: { flexDirection: 'row', justifyContent: 'space-around' },
  specItem: { alignItems: 'center' },
  specBig: { fontSize: 28, fontWeight: '800' },
  specUnit: { fontSize: 10, fontWeight: '600', marginTop: 2 },
});
