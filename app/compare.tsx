import GlassCard from '@/components/GlassCard';
import TopographicBackground from '@/components/TopographicBackground';
import { useProjects } from '@/context/ProjectContext';
import { useTheme } from '@/context/ThemeContext';
import { calculate } from '@/utils/calculator';
import { goBackOrHome } from '@/utils/navigation';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useRouter } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function CompareScreen() {
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { projects } = useProjects();
  const comparable = projects.filter((p) => (p.camper_state as any)?.usage).slice(0, 4);

  return (
    <View style={[s.container, { backgroundColor: theme.background }]}>
      <TopographicBackground />
      <ScrollView contentContainerStyle={[s.content, { paddingTop: insets.top + 20 }]}>
        <TouchableOpacity onPress={() => goBackOrHome(router)} style={s.backBtn} activeOpacity={0.7}>
          <FontAwesome name="chevron-left" size={14} color={theme.accent} />
          <Text style={[s.backText, { color: theme.accent }]}>Back</Text>
        </TouchableOpacity>
        <Text style={[s.title, { color: theme.text }]}>Project Comparison</Text>
        <Text style={[s.sub, { color: theme.textSecondary }]}>
          Side-by-side overview to help choose the right spec for your budget and usage profile.
        </Text>
        {comparable.length < 2 && (
          <GlassCard>
            <Text style={{ color: theme.textSecondary, fontSize: 13 }}>
              Create at least two projects with calculator data to compare.
            </Text>
          </GlassCard>
        )}
        {comparable.length >= 2 && (
          <GlassCard>
            <View style={s.row}>
              <Text style={[s.hCell, { color: theme.textSecondary }]}>Project</Text>
              <Text style={[s.hCell, { color: theme.textSecondary }]}>Battery</Text>
              <Text style={[s.hCell, { color: theme.textSecondary }]}>Solar</Text>
              <Text style={[s.hCell, { color: theme.textSecondary }]}>Daily Ah</Text>
            </View>
            {comparable.map((p) => {
              const c = calculate(p.camper_state as any);
              return (
                <View key={p.id} style={s.row}>
                  <Text style={[s.cell, { color: theme.text }]} numberOfLines={1}>{p.name}</Text>
                  <Text style={[s.cell, { color: theme.accent }]}>{c.recommendedBankAh}Ah</Text>
                  <Text style={[s.cell, { color: theme.text }]}>{c.recommendedSolarW}W</Text>
                  <Text style={[s.cell, { color: theme.text }]}>{c.dailyAh}</Text>
                </View>
              );
            })}
          </GlassCard>
        )}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 24, paddingBottom: 48 },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 16 },
  backText: { fontSize: 14, fontWeight: '700' },
  title: { fontSize: 26, fontWeight: '800', marginBottom: 8 },
  sub: { fontSize: 13, lineHeight: 18, marginBottom: 16 },
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 8 },
  hCell: { flex: 1, fontSize: 10, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase' },
  cell: { flex: 1, fontSize: 12, fontWeight: '700' },
});

