import TopographicBackground from '@/components/TopographicBackground';
import { useTheme } from '@/context/ThemeContext';
import { goBackOrHome } from '@/utils/navigation';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useRouter } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const FAQS = [
  {
    q: 'How do recommendations work?',
    a: 'CamperPlan uses your usage profile, appliances, and off-grid goals to generate bespoke recommendations for electrical, water, and insulation.',
  },
  {
    q: 'Are recommendations installation-ready?',
    a: 'Recommendations are planning outputs and should be implemented/verified by a qualified installer to meet applicable standards.',
  },
  {
    q: 'Do I need an account to use CamperPlan?',
    a: 'You can browse some features without an account, but account login is required for saving projects, checkout, and synced access.',
  },
  {
    q: 'How are electrical packages priced?',
    a: 'Package pricing is based on current configured products and may update as supplier pricing or stock changes.',
  },
  {
    q: 'Which payment methods are supported?',
    a: 'Payments are processed securely by Stripe. Method availability may vary by region, currency, and account settings.',
  },
  {
    q: 'Will I receive an order confirmation?',
    a: 'Yes. After successful payment, order confirmation is sent to your checkout email address.',
  },
  {
    q: 'How long does delivery take?',
    a: 'Delivery depends on product size and supplier availability. Most in-stock items dispatch within 1-2 business days.',
  },
  {
    q: 'Do you ship all product types the same way?',
    a: 'No. Small items, heavy items, and pallet/freight products can use different couriers and timelines.',
  },
  {
    q: 'Can I return items?',
    a: 'Yes. Physical items follow our returns policy. Digital products may be non-returnable once accessed unless legally required.',
  },
  {
    q: 'What if an item arrives damaged?',
    a: 'Contact support with photos of the item and packaging as soon as possible so we can open a courier/supplier case.',
  },
  {
    q: 'Can I change or cancel an order after payment?',
    a: 'Contact support immediately. Changes are subject to fulfilment status and supplier dispatch progress.',
  },
  {
    q: 'How do I get installation guidance?',
    a: 'Wiring and install guidance is available through the bespoke wiring package and entitlement features in-app.',
  },
  {
    q: 'How is my data handled?',
    a: 'We process account, project, and transaction data to provide service operations, as detailed in our Privacy Policy.',
  },
  {
    q: 'How do I get support?',
    a: 'Contact dan@craftedcamper.co with your order number/project name and issue details.',
  },
  {
    q: 'Where can I find legal policies?',
    a: 'You can access Terms, Privacy, Cookies, Returns, and Shipping policies from the app footer links.',
  },
];

export default function FaqScreen() {
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
        <Text style={[s.heading, { color: theme.text }]}>FAQs</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        {FAQS.map((item) => (
          <View key={item.q} style={s.item}>
            <Text style={[s.q, { color: theme.accent }]}>{item.q}</Text>
            <Text style={[s.a, { color: theme.text }]}>{item.a}</Text>
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
  item: { marginBottom: 22 },
  q: { fontSize: 14, fontWeight: '800', marginBottom: 6 },
  a: { fontSize: 12, lineHeight: 19 },
});
