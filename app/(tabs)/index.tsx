import GlassCard from '@/components/GlassCard';
import TopographicBackground from '@/components/TopographicBackground';
import { ClimateType, DestinationType, PartyType, ShowerFrequency, ShowerType, UsageType, useCamper } from '@/context/CamperContext';
import { useTheme } from '@/context/ThemeContext';
import { useScreenSlide } from '@/hooks/useScreenSlide';
import { useRouter } from 'expo-router';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  Animated,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

const DESTINATIONS: { label: DestinationType; icon: string }[] = [
  { label: 'Mountains & Highlands', icon: '⛰️' },
  { label: 'Ski Holiday', icon: '🎿' },
  { label: 'Coastal & Beach', icon: '🏖️' },
  { label: 'Forest & Lakes', icon: '🌲' },
  { label: 'European Road Trip', icon: '🗺️' },
  { label: 'Off-Grid & Remote', icon: '🛰️' },
];

const SEASONS: { label: ClimateType; desc: string }[] = [
  { label: 'Summer', desc: 'High solar, warm nights' },
  { label: 'Spring & Autumn', desc: 'Mixed weather, moderate' },
  { label: 'Deep Winter', desc: 'Short days, heavy heating' },
];

const USAGE: { label: UsageType; desc: string }[] = [
  { label: 'Weekend Trips', desc: '2–4 days' },
  { label: 'Extended Breaks', desc: '1–2 weeks' },
  { label: 'Full-Time Living', desc: 'Life on the road' },
  { label: 'Festival Goer', desc: 'Long stays, low driving, little/no shore power' },
];

const PARTY: { label: PartyType; icon: string }[] = [
  { label: 'Solo', icon: '🧍' },
  { label: 'Couple', icon: '👫' },
  { label: 'Family', icon: '👨‍👩‍👧' },
  { label: 'Group / Friends', icon: '👥' },
];

function AnimatedCard({ children, delay = 0, style }: { children: React.ReactNode; delay?: number; style?: object }) {
  const anim = useRef(new Animated.Value(0)).current;
  React.useEffect(() => {
    Animated.timing(anim, { toValue: 1, duration: 500, delay, useNativeDriver: true }).start();
  }, []);
  return (
    <Animated.View style={[{
      opacity: anim,
      transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [24, 0] }) }],
    }, style]}>
      {children}
    </Animated.View>
  );
}

const PROCESS_STEPS = [
  { step: '1', label: 'Your lifestyle', desc: 'Tell us about your adventures' },
  { step: '2', label: 'Electrical systems', desc: 'Power, loads, generation' },
  { step: '3', label: 'Insulation + final build', desc: 'Refine and add to cart' },
];

const EXTRA_OPTIONS = [
  { key: 'hasPets' as const, icon: '🐾', label: 'Pets', desc: '+fan & cooling draw' },
  { key: 'hasChildren' as const, icon: '🎮', label: 'Children', desc: '+entertainment & lighting' },
  { key: 'worksFromVan' as const, icon: '💻', label: 'Work from Van', desc: '+laptop & comms' },
];

const SHOWER_OPTIONS: { key: ShowerType; icon: string; label: string; desc: string }[] = [
  { key: 'indoor', icon: '🚿', label: 'Indoor Shower', desc: 'Built-in wet room or shower cubicle. Uses hot water system and water pump.' },
  { key: 'outdoor', icon: '🌊', label: 'Outdoor Shower', desc: 'External rinse for gear, pets, and quick wash-offs. Typically cold water.' },
  { key: 'none', icon: '✕', label: 'No Shower', desc: 'Using campsite facilities or no shower at all. Reduces water and power needs.' },
];

const SHOWER_FREQUENCY_OPTIONS: { key: ShowerFrequency; label: string; desc: string }[] = [
  { key: 'daily', label: 'Every day', desc: 'Full comfort' },
  { key: 'every2', label: 'Every 2 days', desc: 'Most common' },
  { key: 'every3', label: 'Every 3 days', desc: 'Water-saving' },
];

