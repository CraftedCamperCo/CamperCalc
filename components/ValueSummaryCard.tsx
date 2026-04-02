import CraftedConfidenceBadge from '@/components/CraftedConfidenceBadge';
import GlassCard from '@/components/GlassCard';
import { useTheme } from '@/context/ThemeContext';
import { ValueSavedResult } from '@/utils/valueSaved';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export default function ValueSummaryCard({
  vanLabel,
  itemCount,
  valueSaved,
}: {
  vanLabel: string;
  itemCount: number;
  valueSaved: ValueSavedResult;
}) {
  const theme = useTheme();
  return (
    <GlassCard style={s.card}>
      <Text style={[s.title, { color: theme.text }]}>Your Bespoke Value Summary</Text>
      <Text style={[s.sub, { color: theme.textSecondary }]}>
        Matched to your {vanLabel} build · {itemCount} key items curated
      </Text>
      <View style={s.grid}>
        <View>
          <Text style={[s.num, { color: theme.accent }]}>{Math.round(valueSaved.timeHoursSaved)}h</Text>
          <Text style={[s.label, { color: theme.textSecondary }]}>Time saved</Text>
        </View>
        <View>
          <Text style={[s.num, { color: theme.accent }]}>£{Math.round(valueSaved.wasteCostAvoided)}</Text>
          <Text style={[s.label, { color: theme.textSecondary }]}>Waste avoided</Text>
        </View>
        <View>
          <Text style={[s.num, { color: theme.success }]}>{valueSaved.confidenceScore}%</Text>
          <Text style={[s.label, { color: theme.textSecondary }]}>Confidence</Text>
        </View>
      </View>
      <CraftedConfidenceBadge />
    </GlassCard>
  );
}

const s = StyleSheet.create({
  card: { marginBottom: 12 },
  title: { fontSize: 16, fontWeight: '800', marginBottom: 4 },
  sub: { fontSize: 12, lineHeight: 17, marginBottom: 10 },
  grid: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  num: { fontSize: 22, fontWeight: '800' },
  label: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.6 },
});

