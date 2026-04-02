import GlassCard from '@/components/GlassCard';
import TopographicBackground from '@/components/TopographicBackground';
import { useTheme } from '@/context/ThemeContext';
import { trackCheckoutCancel } from '@/utils/analytics';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function CheckoutCancel() {
  const theme = useTheme();
  const router = useRouter();

  useEffect(() => {
    trackCheckoutCancel();
  }, []);

  return (
    <View style={[s.container, { backgroundColor: theme.background }]}>
      <TopographicBackground />
      <GlassCard style={s.card}>
        <MaterialCommunityIcons name="cart-outline" size={42} color={theme.accent} style={{ marginBottom: 12 }} />
        <Text style={[s.title, { color: theme.text }]}>Checkout Paused</Text>
        <Text style={[s.desc, { color: theme.textSecondary }]}>
          Your bespoke package is still saved in your cart and ready whenever you are.
        </Text>
        <TouchableOpacity style={[s.btn, { backgroundColor: theme.accent }]} onPress={() => router.replace('/basket')} activeOpacity={0.85}>
          <Text style={s.btnText}>Return to Cart</Text>
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
  btn: { borderRadius: 10, paddingHorizontal: 18, paddingVertical: 12 },
  btnText: { color: '#1A1A1A', fontWeight: '800' },
});

