import GlassCard from '@/components/GlassCard';
import TopographicBackground from '@/components/TopographicBackground';
import { ClimateType, FuelType, PartyType, UsageType, useCamper } from '@/context/CamperContext';
import { useTheme } from '@/context/ThemeContext';
import { goBackOrHome } from '@/utils/navigation';
import { APPLIANCES, getDefaultHours } from '@/utils/calculator';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  LayoutAnimation,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  UIManager,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const USAGE_OPTS: { label: UsageType; desc: string }[] = [
  { label: 'Weekend Trips', desc: '2-4 days' },
  { label: 'Extended Breaks', desc: '1-2 weeks' },
  { label: 'Full-Time Living', desc: 'Life on the road' },
];

const PARTY_OPTS: { label: PartyType; icon: string }[] = [
  { label: 'Solo', icon: '🧍' },
  { label: 'Couple', icon: '👫' },
  { label: 'Family', icon: '👨‍👩‍👧' },
  { label: 'Group / Friends', icon: '👥' },
];

const SEASON_OPTS: { label: ClimateType; desc: string }[] = [
  { label: 'Summer', desc: 'High solar' },
  { label: 'Spring & Autumn', desc: 'Mixed' },
  { label: 'Deep Winter', desc: 'Heavy heating' },
];

const COOK_OPTS: FuelType[] = ['Gas', 'Electric', 'None'];
const HEAT_OPTS: FuelType[] = ['Diesel', 'Gas', 'Electric', 'None'];
const WATER_OPTS: FuelType[] = ['Diesel', 'Gas', 'Electric', 'None'];
const SOLAR_OPTS = [0, 200, 400, 600];
const DRIVE_OPTS = [0, 1, 2];

