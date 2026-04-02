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
    title: '1. Fulfilment Model',
    body: 'Orders are fulfilled via in-house processing and approved dropship supplier partners depending on product type and availability.',
  },
  {
    title: '2. Delivery Methods',
    body: 'Delivery methods include standard parcel, large parcel, and pallet/freight for oversized or specialist items.',
  },
  {
    title: '3. Dispatch and Delivery Times',
    body: 'In-stock items are typically dispatched within 1-2 business days. Delivery windows vary by method and destination.',
  },
  {
    title: '4. Surcharges and Restrictions',
    body: 'Additional charges may apply for dangerous goods, oversized items, remote locations, and non-mainland delivery regions.',
  },
  {
    title: '5. Damaged or Missing Deliveries',
    body: 'If an order is damaged or missing, contact support promptly with order number and photo evidence (including packaging where possible).',
  },
  {
    title: '6. Tracking',
    body: 'Tracking details are issued where courier services support shipment tracking.',
  },
  {
    title: '7. Contact',
    body: 'Email: dan@craftedcamper.co',
  },
];

export default function ShippingScreen() {
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
        <Text style={[s.heading, { color: theme.text }]}>Shipping & Fulfilment</Text>
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
