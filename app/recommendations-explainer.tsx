import GlassCard from '@/components/GlassCard';
import TopographicBackground from '@/components/TopographicBackground';
import { useTheme } from '@/context/ThemeContext';
import { goBackOrHome } from '@/utils/navigation';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useRouter } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function RecommendationsExplainerScreen() {
  const theme = useTheme();
  const router = useRouter();

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <TopographicBackground />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <TouchableOpacity style={styles.backBtn} onPress={() => goBackOrHome(router)} activeOpacity={0.8}>
          <FontAwesome name="chevron-left" size={14} color={theme.accent} />
          <Text style={[styles.backText, { color: theme.accent }]}>Back</Text>
        </TouchableOpacity>

        <Text style={[styles.heading, { color: theme.text }]}>How We Built Your Recommendations</Text>
        <Text style={[styles.subheading, { color: theme.textSecondary }]}>
          A simple overview of how CamperPlan turns your answers into a bespoke electrical, insulation, and water setup.
        </Text>

        <GlassCard style={styles.card}>
          <Text style={[styles.cardLabel, { color: theme.accent }]}>1. YOUR LIFESTYLE INPUTS</Text>
          <Text style={[styles.body, { color: theme.textSecondary }]}>
            We use your travel style, off-grid days, climate, crew size, and appliance selections to estimate real daily usage.
          </Text>
        </GlassCard>

        <GlassCard style={styles.card}>
          <Text style={[styles.cardLabel, { color: theme.accent }]}>2. POWER + SAFETY SIZING</Text>
          <Text style={[styles.body, { color: theme.textSecondary }]}>
            We size battery bank, solar, charging, and protection components to match your target reliability and usage.
          </Text>
        </GlassCard>

        <GlassCard style={styles.card}>
          <Text style={[styles.cardLabel, { color: theme.accent }]}>3. SYSTEM PACKAGE OUTPUT</Text>
          <Text style={[styles.body, { color: theme.textSecondary }]}>
            We package your recommendations into a build-ready list so you can add the right kit quickly and avoid mismatched parts.
          </Text>
        </GlassCard>

        <GlassCard style={styles.card}>
          <Text style={[styles.cardLabel, { color: theme.accent }]}>4. BESPOKE INSTALL SUPPORT</Text>
          <Text style={[styles.body, { color: theme.textSecondary }]}>
            Your bespoke wiring package includes a tailored schematic and video guidance for your exact setup, with Sales Suite access
            unlocked at the spend threshold.
          </Text>
        </GlassCard>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 24, paddingTop: 64 },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 18 },
  backText: { fontSize: 14, fontWeight: '700' },
  heading: { fontSize: 26, fontWeight: '800', marginBottom: 8 },
  subheading: { fontSize: 13, lineHeight: 19, marginBottom: 18 },
  card: { marginBottom: 12 },
  cardLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 2, marginBottom: 8 },
  body: { fontSize: 13, lineHeight: 19 },
});