function PillSelect({ value, options, onChange, fmt, theme }: {
  value: number | string; options: (number | string)[]; onChange: (v: any) => void; fmt?: (v: any) => string; theme: any;
}) {
  const isDark = theme.blurTint === 'dark';
  return (
    <View style={{ flexDirection: 'row', gap: 6 }}>
      {options.map(o => {
        const active = value === o;
        return (
          <TouchableOpacity
            key={String(o)}
            style={[s.pill, { backgroundColor: active ? theme.accent : isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)', borderColor: active ? theme.accent : isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)' }]}
            onPress={() => onChange(o)}
            activeOpacity={0.75}
          >
            <Text style={[s.pillText, { color: active ? '#fff' : theme.textSecondary }]}>
              {fmt ? fmt(o) : String(o)}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function ApplianceToggle({ app, theme }: { app: { id: string; name: string; watts: string; ah: number }; theme: any }) {
  const { state, set } = useCamper();
  const isOn = !!state.selectedAppliances[app.id];
  const isDark = theme.blurTint === 'dark';
  const defaultHrs = getDefaultHours(app);
  const overrideHrs = state.applianceHoursOverrides[app.id];
  const currentHrs = overrideHrs ?? defaultHrs;
  const watts = parseInt(app.watts);
  const currentAh = Math.round((watts * currentHrs) / 12);

  const toggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    set('selectedAppliances', { ...state.selectedAppliances, [app.id]: !isOn });
  };

  return (
    <View style={[s.appRow, { borderBottomColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }]}>
      <View style={{ flex: 1 }}>
        <Text style={[s.appName, { color: theme.text }]}>{app.name}</Text>
        <Text style={[s.appSub, { color: theme.textSecondary }]}>{app.watts} · {currentAh}Ah/day</Text>
      </View>
      <Switch value={isOn} onValueChange={toggle} trackColor={{ false: isDark ? '#2C2C2E' : '#D1D1D6', true: theme.success }} thumbColor="#fff" />
    </View>
  );
}

export default function ElectricsCalc() {
  const { state, set } = useCamper();
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const isDark = theme.blurTint === 'dark';

  const [daysText, setDaysText] = useState(String(state.daysOffGrid));

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

  const toggleClimate = (c: ClimateType) => {
    const next = state.climates.includes(c) ? state.climates.filter(x => x !== c) : [...state.climates, c];
    if (next.length > 0) set('climates', next);
  };

  return (
    <View style={[s.container, { backgroundColor: theme.background }]}>
      <TopographicBackground />

      {/* Back button */}
      <TouchableOpacity
        style={[s.backBtn, { top: insets.top + 10 }]}
        onPress={() => goBackOrHome(router)}
        activeOpacity={0.7}
      >
        <FontAwesome name="chevron-left" size={16} color={theme.accent} />
        <Text style={[s.backText, { color: theme.accent }]}>Back</Text>
      </TouchableOpacity>

      <ScrollView style={s.scroll} contentContainerStyle={[s.content, { paddingTop: insets.top + 56 }]} showsVerticalScrollIndicator={false}>
        <Text style={[s.eyebrow, { color: theme.accent }]}>ELECTRICS CALCULATOR</Text>
        <Text style={[s.title, { color: theme.text }]}>Size your electrical system</Text>
        <Text style={[s.subtitle, { color: theme.textSecondary }]}>
          Answer a few questions and we'll calculate your battery, solar, and inverter needs.
        </Text>

        {/* Trip Type */}
        <GlassCard style={s.card}>
          <Text style={[s.cardLabel, { color: theme.accent }]}>TRIP DURATION</Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {USAGE_OPTS.map(u => {
              const active = state.usage === u.label;
              return (
                <TouchableOpacity key={u.label} style={[s.choicePill, active && { backgroundColor: theme.accent, borderColor: theme.accent }, { borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)', backgroundColor: active ? theme.accent : isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)' }]} onPress={() => set('usage', u.label)} activeOpacity={0.75}>
                  <Text style={[s.choiceLabel, { color: active ? '#fff' : theme.text }]}>{u.label}</Text>
                  <Text style={[s.choiceDesc, { color: active ? 'rgba(255,255,255,0.7)' : theme.textSecondary }]}>{u.desc}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </GlassCard>

        {/* Party */}
        <GlassCard style={s.card}>
          <Text style={[s.cardLabel, { color: theme.accent }]}>YOUR CREW</Text>
          <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
            {PARTY_OPTS.map(p => {
              const active = state.party === p.label;
              return (
                <TouchableOpacity key={p.label} style={[s.partyPill, { borderColor: active ? theme.accent : isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)', backgroundColor: active ? `${theme.accent}20` : isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)' }]} onPress={() => set('party', p.label)} activeOpacity={0.75}>
                  <Text style={s.partyIcon}>{p.icon}</Text>
                  <Text style={[s.partyLabel, { color: active ? theme.accent : theme.textSecondary }]}>{p.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </GlassCard>

        {/* Season */}
        <GlassCard style={s.card}>
          <Text style={[s.cardLabel, { color: theme.accent }]}>TRAVEL SEASONS</Text>
          <Text style={[s.cardHelper, { color: theme.textSecondary }]}>Select all that apply</Text>
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

        {/* Off-Grid Days */}
        <GlassCard style={s.card}>
          <Text style={[s.cardLabel, { color: theme.accent }]}>DAYS OFF-GRID</Text>
          <Text style={[s.cardHelper, { color: theme.textSecondary }]}>How many days must your battery last without hookup or driving?</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 8 }}>
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
            <Text style={[{ fontSize: 18, color: theme.textSecondary, fontWeight: '500' }]}>days</Text>
          </View>
        </GlassCard>

        {/* Major Systems */}
        <GlassCard style={s.card}>
          <Text style={[s.cardLabel, { color: theme.accent }]}>MAJOR SYSTEMS</Text>
          <Text style={[s.fieldTitle, { color: theme.text }]}>Cooking</Text>
          <PillSelect value={state.cookFuel} options={COOK_OPTS} onChange={v => set('cookFuel', v)} theme={theme} />
          <View style={{ height: 16 }} />
          <Text style={[s.fieldTitle, { color: theme.text }]}>Space Heating</Text>
          <PillSelect value={state.heatFuel} options={HEAT_OPTS} onChange={v => set('heatFuel', v)} theme={theme} />
          <View style={{ height: 16 }} />
          <Text style={[s.fieldTitle, { color: theme.text }]}>Hot Water</Text>
          <PillSelect value={state.waterFuel} options={WATER_OPTS} onChange={v => set('waterFuel', v)} theme={theme} />
        </GlassCard>

        {/* Power Generation */}
        <GlassCard style={s.card}>
          <Text style={[s.cardLabel, { color: theme.accent }]}>POWER GENERATION</Text>
          <Text style={[s.fieldTitle, { color: theme.text }]}>Solar Panels</Text>
          <PillSelect value={state.solarWatts} options={SOLAR_OPTS} onChange={v => set('solarWatts', v)} fmt={v => v === 0 ? 'None' : `${v}W`} theme={theme} />
          <View style={{ height: 16 }} />
          <Text style={[s.fieldTitle, { color: theme.text }]}>Daily Driving</Text>
          <PillSelect value={state.driveHours} options={DRIVE_OPTS} onChange={v => set('driveHours', v)} fmt={v => v === 0 ? 'None' : `${v} hr${v > 1 ? 's' : ''}`} theme={theme} />
        </GlassCard>

        {/* Appliances */}
        <GlassCard style={s.card}>
          <Text style={[s.cardLabel, { color: theme.accent }]}>APPLIANCES</Text>
          <Text style={[s.cardHelper, { color: theme.textSecondary }]}>Toggle what you'll have in your build.</Text>
          {APPLIANCES.dc_12v.map(app => (
            <ApplianceToggle key={app.id} app={app} theme={theme} />
          ))}
          <View style={{ height: 12, borderTopWidth: 1, borderTopColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)', marginTop: 8 }} />
          <Text style={[s.fieldTitle, { color: theme.text, marginTop: 4 }]}>240V Appliances</Text>
          {APPLIANCES.ac_240v.map(app => (
            <ApplianceToggle key={app.id} app={app} theme={theme} />
          ))}
        </GlassCard>

        {/* Extras */}
        <GlassCard style={s.card}>
          <Text style={[s.cardLabel, { color: theme.accent }]}>EXTRAS</Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {[
              { key: 'hasPets' as const, icon: '🐾', label: 'Pets' },
              { key: 'hasChildren' as const, icon: '🎮', label: 'Children' },
              { key: 'worksFromVan' as const, icon: '💻', label: 'Work from Van' },
            ].map(e => {
              const active = state[e.key];
              return (
                <TouchableOpacity key={e.key} style={[s.extraCard, { borderColor: active ? theme.accent : isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)', backgroundColor: active ? `${theme.accent}15` : isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)' }]} onPress={() => set(e.key, !active)} activeOpacity={0.75}>
                  <Text style={{ fontSize: 22, marginBottom: 4 }}>{e.icon}</Text>
                  <Text style={[s.extraLabel, { color: active ? theme.accent : theme.textSecondary }]}>{e.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </GlassCard>

        {/* CTA */}
        <TouchableOpacity
          style={[s.ctaButton, { backgroundColor: theme.accent }]}
          onPress={() => router.push('/(calc)/results')}
          activeOpacity={0.85}
        >
          <Text style={s.ctaText}>Calculate My Build →</Text>
        </TouchableOpacity>

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
  fieldTitle: { fontSize: 14, fontWeight: '700', marginBottom: 10 },

  pill: { flex: 1, paddingVertical: 9, borderRadius: 8, borderWidth: 1, alignItems: 'center' },
  pillText: { fontSize: 11, fontWeight: '600' },

  choicePill: { flex: 1, paddingVertical: 12, paddingHorizontal: 8, borderRadius: 10, borderWidth: 1, alignItems: 'center' },
  choiceLabel: { fontSize: 11, fontWeight: '700', marginBottom: 2, textAlign: 'center' },
  choiceDesc: { fontSize: 9, textAlign: 'center' },

  partyPill: { flex: 1, minWidth: '40%', alignItems: 'center', paddingVertical: 14, borderRadius: 10, borderWidth: 1 },
  partyIcon: { fontSize: 22, marginBottom: 4 },
  partyLabel: { fontSize: 11, fontWeight: '600' },

  rowOption: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, paddingHorizontal: 14, borderRadius: 10, borderWidth: 1, marginBottom: 8 },
  rowLabel: { fontSize: 15, fontWeight: '600', marginBottom: 2 },
  rowDesc: { fontSize: 12 },
  checkCircle: { width: 22, height: 22, borderRadius: 11, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  checkMark: { color: '#000', fontSize: 12, fontWeight: '800' },

  daysInput: { width: 80, height: 56, borderRadius: 10, borderWidth: 1, fontSize: 28, fontWeight: '800', textAlign: 'center' },

  appRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1 },
  appName: { fontSize: 14, fontWeight: '500' },
  appSub: { fontSize: 11, marginTop: 1 },

  extraCard: { flex: 1, alignItems: 'center', paddingVertical: 14, borderRadius: 10, borderWidth: 1 },
  extraLabel: { fontSize: 11, fontWeight: '700' },

  ctaButton: { paddingVertical: 18, borderRadius: 12, alignItems: 'center', marginTop: 8 },
  ctaText: { color: '#fff', fontSize: 17, fontWeight: '800', letterSpacing: 0.5 },
});
