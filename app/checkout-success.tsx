import GlassCard from '@/components/GlassCard';
import TopographicBackground from '@/components/TopographicBackground';
import { useCart } from '@/context/CartContext';
import { useEntitlements } from '@/context/EntitlementsContext';
import { useProjects } from '@/context/ProjectContext';
import { useTheme } from '@/context/ThemeContext';
import { trackCheckoutSuccess } from '@/utils/analytics';
import { successHaptic } from '@/utils/haptics';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function CheckoutSuccess() {
  const theme = useTheme();
  const router = useRouter();
  const { items, clearCart } = useCart();
  const { currentProject, markPurchasedItems, refreshProjects } = useProjects();
  const { has, refresh: refreshEntitlements } = useEntitlements();
  const salesSuiteUnlocked = has('sales_suite_access');

  useEffect(() => {
    successHaptic();
    trackCheckoutSuccess('stripe_session', items.reduce((s, i) => s + i.product.estimatedPrice * i.quantity, 0));
    const ids = items.map((i) => i.product.id);
    if (currentProject && ids.length > 0) {
      markPurchasedItems(currentProject.id, ids).catch(() => {});
    }
    refreshProjects().catch(() => {});
    refreshEntitlements().catch(() => {});
    clearCart();
  }, []);
  return (
    <View style={[s.container, { backgroundColor: theme.background }]}>
      <TopographicBackground />
      <GlassCard style={s.card}>
        <MaterialCommunityIcons name="check-circle" size={42} color={theme.success} style={{ marginBottom: 12 }} />
        <Text style={[s.title, { color: theme.text }]}>Payment Successful</Text>
        <Text style={[s.desc, { color: theme.textSecondary }]}>
          Your order is confirmed and your components are now marked on this project.
          If install-guide access does not appear instantly, pull to refresh your build in a few moments.
        </Text>
        {salesSuiteUnlocked && (
          <View style={[s.unlockPill, { borderColor: `${theme.accent}40`, backgroundColor: `${theme.accent}14` }]}>
            <Text style={[s.unlockText, { color: theme.accent }]}>
              Sales Suite unlocked: schematics + installation guides + tutorial access.
            </Text>
          </View>
        )}
        <TouchableOpacity style={[s.btn, { backgroundColor: theme.accent }]} onPress={() => router.replace('/(tabs)/three')} activeOpacity={0.85}>
          <Text style={s.btnText}>Open Your Build</Text>
        </TouchableOpacity>
      </GlassCard>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 24 },
  card: { alignItems: 'center' },
  title: { fontSize: 24, fontWeight: '800', marginBottom: 6 },
  desc: { fontSize: 13, textAlign: 'center', lineHeight: 19, marginBottom: 14 },
  unlockPill: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 9, marginBottom: 12 },
  unlockText: { fontSize: 12, fontWeight: '700', textAlign: 'center', lineHeight: 16 },
  btn: { borderRadius: 10, paddingHorizontal: 18, paddingVertical: 12 },
  btnText: { color: '#1A1A1A', fontWeight: '800' },
});

