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
    title: '1. Scope',
    body: 'This policy applies to products purchased through CamperPlan by Crafted and related online sales channels operated by Crafted Camper Co (Yorkshire) LTD.',
  },
  {
    title: '2. Change-of-Mind Returns (Physical Goods)',
    body: 'You have 14 days from delivery to notify us of a return, then a further 14 days to send the item back (28 days total). Items must be unused, in original condition, and in original packaging with proof of purchase.',
  },
  {
    title: '3. Return Shipping',
    body: 'For change-of-mind returns, return shipping costs are your responsibility. Outbound shipping is non-refundable except where required by law.',
  },
  {
    title: '4. Faulty, Damaged, or Not-As-Described Items',
    body: 'If an item is faulty, damaged, or not as described, contact support with photos and order details. Where fault is confirmed, we provide remedy in line with UK consumer law.',
  },
  {
    title: '5. Refund Timing',
    body: 'Approved refunds are returned to your original payment method, typically within 5 business days after item inspection and approval.',
  },
  {
    title: '6. Non-Returnable Items',
    body: 'Custom-made items and accessed digital products may be non-returnable unless faulty or otherwise required by law.',
  },
  {
    title: '7. Contact',
    body: 'Email: dan@craftedcamper.co',
  },
];

export default function ReturnsScreen() {
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
        <Text style={[s.heading, { color: theme.text }]}>Returns & Refunds</Text>
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
