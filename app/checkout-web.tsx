import { useTheme } from '@/context/ThemeContext';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useMemo } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { WebView } from 'react-native-webview';

const SUCCESS_SCHEME = 'camperplan://checkout-success';
const CANCEL_SCHEME = 'camperplan://checkout-cancel';
const SUCCESS_WEB_URL = 'https://camperplan.com/checkout-success';
const CANCEL_WEB_URL = 'https://camperplan.com/checkout-cancel';

export default function CheckoutWebScreen() {
  const theme = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{ url?: string | string[] }>();
  const checkoutUrl = useMemo(() => {
    const raw = Array.isArray(params.url) ? params.url[0] : params.url;
    if (!raw || typeof raw !== 'string') return '';
    try {
      return decodeURIComponent(raw);
    } catch {
      return raw;
    }
  }, [params.url]);

  if (!checkoutUrl) {
    return (
      <View style={[s.fallback, { backgroundColor: theme.background }]}>
        <Text style={[s.fallbackTitle, { color: theme.text }]}>Checkout link missing</Text>
        <TouchableOpacity style={[s.closeBtn, { backgroundColor: theme.accent }]} onPress={() => router.replace('/basket')}>
          <Text style={s.closeBtnText}>Back to Basket</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleRedirectUrl = (nextRaw?: string | null) => {
    const next = nextRaw ?? '';
    if (!next) return false;
    if (next.startsWith(SUCCESS_SCHEME) || next.startsWith(SUCCESS_WEB_URL) || next.includes('/checkout-success')) {
      router.replace('/checkout-success');
      return true;
    }
    if (next.startsWith(CANCEL_SCHEME) || next.startsWith(CANCEL_WEB_URL) || next.includes('/checkout-cancel')) {
      router.replace('/checkout-cancel');
      return true;
    }
    return false;
  };

  return (
    <View style={[s.container, { backgroundColor: theme.background }]}>
      <View style={[s.header, { borderBottomColor: 'rgba(0,0,0,0.08)' }]}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.replace('/basket')} activeOpacity={0.8}>
          <FontAwesome name="chevron-left" size={13} color={theme.accent} />
          <Text style={[s.backText, { color: theme.accent }]}>Basket</Text>
        </TouchableOpacity>
        <Text style={[s.headerTitle, { color: theme.text }]}>Secure Checkout</Text>
        <View style={{ width: 56 }} />
      </View>
      <WebView
        source={{ uri: checkoutUrl }}
        startInLoadingState
        renderLoading={() => (
          <View style={s.loadingOverlay}>
            <ActivityIndicator color={theme.accent} size="small" />
          </View>
        )}
        onShouldStartLoadWithRequest={(req) => {
          return !handleRedirectUrl(req.url);
        }}
        onNavigationStateChange={(nav) => {
          handleRedirectUrl(nav.url);
        }}
      />
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  header: {
    height: 56,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
  },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, width: 56 },
  backText: { fontSize: 13, fontWeight: '700' },
  headerTitle: { fontSize: 15, fontWeight: '800' },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fallback: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  fallbackTitle: { fontSize: 18, fontWeight: '800', marginBottom: 16, textAlign: 'center' },
  closeBtn: { borderRadius: 10, paddingHorizontal: 18, paddingVertical: 12 },
  closeBtnText: { color: '#1A1A1A', fontSize: 14, fontWeight: '800' },
});
