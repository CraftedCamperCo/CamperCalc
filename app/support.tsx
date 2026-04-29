import TopographicBackground from '@/components/TopographicBackground';
import { useProjects } from '@/context/ProjectContext';
import { useTheme } from '@/context/ThemeContext';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import Constants from 'expo-constants';
import * as MailComposer from 'expo-mail-composer';
import { usePathname, useRouter } from 'expo-router';
import { goBackOrHome } from '@/utils/navigation';
import React from 'react';
import { Alert, Platform, ScrollView, Share, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function SupportScreen() {
  const theme = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const { currentProject } = useProjects();

  const emailSupport = async () => {
    const subject = 'CamperPlan Support Request';
    const body = 'Hi Crafted team,\n\nI need help with:\n\nOrder number (if relevant):\nProject name:\nIssue details:\n\nThanks,';

    if (Platform.OS === 'web') {
      // Browser mailto handoff. Most users have a default mail app or Gmail/Outlook web link handler.
      if (typeof window !== 'undefined') {
        window.location.href = `mailto:dan@craftedcamper.co?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      }
      return;
    }

    try {
      const available = await MailComposer.isAvailableAsync();
      if (!available) {
        Alert.alert('Email unavailable', 'Please email dan@craftedcamper.co from your mail app.');
        return;
      }
      await MailComposer.composeAsync({
        recipients: ['dan@craftedcamper.co'],
        subject,
        body,
      });
    } catch {
      Alert.alert('Support', 'Please email dan@craftedcamper.co');
    }
  };

  const shareDebugSnapshot = async () => {
    const debugSnapshot = [
      `App: CamperPlan by Crafted`,
      `Version: ${Constants.expoConfig?.version ?? 'unknown'}`,
      `Platform: ${Platform.OS}`,
      `Route: ${pathname ?? 'unknown'}`,
      `Project ID: ${currentProject?.id ?? 'none selected'}`,
      `EAS Project ID: ${Constants.expoConfig?.extra?.eas?.projectId ?? 'unknown'}`,
      `Timestamp: ${new Date().toISOString()}`,
    ].join('\n');

    try {
      await Share.share({
        title: 'CamperPlan Debug Snapshot',
        message: debugSnapshot,
      });
    } catch {
      Alert.alert('Unable to share', 'Please copy these details manually and include them in your support email.');
    }
  };

  return (
    <View style={[s.container, { backgroundColor: theme.background }]}>
      <TopographicBackground />
      <View style={[s.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity style={s.back} onPress={() => goBackOrHome(router)} activeOpacity={0.7}>
          <FontAwesome name="chevron-left" size={14} color={theme.accent} />
          <Text style={[s.backText, { color: theme.accent }]}>Back</Text>
        </TouchableOpacity>
        <Text style={[s.heading, { color: theme.text }]}>Support</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        <Text style={[s.title, { color: theme.text }]}>Need help?</Text>
        <Text style={[s.body, { color: theme.textSecondary }]}>
          For fastest support, include your order number, project name, and screenshots of the issue.
        </Text>

        <View style={[s.card, { borderColor: `${theme.accent}35`, backgroundColor: `${theme.accent}10` }]}>
          <Text style={[s.cardLabel, { color: theme.accent }]}>SUPPORT EMAIL</Text>
          <Text style={[s.cardText, { color: theme.text }]}>dan@craftedcamper.co</Text>
          <Text style={[s.cardSub, { color: theme.textSecondary }]}>Typical response: within 1 business day.</Text>
        </View>

        <View style={[s.card, { borderColor: 'rgba(46,76,61,0.35)', backgroundColor: 'rgba(46,76,61,0.08)' }]}>
          <Text style={[s.cardLabel, { color: theme.successBright }]}>ESCALATION PATH</Text>
          <Text style={[s.cardSub, { color: theme.textSecondary }]}>
            If an order is urgent (dispatch issue, payment taken without confirmation), add "URGENT ORDER" to your subject line and include your order number.
          </Text>
        </View>

        <TouchableOpacity style={[s.btn, { backgroundColor: theme.accent }]} onPress={emailSupport} activeOpacity={0.85}>
          <Text style={s.btnText}>Email Support</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[s.btnSecondary, { borderColor: `${theme.accent}45`, backgroundColor: `${theme.accent}12` }]} onPress={shareDebugSnapshot} activeOpacity={0.85}>
          <Text style={[s.btnSecondaryText, { color: theme.accent }]}>Share Technical Snapshot</Text>
        </TouchableOpacity>

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
  title: { fontSize: 24, fontWeight: '800', marginBottom: 8 },
  body: { fontSize: 13, lineHeight: 19, marginBottom: 14 },
  card: { borderWidth: 1, borderRadius: 12, padding: 14, marginBottom: 14 },
  cardLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 2, marginBottom: 8 },
  cardText: { fontSize: 16, fontWeight: '800', marginBottom: 4 },
  cardSub: { fontSize: 12, lineHeight: 17 },
  btn: { borderRadius: 10, alignItems: 'center', paddingVertical: 13 },
  btnText: { color: '#1A1A1A', fontSize: 14, fontWeight: '800' },
  btnSecondary: { marginTop: 10, borderRadius: 10, alignItems: 'center', paddingVertical: 12, borderWidth: 1 },
  btnSecondaryText: { fontSize: 13, fontWeight: '800' },
});
