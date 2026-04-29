import GlassCard from '@/components/GlassCard';
import TopographicBackground from '@/components/TopographicBackground';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { useProjects } from '@/context/ProjectContext';
import { useTheme } from '@/context/ThemeContext';
import { trackBasketViewed, trackBeginCheckout, trackCheckoutError } from '@/utils/analytics';
import { startCheckoutSession } from '@/utils/checkout';
import { calculate } from '@/utils/calculator';
import { goBackOrHome } from '@/utils/navigation';
import { calculateValueSaved } from '@/utils/valueSaved';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function BasketScreen() {
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { currentProject } = useProjects();
  const { items, total, count, addItem, removeItem, updateQty, clearCart } = useCart();
  const [checkingOut, setCheckingOut] = useState(false);
  const [checkoutError, setCheckoutError] = useState('');
  const [recentlyRemoved, setRecentlyRemoved] = useState<{ product: (typeof items)[number]['product']; quantity: number } | null>(null);

  useEffect(() => {
    trackBasketViewed(count, total);
  }, []);

  useEffect(() => {
    if (!recentlyRemoved) return;
    const timer = setTimeout(() => setRecentlyRemoved(null), 5000);
    return () => clearTimeout(timer);
  }, [recentlyRemoved]);

  const buildSpec = currentProject?.camper_state && (currentProject.camper_state as any).usage
    ? calculate(currentProject.camper_state as any)
    : null;

  const derived = useMemo(() => {
    const insulationOnly = items.length > 0 && items.every((item) => item.product.id.startsWith('ins_'));

    if (buildSpec) {
      const val = calculateValueSaved({
        recommendedBankAh: buildSpec.recommendedBankAh,
        recommendedSolarW: buildSpec.recommendedSolarW,
        dailyAh: buildSpec.dailyAh,
        inverterSize: buildSpec.inverterSize,
        dcDcChargerSize: buildSpec.dcDcChargerSize,
      });

      const baselineHours = Math.min(val.timeHoursSaved * 0.8, 48);
      const hoursSaved = insulationOnly
        ? Math.min(2.5, Math.max(1.5, Math.round(baselineHours * 10) / 10))
        : Math.max(8, Math.round(baselineHours));

      return {
        poundsSaved: Math.max(45, Math.round(Math.min(val.wasteCostAvoided * 0.65, total * 0.16))),
        hoursSaved,
      };
    }

    const fallbackHours = insulationOnly
      ? Math.min(2.5, Math.max(1.5, Math.round(count * 0.6 * 10) / 10))
      : Math.max(6, Math.round(count * 1.5));

    return {
      poundsSaved: Math.max(25, Math.round(total * 0.1)),
      hoursSaved: fallbackHours,
    };
  }, [buildSpec, total, count, items]);

  async function handleCheckout() {
    if (items.length === 0) return;
    if (!user) {
      setCheckoutError('Sign in to continue to secure checkout.');
      router.push('/auth');
      return;
    }
    setCheckoutError('');
    setCheckingOut(true);
    trackBeginCheckout(count, total);

    // On web, send Stripe back to the running web app (current origin) so the
    // user is returned to the same domain after payment. On native, the existing
    // camperplan.com pages handle the deep link back into the iOS app.
    const isWeb = Platform.OS === 'web' && typeof window !== 'undefined';
    const webOrigin = isWeb ? window.location.origin : '';
    const successUrl = isWeb ? `${webOrigin}/checkout-success` : 'https://camperplan.com/checkout-success';
    const cancelUrl = isWeb ? `${webOrigin}/checkout-cancel` : 'https://camperplan.com/checkout-cancel';

    const { url, error } = await startCheckoutSession({
      userId: user?.id,
      email: user?.email,
      projectId: currentProject?.id,
      successUrl,
      cancelUrl,
      lineItems: items.map((i) => ({
        product_id: i.product.id,
        name: i.product.name,
        quantity: i.quantity,
        unit_price: i.product.estimatedPrice,
      })),
    });
    setCheckingOut(false);
    if (error || !url) {
      const msg = error ?? 'Unable to start checkout';
      setCheckoutError(msg);
      trackCheckoutError(msg);
      return;
    }

    if (isWeb) {
      // Web browsers redirect directly to Stripe Checkout. The in-app WebView
      // route is only used on native, where there is no parent browser to host
      // the redirect.
      window.location.href = url;
      return;
    }

    router.push({ pathname: '/checkout-web', params: { url } });
  }

  const handleRemoveWithUndo = (productId: string) => {
    const existing = items.find((entry) => entry.product.id === productId);
    if (!existing) return;
    setRecentlyRemoved({
      product: existing.product,
      quantity: existing.quantity,
    });
    removeItem(productId);
  };

  const undoRemove = () => {
    if (!recentlyRemoved) return;
    const restored = items.find((entry) => entry.product.id === recentlyRemoved.product.id);
    if (restored) {
      updateQty(restored.product.id, restored.quantity + recentlyRemoved.quantity);
    } else {
      for (let i = 0; i < recentlyRemoved.quantity; i += 1) {
        addItem(recentlyRemoved.product);
      }
    }
    setRecentlyRemoved(null);
  };

  return (
    <View style={[s.container, { backgroundColor: theme.background }]}>
      <TopographicBackground />
      <ScrollView style={s.scroll} contentContainerStyle={[s.content, { paddingTop: insets.top + 20 }]} showsVerticalScrollIndicator={false}>
        <TouchableOpacity onPress={() => goBackOrHome(router)} style={s.backBtn} activeOpacity={0.7}>
          <FontAwesome name="chevron-left" size={14} color={theme.accent} />
          <Text style={[s.backText, { color: theme.accent }]}>Back</Text>
        </TouchableOpacity>

        <Text style={[s.heading, { color: theme.text }]}>Your Basket</Text>

        <GlassCard style={[s.summary, { borderColor: `${theme.accent}40`, borderWidth: 1 }]}>
          <Text style={[s.summaryTitle, { color: theme.text }]}>{count} item{count === 1 ? '' : 's'} · £{total.toLocaleString()}</Text>
          <Text style={[s.summarySub, { color: theme.textSecondary }]}>Estimated saving vs individual purchases: ~£{derived.poundsSaved}</Text>
          <Text style={[s.summarySub, { color: theme.textSecondary }]}>Estimated planning time saved: ~{Number.isInteger(derived.hoursSaved) ? derived.hoursSaved : derived.hoursSaved.toFixed(1)} hours</Text>
        </GlassCard>

        {items.map((item) => (
          <GlassCard key={item.product.id} style={s.rowCard}>
            <Text style={[s.itemName, { color: theme.text }]}>{item.product.name}</Text>
            <Text style={[s.itemMeta, { color: theme.textSecondary }]}>£{item.product.estimatedPrice} each</Text>
            {item.product.id === 'wiring_kit_bespoke' && (
              <Text style={[s.itemMeta, { color: theme.textSecondary, marginTop: 4 }]}>
                Build-matched wiring kit. Looms are pre-cut, pre-crimped, and heat-shrunk to your van model and selected setup.
              </Text>
            )}
            <View style={s.rowActions}>
              <View style={s.qtyWrap}>
                <TouchableOpacity onPress={() => updateQty(item.product.id, item.quantity - 1)} style={[s.qtyBtn, { borderColor: `${theme.accent}40` }]}>
                  <Text style={[s.qtyBtnText, { color: theme.accent }]}>-</Text>
                </TouchableOpacity>
                <Text style={[s.qtyText, { color: theme.text }]}>{item.quantity}</Text>
                <TouchableOpacity onPress={() => updateQty(item.product.id, item.quantity + 1)} style={[s.qtyBtn, { borderColor: `${theme.accent}40` }]}>
                  <Text style={[s.qtyBtnText, { color: theme.accent }]}>+</Text>
                </TouchableOpacity>
              </View>
              <TouchableOpacity onPress={() => handleRemoveWithUndo(item.product.id)} style={[s.removeBtn, { borderColor: 'rgba(231,76,60,0.35)' }]}>
                <MaterialCommunityIcons name="trash-can-outline" size={14} color="#C0392B" />
                <Text style={s.removeText}>Remove</Text>
              </TouchableOpacity>
            </View>
          </GlassCard>
        ))}

        {recentlyRemoved && (
          <GlassCard style={[s.undoCard, { borderColor: `${theme.accent}40`, borderWidth: 1 }]}>
            <Text style={[s.undoText, { color: theme.text }]}>
              Removed {recentlyRemoved.product.name}
            </Text>
            <TouchableOpacity onPress={undoRemove} style={[s.undoBtn, { backgroundColor: theme.accent }]} activeOpacity={0.85}>
              <Text style={s.undoBtnText}>Undo</Text>
            </TouchableOpacity>
          </GlassCard>
        )}

        <View style={s.footerActions}>
          <TouchableOpacity style={[s.clearBtn, { borderColor: 'rgba(231,76,60,0.35)' }]} onPress={clearCart} activeOpacity={0.75}>
            <Text style={s.clearText}>Clear basket</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[s.checkoutBtn, { backgroundColor: theme.accent, opacity: checkingOut ? 0.7 : 1 }]} onPress={handleCheckout} disabled={checkingOut || count === 0} activeOpacity={0.85}>
            <Text style={s.checkoutText}>{checkingOut ? 'Starting checkout...' : 'Checkout'}</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity
          style={[s.guidedBtn, { borderColor: `${theme.accent}35` }]}
          onPress={() => router.push('/(tabs)/three')}
          activeOpacity={0.85}
        >
          <Text style={[s.guidedBtnText, { color: theme.accent }]}>Continue guided build → Summary</Text>
        </TouchableOpacity>

        {!!checkoutError && <Text style={s.errorText}>{checkoutError}</Text>}
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flex: 1 },
  content: { padding: 24 },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 20 },
  backText: { fontSize: 14, fontWeight: '600' },
  heading: { fontSize: 30, fontWeight: '800', marginBottom: 14 },
  summary: { marginBottom: 14 },
  summaryTitle: { fontSize: 18, fontWeight: '800', marginBottom: 6 },
  summarySub: { fontSize: 12, lineHeight: 18 },
  rowCard: { marginBottom: 10 },
  itemName: { fontSize: 15, fontWeight: '700', marginBottom: 3 },
  itemMeta: { fontSize: 12 },
  rowActions: { marginTop: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  qtyWrap: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  qtyBtn: { width: 28, height: 28, borderRadius: 8, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  qtyBtnText: { fontSize: 17, fontWeight: '700' },
  qtyText: { fontSize: 14, fontWeight: '700', minWidth: 14, textAlign: 'center' },
  removeBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 },
  removeText: { color: '#C0392B', fontSize: 12, fontWeight: '700' },
  undoCard: { marginTop: 4, marginBottom: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  undoText: { fontSize: 12, fontWeight: '600', flex: 1 },
  undoBtn: { borderRadius: 9, paddingHorizontal: 14, paddingVertical: 8 },
  undoBtnText: { color: '#1A1A1A', fontSize: 12, fontWeight: '800' },
  footerActions: { flexDirection: 'row', gap: 10, marginTop: 8 },
  guidedBtn: { marginTop: 10, borderRadius: 10, borderWidth: 1, alignItems: 'center', paddingVertical: 11 },
  guidedBtnText: { fontSize: 12, fontWeight: '800' },
  clearBtn: { flex: 1, borderRadius: 10, borderWidth: 1, alignItems: 'center', paddingVertical: 13 },
  clearText: { color: '#C0392B', fontSize: 13, fontWeight: '700' },
  checkoutBtn: { flex: 1, borderRadius: 10, alignItems: 'center', paddingVertical: 13 },
  checkoutText: { color: '#1A1A1A', fontSize: 14, fontWeight: '800' },
  errorText: { color: '#C0392B', fontSize: 12, fontWeight: '700', marginTop: 10 },
});

