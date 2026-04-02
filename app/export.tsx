import GlassCard from '@/components/GlassCard';
import TopographicBackground from '@/components/TopographicBackground';
import { useAuth } from '@/context/AuthContext';
import { useProjects } from '@/context/ProjectContext';
import { useTheme } from '@/context/ThemeContext';
import { ExportSections, generateBuildHTML } from '@/utils/exportBuilder';
import { goBackOrHome } from '@/utils/navigation';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useRouter } from 'expo-router';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface SectionToggle {
  key: keyof ExportSections;
  label: string;
  icon: string;
}

const SECTION_LIST: SectionToggle[] = [
  { key: 'camperProfile', label: 'Camper Profile', icon: 'van-utility' },
  { key: 'insulation', label: 'Insulation Spec', icon: 'shield-home' },
  { key: 'electrical', label: 'Electrical Systems', icon: 'flash' },
  { key: 'water', label: 'Water System', icon: 'water' },
  { key: 'buildSummary', label: 'Build Summary', icon: 'hammer-wrench' },
];

export default function ExportScreen() {
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { currentProject } = useProjects();
  const { user } = useAuth();

  const [sections, setSections] = useState<ExportSections>({
    camperProfile: true,
    insulation: true,
    electrical: true,
    water: true,
    buildSummary: true,
  });
  const [generating, setGenerating] = useState(false);

  const toggle = (key: keyof ExportSections) => {
    setSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const state = currentProject?.camper_state;
  const hasData = state && typeof state === 'object' && state.usage;

  const handleGeneratePDF = useCallback(async () => {
    if (!state || !hasData) return;
    setGenerating(true);
    try {
      const html = generateBuildHTML(state as any, sections, currentProject?.name || 'My Build');
      const { uri } = await Print.printToFileAsync({ html, base64: false, width: 595, height: 842 });
      await Sharing.shareAsync(uri, { mimeType: 'application/pdf', UTI: 'com.adobe.pdf' });
    } catch (e: any) {
      if (!e?.message?.includes('cancelled') && !e?.message?.includes('dismiss')) {
        Alert.alert('Export Error', e?.message || 'Failed to generate PDF');
      }
    } finally {
      setGenerating(false);
    }
  }, [state, sections, currentProject]);

  const isDark = theme.blurTint === 'dark';

  if (!currentProject) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <TopographicBackground />
        <View style={[styles.emptyWrap, { paddingTop: insets.top + 20 }]}>
          <TouchableOpacity onPress={() => goBackOrHome(router)} style={styles.backBtn} activeOpacity={0.7}>
            <FontAwesome name="chevron-left" size={14} color={theme.accent} />
            <Text style={[styles.backText, { color: theme.accent }]}>Back</Text>
          </TouchableOpacity>
          <View style={styles.emptyCenter}>
            <MaterialCommunityIcons name="file-export" size={48} color={theme.textSecondary} style={{ opacity: 0.3 }} />
            <Text style={[styles.emptyTitle, { color: theme.text }]}>No Project Selected</Text>
            <Text style={[styles.emptyDesc, { color: theme.textSecondary }]}>Open a project from the home dashboard first, then come back to export.</Text>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <TopographicBackground />
      <ScrollView style={styles.scroll} contentContainerStyle={[styles.content, { paddingTop: insets.top + 20 }]} showsVerticalScrollIndicator={false}>

        <TouchableOpacity onPress={() => goBackOrHome(router)} style={styles.backBtn} activeOpacity={0.7}>
          <FontAwesome name="chevron-left" size={14} color={theme.accent} />
          <Text style={[styles.backText, { color: theme.accent }]}>Back</Text>
        </TouchableOpacity>

        <Text style={[styles.heading, { color: theme.text }]}>Export Build PDF</Text>
        <Text style={[styles.subheading, { color: theme.textSecondary }]}>
          Select which sections to include in your downloadable build specification document.
        </Text>

        <GlassCard style={styles.card}>
          <Text style={[styles.cardLabel, { color: theme.accent }]}>PROJECT</Text>
          <Text style={[styles.projectName, { color: theme.text }]}>{currentProject.name}</Text>
          {state?.van && (
            <Text style={[styles.vanLabel, { color: theme.textSecondary }]}>
              {(state.van as any).manufacturerName} {(state.van as any).model} — {(state.van as any).wheelbase}
            </Text>
          )}
        </GlassCard>

        <Text style={[styles.sectionLabel, { color: theme.accent }]}>SECTIONS</Text>

        {SECTION_LIST.map((s) => (
          <GlassCard key={s.key} style={styles.toggleCard}>
            <View style={styles.toggleRow}>
              <View style={[styles.toggleIcon, { backgroundColor: `${theme.accent}15` }]}>
                <MaterialCommunityIcons name={s.icon as any} size={20} color={sections[s.key] ? theme.accent : theme.textSecondary} />
              </View>
              <Text style={[styles.toggleLabel, { color: sections[s.key] ? theme.text : theme.textSecondary }]}>{s.label}</Text>
              <Switch
                value={sections[s.key]}
                onValueChange={() => toggle(s.key)}
                trackColor={{ false: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)', true: `${theme.accent}55` }}
                thumbColor={sections[s.key] ? theme.accent : isDark ? '#555' : '#ccc'}
              />
            </View>
          </GlassCard>
        ))}

        {!hasData && (
          <View style={[styles.warningCard, { backgroundColor: `${theme.accent}10`, borderColor: `${theme.accent}30` }]}>
            <MaterialCommunityIcons name="alert-circle-outline" size={18} color={theme.accent} />
            <Text style={[styles.warningText, { color: theme.textSecondary }]}>
              This project doesn't have enough data yet. Complete the calculator tabs first, then export.
            </Text>
          </View>
        )}

        <TouchableOpacity
          style={[styles.generateBtn, { backgroundColor: hasData ? theme.text : theme.textSecondary, opacity: hasData ? 1 : 0.5 }]}
          onPress={handleGeneratePDF}
          activeOpacity={0.85}
          disabled={!hasData || generating}
        >
          {generating ? (
            <ActivityIndicator color={theme.background} size="small" />
          ) : (
            <>
              <MaterialCommunityIcons name="file-pdf-box" size={20} color={theme.background} />
              <Text style={[styles.generateBtnText, { color: theme.background }]}>Generate & Share PDF</Text>
            </>
          )}
        </TouchableOpacity>

        <Text style={[styles.emailHint, { color: theme.textSecondary }]}>
          {user?.email ? `PDF will be shared to ${user.email} or any app you choose.` : 'The PDF will open a share sheet so you can save or send it.'}
        </Text>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flex: 1 },
  content: { padding: 24 },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 24 },
  backText: { fontSize: 15, fontWeight: '600' },
  heading: { fontSize: 26, fontWeight: '800', marginBottom: 8 },
  subheading: { fontSize: 14, lineHeight: 20, marginBottom: 28 },

  card: { marginBottom: 24 },
  cardLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 2, marginBottom: 4 },
  projectName: { fontSize: 18, fontWeight: '700', marginBottom: 2 },
  vanLabel: { fontSize: 13 },

  sectionLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 2, marginBottom: 14 },

  toggleCard: { marginBottom: 8 },
  toggleRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  toggleIcon: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  toggleLabel: { flex: 1, fontSize: 15, fontWeight: '600' },

  warningCard: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, borderRadius: 10, borderWidth: 1, marginTop: 8, marginBottom: 16 },
  warningText: { flex: 1, fontSize: 12, lineHeight: 17 },

  generateBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 16, borderRadius: 12, marginTop: 24 },
  generateBtnText: { fontSize: 16, fontWeight: '800' },

  emailHint: { fontSize: 11, textAlign: 'center', marginTop: 12 },

  emptyWrap: { flex: 1, padding: 24 },
  emptyCenter: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingBottom: 80, gap: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '700' },
  emptyDesc: { fontSize: 13, textAlign: 'center', maxWidth: 280 },
});
