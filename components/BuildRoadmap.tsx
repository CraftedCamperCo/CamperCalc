import GlassCard from '@/components/GlassCard';
import { useTheme } from '@/context/ThemeContext';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

const STAGES = [
  'Van Selection',
  'Insulation',
  'Electrical',
  'Water',
  'Furniture',
  'Consultation',
  'Full Build',
];

export default function BuildRoadmap({ currentStage = 'Electrical', completed = [] as string[] }: { currentStage?: string; completed?: string[] }) {
  const theme = useTheme();
  return (
    <GlassCard style={s.card}>
      <Text style={[s.title, { color: theme.accent }]}>CRAFTED JOURNEY ROADMAP</Text>
      {STAGES.map((stage) => {
        const done = completed.includes(stage);
        const active = currentStage === stage;
        return (
          <View key={stage} style={s.row}>
            <MaterialCommunityIcons
              name={done ? 'check-circle' : active ? 'progress-clock' : 'circle-outline'}
              size={16}
              color={done ? theme.success : active ? theme.accent : theme.textSecondary}
            />
            <Text style={[s.rowText, { color: active ? theme.text : theme.textSecondary, fontWeight: active ? '800' : '600' }]}>
              {stage}
            </Text>
          </View>
        );
      })}
    </GlassCard>
  );
}

const s = StyleSheet.create({
  card: { marginBottom: 16 },
  title: { fontSize: 10, fontWeight: '800', letterSpacing: 1.7, marginBottom: 12 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  rowText: { fontSize: 12 },
});

