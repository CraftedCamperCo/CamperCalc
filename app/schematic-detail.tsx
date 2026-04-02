/**
 * Full-screen wiring schematic viewer.
 * Uses ReactNativeWebView to render the SVG for proper pinch-zoom + pan in all
 * directions with crisp quality at any zoom level (vector SVG, not bitmap).
 * PDF export produces the same schematic + spec sheets with Victron product images.
 */
import TopographicBackground from '@/components/TopographicBackground';
import { generateSchematicWebviewHTML } from '@/utils/schematicWebview';
import { generateSchematicPDFHTML } from '@/utils/schematicPDF';
import { loadImageBase64Map } from '@/utils/imageBase64';
import { goBackOrHome } from '@/utils/navigation';
import { useAuth } from '@/context/AuthContext';
import { useProjects } from '@/context/ProjectContext';
import { useTheme } from '@/context/ThemeContext';
import { calculate } from '@/utils/calculator';
import type { CableRunLength, SystemConfig, WiringSpec } from '@/utils/wiringTypes';
import { generateWiringSpec } from '@/utils/wiringRules';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import * as MailComposer from 'expo-mail-composer';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';

function getCustomerFirstName(user: any): string {
  return user?.user_metadata?.first_name || '';
}

export default function SchematicDetailScreen() {
  const theme = useTheme();
  const { user, updateProfile } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { currentProject } = useProjects();
  const params = useLocalSearchParams<{ hasShore: string; cableRun: string; useLynx: string }>();

  const hasShore = params.hasShore === 'true';
  const cableRun = (params.cableRun ?? 'medium') as CableRunLength;
  const useLynx = params.useLynx === 'true';

  const [exporting, setExporting] = useState(false);
  const [imageMap, setImageMap] = useState<Record<string, string>>({});
  const [imagesLoaded, setImagesLoaded] = useState(false);

  useEffect(() => {
    loadImageBase64Map().then(m => { setImageMap(m); setImagesLoaded(true); });
  }, []);

  const state = currentProject?.camper_state;
  const buildSpec = state && (state as any).usage ? calculate(state as any) : null;

  const needs240v = !!(state as any)?.needs240v;
  const hasLPG = !!(
    (state as any)?.cookFuel === 'Gas' ||
    (state as any)?.heatFuel === 'Gas' ||
    (state as any)?.waterFuel === 'Gas'
  );

  const selectedDcAppliances = state
    ? Object.entries((state as any).selectedAppliances || {}).filter(([_, on]) => on).map(([id]) => id)
    : [];
  const customApplianceNames = state
    ? ((state as any).customAppliances || []).map((a: any) => a.name)
    : [];

  const wiringConfig: SystemConfig | null = buildSpec ? {
    batteryAh: buildSpec.recommendedBankAh,
    inverterVA: (needs240v
      ? (buildSpec.inverterSize <= 1000 ? 800 : buildSpec.inverterSize <= 2000 ? 2000 : 3000)
      : 0) as SystemConfig['inverterVA'],
    solarWatts: (buildSpec.recommendedSolarW <= 200 ? 200 : buildSpec.recommendedSolarW <= 400 ? 400 : 600) as SystemConfig['solarWatts'],
    dcDcAmps: (buildSpec.dcDcChargerSize <= 18 ? 18 : buildSpec.dcDcChargerSize <= 30 ? 30 : 50) as SystemConfig['dcDcAmps'],
    hasShore: needs240v ? hasShore : false,
    hasLPG,
    cableRunLength: cableRun,
    useLynx,
    selectedDcAppliances,
    customApplianceNames,
  } : null;

  const wiringSpec: WiringSpec | null = useMemo(() => {
    if (!wiringConfig) return null;
    try { return generateWiringSpec(wiringConfig); } catch { return null; }
  }, [wiringConfig]);

  const projectName = currentProject?.name ?? 'My Build';

  const webviewHTML = useMemo(() => {
    if (!wiringSpec || !wiringConfig || !imagesLoaded) return null;
    return generateSchematicWebviewHTML(wiringSpec, wiringConfig, imageMap);
  }, [wiringSpec, wiringConfig, imagesLoaded, imageMap]);

  async function handleExport(method: 'share' | 'email') {
    if (!wiringSpec || !wiringConfig) return;
    if (!imagesLoaded) {
      Alert.alert('Loading', 'Component images are still loading. Please wait a moment and try again.');
      return;
    }
    setExporting(true);
    try {
      const html = generateSchematicPDFHTML(wiringSpec, wiringConfig, projectName, imageMap);
      const { uri } = await Print.printToFileAsync({
        html,
        base64: false,
        width: 842,
        height: 595,
      });
      const subject = `CamperPlan by Crafted — ${projectName} Wiring Schematic`;

      if (method === 'share') {
        const canShare = await Sharing.isAvailableAsync();
        if (canShare) {
          await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: `${projectName} Wiring Schematic` });
        } else {
          Alert.alert('PDF saved', uri);
        }
      } else {
        const canEmail = await MailComposer.isAvailableAsync();
        if (canEmail) {
          const sendEmail = async (name: string) => {
            const greeting = name ? `Hi ${name},` : 'Hi,';
            await MailComposer.composeAsync({
              subject,
              body: `${greeting}\n\nPlease find attached the wiring schematic for "${projectName}", generated by CamperPlan by Crafted.\n\nThis document includes the component layout with Victron product imagery, cable sizing, fuse ratings, applicable UK regulations, and safety notes.\n\nIMPORTANT: All electrical installations must be verified and signed off by a qualified/competent electrician before first use. An Electrical Installation Certificate (EIC) is required.\n\nFor trade pricing or a bespoke build quote, please visit craftedcamper.co or email dan@craftedcamper.co.\n\nDan Andrews\nCrafted Camper Co (Yorkshire) LTD\ncraftedcamper.co`,
              attachments: [uri],
            });
          };
          const existing = getCustomerFirstName(user);
          if (existing) {
            await sendEmail(existing);
          } else {
            Alert.prompt(
              'Your name',
              'Enter your first name so we can personalise your emails.',
              [
                { text: 'Skip', style: 'cancel', onPress: () => sendEmail('') },
                { text: 'Save', onPress: (name?: string) => {
                  if (name?.trim()) updateProfile(name.trim()).catch(() => {});
                  sendEmail(name?.trim() || '');
                }},
              ],
              'plain-text',
              '',
              'default',
            );
          }
        } else {
          await Sharing.shareAsync(uri, { mimeType: 'application/pdf' });
        }
      }
    } catch (e: any) {
      Alert.alert('Export failed', e?.message ?? 'Unknown error');
    } finally {
      setExporting(false);
    }
  }

  return (
    <View style={[styles.container, { backgroundColor: '#1A1A1A' }]}>
      <TopographicBackground />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => goBackOrHome(router)} style={styles.backBtn} activeOpacity={0.7}>
          <FontAwesome name="chevron-left" size={14} color="#D9A05B" />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Full Schematic</Text>
          <Text style={styles.headerSub}>Pinch to zoom · Drag to pan</Text>
        </View>
        <View style={styles.headerActions}>
          {exporting ? (
            <ActivityIndicator color="#D9A05B" size="small" />
          ) : (
            <>
              <TouchableOpacity style={styles.actionBtn} onPress={() => handleExport('share')} activeOpacity={0.7}>
                <MaterialCommunityIcons name="file-pdf-box" size={22} color="#D9A05B" />
              </TouchableOpacity>
              <TouchableOpacity style={[styles.actionBtn, { marginLeft: 6 }]} onPress={() => handleExport('email')} activeOpacity={0.7}>
                <MaterialCommunityIcons name="email-outline" size={22} color="#D9A05B" />
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>

      <View style={styles.discountBar}>
        <MaterialCommunityIcons name="book-open-variant" size={13} color="#2E4C3D" />
        <Text style={styles.discountText}>
          £75 bespoke package: full wiring schematic + installation instructions, tailored to this build.
        </Text>
      </View>

      {wiringSpec && wiringConfig && webviewHTML ? (
        <WebView
          source={{ html: webviewHTML }}
          style={styles.canvas}
          scalesPageToFit={false}
          scrollEnabled
          bounces
          showsHorizontalScrollIndicator
          showsVerticalScrollIndicator
          originWhitelist={['*']}
          javaScriptEnabled
          onMessage={(event) => {
            try {
              const data = JSON.parse(event.nativeEvent.data);
              if (data.action === 'buy' && data.productId) {
                router.push({ pathname: '/shop', params: { highlight: data.productId } });
              }
            } catch {}
          }}
        />
      ) : (
        <View style={styles.empty}>
          {!imagesLoaded ? (
            <>
              <ActivityIndicator color="#D9A05B" size="large" />
              <Text style={styles.emptyText}>Loading schematic…</Text>
            </>
          ) : (
            <>
              <MaterialCommunityIcons name="sitemap" size={48} color="rgba(255,255,255,0.15)" />
              <Text style={styles.emptyText}>No schematic data available</Text>
            </>
          )}
        </View>
      )}

      {/* Bottom bar */}
      {wiringSpec && !exporting && (
        <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 8 }]}>
          <TouchableOpacity style={styles.exportBtn} onPress={() => handleExport('share')} activeOpacity={0.85}>
            <MaterialCommunityIcons name="download" size={16} color="#1A1A1A" />
            <Text style={styles.exportBtnText}>Download PDF</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.exportBtn, styles.emailBtn]} onPress={() => handleExport('email')} activeOpacity={0.85}>
            <MaterialCommunityIcons name="email-outline" size={16} color="#D9A05B" />
            <Text style={[styles.exportBtnText, { color: '#D9A05B' }]}>Email</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 10,
    borderBottomWidth: 1, borderBottomColor: 'rgba(217,160,91,0.3)',
    backgroundColor: 'rgba(26,26,26,0.97)', zIndex: 10,
  },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, minWidth: 70 },
  backText: { color: '#D9A05B', fontSize: 14, fontWeight: '600' },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: { color: '#fff', fontSize: 15, fontWeight: '800' },
  headerSub: { color: 'rgba(255,255,255,0.4)', fontSize: 10, marginTop: 1 },
  headerActions: { flexDirection: 'row', alignItems: 'center', minWidth: 70, justifyContent: 'flex-end' },
  actionBtn: { padding: 6 },
  discountBar: {
    flexDirection: 'row', alignItems: 'center', gap: 7,
    backgroundColor: 'rgba(46,76,61,0.25)', paddingHorizontal: 14, paddingVertical: 7,
    borderBottomWidth: 1, borderBottomColor: 'rgba(46,76,61,0.35)',
  },
  discountText: { color: '#7EC8A0', fontSize: 11, flex: 1, lineHeight: 15 },
  canvas: { flex: 1, backgroundColor: '#F8F9FA' },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 10 },
  emptyText: { color: 'rgba(255,255,255,0.4)', fontSize: 16, fontWeight: '700' },
  bottomBar: {
    flexDirection: 'row', gap: 12, paddingHorizontal: 16, paddingTop: 10,
    borderTopWidth: 1, borderTopColor: 'rgba(217,160,91,0.2)',
    backgroundColor: 'rgba(26,26,26,0.97)',
  },
  exportBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, backgroundColor: '#D9A05B', paddingVertical: 14, borderRadius: 10,
  },
  emailBtn: { backgroundColor: 'transparent', borderWidth: 1, borderColor: '#D9A05B' },
  exportBtnText: { color: '#1A1A1A', fontSize: 14, fontWeight: '700' },
});
