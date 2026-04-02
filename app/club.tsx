import GlassCard from '@/components/GlassCard';
import TopographicBackground from '@/components/TopographicBackground';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { goBackOrHome } from '@/utils/navigation';
import { supabase } from '@/utils/supabase';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ClubScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();
  const [refCode, setRefCode] = useState('');

  async function applyReferral() {
    if (!user?.id || !refCode.trim()) return;
    const code = refCode.trim().toUpperCase();
    const { error } = await supabase.from('referrals').insert({
      referrer_user_id: user.id,
      code,
      status: 'pending',
      reward_claimed: false,
    });
    if (error) {
      Alert.alert('Could not apply code', error.message);
      return;
    }
    Alert.alert('Referral code saved', 'Your discount and merch reward will be applied at checkout once verified.');
    setRefCode('');
  }
  return (
    <View style={[s.container, { backgroundColor: theme.background }]}>
      <TopographicBackground />
      <ScrollView contentContainerStyle={[s.content, { paddingTop: insets.top + 20 }]}>
        <TouchableOpacity onPress={() => goBackOrHome(router)} style={s.back} activeOpacity={0.8}>
          <Text style={{ color: theme.accent, fontWeight: '700' }}>Back</Text>
        </TouchableOpacity>
        <Text style={[s.title, { color: theme.text }]}>CamperPlan Club</Text>
        <Text style={[s.sub, { color: theme.textSecondary }]}>
          Unlock premium installation guides and bespoke video walkthroughs tailored to your selected build.
        </Text>
        <GlassCard style={s.card}>
          <Text style={[s.cardTitle, { color: theme.text }]}>What's included</Text>
          {[
            'Electrical installation guide + videos',
            'Insulation installation guide + videos',
            'Water system setup guide',
            'Priority support and update alerts',
          ].map((line) => (
            <View key={line} style={s.row}>
              <MaterialCommunityIcons name="check-circle-outline" size={16} color={theme.success} />
              <Text style={[s.rowText, { color: theme.textSecondary }]}>{line}</Text>
            </View>
          ))}
          <TouchableOpacity style={[s.cta, { backgroundColor: theme.accent }]} onPress={() => router.push('/basket')} activeOpacity={0.85}>
            <Text style={s.ctaText}>Unlock Club Access</Text>
          </TouchableOpacity>
          <View style={{ marginTop: 14 }}>
            <Text style={[s.label, { color: theme.textSecondary }]}>Have a referral code?</Text>
            <View style={s.refRow}>
              <TextInput
                style={[s.input, { color: theme.text, borderColor: `${theme.accent}30`, backgroundColor: 'rgba(0,0,0,0.03)' }]}
                value={refCode}
                onChangeText={setRefCode}
                placeholder="Enter code"
                placeholderTextColor={theme.textSecondary}
                autoCapitalize="characters"
              />
              <TouchableOpacity style={[s.applyBtn, { backgroundColor: theme.accent }]} onPress={applyReferral} activeOpacity={0.85}>
                <Text style={s.applyText}>Apply</Text>
              </TouchableOpacity>
            </View>
          </View>
        </GlassCard>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 24, paddingBottom: 48 },
  back: { marginBottom: 12 },
  title: { fontSize: 28, fontWeight: '800', marginBottom: 8 },
  sub: { fontSize: 13, lineHeight: 19, marginBottom: 12 },
  card: {},
  cardTitle: { fontSize: 18, fontWeight: '800', marginBottom: 10 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  rowText: { fontSize: 13, flex: 1 },
  cta: { marginTop: 10, borderRadius: 10, alignItems: 'center', paddingVertical: 12 },
  ctaText: { color: '#1A1A1A', fontWeight: '800' },
  label: { fontSize: 11, fontWeight: '700', marginBottom: 6, letterSpacing: 0.8, textTransform: 'uppercase' },
  refRow: { flexDirection: 'row', gap: 8 },
  input: { flex: 1, borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 13, fontWeight: '700' },
  applyBtn: { borderRadius: 10, paddingHorizontal: 14, justifyContent: 'center' },
  applyText: { color: '#1A1A1A', fontWeight: '800', fontSize: 13 },
});

