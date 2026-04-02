import TopographicBackground from '@/components/TopographicBackground';
import { useTheme } from '@/context/ThemeContext';
import { goBackOrHome } from '@/utils/navigation';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useRouter } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const SECTIONS = [
  {
    title: '1. What This Covers',
    body: 'This policy explains how CamperPlan websites use cookies and similar technologies.',
  },
  {
    title: '2. Strictly Necessary Cookies',
    body: 'These cookies are required for core functionality, such as secure sessions and checkout operation.',
  },
  {
    title: '3. Analytics Cookies',
    body: 'Analytics cookies help us understand usage and improve performance. Where required, these are controlled by consent settings.',
  },
  {
    title: '4. Functional Cookies',
    body: 'Functional cookies remember preferences that improve your experience.',
  },
  {
    title: '5. Third-Party Cookies',
    body: 'Some third-party tools (for example analytics or payment services) may set cookies under their own policies.',
  },
  {
    title: '6. Managing Cookies',
    body: 'You can adjust cookie settings via site controls and your browser preferences at any time.',
  },
  {
    title: '7. Contact',
    body: 'Email: dan@craftedcamper.co',
  },
];

export default function CookiesScreen() {
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={[s.container, { backgroundColor: theme.background }]}>
      <TopographicBackground />
      <View style={[s.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity style={s.back} onPress={() => goBackOrHome(router)} activeOpacity={0.7}>
          <FontAwesome name="chevron-left" size={14} color={theme.accent} />
          <Text style={[s.backText, { color: theme.accent }]}>Back</Text>
        </TouchableOpacity>
        <Text style={[s.heading, { color: theme.text }]}>Cookie Policy</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        <Text style={[s.updated, { color: theme.textSecondary }]}>Last updated: March 2026</Text>
        {SECTIONS.map((sec) => (
          <View key={sec.title} style={s.section}>
            <Text style={[s.sectionTitle, { color: theme.accent }]}>{sec.title}</Text>
            <Text style={[s.sectionBody, { color: theme.text }]}>{sec.body}</Text>
          </View>
        ))}
        <View style={{ height: 60 }} />
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.08)' },
  back: { flexDirection: 'row', alignItems: 'center', gap: 6, width: 60 },
  backText: { fontSize: 14, fontWeight: '600' },
  heading: { fontSize: 16, fontWeight: '800' },
  content: { paddingHorizontal: 20, paddingTop: 20 },
  updated: { fontSize: 11, fontWeight: '600', marginBottom: 20 },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 14, fontWeight: '800', marginBottom: 6 },
  sectionBody: { fontSize: 12, lineHeight: 19 },
});
