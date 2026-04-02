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
    title: '1. Acceptance of Terms',
    body: `By downloading, accessing, or using the CamperPlan by Crafted application ("the App"), you agree to be bound by these Terms of Use ("Terms"). If you do not agree to these Terms, do not use the App. These Terms constitute a legally binding agreement between you and Crafted Camper Co (Yorkshire) LTD ("we", "us", "our").`,
  },
  {
    title: '2. Description of Service',
    body: `CamperPlan provides planning tools, recommendations, checkout for selected products, and optional premium installation resources for camper builds. Outputs are for planning purposes and do not replace qualified installer verification.`,
  },
  {
    title: '3. Electrical Safety Disclaimer',
    body: `IMPORTANT: All electrical calculations, cable sizes, fuse ratings, wiring schematics, and system recommendations provided by this App are for planning and informational purposes only. They do NOT constitute professional electrical engineering advice.\n\nAll electrical installations MUST be:\n• Designed and installed by a qualified/competent electrician\n• Inspected, tested, and certified before first use\n• Covered by a valid Electrical Installation Certificate (EIC)\n• Compliant with BS 7671:2018+A2:2022 (IET Wiring Regulations), BS EN 1648-1/2, and all applicable local regulations\n\nCrafted Camper Co (Yorkshire) LTD accepts NO LIABILITY for any damage, injury, loss, or consequence arising from the use of this App or the installation of any electrical or plumbing system based on its outputs. It is the sole responsibility of the installer to ensure compliance with all applicable regulations and standards.`,
  },
  {
    title: '4. No Professional Advice',
    body: `The information provided by the App does not replace professional consultation with qualified electricians, plumbers, gas engineers, or vehicle conversion specialists. You should always seek independent professional advice before undertaking any installation work on your vehicle.`,
  },
  {
    title: '5. User Accounts',
    body: `When you create an account, you agree to:\n• Provide accurate, current, and complete information\n• Maintain the security of your password and account\n• Accept responsibility for all activities under your account\n• Notify us immediately of any unauthorised use\n\nWe reserve the right to suspend or terminate accounts that violate these Terms or are used fraudulently.`,
  },
  {
    title: '6. Orders, Pricing, and Payments',
    body: `Payments are processed via Stripe. Product pricing and availability may change at any time prior to order confirmation. We reserve the right to cancel/refund orders where payment verification fails, stock is unavailable, or pricing errors occur. Shipping, returns, and refund handling are governed by our dedicated policy pages.`,
  },
  {
    title: '7. Intellectual Property',
    body: `All content in the App — including but not limited to wiring schematics, calculators, designs, text, graphics, logos, and software — is the property of Crafted Camper Co (Yorkshire) LTD or its licensors and is protected by copyright, trademark, and other intellectual property laws.\n\nYou may use exported PDFs and schematics for your personal, non-commercial use. Redistribution, resale, or commercial use of any App content without written permission is strictly prohibited.`,
  },
  {
    title: '8. Third-Party Products',
    body: `The App may reference or display products from third-party manufacturers including Victron Energy, Fogstar, and others. Product specifications and estimated prices are sourced from manufacturer-published data and are subject to change. We do not guarantee the accuracy, availability, or suitability of any third-party product information displayed in the App.`,
  },
  {
    title: '9. Limitation of Liability',
    body: `TO THE MAXIMUM EXTENT PERMITTED BY LAW:\n\n• The App is provided "as is" and "as available" without warranties of any kind\n• We do not warrant that the App will be uninterrupted, error-free, or that defects will be corrected\n• We shall not be liable for any indirect, incidental, special, consequential, or punitive damages\n• Our total liability shall not exceed the amount paid by you for the App in the preceding 12 months\n• Nothing in these Terms excludes liability for death or personal injury caused by negligence, fraud, or any other liability that cannot be excluded by law`,
  },
  {
    title: '10. Indemnification',
    body: `You agree to indemnify, defend, and hold harmless Crafted Camper Co (Yorkshire) LTD, its directors, employees, and agents from any claims, damages, losses, or expenses arising from your use of the App, your violation of these Terms, or your violation of any third-party rights.`,
  },
  {
    title: '11. Changes to Terms',
    body: `We may update these Terms from time to time. Continued use of the App after changes constitutes acceptance of the revised Terms. We will notify users of material changes via the App or email.`,
  },
  {
    title: '12. Governing Law',
    body: `These Terms are governed by and construed in accordance with the laws of England and Wales. Any disputes shall be subject to the exclusive jurisdiction of the courts of England and Wales.`,
  },
  {
    title: '13. Contact',
    body: `Crafted Camper Co (Yorkshire) LTD\nEmail: dan@craftedcamper.co\nWebsite: craftedcamper.co`,
  },
];

export default function TermsScreen() {
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
        <Text style={[s.heading, { color: theme.text }]}>Terms of Use</Text>
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