function ProcessSteps({ styles: s }: { styles: any }) {
  const step0 = useRef(new Animated.Value(0)).current;
  const step1 = useRef(new Animated.Value(0)).current;
  const step2 = useRef(new Animated.Value(0)).current;
  const arrow0 = useRef(new Animated.Value(0)).current;
  const arrow1 = useRef(new Animated.Value(0)).current;
  const stepAnims = [step0, step1, step2];
  const arrowAnims = [arrow0, arrow1];

  React.useEffect(() => {
    Animated.stagger(300, [
      Animated.spring(stepAnims[0], { toValue: 1, friction: 6, tension: 50, useNativeDriver: true }),
      Animated.timing(arrowAnims[0], { toValue: 1, duration: 250, useNativeDriver: true }),
      Animated.spring(stepAnims[1], { toValue: 1, friction: 6, tension: 50, useNativeDriver: true }),
      Animated.timing(arrowAnims[1], { toValue: 1, duration: 250, useNativeDriver: true }),
      Animated.spring(stepAnims[2], { toValue: 1, friction: 6, tension: 50, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <>
      {PROCESS_STEPS.map((p, i) => (
        <React.Fragment key={p.step}>
          <Animated.View style={[s.processStep, {
            opacity: stepAnims[i],
            transform: [{ scale: stepAnims[i].interpolate({ inputRange: [0, 1], outputRange: [0.7, 1] }) }],
          }]}>
            <View style={s.processNum}><Text style={s.processNumText}>{p.step}</Text></View>
            <Text style={s.processLabel}>{p.label}</Text>
            <Text style={s.processDesc}>{p.desc}</Text>
          </Animated.View>
          {i < 2 && (
            <Animated.View style={[s.processArrow, { opacity: arrowAnims[i], transform: [{ translateX: arrowAnims[i].interpolate({ inputRange: [0, 1], outputRange: [-8, 0] }) }] }]}>
              <Text style={s.processArrowText}>→</Text>
            </Animated.View>
          )}
        </React.Fragment>
      ))}
    </>
  );
}

export default function YourCamperScreen() {
  const { state, set } = useCamper();
  const theme = useTheme();
  const router = useRouter();
  const { style: slideStyle, panHandlers } = useScreenSlide(0);
  const [daysText, setDaysText] = useState(String(state.daysOffGrid));

  const handleDaysChange = useCallback((v: string) => {
    const digits = v.replace(/[^0-9]/g, '');
    setDaysText(digits);
    const n = parseInt(digits);
    if (!isNaN(n) && n > 0) set('daysOffGrid', n);
  }, [set]);

  const handleDaysBlur = useCallback(() => {
    const n = parseInt(daysText);
    if (isNaN(n) || n <= 0) {
      setDaysText(String(state.daysOffGrid));
    }
  }, [daysText, state.daysOffGrid]);

  const toggleClimate = useCallback((c: ClimateType) => {
    const next = state.climates.includes(c) ? state.climates.filter(x => x !== c) : [...state.climates, c];
    if (next.length > 0) set('climates', next);
  }, [set, state.climates]);

  const toggleDestination = useCallback((d: DestinationType) => {
    const next = state.destinations.includes(d) ? state.destinations.filter(x => x !== d) : [...state.destinations, d];
    if (next.length > 0) set('destinations', next);
  }, [set, state.destinations]);

  const s = useMemo(() => makeStyles(theme), [theme]);

  return (
    <Animated.View style={[{ flex: 1, backgroundColor: theme.background }, slideStyle]} {...panHandlers}>
      <TopographicBackground />
      <ScrollView style={s.scroll} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>

        <AnimatedCard delay={0}>
          <Text style={s.header}>Picture your{'\n'}perfect trip.</Text>
          <Text style={s.subheader}>Quick setup first, then we calculate and recommend your package.</Text>
        </AnimatedCard>

        {/* Process intro — animated step reveal */}
        <AnimatedCard delay={40}>
          <View style={s.processCard}>
            <View style={s.processRow}>
              <ProcessSteps styles={s} />
            </View>
            <Text style={s.processTagline}>Answer only what matters now. You can fine-tune later.</Text>
          </View>
        </AnimatedCard>

        {/* Q1 — Destination */}
        <AnimatedCard delay={80}>
          <GlassCard style={s.card}>
            <Text style={s.questionLabel}>WHERE WILL YOU TAKE IT?</Text>
            <Text style={s.questionTitle}>Pick your terrain</Text>
            <Text style={s.questionHelper}>Select all that apply — we'll optimise for your conditions.</Text>
            <View style={s.destGrid}>
              {DESTINATIONS.map(d => {
                const active = state.destinations.includes(d.label);
                return (
                  <TouchableOpacity key={d.label} style={[s.destPill, active && s.destPillActive]} onPress={() => toggleDestination(d.label)} activeOpacity={0.75}>
                    <Text style={s.destIcon}>{d.icon}</Text>
                    <Text style={[s.destLabel, active && s.destLabelActive]}>{d.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </GlassCard>
        </AnimatedCard>

        {/* Q2 — Seasons */}
        <AnimatedCard delay={160}>
          <GlassCard style={s.card}>
            <Text style={s.questionLabel}>WHEN WILL YOU ADVENTURE?</Text>
            <Text style={s.questionTitle}>Travel seasons</Text>
            <Text style={s.questionHelper}>Select all you plan to camp in. This affects solar and heating calculations.</Text>
            {SEASONS.map(season => {
              const active = state.climates.includes(season.label);
              return (
                <TouchableOpacity key={season.label} style={[s.rowOption, active && s.rowOptionActive]} onPress={() => toggleClimate(season.label)} activeOpacity={0.75}>
                  <View style={s.rowOptionInner}>
                    <Text style={[s.rowOptionLabel, active && { color: theme.accent }]}>{season.label}</Text>
                    <Text style={[s.rowOptionDesc, active && { color: theme.blurTint === 'dark' ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.5)' }]}>{season.desc}</Text>
                  </View>
                  <View style={[s.checkCircle, active && s.checkCircleActive]}>
                    {active && <Text style={s.checkMark}>✓</Text>}
                  </View>
                </TouchableOpacity>
              );
            })}
          </GlassCard>
        </AnimatedCard>

        {/* Q3 — Trip Length */}
        <AnimatedCard delay={240}>
          <GlassCard style={s.card}>
            <Text style={s.questionLabel}>HOW LONG DO YOU ESCAPE?</Text>
            <Text style={s.questionTitle}>Trip duration</Text>
            <View style={s.pillRow}>
              {USAGE.map(u => {
                const active = state.usage === u.label;
                return (
                  <TouchableOpacity key={u.label} style={[s.pill, active && s.pillActive]} onPress={() => set('usage', u.label)} activeOpacity={0.75}>
                    <Text style={[s.pillLabel, active && { color: theme.blurTint === 'dark' ? '#fff' : '#fff' }]}>{u.label}</Text>
                    <Text style={[s.pillDesc, active && { color: 'rgba(255,255,255,0.7)' }]}>{u.desc}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </GlassCard>
        </AnimatedCard>

        {/* Q4 — Party */}
        <AnimatedCard delay={320}>
          <GlassCard style={s.card}>
            <Text style={s.questionLabel}>WHO'S COMING WITH YOU?</Text>
            <Text style={s.questionTitle}>Your crew</Text>
            <View style={s.partyRow}>
              {PARTY.map(p => {
                const active = state.party === p.label;
                return (
                  <TouchableOpacity key={p.label} style={[s.partyPill, active && s.partyPillActive]} onPress={() => set('party', p.label)} activeOpacity={0.75}>
                    <Text style={s.partyIcon}>{p.icon}</Text>
                    <Text style={[s.partyLabel, active && { color: theme.accent }]}>{p.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </GlassCard>
        </AnimatedCard>

        {/* Q5 — Extras */}
        <AnimatedCard delay={400}>
          <GlassCard style={s.card}>
            <Text style={s.questionLabel}>ANY EXTRAS TO CONSIDER?</Text>
            <Text style={s.questionTitle}>A few more details</Text>
            <Text style={s.questionHelper}>These add real power draw to your calculation.</Text>
            <View style={s.extrasGrid}>
              {EXTRA_OPTIONS.map(e => {
                const active = state[e.key];
                return (
                  <TouchableOpacity key={e.key} style={[s.extraCard, active && s.extraCardActive]} onPress={() => set(e.key, !active)} activeOpacity={0.75}>
                    <Text style={s.extraIcon}>{e.icon}</Text>
                    <Text style={[s.extraLabel, active && { color: theme.accent }]}>{e.label}</Text>
                    <Text style={s.extraDesc}>{e.desc}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </GlassCard>
        </AnimatedCard>

        {/* Q6 — Shower Setup */}
        <AnimatedCard delay={480}>
          <GlassCard style={s.card}>
            <Text style={s.questionLabel}>WHAT'S YOUR SHOWER SETUP?</Text>
            <Text style={s.questionTitle}>Shower type</Text>
            <Text style={s.questionHelper}>This affects both water usage and electrical draw for heating. Pick the option that best describes your build.</Text>
            {SHOWER_OPTIONS.map(opt => {
              const active = state.showerType === opt.key;
              return (
                <TouchableOpacity key={opt.key} style={[s.rowOption, active && s.rowOptionActive]} onPress={() => set('showerType', opt.key)} activeOpacity={0.75}>
                  <View style={s.rowOptionInner}>
                    <Text style={[s.rowOptionLabel, active && { color: theme.accent }]}>{opt.icon}  {opt.label}</Text>
                    <Text style={[s.rowOptionDesc, active && { color: theme.blurTint === 'dark' ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.5)' }]}>{opt.desc}</Text>
                  </View>
                  <View style={[s.checkCircle, active && s.checkCircleActive]}>
                    {active && <Text style={s.checkMark}>✓</Text>}
                  </View>
                </TouchableOpacity>
              );
            })}

            {state.showerType === 'indoor' && (
              <View style={{ marginTop: 20 }}>
                <Text style={s.questionLabel}>HOW OFTEN WILL YOU SHOWER?</Text>
                <Text style={[s.questionTitle, { marginBottom: 4 }]}>Shower frequency</Text>
                <Text style={[s.questionHelper, { marginBottom: 12 }]}>Affects daily water consumption and hot water heating draw.</Text>
                <View style={s.pillRow}>
                  {SHOWER_FREQUENCY_OPTIONS.map(opt => {
                    const active = state.showerFrequency === opt.key;
                    return (
                      <TouchableOpacity key={opt.key} style={[s.pill, active && s.pillActive]} onPress={() => set('showerFrequency', opt.key)} activeOpacity={0.75}>
                        <Text style={[s.pillLabel, active && { color: '#fff' }]}>{opt.label}</Text>
                        <Text style={[s.pillDesc, active && { color: 'rgba(255,255,255,0.7)' }]}>{opt.desc}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}
          </GlassCard>
        </AnimatedCard>

        {/* Q7 — Off-Grid Days */}
        <AnimatedCard delay={560}>
          <GlassCard style={s.card}>
            <Text style={s.questionLabel}>OFF-GRID TARGET</Text>
            <Text style={s.questionTitle}>Days without hookup or driving?</Text>
            <Text style={s.questionHelper}>How many days must your battery last without topping up from solar or driving.</Text>
            <View style={s.inputRow}>
              <TextInput
                style={s.daysInput}
                value={daysText}
                onChangeText={handleDaysChange}
                onBlur={handleDaysBlur}
                keyboardType="numeric"
                maxLength={2}
                placeholderTextColor={theme.textSecondary}
                placeholder="1"
                selectTextOnFocus
              />
              <Text style={s.daysLabel}>days</Text>
            </View>
          </GlassCard>
        </AnimatedCard>

        <AnimatedCard delay={640}>
          <TouchableOpacity style={s.ctaButton} onPress={() => router.push('/two')} activeOpacity={0.85}>
            <Text style={s.ctaText}>Continue to Systems →</Text>
          </TouchableOpacity>
        </AnimatedCard>

        <View style={{ height: 120 }} />
      </ScrollView>
    </Animated.View>
  );
}

function makeStyles(theme: ReturnType<typeof useTheme>) {
  const isDark = theme.blurTint === 'dark';
  return StyleSheet.create({
    scroll: { flex: 1 },
    content: { padding: 24, paddingTop: 24 },
    header: { fontSize: 34, fontWeight: '800', color: theme.text, lineHeight: 42, marginBottom: 14 },
    subheader: { fontSize: 15, color: theme.textSecondary, lineHeight: 23, marginBottom: 40 },
    card: { marginBottom: 28 },
    questionLabel: { fontSize: 10, fontWeight: '700', color: theme.accent, letterSpacing: 2, marginBottom: 6 },
    questionTitle: { fontSize: 18, fontWeight: '700', color: theme.text, marginBottom: 6 },
    questionHelper: { fontSize: 13, color: theme.textSecondary, marginBottom: 18, lineHeight: 19 },
    processCard: { borderWidth: 1, borderColor: `${theme.accent}33`, borderRadius: 14, padding: 20, marginBottom: 28, backgroundColor: `${theme.accent}08` },
    processRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 },
    processStep: { flex: 1, alignItems: 'center', gap: 6 },
    processNum: { width: 28, height: 28, borderRadius: 14, backgroundColor: `${theme.accent}28`, borderWidth: 1, borderColor: `${theme.accent}66`, alignItems: 'center', justifyContent: 'center' },
    processNumText: { color: theme.accent, fontSize: 12, fontWeight: '800' },
    processLabel: { fontSize: 11, fontWeight: '700', color: theme.text, textAlign: 'center' },
    processDesc: { fontSize: 10, color: theme.textSecondary, textAlign: 'center', lineHeight: 13 },
    processArrow: { paddingTop: 6, paddingHorizontal: 4 },
    processArrowText: { color: `${theme.accent}66`, fontSize: 14 },
    processTagline: { fontSize: 12, color: theme.textSecondary, textAlign: 'center', lineHeight: 16, borderTopWidth: 1, borderTopColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)', paddingTop: 12 },
    destGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    destPill: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.10)', backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)' },
    destPillActive: { borderColor: theme.accent, backgroundColor: `${theme.accent}22` },
    destIcon: { fontSize: 16 },
    destLabel: { fontSize: 12, fontWeight: '600', color: theme.textSecondary },
    destLabelActive: { color: theme.accent },
    rowOption: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, paddingHorizontal: 14, borderRadius: 10, borderWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)', backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', marginBottom: 8 },
    rowOptionActive: { borderColor: theme.accent, backgroundColor: `${theme.accent}15` },
    rowOptionInner: { flex: 1 },
    rowOptionLabel: { fontSize: 15, fontWeight: '600', color: theme.text, marginBottom: 2 },
    rowOptionDesc: { fontSize: 12, color: theme.textSecondary },
    checkCircle: { width: 22, height: 22, borderRadius: 11, borderWidth: 1.5, borderColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.15)', alignItems: 'center', justifyContent: 'center' },
    checkCircleActive: { backgroundColor: theme.accent, borderColor: theme.accent },
    checkMark: { color: '#000', fontSize: 12, fontWeight: '800' },
    pillRow: { flexDirection: 'row', gap: 8, marginTop: 8 },
    pill: { flex: 1, paddingVertical: 12, paddingHorizontal: 8, borderRadius: 10, borderWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)', backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)', alignItems: 'center' },
    pillActive: { backgroundColor: theme.accent, borderColor: theme.accent },
    pillLabel: { fontSize: 12, fontWeight: '700', color: theme.text, marginBottom: 3, textAlign: 'center' },
    pillDesc: { fontSize: 10, color: theme.textSecondary, textAlign: 'center' },
    partyRow: { flexDirection: 'row', gap: 8, marginTop: 8, flexWrap: 'wrap' },
    partyPill: { flex: 1, minWidth: '40%', alignItems: 'center', paddingVertical: 14, borderRadius: 10, borderWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)', backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)' },
    partyPillActive: { borderColor: theme.accent, backgroundColor: `${theme.accent}20` },
    partyIcon: { fontSize: 22, marginBottom: 6 },
    partyLabel: { fontSize: 12, fontWeight: '600', color: theme.textSecondary },
    extrasGrid: { flexDirection: 'row', gap: 8, marginTop: 4 },
    extraCard: { flex: 1, alignItems: 'center', paddingVertical: 14, borderRadius: 10, borderWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)', backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)' },
    extraCardActive: { borderColor: theme.accent, backgroundColor: `${theme.accent}15` },
    extraIcon: { fontSize: 22, marginBottom: 6 },
    extraLabel: { fontSize: 11, fontWeight: '700', color: theme.text, marginBottom: 3 },
    extraDesc: { fontSize: 9, color: theme.textSecondary, textAlign: 'center', paddingHorizontal: 4 },
    inputRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 8 },
    daysInput: { width: 80, height: 56, backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)', borderRadius: 10, borderWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.12)', color: theme.text, fontSize: 28, fontWeight: '800', textAlign: 'center' },
    daysLabel: { fontSize: 18, color: theme.textSecondary, fontWeight: '500' },
    ctaButton: { backgroundColor: theme.text, paddingVertical: 18, borderRadius: 12, alignItems: 'center', marginTop: 12 },
    ctaText: { color: theme.background, fontSize: 17, fontWeight: '800', letterSpacing: 0.5 },
  });
}
