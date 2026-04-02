import CollapsibleSection from '@/components/CollapsibleSection';
import ElectricalDisclaimer from '@/components/ElectricalDisclaimer';
import GlassCard from '@/components/GlassCard';
import TopographicBackground from '@/components/TopographicBackground';
import { FuelType, useCamper } from '@/context/CamperContext';
import { useTheme } from '@/context/ThemeContext';
import { useScreenSlide } from '@/hooks/useScreenSlide';
import { APPLIANCES, getDefaultHours } from '@/utils/calculator';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
  Animated,
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

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const COOK_OPTS: FuelType[] = ['Gas', 'Electric', 'None'];
const HEAT_OPTS: FuelType[] = ['Diesel', 'Gas', 'Electric', 'None'];
const WATER_OPTS: FuelType[] = ['Diesel', 'Gas', 'Electric', 'None'];
const SOLAR_OPTS = [0, 200, 400, 600];
const DRIVE_OPTS = [0, 1, 2];
const DC_APPLIANCE_IDS = new Set(APPLIANCES.dc_12v.map((app) => app.id));
const AC_APPLIANCE_IDS = new Set(APPLIANCES.ac_240v.map((app) => app.id));


function PillSelector({ value, options, onChange, fmt, theme }: {
  value: number | string;
  options: (number | string)[];
  onChange: (v: any) => void;
  fmt?: (v: any) => string;
  theme: any;
}) {
  const isDark = theme.blurTint === 'dark';
  return (
    <View style={{ flexDirection: 'row', gap: 6 }}>
      {options.map(o => {
        const active = value === o;
        return (
          <TouchableOpacity
            key={String(o)}
            style={[styles.pill,
              { backgroundColor: active ? theme.accent : isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)' },
              { borderColor: active ? theme.accent : isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)' }
            ]}
            onPress={() => onChange(o)}
            activeOpacity={0.75}
          >
            <Text style={[styles.pillText, { color: active ? '#fff' : theme.textSecondary }]}>
              {fmt ? fmt(o) : String(o)}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function ApplianceRow({ app, theme, isDark }: { app: { id: string; name: string; watts: string; ah: number }; theme: any; isDark: boolean }) {
  const { state, set } = useCamper();
  const isOn = !!state.selectedAppliances[app.id];
  const defaultHrs = getDefaultHours(app);
  const overrideHrs = state.applianceHoursOverrides[app.id];
  const displayHrs = overrideHrs !== undefined ? String(overrideHrs) : String(defaultHrs);
  const isFridge = app.id === 'dc_fridge';

  const toggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    set('selectedAppliances', { ...state.selectedAppliances, [app.id]: !isOn });
  };

  const onHoursChange = (val: string) => {
    const n = parseFloat(val);
    if (val === '' || isNaN(n)) {
      const next = { ...state.applianceHoursOverrides };
      delete next[app.id];
      set('applianceHoursOverrides', next);
    } else {
      set('applianceHoursOverrides', { ...state.applianceHoursOverrides, [app.id]: n });
    }
  };

  const onFridgeSizeChange = (val: string) => {
    const n = parseInt(val);
    if (!isNaN(n) && n > 0) set('fridgeLitres', n);
  };

  const currentHrs = overrideHrs ?? defaultHrs;
  const watts = parseInt(app.watts);
  const fridgeScale = isFridge ? (state.fridgeLitres ?? 50) / 50 : 1;
  const currentAh = Math.round((watts * currentHrs * fridgeScale) / 12);
  const displayName = isFridge ? `${state.fridgeLitres ?? 50}L Fridge/Freezer` : app.name;

  return (
    <View style={[styles.toggleRow, { borderBottomColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }]}>
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View style={styles.toggleInfo}>
            <Text style={[styles.toggleLabel, { color: theme.text }]}>{displayName}</Text>
            <Text style={[styles.toggleSub, { color: theme.textSecondary }]}>{app.watts} · {currentAh}Ah/day</Text>
          </View>
          <Switch value={isOn} onValueChange={toggle} trackColor={{ false: isDark ? '#2C2C2E' : '#D1D1D6', true: theme.success }} thumbColor="#fff" />
        </View>
        {isOn && (
          <View style={[styles.hoursRow, { backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)' }]}>
            {isFridge && (
              <>
                <Text style={[styles.hoursLabel, { color: theme.textSecondary }]}>Size</Text>
                <TextInput
                  style={[styles.hoursInput, {
                    color: theme.text,
                    backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)',
                    borderColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.1)',
                  }]}
                  keyboardType="number-pad"
                  value={String(state.fridgeLitres ?? 50)}
                  onChangeText={onFridgeSizeChange}
                  selectTextOnFocus
                />
                <Text style={[styles.hoursUnit, { color: theme.textSecondary, marginRight: 16 }]}>L</Text>
              </>
            )}
            <Text style={[styles.hoursLabel, { color: theme.textSecondary }]}>Hours per day</Text>
            <TextInput
              style={[styles.hoursInput, {
                color: theme.text,
                backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)',
                borderColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.1)',
              }]}
              keyboardType="decimal-pad"
              value={displayHrs}
              onChangeText={onHoursChange}
              selectTextOnFocus
            />
            <Text style={[styles.hoursUnit, { color: theme.textSecondary }]}>hrs</Text>
          </View>
        )}
      </View>
    </View>
  );
}

export default function YourSystemsScreen() {
  const { state, set } = useCamper();
  const theme = useTheme();
  const router = useRouter();
  const { style: slideStyle, panHandlers } = useScreenSlide(1);
  const isDark = theme.blurTint === 'dark';

  const [customName, setCustomName] = useState('');
  const [customWatts, setCustomWatts] = useState('');
  const [customHours, setCustomHours] = useState('4');
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [customAcName, setCustomAcName] = useState('');
  const [customAcWatts, setCustomAcWatts] = useState('');
  const [customAcHours, setCustomAcHours] = useState('1');
  const [showCustomAcForm, setShowCustomAcForm] = useState(false);

  const custom12vApps = useMemo(
    () => state.customAppliances.filter((a) => a.voltage !== '240v'),
    [state.customAppliances],
  );
  const custom240vApps = useMemo(
    () => state.customAppliances.filter((a) => a.voltage === '240v'),
    [state.customAppliances],
  );
  const selectedApplianceIds = useMemo(
    () => Object.keys(state.selectedAppliances).filter((id) => state.selectedAppliances[id]),
    [state.selectedAppliances],
  );
  const selectedAcCount = useMemo(
    () => selectedApplianceIds.filter((id) => AC_APPLIANCE_IDS.has(id)).length + custom240vApps.length,
    [custom240vApps.length, selectedApplianceIds],
  );
  const selectedDcCount = useMemo(
    () => selectedApplianceIds.filter((id) => DC_APPLIANCE_IDS.has(id)).length,
    [selectedApplianceIds],
  );

  const addCustomAppliance = () => {
    const w = parseFloat(customWatts);
    const h = parseFloat(customHours);
    if (!customName || isNaN(w) || w <= 0) return;
    set('customAppliances', [...state.customAppliances, { id: `custom_${Date.now()}`, name: customName, watts: w, hoursPerDay: isNaN(h) ? 4 : h, voltage: '12v' }]);
    setCustomName(''); setCustomWatts(''); setCustomHours('4'); setShowCustomForm(false);
  };
  const addCustomAcAppliance = () => {
    const w = parseFloat(customAcWatts);
    const h = parseFloat(customAcHours);
    if (!customAcName || isNaN(w) || w <= 0) return;
    set('customAppliances', [...state.customAppliances, { id: `custom_${Date.now()}`, name: customAcName, watts: w, hoursPerDay: isNaN(h) ? 1 : h, voltage: '240v' }]);
    setCustomAcName(''); setCustomAcWatts(''); setCustomAcHours('1'); setShowCustomAcForm(false);
  };

  const removeCustom = (id: string) => set('customAppliances', state.customAppliances.filter(a => a.id !== id));

  return (
    <Animated.View style={[{ flex: 1, backgroundColor: theme.background, position: 'relative' }, slideStyle]} {...panHandlers}>
      <TopographicBackground />

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* 1. POWER GENERATION */}
        <GlassCard style={styles.card}>
          <Text style={[styles.sectionLabel, { color: theme.accent }]}>1. POWER GENERATION</Text>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Solar Panels</Text>
          <PillSelector value={state.solarWatts} options={SOLAR_OPTS} onChange={v => set('solarWatts', v)} fmt={v => v === 0 ? 'None' : `${v}W`} theme={theme} />
          <View style={styles.spacer} />
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Daily Driving</Text>
          <PillSelector value={state.driveHours} options={DRIVE_OPTS} onChange={v => set('driveHours', v)} fmt={v => v === 0 ? 'Not driving' : `${v} hr${v > 1 ? 's' : ''}`} theme={theme} />
          {state.driveHours > 0 && (
            <CollapsibleSection title="DC-DC Charger" badge={`${state.dcDcSize}A`}>
              <Text style={[styles.accordionHelper, { color: theme.textSecondary }]}>Auto-selected based on your usage. Adjust if you have a specific charger installed.</Text>
              <View style={{ flexDirection: 'row', gap: 6 }}>
                {['18', '30', '50'].map(a => {
                  const active = String(state.dcDcSize) === a;
                  return (
                    <TouchableOpacity key={a} style={[styles.pill, { backgroundColor: active ? theme.accent : isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)', borderColor: active ? theme.accent : isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)' }]} onPress={() => set('dcDcSize', parseInt(a))}>
                      <Text style={[styles.pillText, { color: active ? '#fff' : theme.textSecondary }]}>{a}A</Text>
                    </TouchableOpacity>
                  );
                })}
                <TextInput style={[styles.customInput, { color: theme.text, backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)', borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)' }]} placeholder="Custom" placeholderTextColor={theme.textSecondary} keyboardType="numeric" onChangeText={v => { const n = parseInt(v); if (!isNaN(n)) set('dcDcSize', n); }} value={!['18', '30', '50'].includes(String(state.dcDcSize)) ? String(state.dcDcSize) : ''} />
              </View>
            </CollapsibleSection>
          )}
        </GlassCard>

        {/* 2. 240V ELECTRICS */}
        <GlassCard style={styles.card}>
          <Text style={[styles.sectionLabel, { color: theme.accent }]}>2. 240V ELECTRICS</Text>
          <Text style={[styles.sectionHelper, { color: theme.textSecondary }]}>
            One place for mains setup: 240V, hook-up charging, and appliances.
          </Text>
          <View style={[styles.toggleRow, { borderBottomWidth: 0 }]}>
            <View style={styles.toggleInfo}>
              <Text style={[styles.toggleLabel, { color: theme.text }]}>240V Electrics</Text>
              <Text style={[styles.toggleSub, { color: theme.textSecondary }]}>
                {state.needs240v ? 'Inverter/shore power enabled' : '12V only — no mains sockets'}
              </Text>
            </View>
            <Switch
              value={state.needs240v}
              onValueChange={v => {
                LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                set('needs240v', v);
              }}
              trackColor={{ false: isDark ? '#2C2C2E' : '#D1D1D6', true: theme.success }}
              thumbColor="#fff"
            />
          </View>
          {!state.needs240v && (
            <View style={[styles.infoBox, { backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)' }]}>
              <Text style={[styles.infoBoxText, { color: theme.textSecondary }]}>
                Your build is 12V only. To use mains-powered appliances (microwave, coffee machine, hair dryer etc.), enable 240V electrics above.
              </Text>
            </View>
          )}
          {state.needs240v && (
            <>
              <View style={[styles.toggleRow, { marginTop: 6 }]}>
                <View style={styles.toggleInfo}>
                  <Text style={[styles.toggleLabel, { color: theme.text }]}>Charge system on shore power?</Text>
                  <Text style={[styles.toggleSub, { color: theme.textSecondary }]}>
                    Turn on if you want campsite hook-up charging.
                  </Text>
                </View>
                <Switch
                  value={state.wantsHookupCharging}
                  onValueChange={(v) => {
                    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                    set('wantsHookupCharging', v);
                  }}
                  trackColor={{ false: isDark ? '#2C2C2E' : '#D1D1D6', true: theme.success }}
                  thumbColor="#fff"
                />
              </View>
              <View style={styles.spacer} />
              <Text style={[styles.sectionTitle, { color: theme.text }]}>240V Appliances</Text>
              <Text style={[styles.sectionHelper, { color: theme.textSecondary }]}>High-draw items that size your inverter and battery.</Text>
              <CollapsibleSection
                title="Show 240V appliances"
                badge={`${selectedAcCount} on`}
              >
                {APPLIANCES.ac_240v.map(app => (
                  <ApplianceRow key={app.id} app={app} theme={theme} isDark={isDark} />
                ))}
                {custom240vApps.map(app => {
                  const ah = Math.round((app.watts * app.hoursPerDay) / 12);
                  return (
                    <View key={app.id} style={[styles.toggleRow, { borderBottomColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }]}>
                      <View style={styles.toggleInfo}>
                        <Text style={[styles.toggleLabel, { color: theme.text }]}>{app.name}</Text>
                        <Text style={[styles.toggleSub, { color: theme.textSecondary }]}>{app.watts}W · {app.hoursPerDay}hrs/day · {ah}Ah/day</Text>
                      </View>
                      <TouchableOpacity onPress={() => removeCustom(app.id)} style={{ padding: 8 }}>
                        <FontAwesome name="times" size={14} color={theme.danger} />
                      </TouchableOpacity>
                    </View>
                  );
                })}
                {showCustomAcForm ? (
                  <View style={{ marginTop: 12, gap: 8 }}>
                    <TextInput style={[styles.customField, { color: theme.text, backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)', borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)' }]} placeholder="240V appliance name" placeholderTextColor={theme.textSecondary} value={customAcName} onChangeText={setCustomAcName} />
                    <View style={{ flexDirection: 'row', gap: 8 }}>
                      <TextInput style={[styles.customField, { flex: 1, color: theme.text, backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)', borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)' }]} placeholder="Watts" placeholderTextColor={theme.textSecondary} keyboardType="numeric" value={customAcWatts} onChangeText={setCustomAcWatts} />
                      <TextInput style={[styles.customField, { flex: 1, color: theme.text, backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)', borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)' }]} placeholder="Hrs/day" placeholderTextColor={theme.textSecondary} keyboardType="numeric" value={customAcHours} onChangeText={setCustomAcHours} />
                    </View>
                    {customAcWatts && customAcHours && <Text style={{ color: theme.accent, fontSize: 13, fontWeight: '700', textAlign: 'center' }}>≈ {Math.round((parseFloat(customAcWatts) * parseFloat(customAcHours)) / 12)} Ah/day</Text>}
                    <View style={{ flexDirection: 'row', gap: 8 }}>
                      <TouchableOpacity style={[styles.customBtnBase, { flex: 1, backgroundColor: theme.text }]} onPress={addCustomAcAppliance}><Text style={{ color: theme.background, fontWeight: '800', fontSize: 13 }}>Add 240V Appliance</Text></TouchableOpacity>
                      <TouchableOpacity style={[styles.customBtnBase, { flex: 1, backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)', borderWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)' }]} onPress={() => setShowCustomAcForm(false)}><Text style={{ color: theme.textSecondary, fontWeight: '600', fontSize: 13 }}>Cancel</Text></TouchableOpacity>
                    </View>
                  </View>
                ) : (
                  <TouchableOpacity style={[styles.addBtn, { borderColor: `${theme.accent}40` }]} onPress={() => setShowCustomAcForm(true)}>
                    <FontAwesome name="plus" size={12} color={theme.accent} />
                    <Text style={{ color: theme.accent, fontSize: 13, fontWeight: '600' }}>Add custom 240V appliance</Text>
                  </TouchableOpacity>
                )}
              </CollapsibleSection>
            </>
          )}
        </GlassCard>

        {/* 3. MAJOR SYSTEMS */}
        <GlassCard style={styles.card}>
          <Text style={[styles.sectionLabel, { color: theme.accent }]}>3. MAJOR SYSTEMS</Text>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Cooking</Text>
          <PillSelector value={state.cookFuel} options={COOK_OPTS} onChange={v => set('cookFuel', v)} theme={theme} />
          <View style={styles.spacer} />
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Space Heating</Text>
          <Text style={[styles.sectionHelper, { color: theme.textSecondary }]}>Choose your main heating type.</Text>
          <PillSelector value={state.heatFuel} options={HEAT_OPTS} onChange={v => set('heatFuel', v)} theme={theme} />
          <CollapsibleSection title="Heating details">
            <Text style={[styles.accordionHelper, { color: theme.textSecondary }]}>Diesel heaters (Webasto/Autoterm) draw ~12Ah/day for the controller + fan.{'\n'}Gas heaters (Truma) draw similar. Electric-only draws ~150Ah/day — only practical with very large solar.</Text>
          </CollapsibleSection>
          <View style={styles.spacer} />
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Hot Water</Text>
          <Text style={[styles.sectionHelper, { color: theme.textSecondary }]}>Choose your hot water type.</Text>
          <PillSelector value={state.waterFuel} options={WATER_OPTS} onChange={v => set('waterFuel', v)} theme={theme} />
        </GlassCard>

        {/* 4. 12V APPLIANCES */}
        <GlassCard style={styles.card}>
          <Text style={[styles.sectionLabel, { color: theme.accent }]}>4. 12V APPLIANCES</Text>
          <Text style={[styles.sectionHelper, { color: theme.textSecondary }]}>Toggle what you need. These run directly from battery power.</Text>
          <CollapsibleSection
            title="Show 12V appliances"
            badge={`${selectedDcCount} on`}
          >
            {APPLIANCES.dc_12v.map(app => (
              <ApplianceRow key={app.id} app={app} theme={theme} isDark={isDark} />
            ))}
          </CollapsibleSection>
        </GlassCard>

        {/* 5. CUSTOM 12V APPLIANCES */}
        <GlassCard style={styles.card}>
          <Text style={[styles.sectionLabel, { color: theme.accent }]}>5. CUSTOM 12V APPLIANCES</Text>
          <Text style={[styles.sectionHelper, { color: theme.textSecondary }]}>Add any 12V appliance not listed above. 240V customs are handled in the 240V section.</Text>
          {custom12vApps.map(app => {
            const ah = Math.round((app.watts * app.hoursPerDay) / 12);
            return (
              <View key={app.id} style={[styles.toggleRow, { borderBottomColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }]}>
                <View style={styles.toggleInfo}>
                  <Text style={[styles.toggleLabel, { color: theme.text }]}>{app.name}</Text>
                  <Text style={[styles.toggleSub, { color: theme.textSecondary }]}>{app.watts}W · {app.hoursPerDay}hrs/day · {ah}Ah/day</Text>
                </View>
                <TouchableOpacity onPress={() => removeCustom(app.id)} style={{ padding: 8 }}>
                  <FontAwesome name="times" size={14} color={theme.danger} />
                </TouchableOpacity>
              </View>
            );
          })}
          {showCustomForm ? (
            <View style={{ marginTop: 12, gap: 8 }}>
              <TextInput style={[styles.customField, { color: theme.text, backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)', borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)' }]} placeholder="Appliance name" placeholderTextColor={theme.textSecondary} value={customName} onChangeText={setCustomName} />
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <TextInput style={[styles.customField, { flex: 1, color: theme.text, backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)', borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)' }]} placeholder="Watts" placeholderTextColor={theme.textSecondary} keyboardType="numeric" value={customWatts} onChangeText={setCustomWatts} />
                <TextInput style={[styles.customField, { flex: 1, color: theme.text, backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)', borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)' }]} placeholder="Hrs/day" placeholderTextColor={theme.textSecondary} keyboardType="numeric" value={customHours} onChangeText={setCustomHours} />
              </View>
              {customWatts && customHours && <Text style={{ color: theme.accent, fontSize: 13, fontWeight: '700', textAlign: 'center' }}>≈ {Math.round((parseFloat(customWatts) * parseFloat(customHours)) / 12)} Ah/day</Text>}
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <TouchableOpacity style={[styles.customBtnBase, { flex: 1, backgroundColor: theme.text }]} onPress={addCustomAppliance}><Text style={{ color: theme.background, fontWeight: '800', fontSize: 13 }}>Add Appliance</Text></TouchableOpacity>
                <TouchableOpacity style={[styles.customBtnBase, { flex: 1, backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)', borderWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)' }]} onPress={() => setShowCustomForm(false)}><Text style={{ color: theme.textSecondary, fontWeight: '600', fontSize: 13 }}>Cancel</Text></TouchableOpacity>
              </View>
            </View>
          ) : (
            <TouchableOpacity style={[styles.addBtn, { borderColor: `${theme.accent}40` }]} onPress={() => setShowCustomForm(true)}>
              <FontAwesome name="plus" size={12} color={theme.accent} />
              <Text style={{ color: theme.accent, fontSize: 13, fontWeight: '600' }}>Add Your Own</Text>
            </TouchableOpacity>
          )}
        </GlassCard>

        <ElectricalDisclaimer compact />

        {/* CTA — fixed */}
        <TouchableOpacity style={[styles.ctaButton, { backgroundColor: theme.text }]} onPress={() => router.push('/insulation')} activeOpacity={0.85}>
          <Text style={[styles.ctaText, { color: theme.background }]}>Continue to Insulation →</Text>
        </TouchableOpacity>

        <View style={{ height: 120 }} />
      </ScrollView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: { padding: 24, paddingTop: 24 },
  card: { marginBottom: 28 },
  sectionLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 2, marginBottom: 10 },
  sectionTitle: { fontSize: 14, fontWeight: '700', marginBottom: 10 },
  sectionHelper: { fontSize: 12, marginBottom: 12, lineHeight: 17 },
  spacer: { height: 18 },
  accordionHelper: { fontSize: 12, lineHeight: 17, marginBottom: 10 },
  pill: { flex: 1, paddingVertical: 9, borderRadius: 8, borderWidth: 1, alignItems: 'center' },
  pillText: { fontSize: 11, fontWeight: '600' },
  toggleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 11, borderBottomWidth: 1 },
  toggleInfo: { flex: 1 },
  toggleLabel: { fontSize: 14, fontWeight: '500' },
  toggleSub: { fontSize: 11, marginTop: 1 },
  customInput: { flex: 1.3, borderRadius: 8, paddingHorizontal: 8, fontSize: 11, fontWeight: '600', textAlign: 'center', borderWidth: 1 },
  customField: { borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, borderWidth: 1 },
  customBtnBase: { paddingVertical: 11, borderRadius: 8, alignItems: 'center' },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 12, borderRadius: 8, justifyContent: 'center', borderWidth: 1, borderStyle: 'dashed', marginTop: 8 },
  hoursRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8 },
  hoursLabel: { fontSize: 12, fontWeight: '500', flex: 1 },
  hoursInput: { width: 56, textAlign: 'center', fontSize: 14, fontWeight: '700', paddingVertical: 6, paddingHorizontal: 4, borderRadius: 8, borderWidth: 1 },
  hoursUnit: { fontSize: 12, fontWeight: '500' },
  ctaButton: { paddingVertical: 18, borderRadius: 12, alignItems: 'center', marginTop: 12 },
  ctaText: { fontSize: 17, fontWeight: '800', letterSpacing: 0.5 },
  infoBox: { padding: 14, borderRadius: 10, marginTop: 4 },
  infoBoxText: { fontSize: 12, lineHeight: 18, fontStyle: 'italic' },
});
