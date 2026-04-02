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
    title: '1. Who We Are',
    body: `Crafted Camper Co (Yorkshire) LTD ("we", "us", "our") is the data controller for the personal data collected through the CamperPlan by Crafted application ("the App").\n\nEmail: dan@craftedcamper.co\nWebsite: craftedcamper.co`,
  },
  {
    title: '2. Data We Collect',
    body: `We collect and process the following personal data:\n\n• Account information: email address and authentication identifiers\n• Profile data: first name, last name (if provided)\n• Project data: build configurations, calculator inputs, and exported documents\n• Transaction data: order details, line items, payment status, and project linkage\n• Support data: communications submitted to support\n• Technical data: diagnostics and limited usage data used to improve reliability`,
  },
  {
    title: '3. How We Use Your Data',
    body: `We use your personal data for the following purposes:\n\n• Providing the App service — storing projects and generating outputs\n• Commerce operations — processing orders, confirmations, and fulfilment events\n• Account management — authentication, security, and support\n• Service improvement — reliability, bug fixes, and product quality improvements\n• Legal compliance — meeting legal and regulatory obligations`,
  },
  {
    title: '4. Legal Basis for Processing',
    body: `Under the UK General Data Protection Regulation (UK GDPR), we process your data based on:\n\n• Contract performance — to provide the App services you've signed up for\n• Legitimate interests — to improve our services and protect against fraud\n• Consent — for marketing communications (you can withdraw consent at any time)\n• Legal obligation — where required by law`,
  },
  {
    title: '5. Data Sharing',
    body: `We share your data with third parties only where required to run the service:\n\n• Supabase (database & authentication)\n• Stripe (payment processing)\n• Email providers for transactional and opted-in marketing communication\n\nWe do not sell your personal data.`,
  },
  {
    title: '6. Data Storage & Security',
    body: `Your data is stored on Supabase servers with industry-standard encryption. Passwords are hashed and never stored in plain text. We implement Row Level Security (RLS) to ensure you can only access your own data.\n\nWe retain your account data for as long as your account is active. If you delete your account, your data will be permanently removed within 30 days.`,
  },
  {
    title: '7. Your Rights',
    body: `Under UK GDPR, you have the right to:\n\n• Access — request a copy of the personal data we hold about you\n• Rectification — request correction of inaccurate data\n• Erasure — request deletion of your personal data ("right to be forgotten")\n• Restriction — request that we limit the processing of your data\n• Data portability — receive your data in a structured, machine-readable format\n• Object — object to processing based on legitimate interests or for direct marketing\n• Withdraw consent — withdraw consent for marketing communications at any time\n\nTo exercise any of these rights, contact us at dan@craftedcamper.co. We will respond within 30 days.`,
  },
  {
    title: '8. Cookies & Tracking',
    body: `The app uses device storage for core functionality. Our web properties may use functional and analytics cookies as described in our Cookie Policy.`,
  },
  {
    title: '9. Children\'s Privacy',
    body: `The App is not intended for use by children under 16 years of age. We do not knowingly collect personal data from children. If you believe a child has provided us with personal data, please contact us and we will delete it promptly.`,
  },
  {
    title: '10. Changes to This Policy',
    body: `We may update this Privacy Policy from time to time. We will notify you of any material changes via the App or email. Continued use of the App after changes constitutes acceptance of the revised policy.`,
  },
  {
    title: '11. Complaints',
    body: `If you have concerns about how we handle your data, please contact us first at dan@craftedcamper.co.\n\nYou also have the right to lodge a complaint with the Information Commissioner's Office (ICO):\nWebsite: ico.org.uk\nHelpline: 0303 123 1113`,
  },
  {
    title: '12. Contact',
    body: `Crafted Camper Co (Yorkshire) LTD\nEmail: dan@craftedcamper.co\nWebsite: craftedcamper.co`,
  },
];

export default function PrivacyScreen() {
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
        <Text style={[s.heading, { color: theme.text }]}>Privacy Policy</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        <Text style={[s.updated, { color: theme.textSecondary }]}>Last updated: February 2026</Text>

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
