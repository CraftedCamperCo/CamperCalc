import { useTheme } from '@/context/ThemeContext';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface Props {
  compact?: boolean;
}

export default function ElectricalDisclaimer({ compact }: Props) {
  const theme = useTheme();
  const router = useRouter();

  if (compact) {
    return (
      <View style={[s.compact, { borderColor: 'rgba(192,57,43,0.2)', backgroundColor: 'rgba(192,57,43,0.04)' }]}>
        <MaterialCommunityIcons name="shield-alert-outline" size={13} color="#C0392B" />
        <Text style={s.compactText}>
          All electrical work must be checked by a qualified electrician.{' '}
          <Text style={s.compactLink} onPress={() => router.push('/terms')}>Terms</Text>
        </Text>
      </View>
    );
  }

  return (
    <View style={[s.container, { borderColor: 'rgba(192,57,43,0.25)', backgroundColor: 'rgba(192,57,43,0.04)' }]}>
      <View style={s.headerRow}>
        <MaterialCommunityIcons name="shield-alert-outline" size={16} color="#C0392B" />
        <Text style={s.title}>Electrical Safety Notice</Text>
      </View>
      <Text style={[s.body, { color: theme.text }]}>
        All electrical calculations, cable sizes, and wiring recommendations are for planning purposes only.
        Installations must be carried out by a qualified/competent electrician, inspected, tested, and certified
        with an Electrical Installation Certificate (EIC) before first use.
      </Text>
      <TouchableOpacity onPress={() => router.push('/terms')} activeOpacity={0.7}>
        <Text style={s.link}>View full Terms of Use →</Text>
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  container: { borderWidth: 1, borderRadius: 10, padding: 14, marginVertical: 10 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  title: { fontSize: 12, fontWeight: '800', color: '#C0392B' },
  body: { fontSize: 11, lineHeight: 17 },
  link: { fontSize: 11, fontWeight: '700', color: '#C0392B', marginTop: 8 },
  compact: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, marginVertical: 6 },
  compactText: { fontSize: 10, color: '#C0392B', flex: 1, lineHeight: 14 },
  compactLink: { fontWeight: '700', textDecorationLine: 'underline' },
});
