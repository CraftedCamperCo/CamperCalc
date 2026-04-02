import GlassCard from '@/components/GlassCard';
import InvoiceForm from '@/components/InvoiceForm';
import TopographicBackground from '@/components/TopographicBackground';
import { useCamper } from '@/context/CamperContext';
import { useTheme } from '@/context/ThemeContext';
import { goBackOrHome } from '@/utils/navigation';
import { AlternativeBatteries, BatteryRecommendation, BuildSpec, calculate, FogstarBattery } from '@/utils/calculator';
import { buildShoppingList } from '@/utils/supplierCatalog';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

function BatteryCard({ battery, badge, isRecommended, theme }: {
  battery: FogstarBattery | BatteryRecommendation; badge: string; isRecommended: boolean; theme: any;
}) {
  const isDark = theme.blurTint === 'dark';
  return (
    <View style={[s.battCard, isRecommended && { borderColor: theme.accent, borderWidth: 2 }, { backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)' }]}>
      {isRecommended && (
        <View style={[s.battBadge, { backgroundColor: theme.accent }]}>
          <Text style={s.battBadgeText}>RECOMMENDED</Text>
        </View>
      )}
      <Text style={[s.battLabel, { color: theme.textSecondary }]}>{badge}</Text>
      <Text style={[s.battName, { color: theme.text }]}>{battery.name}</Text>
      <Text style={[s.battAh, { color: theme.accent }]}>{battery.capacityAh}Ah</Text>
      <Text style={[s.battPrice, { color: theme.text }]}>£{battery.price.toFixed(2)}</Text>
    </View>
  );
}

function StatBox({ label, value, unit, accent, theme }: { label: string; value: string | number; unit?: string; accent?: boolean; theme: any }) {
  return (
    <View style={s.statBox}>
      <Text style={[s.statLabel, { color: theme.textSecondary }]}>{label}</Text>
      <Text style={[s.statValue, { color: accent ? theme.accent : theme.text }]}>{value}</Text>
      {unit && <Text style={[s.statUnit, { color: theme.textSecondary }]}>{unit}</Text>}
    </View>
  );
}

function ConsumptionBar({ label, ah, total, theme }: { label: string; ah: number; total: number; theme: any }) {
  const pct = total > 0 ? Math.max(2, (ah / total) * 100) : 0;
  const isDark = theme.blurTint === 'dark';
  return (
    <View style={s.barRow}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
        <Text style={[s.barLabel, { color: theme.text }]}>{label}</Text>
        <Text style={[s.barVal, { color: theme.textSecondary }]}>{ah}Ah</Text>
      </View>
      <View style={[s.barTrack, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }]}>
        <View style={[s.barFill, { width: `${pct}%`, backgroundColor: theme.accent }]} />
      </View>
    </View>
  );
}

export default function ResultsScreen() {
  const { state } = useCamper();
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const isDark = theme.blurTint === 'dark';

  const [showInvoice, setShowInvoice] = useState(false);
  const spec = calculate(state);
  const { consumption, generation, recommendedBattery: bat, alternativeBatteries: alts, calculatedAh } = spec;
  const shopping = useMemo(() => buildShoppingList(spec), [spec.recommendedBankAh, spec.inverterSize, spec.recommendedSolarW, spec.dcDcChargerSize, spec.batteryVoltage]);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start();
  }, []);

  return (
    <View style={[s.container, { backgroundColor: theme.background }]}>
      <TopographicBackground />

      <TouchableOpacity style={[s.backBtn, { top: insets.top + 10 }]} onPress={() => goBackOrHome(router)} activeOpacity={0.7}>
        <FontAwesome name="chevron-left" size={16} color={theme.accent} />
        <Text style={[s.backText, { color: theme.accent }]}>Back</Text>
      </TouchableOpacity>

      <ScrollView style={s.scroll} contentContainerStyle={[s.content, { paddingTop: insets.top + 56 }]} showsVerticalScrollIndicator={false}>
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: fadeAnim.interpolate({ inputRange: [0, 1], outputRange: [15, 0] }) }] }}>
          <Text style={[s.eyebrow, { color: theme.accent }]}>YOUR BUILD SPEC</Text>
          <Text style={[s.title, { color: theme.text }]}>Here's what you need.</Text>
        </Animated.View>

        {/* Key Stats */}
        <GlassCard style={s.card} float>
          <View style={s.statsGrid}>
            <StatBox label="Daily Usage" value={spec.dailyAh} unit="Ah/day" accent theme={theme} />
            <StatBox label="Net Daily" value={spec.netDailyAh} unit="Ah/day" theme={theme} />
            <StatBox label="Battery Bank" value={bat.totalAh} unit="Ah" accent theme={theme} />
            <StatBox label="Solar" value={spec.recommendedSolarW > 0 ? `${spec.recommendedSolarW}W` : 'None'} theme={theme} />
          </View>
        </GlassCard>

        {/* Battery Recommendation */}
        <GlassCard style={s.card}>
          <Text style={[s.cardLabel, { color: theme.accent }]}>BATTERY RECOMMENDATION</Text>
          <Text style={[s.calcText, { color: theme.textSecondary }]}>
            Your system requires approximately <Text style={{ color: theme.text, fontWeight: '800' }}>{calculatedAh}Ah</Text>
          </Text>
          <Text style={[s.calcRec, { color: theme.text }]}>
            We recommend the <Text style={{ color: theme.accent, fontWeight: '800' }}>{bat.name}</Text>
            {bat.quantity > 1 ? <Text style={{ color: theme.textSecondary }}> × {bat.quantity}</Text> : null}
          </Text>

          <View style={s.battGrid}>
            {alts.eco && (
              <BatteryCard battery={alts.eco} badge="BUDGET" isRecommended={false} theme={theme} />
            )}
            <BatteryCard battery={bat} badge="STANDARD" isRecommended theme={theme} />
            {alts.pro && (
              <BatteryCard battery={alts.pro} badge="PREMIUM" isRecommended={false} theme={theme} />
            )}
          </View>
        </GlassCard>

        {/* Consumption Breakdown */}
        <GlassCard style={s.card}>
          <Text style={[s.cardLabel, { color: theme.accent }]}>DAILY CONSUMPTION</Text>
          {consumption.base > 0 && <ConsumptionBar label="Base Load" ah={consumption.base} total={spec.dailyAh} theme={theme} />}
          {consumption.party > 0 && <ConsumptionBar label="Crew" ah={consumption.party} total={spec.dailyAh} theme={theme} />}
          {consumption.heating > 0 && <ConsumptionBar label="Space Heating" ah={consumption.heating} total={spec.dailyAh} theme={theme} />}
          {consumption.cooking > 0 && <ConsumptionBar label="Cooking" ah={consumption.cooking} total={spec.dailyAh} theme={theme} />}
          {consumption.hotWater > 0 && <ConsumptionBar label="Hot Water" ah={consumption.hotWater} total={spec.dailyAh} theme={theme} />}
          {consumption.appliances > 0 && <ConsumptionBar label="Appliances" ah={consumption.appliances} total={spec.dailyAh} theme={theme} />}
          {consumption.custom > 0 && <ConsumptionBar label="Custom" ah={consumption.custom} total={spec.dailyAh} theme={theme} />}
        </GlassCard>

        {/* Power Generation */}
        {(generation.solar > 0 || generation.alternator > 0) && (
          <GlassCard style={s.card}>
            <Text style={[s.cardLabel, { color: theme.accent }]}>POWER GENERATION</Text>
            {generation.solar > 0 && (
              <View style={s.genRow}>
                <MaterialCommunityIcons name="solar-panel" size={18} color={theme.accent} />
                <Text style={[s.genText, { color: theme.text }]}>{spec.solarPanelsNeeded}× 200W panels = {spec.recommendedSolarW}W</Text>
                <Text style={[s.genAh, { color: theme.accent }]}>+{generation.solar}Ah/day</Text>
              </View>
            )}
            {generation.alternator > 0 && (
              <View style={s.genRow}>
                <MaterialCommunityIcons name="car-battery" size={18} color={theme.accent} />
                <Text style={[s.genText, { color: theme.text }]}>{spec.dcDcChargerSize}A DC-DC × {state.driveHours}hr driving</Text>
                <Text style={[s.genAh, { color: theme.accent }]}>+{generation.alternator}Ah/day</Text>
              </View>
            )}
          </GlassCard>
        )}

        {/* Inverter */}
        <GlassCard style={s.card}>
          <Text style={[s.cardLabel, { color: theme.accent }]}>SYSTEM COMPONENTS</Text>
          <View style={s.compRow}>
            <Text style={[s.compName, { color: theme.text }]}>Inverter</Text>
            <Text style={[s.compVal, { color: spec.inverterSize > 0 ? theme.accent : theme.textSecondary }]}>
              {spec.inverterSize > 0 ? `${spec.inverterSize}W` : 'Not required'}
            </Text>
          </View>
          <View style={s.compRow}>
            <Text style={[s.compName, { color: theme.text }]}>DC-DC Charger</Text>
            <Text style={[s.compVal, { color: spec.dcDcChargerSize > 0 ? theme.accent : theme.textSecondary }]}>
              {spec.dcDcChargerSize > 0 ? `${spec.dcDcChargerSize}A` : 'Not required'}
            </Text>
          </View>
          <View style={s.compRow}>
            <Text style={[s.compName, { color: theme.text }]}>Battery Type</Text>
            <Text style={[s.compVal, { color: theme.text }]}>{spec.batteryType}</Text>
          </View>
          <View style={s.compRow}>
            <Text style={[s.compName, { color: theme.text }]}>System Voltage</Text>
            <Text style={[s.compVal, { color: theme.text }]}>{spec.batteryVoltage}V</Text>
          </View>
        </GlassCard>

        {/* Fuel Consumption */}
        {(spec.dailyLPG > 0 || spec.dailyDiesel > 0) && (
          <GlassCard style={s.card}>
            <Text style={[s.cardLabel, { color: theme.accent }]}>FUEL CONSUMPTION</Text>
            {spec.dailyLPG > 0 && (
              <View style={s.compRow}>
                <Text style={[s.compName, { color: theme.text }]}>LPG Gas</Text>
                <Text style={[s.compVal, { color: theme.textSecondary }]}>{spec.dailyLPG} kg/day</Text>
              </View>
            )}
            {spec.dailyDiesel > 0 && (
              <View style={s.compRow}>
                <Text style={[s.compName, { color: theme.text }]}>Diesel (Heater)</Text>
                <Text style={[s.compVal, { color: theme.textSecondary }]}>{spec.dailyDiesel} L/day</Text>
              </View>
            )}
          </GlassCard>
        )}

        {/* Shopping List */}
        <GlassCard style={s.card}>
          <Text style={[s.cardLabel, { color: theme.accent }]}>COMPONENT LIST</Text>
          {shopping.items.map((item, idx) => (
            <View key={item.id + idx} style={[s.compRow, { borderBottomColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }]}>
              <Text style={[s.compName, { color: theme.text }]}>{item.name}</Text>
              <Text style={[s.compVal, { color: theme.accent }]}>£{item.supplierPrice.toFixed(2)}</Text>
            </View>
          ))}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingTop: 12, marginTop: 4 }}>
            <Text style={[{ fontSize: 14, fontWeight: '700', color: theme.text }]}>Total (RRP)</Text>
            <Text style={[{ fontSize: 18, fontWeight: '800', color: theme.accent }]}>£{shopping.totalRRP.toFixed(2)}</Text>
          </View>
          <Text style={[{ fontSize: 11, color: theme.successBright, fontWeight: '600', marginTop: 4, textAlign: 'right' }]}>
            Save £{shopping.savings.toFixed(2)} with Crafted discount
          </Text>
        </GlassCard>

        {/* CTAs */}
        <TouchableOpacity
          style={[s.ctaPrimary, { backgroundColor: theme.accent }]}
          activeOpacity={0.85}
          onPress={() => setShowInvoice(true)}
        >
          <MaterialCommunityIcons name="file-document-outline" size={20} color="#fff" />
          <Text style={s.ctaPrimaryText}>Generate Invoice</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[s.ctaSecondary, { borderColor: theme.accent }]}
          activeOpacity={0.85}
          onPress={() => {
            router.dismissAll();
            router.push('/projects');
          }}
        >
          <FontAwesome name="bookmark-o" size={16} color={theme.accent} />
          <Text style={[s.ctaSecondaryText, { color: theme.accent }]}>Save to Project</Text>
        </TouchableOpacity>

        <View style={{ height: 60 }} />
      </ScrollView>

      <InvoiceForm
        visible={showInvoice}
        onDismiss={() => setShowInvoice(false)}
        items={shopping.items}
        totalRRP={shopping.totalRRP}
        totalCrafted={shopping.totalCrafted}
        savings={shopping.savings}
        hasCraftedDiscount={false}
      />
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
  title: { fontSize: 26, fontWeight: '800', marginBottom: 20 },
  card: { marginBottom: 18 },
  cardLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 2, marginBottom: 14 },

  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'space-between' },
  statBox: { width: '46%', alignItems: 'center', paddingVertical: 14 },
  statLabel: { fontSize: 10, fontWeight: '600', letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 4 },
  statValue: { fontSize: 26, fontWeight: '800' },
  statUnit: { fontSize: 10, fontWeight: '500', marginTop: 2 },

  calcText: { fontSize: 13, lineHeight: 19, marginBottom: 4 },
  calcRec: { fontSize: 14, lineHeight: 20, marginBottom: 18, fontWeight: '500' },

  battGrid: { flexDirection: 'row', gap: 8 },
  battCard: { flex: 1, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', padding: 12, alignItems: 'center', position: 'relative', overflow: 'hidden' },
  battBadge: { position: 'absolute', top: 0, left: 0, right: 0, paddingVertical: 3, alignItems: 'center' },
  battBadgeText: { color: '#fff', fontSize: 8, fontWeight: '800', letterSpacing: 1 },
  battLabel: { fontSize: 8, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6, marginTop: 6 },
  battName: { fontSize: 11, fontWeight: '700', textAlign: 'center', marginBottom: 6, minHeight: 30 },
  battAh: { fontSize: 20, fontWeight: '800', marginBottom: 2 },
  battPrice: { fontSize: 12, fontWeight: '600' },

  barRow: { marginBottom: 12 },
  barLabel: { fontSize: 13, fontWeight: '500' },
  barVal: { fontSize: 12, fontWeight: '600' },
  barTrack: { height: 6, borderRadius: 3, overflow: 'hidden' },
  barFill: { height: 6, borderRadius: 3 },

  genRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  genText: { flex: 1, fontSize: 13, fontWeight: '500' },
  genAh: { fontSize: 13, fontWeight: '700' },

  compRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: 'rgba(255,255,255,0.06)' },
  compName: { fontSize: 14, fontWeight: '500' },
  compVal: { fontSize: 14, fontWeight: '700' },

  ctaPrimary: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 18, borderRadius: 12, marginBottom: 10 },
  ctaPrimaryText: { color: '#fff', fontSize: 17, fontWeight: '800' },
  ctaSecondary: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 16, borderRadius: 12, borderWidth: 1.5 },
  ctaSecondaryText: { fontSize: 15, fontWeight: '700' },
});
