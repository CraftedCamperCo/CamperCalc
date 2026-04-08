import AuthorityBadge from '@/components/AuthorityBadge';
import CraftedConfidenceBadge from '@/components/CraftedConfidenceBadge';
import ElectricalDisclaimer from '@/components/ElectricalDisclaimer';
import GlassCard from '@/components/GlassCard';
import TopographicBackground from '@/components/TopographicBackground';
import { FEATURE_FLAGS } from '@/constants/featureFlags';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { useEntitlements } from '@/context/EntitlementsContext';
import { useProjects } from '@/context/ProjectContext';
import { useTheme } from '@/context/ThemeContext';
import { VICTRON_CATALOG_BY_ID } from '@/data/victronCatalog';
import { calculate } from '@/utils/calculator';
import { loadImageBase64Map } from '@/utils/imageBase64';
import { goBackOrHome } from '@/utils/navigation';
import { generateSchematicWebviewHTML } from '@/utils/schematicWebview';
import type { SystemConfig, WiringSpec, ShoppingListItem, InstallStep, CableRunLength } from '@/utils/wiringTypes';
import { generateWiringSpec } from '@/utils/wiringRules';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Dimensions,
  LayoutAnimation,
  Linking,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  UIManager,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

type Tab = 'schematic' | 'shopping' | 'install';
const { width: SCREEN_W } = Dimensions.get('window');
const SCHEMA_W = 2400;
const WIRING_BUNDLE_PRODUCT_ID = 'wiring_kit_bespoke';
const REQUIRED_TOOL_PRODUCT_IDS = ['tool_hydraulic_crimper', 'tool_wire_strippers', 'tool_multimeter'];
const OPTIONAL_TOOL_PRODUCT_IDS = ['tool_ratchet_crimper', 'tool_torque_wrench', 'tool_heat_gun'];

function SegmentedControl({ tabs, selected, onSelect, theme }: { tabs: { key: Tab; label: string }[]; selected: Tab; onSelect: (t: Tab) => void; theme: any }) {
  const isDark = theme.blurTint === 'dark';
  return (
    <View style={[seg.row, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }]}>
      {tabs.map(t => (
        <TouchableOpacity key={t.key} style={[seg.tab, selected === t.key && { backgroundColor: `${theme.accent}30` }]} onPress={() => onSelect(t.key)} activeOpacity={0.7}>
          <Text style={[seg.label, { color: selected === t.key ? theme.accent : theme.textSecondary }]}>{t.label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

function ShoppingListView({
  items,
  theme,
  onAddBundleSelection,
  cartCount,
}: {
  items: ShoppingListItem[];
  theme: any;
  onAddBundleSelection: (ids: string[]) => void;
  cartCount: number;
}) {
  const coreItems = useMemo(
    () => items.filter((item) => item.category === 'Core Components'),
    [items],
  );
  const wiringKitItems = useMemo(
    () => items.filter((item) => item.category !== 'Core Components' && item.category !== 'Tools Required'),
    [items],
  );
  const wiringBundleProduct = VICTRON_CATALOG_BY_ID[WIRING_BUNDLE_PRODUCT_ID];
  const requiredToolProducts = useMemo(
    () => REQUIRED_TOOL_PRODUCT_IDS.map((id) => VICTRON_CATALOG_BY_ID[id]).filter(Boolean),
    [],
  );
  const optionalToolProducts = useMemo(
    () => OPTIONAL_TOOL_PRODUCT_IDS.map((id) => VICTRON_CATALOG_BY_ID[id]).filter(Boolean),
    [],
  );
  const [includedRequiredTools, setIncludedRequiredTools] = useState<Record<string, boolean>>({});
  const [includedOptionalTools, setIncludedOptionalTools] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const requiredDefaults = Object.fromEntries(requiredToolProducts.map((item) => [item.id, true]));
    const optionalDefaults = Object.fromEntries(optionalToolProducts.map((item) => [item.id, false]));
    setIncludedRequiredTools(requiredDefaults);
    setIncludedOptionalTools(optionalDefaults);
  }, [requiredToolProducts, optionalToolProducts]);

  const wiringKitPrice = wiringBundleProduct?.estimatedPrice ?? wiringKitItems.reduce((sum, item) => sum + item.estimatedPrice, 0);
  const selectedRequiredToolItems = requiredToolProducts.filter((item: any) => includedRequiredTools[item.id] !== false);
  const selectedOptionalToolItems = optionalToolProducts.filter((item: any) => includedOptionalTools[item.id] !== false);
  const selectedToolItems = [...selectedRequiredToolItems, ...selectedOptionalToolItems];
  const selectedToolTotal = selectedToolItems.reduce((sum, item) => sum + item.estimatedPrice, 0);
  const total = coreItems.reduce((sum, item) => sum + item.estimatedPrice, 0) + wiringKitPrice + selectedToolTotal;

  const toggleRequiredTool = (id: string) => {
    setIncludedRequiredTools((prev) => ({ ...prev, [id]: !(prev[id] ?? true) }));
  };
  const toggleOptionalTool = (id: string) => {
    setIncludedOptionalTools((prev) => ({ ...prev, [id]: !(prev[id] ?? false) }));
  };
  const handleAddBundleSelection = () => {
    const selectedIds = [
      WIRING_BUNDLE_PRODUCT_ID,
      ...selectedRequiredToolItems.map((item: any) => item.id),
      ...selectedOptionalToolItems.map((item: any) => item.id),
    ];
    onAddBundleSelection(selectedIds);
  };

  return (
    <View>
      <View style={{ marginBottom: 16 }}>
        <Text style={[s.catLabel, { color: theme.accent }]}>CORE COMPONENTS</Text>
        {coreItems.map((item, i) => (
          <GlassCard key={`${item.name}_${i}`} style={s.listCard}>
            <View style={s.listRow}>
              <View style={{ flex: 1 }}>
                <Text style={[s.itemName, { color: theme.text }]}>{item.name}</Text>
                <Text style={[s.itemDesc, { color: theme.textSecondary }]}>{item.description}</Text>
              </View>
              <View style={s.listRight}>
                <Text style={[s.itemQty, { color: theme.text }]}>{item.quantity} {item.unit}</Text>
                <Text style={[s.itemPrice, { color: theme.accent }]}>£{item.estimatedPrice.toFixed(0)}</Text>
              </View>
            </View>
          </GlassCard>
        ))}
      </View>

      <View style={{ marginBottom: 16 }}>
        <Text style={[s.catLabel, { color: theme.accent }]}>CRAFTED WIRING KIT BUNDLE</Text>
        <GlassCard style={[s.listCard, { borderWidth: 1, borderColor: `${theme.accent}35` }]}>
          <View style={s.listRow}>
            <View style={{ flex: 1 }}>
              <Text style={[s.itemName, { color: theme.text }]}>Pre-Cut Looms + Terminated Ends</Text>
              <Text style={[s.itemDesc, { color: theme.textSecondary }]}>
                All major wiring in this package is pre-cut, pre-crimped, and heat-shrunk for your build.
              </Text>
              <Text style={[s.bundleHint, { color: theme.textSecondary }]}>
                Includes enough cable for a typical average-layout van on 12V appliance and lighting runs, plus 10% safety headroom.
              </Text>
              <Text style={[s.bundleHint, { color: theme.textSecondary }]}>
                Covers {wiringKitItems.length} internal wiring/protection line items while keeping full cable schedules in the paid package.
              </Text>
            </View>
            <View style={s.listRight}>
              <Text style={[s.itemQty, { color: theme.text }]}>1 package</Text>
              <Text style={[s.itemPrice, { color: theme.accent }]}>£{wiringKitPrice.toFixed(0)}</Text>
            </View>
          </View>
        </GlassCard>
      </View>

      <View style={{ marginBottom: 16 }}>
        <Text style={[s.catLabel, { color: theme.accent }]}>REQUIRED TOOLS TO ADD ALONGSIDE THE BUNDLE</Text>
        {requiredToolProducts.map((item: any, i: number) => {
          const included = includedRequiredTools[item.id] !== false;
          return (
            <TouchableOpacity key={`${item.id}_${i}`} onPress={() => toggleRequiredTool(item.id)} activeOpacity={0.85}>
              <GlassCard style={s.listCard}>
                <View style={s.listRow}>
                  <MaterialCommunityIcons
                    name={included ? 'checkbox-marked-circle' : 'checkbox-blank-circle-outline'}
                    size={18}
                    color={included ? theme.accent : theme.textSecondary}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={[s.itemName, { color: theme.text }]}>{item.name}</Text>
                    <Text style={[s.itemDesc, { color: theme.textSecondary }]}>Recommended alongside the wiring bundle.</Text>
                  </View>
                  <View style={s.listRight}>
                    <Text style={[s.itemQty, { color: theme.text }]}>1 unit</Text>
                    <Text style={[s.itemPrice, { color: included ? theme.accent : theme.textSecondary }]}>£{item.estimatedPrice.toFixed(0)}</Text>
                  </View>
                </View>
              </GlassCard>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={{ marginBottom: 16 }}>
        <Text style={[s.catLabel, { color: theme.accent }]}>OPTIONAL TOOLS</Text>
        {optionalToolProducts.map((item: any, i: number) => {
          const included = includedOptionalTools[item.id] !== false;
          return (
            <TouchableOpacity key={`${item.id}_${i}`} onPress={() => toggleOptionalTool(item.id)} activeOpacity={0.85}>
              <GlassCard style={s.listCard}>
                <View style={s.listRow}>
                  <MaterialCommunityIcons
                    name={included ? 'checkbox-marked-circle' : 'checkbox-blank-circle-outline'}
                    size={18}
                    color={included ? theme.accent : theme.textSecondary}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={[s.itemName, { color: theme.text }]}>{item.name}</Text>
                    <Text style={[s.itemDesc, { color: theme.textSecondary }]}>Optional convenience add-on.</Text>
                  </View>
                  <View style={s.listRight}>
                    <Text style={[s.itemQty, { color: theme.text }]}>1 unit</Text>
                    <Text style={[s.itemPrice, { color: included ? theme.accent : theme.textSecondary }]}>£{item.estimatedPrice.toFixed(0)}</Text>
                  </View>
                </View>
              </GlassCard>
            </TouchableOpacity>
          );
        })}
      </View>

      <TouchableOpacity style={[s.bundleAddBtn, { backgroundColor: theme.accent }]} onPress={handleAddBundleSelection} activeOpacity={0.85}>
        <MaterialCommunityIcons name="cart-plus" size={16} color="#1A1A1A" />
        <Text style={s.bundleAddBtnText}>Add Wiring Bundle + Selected Tools ({cartCount} in basket)</Text>
      </TouchableOpacity>

      <GlassCard style={[s.totalCard, { borderColor: `${theme.accent}40` }]}>
        <View style={s.totalRow}>
          <Text style={[s.totalLabel, { color: theme.textSecondary }]}>ESTIMATED TOTAL</Text>
          <Text style={[s.totalValue, { color: theme.accent }]}>£{total.toFixed(0)}</Text>
        </View>
      </GlassCard>
    </View>
  );
}

function InstallGuideView({ steps, theme }: { steps: InstallStep[]; theme: any }) {
  const [expanded, setExpanded] = useState<number | null>(null);
  const toggle = (n: number) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded(expanded === n ? null : n);
  };
  return (
    <View>
      {steps.map((step) => {
        const isOpen = expanded === step.stepNumber;
        return (
          <TouchableOpacity key={step.stepNumber} onPress={() => toggle(step.stepNumber)} activeOpacity={0.8}>
            <GlassCard style={s.stepCard}>
              <View style={s.stepHeader}>
                <View style={[s.stepBadge, { backgroundColor: `${theme.accent}20` }]}>
                  <Text style={[s.stepNum, { color: theme.accent }]}>{step.stepNumber}</Text>
                </View>
                <Text style={[s.stepTitle, { color: theme.text }]} numberOfLines={isOpen ? undefined : 1}>{step.title}</Text>
                <FontAwesome name={isOpen ? 'chevron-up' : 'chevron-down'} size={12} color={theme.textSecondary} />
              </View>
              {isOpen && (
                <View style={s.stepBody}>
                  {step.instructions.map((inst, i) => (
                    <View key={i} style={s.instrRow}>
                      <Text style={[s.instrBullet, { color: theme.accent }]}>•</Text>
                      <Text style={[s.instrText, { color: theme.text }]}>{inst}</Text>
                    </View>
                  ))}
                  {step.cableSpecs && step.cableSpecs.length > 0 && (
                    <View style={[s.specBlock, { backgroundColor: `${theme.accent}10` }]}>
                      <Text style={[s.specBlockLabel, { color: theme.accent }]}>CABLE SPECS</Text>
                      {step.cableSpecs.map((cs, i) => <Text key={i} style={[s.specBlockText, { color: theme.text }]}>{cs}</Text>)}
                    </View>
                  )}
                  {step.regulations && step.regulations.length > 0 && (
                    <View style={[s.specBlock, { backgroundColor: 'rgba(52,152,219,0.1)' }]}>
                      <Text style={[s.specBlockLabel, { color: '#3498DB' }]}>REGULATIONS</Text>
                      {step.regulations.map((r, i) => <Text key={i} style={[s.specBlockText, { color: theme.textSecondary }]}>{r}</Text>)}
                    </View>
                  )}
                  {step.warnings && step.warnings.length > 0 && step.warnings.map((w, i) => (
                    <View key={i} style={[s.warnBlock, { backgroundColor: 'rgba(231,76,60,0.1)', borderColor: 'rgba(231,76,60,0.3)' }]}>
                      <Text style={[s.warnText, { color: '#E74C3C' }]}>⚠ {w}</Text>
                    </View>
                  ))}
                </View>
              )}
            </GlassCard>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

// ─── Project Picker Modal ─────────────────────────────────────────────────────
function ProjectPickerModal({ visible, onClose, theme }: { visible: boolean; onClose: () => void; theme: any }) {
  const { projects, selectProject, createProject, loading } = useProjects();
  const { user } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [newName, setNewName] = useState('');
  const [creating, setCreating] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const isDark = theme.blurTint === 'dark';

  async function handleCreate() {
    if (!newName.trim()) return;
    setCreating(true);
    try {
      const p = await createProject(newName.trim());
      if (p) { selectProject(p); onClose(); }
    } finally {
      setCreating(false);
      setNewName('');
      setShowCreate(false);
    }
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[pm.container, { backgroundColor: theme.background }]}>
        <TopographicBackground />
        <View style={[pm.header, { paddingTop: insets.top + 8, borderBottomColor: `${theme.accent}25` }]}>
          <Text style={[pm.title, { color: theme.text }]}>Select Project</Text>
          <TouchableOpacity onPress={onClose} style={[pm.closeBtn, { backgroundColor: `${theme.accent}15` }]} activeOpacity={0.7}>
            <MaterialCommunityIcons name="close" size={18} color={theme.text} />
          </TouchableOpacity>
        </View>

        <ScrollView style={{ flex: 1 }} contentContainerStyle={pm.list} showsVerticalScrollIndicator={false}>
          <Text style={[pm.sub, { color: theme.textSecondary }]}>
            Choose a project to generate its wiring schematic, or create a new one.
          </Text>

          {!user && (
            <GlassCard style={pm.authCard}>
              <Text style={[pm.authText, { color: theme.textSecondary }]}>Sign in to save and manage multiple projects.</Text>
              <TouchableOpacity style={[pm.authBtn, { backgroundColor: theme.accent }]} onPress={() => { onClose(); router.push('/auth'); }} activeOpacity={0.85}>
                <Text style={pm.authBtnText}>Sign In / Register</Text>
              </TouchableOpacity>
            </GlassCard>
          )}

          {projects.length > 0 && (
            <View style={{ marginBottom: 16 }}>
              <Text style={[pm.sectionLabel, { color: theme.accent }]}>YOUR PROJECTS</Text>
              {projects.map(p => (
                <TouchableOpacity key={p.id} style={[pm.projectRow, { borderColor: `${theme.accent}20` }]} onPress={() => { selectProject(p); onClose(); }} activeOpacity={0.8}>
                  <View style={[pm.projectIcon, { backgroundColor: `${theme.accent}15` }]}>
                    <MaterialCommunityIcons name="folder-outline" size={18} color={theme.accent} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[pm.projectName, { color: theme.text }]}>{p.name}</Text>
                    <Text style={[pm.projectDate, { color: theme.textSecondary }]}>
                      Last updated {new Date(p.updated_at ?? p.created_at ?? '').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </Text>
                  </View>
                  <FontAwesome name="chevron-right" size={12} color={theme.textSecondary} />
                </TouchableOpacity>
              ))}
            </View>
          )}

          {showCreate ? (
            <GlassCard style={pm.createCard}>
              <Text style={[pm.sectionLabel, { color: theme.accent }]}>NEW PROJECT</Text>
              <TextInput
                style={[pm.input, { color: theme.text, borderColor: `${theme.accent}40`, backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)' }]}
                placeholder="Project name (e.g. VW Crafter Build)"
                placeholderTextColor={theme.textSecondary}
                value={newName}
                onChangeText={setNewName}
                autoFocus
              />
              <View style={pm.createBtns}>
                <TouchableOpacity style={[pm.cancelBtn, { borderColor: `${theme.accent}30` }]} onPress={() => setShowCreate(false)} activeOpacity={0.7}>
                  <Text style={[pm.cancelBtnText, { color: theme.textSecondary }]}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[pm.createBtn, { backgroundColor: theme.accent, opacity: creating || !newName.trim() ? 0.6 : 1 }]}
                  onPress={handleCreate} disabled={creating || !newName.trim()} activeOpacity={0.85}
                >
                  <Text style={pm.createBtnText}>{creating ? 'Creating…' : 'Create Project'}</Text>
                </TouchableOpacity>
              </View>
            </GlassCard>
          ) : (
            <TouchableOpacity style={[pm.newBtn, { borderColor: `${theme.accent}40` }]} onPress={() => setShowCreate(true)} activeOpacity={0.8}>
              <MaterialCommunityIcons name="plus" size={18} color={theme.accent} />
              <Text style={[pm.newBtnText, { color: theme.accent }]}>Create New Project</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}

const pm = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingBottom: 14, borderBottomWidth: 1 },
  title: { fontSize: 18, fontWeight: '800' },
  closeBtn: { padding: 8, borderRadius: 16 },
  list: { padding: 20, paddingBottom: 48 },
  sub: { fontSize: 13, lineHeight: 19, marginBottom: 20 },
  sectionLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 2, marginBottom: 12 },
  projectRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14, paddingHorizontal: 14, borderRadius: 12, borderWidth: 1, marginBottom: 8 },
  projectIcon: { width: 38, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  projectName: { fontSize: 15, fontWeight: '700', marginBottom: 2 },
  projectDate: { fontSize: 11 },
  authCard: { marginBottom: 16 },
  authText: { fontSize: 13, lineHeight: 19, marginBottom: 12 },
  authBtn: { paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  authBtnText: { color: '#1A1A1A', fontSize: 14, fontWeight: '700' },
  createCard: { marginBottom: 8 },
  input: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, marginBottom: 12 },
  createBtns: { flexDirection: 'row', gap: 10 },
  cancelBtn: { flex: 1, paddingVertical: 12, borderRadius: 10, borderWidth: 1, alignItems: 'center' },
  cancelBtnText: { fontSize: 14, fontWeight: '600' },
  createBtn: { flex: 2, paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  createBtnText: { color: '#1A1A1A', fontSize: 14, fontWeight: '700' },
  newBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 16, borderRadius: 12, borderWidth: 1, borderStyle: 'dashed' },
  newBtnText: { fontSize: 15, fontWeight: '700' },
});

const MAX_REGENERATIONS = 3;

export default function WiringScreen() {
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { addProductsByIds, count: cartCount } = useCart();
  const { has: hasEntitlement } = useEntitlements();
  const { currentProject, incrementSchematicRegeneration } = useProjects();
  const [projectPickerVisible, setProjectPickerVisible] = useState(false);

  const [tab, setTab] = useState<Tab>('schematic');
  const [hasShore, setHasShore] = useState(true);
  const [cableRun, setCableRun] = useState<CableRunLength>('medium');
  const useLynx = true;
  const [mpptOverride, setMpptOverride] = useState<number | null>(null);
  const [dcDcOverride, setDcDcOverride] = useState<number | null>(null);
  const [mpptCustom, setMpptCustom] = useState('');
  const [dcDcCustom, setDcDcCustom] = useState('');
  const [imageMap, setImageMap] = useState<Record<string, string>>({});

  useEffect(() => { loadImageBase64Map().then(setImageMap); }, []);

  const camperState = currentProject?.camper_state;
  const buildSpec = camperState && camperState.usage ? calculate(camperState as any) : null;

  const needs240v = !!(camperState as any)?.needs240v;
  const hasLPG = !!(
    (camperState as any)?.cookFuel === 'Gas' ||
    (camperState as any)?.heatFuel === 'Gas' ||
    (camperState as any)?.waterFuel === 'Gas'
  );

  const autoMppt = buildSpec ? Math.min(
    buildSpec.recommendedSolarW <= 200 ? 15 : buildSpec.recommendedSolarW <= 400 ? 30 : 50,
    50
  ) : 0;
  const oneUpMppt = autoMppt === 15 ? 30 : autoMppt === 30 ? 50 : 50;
  const effectiveMppt = mpptOverride ?? autoMppt;

  const autoDcDc = buildSpec ? buildSpec.dcDcChargerSize : 0;
  const oneUpDcDc = autoDcDc <= 18 ? 30 : autoDcDc <= 30 ? 50 : 50;
  const effectiveDcDc = dcDcOverride ?? autoDcDc;

  const selectedDcAppliances = camperState
    ? Object.entries((camperState as any).selectedAppliances || {})
        .filter(([_, on]) => on)
        .map(([id]) => id)
    : [];
  const customApplianceNames = camperState
    ? ((camperState as any).customAppliances || []).map((a: any) => a.name)
    : [];

  const wiringConfig: SystemConfig | null = buildSpec ? {
    batteryAh: buildSpec.recommendedBankAh,
    inverterVA: (needs240v
      ? (buildSpec.inverterSize === 1000 ? 800 : buildSpec.inverterSize === 2000 ? 2000 : buildSpec.inverterSize === 3000 ? 3000 : 0)
      : 0) as SystemConfig['inverterVA'],
    solarWatts: (buildSpec.recommendedSolarW <= 200 ? 200 : buildSpec.recommendedSolarW <= 400 ? 400 : 600) as SystemConfig['solarWatts'],
    dcDcAmps: (effectiveDcDc <= 18 ? 18 : effectiveDcDc <= 30 ? 30 : 50) as SystemConfig['dcDcAmps'],
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
  }, [wiringConfig, hasShore, cableRun]);

  // Smart validation — hard blocks + soft warnings
  const validationErrors: string[] = [];
  const validationWarnings: string[] = [];
  if (buildSpec) {
    if (buildSpec.recommendedBankAh <= 0) validationErrors.push('No battery data. Complete the calculator tabs first.');
    if (buildSpec.recommendedBankAh > 0 && buildSpec.recommendedBankAh < buildSpec.calculatedAh * 0.5) validationWarnings.push('Battery capacity is significantly undersized for your usage. Consider increasing battery size or reducing loads.');
    if (buildSpec.recommendedSolarW === 0 && buildSpec.dcDcChargerSize === 0) validationWarnings.push('No charging source configured. Your battery will not recharge without solar panels or a DC-DC charger from driving.');
    if (needs240v && buildSpec.inverterSize === 0) validationWarnings.push('240V electrics are enabled but no 240V appliances are selected. The inverter will be sized minimally.');
    if (needs240v && buildSpec.inverterSize >= 3000 && buildSpec.recommendedBankAh < 280) validationWarnings.push('3kVA inverter with a small battery bank. High-draw appliances may exceed safe discharge rates.');
  }
  const canGenerate = validationErrors.length === 0;

  const isDark = theme.blurTint === 'dark';
  const reviewBypass = FEATURE_FLAGS.SCHEMATICS_REVIEW_BYPASS;
  const installUnlocked = reviewBypass || hasEntitlement('electrical_install_guide');
  const salesSuiteUnlocked = reviewBypass || hasEntitlement('sales_suite_access');

  const previewHTML = useMemo(() => {
    if (!wiringSpec || !wiringConfig) return null;
    return generateSchematicWebviewHTML(wiringSpec, wiringConfig, imageMap);
  }, [wiringSpec, wiringConfig, imageMap]);

  function openFullSchematic() {
    router.push({
      pathname: '/schematic-detail',
      params: {
        hasShore: String(hasShore),
        cableRun,
        useLynx: 'true',
      },
    });
  }

  const regenerations = currentProject?.schematic_regenerations ?? 0;
  const remainingAmendments = Math.max(0, MAX_REGENERATIONS - regenerations);
  const isLimitReached = !salesSuiteUnlocked && regenerations >= MAX_REGENERATIONS;

  const handleGenerateSchematic = useCallback(async () => {
    if (!currentProject) return;
    if (isLimitReached) {
      Alert.alert(
        'Amendment Limit Reached',
        'You\'ve used all 3 free schematic regenerations for this project. Email us for further updates.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Email Us', onPress: () => Linking.openURL('mailto:hello@craftedcamper.co?subject=Schematic%20Amendment%20Request%20-%20' + encodeURIComponent(currentProject.name)) },
        ]
      );
      return;
    }
    await incrementSchematicRegeneration(currentProject.id);
    openFullSchematic();
  }, [currentProject, isLimitReached, incrementSchematicRegeneration]);

  const handleAddWiringBundleSelection = useCallback((ids: string[]) => {
    const uniqueIds = [...new Set(ids)];
    const added = addProductsByIds(uniqueIds);
    if (added > 0) {
      Alert.alert('Added to basket', `Added ${added} item${added === 1 ? '' : 's'} from your wiring package selection.`);
    } else {
      Alert.alert('Already in basket', 'Your selected wiring package items are already in the basket.');
    }
  }, [addProductsByIds]);

  if (!FEATURE_FLAGS.ELECTRICAL_SCHEMATICS_ENABLED) {
    return (
      <View style={[s.container, { backgroundColor: theme.background }]}>
        <TopographicBackground />
        <ScrollView contentContainerStyle={[s.emptyWrap, { paddingTop: insets.top + 20, flexGrow: 1 }]}>
          <TouchableOpacity onPress={() => goBackOrHome(router)} style={s.backBtn} activeOpacity={0.7}>
            <FontAwesome name="chevron-left" size={14} color={theme.accent} />
            <Text style={[s.backText, { color: theme.accent }]}>Back</Text>
          </TouchableOpacity>
          <Text style={[s.heading, { color: theme.text }]}>Wiring Schematics</Text>
          <GlassCard style={{ marginTop: 24, borderWidth: 1, borderColor: `${theme.accent}35` }} float>
            <MaterialCommunityIcons name="sitemap" size={32} color={theme.accent} style={{ marginBottom: 12, opacity: 0.6 }} />
            <Text style={{ fontSize: 17, fontWeight: '800', color: theme.text, marginBottom: 6 }}>Temporarily hidden</Text>
            <Text style={{ fontSize: 13, color: theme.textSecondary, lineHeight: 19, marginBottom: 16 }}>
              Electrical schematics are turned off for launch recording and will be re-enabled shortly.
            </Text>
            <TouchableOpacity
              style={{ backgroundColor: theme.accent, paddingVertical: 14, borderRadius: 10, alignItems: 'center' }}
              onPress={() => router.replace('/(tabs)')}
              activeOpacity={0.85}
            >
              <Text style={{ color: '#1A1A1A', fontSize: 14, fontWeight: '800' }}>Return to Build →</Text>
            </TouchableOpacity>
          </GlassCard>
        </ScrollView>
      </View>
    );
  }

  // Auth gate — bypassed temporarily for schematic review mode.
  if (!user && !reviewBypass) {
    return (
      <View style={[s.container, { backgroundColor: theme.background }]}>
        <TopographicBackground />
        <ScrollView contentContainerStyle={[s.emptyWrap, { paddingTop: insets.top + 20, flexGrow: 1 }]}>
          <TouchableOpacity onPress={() => goBackOrHome(router)} style={s.backBtn} activeOpacity={0.7}>
            <FontAwesome name="chevron-left" size={14} color={theme.accent} />
            <Text style={[s.backText, { color: theme.accent }]}>Back</Text>
          </TouchableOpacity>
          <Text style={[s.heading, { color: theme.text }]}>Wiring Schematics</Text>
          <GlassCard style={{ marginTop: 24, borderWidth: 1, borderColor: `${theme.accent}35` }} float>
            <MaterialCommunityIcons name="lock-outline" size={32} color={theme.accent} style={{ marginBottom: 12, opacity: 0.6 }} />
            <Text style={{ fontSize: 17, fontWeight: '800', color: theme.text, marginBottom: 6 }}>Sign In Required</Text>
            <Text style={{ fontSize: 13, color: theme.textSecondary, lineHeight: 19, marginBottom: 16 }}>
              Create an account to access bespoke schematics, installation guidance, saved projects, and PDF exports.
            </Text>
            <TouchableOpacity
              style={{ backgroundColor: theme.accent, paddingVertical: 14, borderRadius: 10, alignItems: 'center' }}
              onPress={() => router.push('/auth')} activeOpacity={0.85}
            >
              <Text style={{ color: '#1A1A1A', fontSize: 14, fontWeight: '800' }}>Sign In / Register →</Text>
            </TouchableOpacity>
          </GlassCard>
        </ScrollView>
      </View>
    );
  }

  if (!currentProject || !buildSpec) {
    return (
      <View style={[s.container, { backgroundColor: theme.background }]}>
        <TopographicBackground />
        <ScrollView contentContainerStyle={[s.emptyWrap, { paddingTop: insets.top + 20, flexGrow: 1 }]}>
          <TouchableOpacity onPress={() => goBackOrHome(router)} style={s.backBtn} activeOpacity={0.7}>
            <FontAwesome name="chevron-left" size={14} color={theme.accent} />
            <Text style={[s.backText, { color: theme.accent }]}>Back</Text>
          </TouchableOpacity>
          <Text style={[s.heading, { color: theme.text }]}>Wiring Schematics</Text>
          <Text style={[s.subheading, { color: theme.textSecondary }]}>
            {!currentProject
              ? 'Select a project to generate its bespoke wiring schematic, or create a new one.'
              : 'Complete the Camper, Systems, and Water calculator tabs to generate your schematic.'}
          </Text>

          <GlassCard style={[{ marginBottom: 14, borderWidth: 1, borderColor: `${theme.accent}35` }]} float>
            <MaterialCommunityIcons name="sitemap" size={32} color={theme.accent} style={{ marginBottom: 12, opacity: 0.6 }} />
            <Text style={{ fontSize: 17, fontWeight: '800', color: theme.text, marginBottom: 6 }}>
              {!currentProject ? 'No Project Selected' : 'No Build Data Yet'}
            </Text>
            <Text style={{ fontSize: 13, color: theme.textSecondary, lineHeight: 19, marginBottom: 16 }}>
              {!currentProject
                ? 'Your wiring schematic is generated automatically from your build calculations — battery size, solar array, inverter, and DC-DC charger are all determined from your answers.'
                : `"${currentProject.name}" doesn't have enough data yet. Work through the calculator tabs first.`}
            </Text>
            <TouchableOpacity
              style={{ backgroundColor: theme.accent, paddingVertical: 14, borderRadius: 10, alignItems: 'center' }}
              onPress={!currentProject ? () => setProjectPickerVisible(true) : () => router.replace('/(tabs)')}
              activeOpacity={0.85}
            >
              <Text style={{ color: '#1A1A1A', fontSize: 14, fontWeight: '800' }}>
                {!currentProject ? 'Select or Create Project →' : 'Go to Calculator →'}
              </Text>
            </TouchableOpacity>
          </GlassCard>
        </ScrollView>
        <ProjectPickerModal visible={projectPickerVisible} onClose={() => setProjectPickerVisible(false)} theme={theme} />
      </View>
    );
  }

  return (
    <View style={[s.container, { backgroundColor: theme.background }]}>
      <TopographicBackground />
      <ScrollView style={s.scroll} contentContainerStyle={[s.content, { paddingTop: insets.top + 20 }]} showsVerticalScrollIndicator={false}>

        <TouchableOpacity onPress={() => goBackOrHome(router)} style={s.backBtn} activeOpacity={0.7}>
          <FontAwesome name="chevron-left" size={14} color={theme.accent} />
          <Text style={[s.backText, { color: theme.accent }]}>Back</Text>
        </TouchableOpacity>

        <View style={s.projectRow}>
          <View style={{ flex: 1 }}>
            <Text style={[s.heading, { color: theme.text }]}>Wiring Schematics</Text>
          </View>
          <TouchableOpacity
            style={[s.switchProjectBtn, { backgroundColor: `${theme.accent}15`, borderColor: `${theme.accent}30` }]}
            onPress={() => setProjectPickerVisible(true)} activeOpacity={0.7}
          >
            <MaterialCommunityIcons name="folder-swap-outline" size={14} color={theme.accent} />
            <Text style={[s.switchProjectText, { color: theme.accent }]} numberOfLines={1}>{currentProject.name}</Text>
          </TouchableOpacity>
        </View>
        <Text style={[s.subheading, { color: theme.textSecondary }]}>
          Auto-generated from your build spec. Includes schematic, shopping list, and install guidance.
        </Text>

        {/* Configuration */}
        <GlassCard style={s.optionsCard}>
          <Text style={[s.optLabel, { color: theme.accent }]}>CONFIGURATION</Text>

          {needs240v && (
            <View style={s.optRow}>
              <Text style={[s.optText, { color: theme.text }]}>Shore Power (240V)</Text>
              <Switch value={hasShore} onValueChange={setHasShore}
                trackColor={{ false: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)', true: `${theme.accent}55` }}
                thumbColor={hasShore ? theme.accent : isDark ? '#555' : '#ccc'} />
            </View>
          )}

          {/* MPPT Solar Charger Size */}
          {buildSpec && buildSpec.recommendedSolarW > 0 && (
            <>
              <Text style={[s.cableLabel, { color: theme.textSecondary, marginTop: 8 }]}>MPPT Solar Charger</Text>
              <View style={s.cableRow}>
                <TouchableOpacity
                  style={[s.cableChip, mpptOverride === null && { backgroundColor: `${theme.accent}30`, borderColor: theme.accent }]}
                  onPress={() => { setMpptOverride(null); setMpptCustom(''); }} activeOpacity={0.7}>
                  <Text style={[s.cableChipText, { color: mpptOverride === null ? theme.accent : theme.textSecondary }]}>Auto ({autoMppt}A)</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[s.cableChip, mpptOverride === oneUpMppt && { backgroundColor: `${theme.accent}30`, borderColor: theme.accent }]}
                  onPress={() => { setMpptOverride(oneUpMppt); setMpptCustom(''); }} activeOpacity={0.7}>
                  <Text style={[s.cableChipText, { color: mpptOverride === oneUpMppt ? theme.accent : theme.textSecondary }]}>{oneUpMppt}A</Text>
                </TouchableOpacity>
                <TextInput
                  style={[s.customSizeInput, {
                    color: theme.text,
                    backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
                    borderColor: mpptCustom ? theme.accent : (isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'),
                  }]}
                  placeholder="Custom"
                  placeholderTextColor={theme.textSecondary}
                  keyboardType="numeric"
                  value={mpptCustom}
                  onChangeText={v => {
                    setMpptCustom(v);
                    const n = parseInt(v);
                    if (!isNaN(n) && n > 0) setMpptOverride(n);
                  }}
                />
              </View>
            </>
          )}

          {/* DC-DC Charger Size */}
          {buildSpec && buildSpec.dcDcChargerSize > 0 && (
            <>
              <Text style={[s.cableLabel, { color: theme.textSecondary, marginTop: 8 }]}>DC-DC Charger</Text>
              <View style={s.cableRow}>
                <TouchableOpacity
                  style={[s.cableChip, dcDcOverride === null && { backgroundColor: `${theme.accent}30`, borderColor: theme.accent }]}
                  onPress={() => { setDcDcOverride(null); setDcDcCustom(''); }} activeOpacity={0.7}>
                  <Text style={[s.cableChipText, { color: dcDcOverride === null ? theme.accent : theme.textSecondary }]}>Auto ({autoDcDc}A)</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[s.cableChip, dcDcOverride === oneUpDcDc && { backgroundColor: `${theme.accent}30`, borderColor: theme.accent }]}
                  onPress={() => { setDcDcOverride(oneUpDcDc); setDcDcCustom(''); }} activeOpacity={0.7}>
                  <Text style={[s.cableChipText, { color: dcDcOverride === oneUpDcDc ? theme.accent : theme.textSecondary }]}>{oneUpDcDc}A</Text>
                </TouchableOpacity>
                <TextInput
                  style={[s.customSizeInput, {
                    color: theme.text,
                    backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
                    borderColor: dcDcCustom ? theme.accent : (isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'),
                  }]}
                  placeholder="Custom"
                  placeholderTextColor={theme.textSecondary}
                  keyboardType="numeric"
                  value={dcDcCustom}
                  onChangeText={v => {
                    setDcDcCustom(v);
                    const n = parseInt(v);
                    if (!isNaN(n) && n > 0) setDcDcOverride(n);
                  }}
                />
              </View>
            </>
          )}

          <Text style={[s.cableLabel, { color: theme.textSecondary, marginTop: 8 }]}>Cable Run Length</Text>
          <View style={s.cableRow}>
            {(['short', 'medium', 'long'] as CableRunLength[]).map(r => (
              <TouchableOpacity key={r}
                style={[s.cableChip, cableRun === r && { backgroundColor: `${theme.accent}30`, borderColor: theme.accent }]}
                onPress={() => setCableRun(r)} activeOpacity={0.7}>
                <Text style={[s.cableChipText, { color: cableRun === r ? theme.accent : theme.textSecondary }]}>
                  {r.charAt(0).toUpperCase() + r.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </GlassCard>

        {/* Validation messages */}
        {validationErrors.length > 0 && (
          <GlassCard style={{ ...s.optionsCard, borderWidth: 1, borderColor: 'rgba(231,76,60,0.4)' }}>
            <Text style={[s.optLabel, { color: '#E74C3C' }]}>CANNOT GENERATE SCHEMATIC</Text>
            {validationErrors.map((err, i) => (
              <Text key={i} style={{ fontSize: 13, color: '#E74C3C', lineHeight: 19, marginBottom: 4 }}>{err}</Text>
            ))}
          </GlassCard>
        )}
        {validationWarnings.length > 0 && (
          <GlassCard style={{ ...s.optionsCard, borderWidth: 1, borderColor: 'rgba(217,160,91,0.4)' }}>
            <Text style={[s.optLabel, { color: '#D9A05B' }]}>ADVISORY</Text>
            {validationWarnings.map((w, i) => (
              <Text key={i} style={{ fontSize: 13, color: '#D9A05B', lineHeight: 19, marginBottom: 4 }}>{w}</Text>
            ))}
          </GlassCard>
        )}

        {canGenerate && wiringSpec && wiringConfig && (
          <>
            {/* System summary */}
            <GlassCard style={s.archCard}>
              <Text style={[s.archLabel, { color: theme.accent }]}>SYSTEM</Text>
              <Text style={[s.archValue, { color: theme.text }]}>{wiringSpec.archetype.replace(/_/g, ' ')}</Text>
              <Text style={[s.archSub, { color: theme.textSecondary }]}>
                {wiringSpec.components.length} components · {wiringSpec.connections.length} connections
              </Text>
            </GlassCard>

            {/* Tab switcher */}
            <SegmentedControl
              tabs={[
                { key: 'schematic', label: 'Schematic' },
                { key: 'shopping', label: 'Shopping List' },
                { key: 'install', label: installUnlocked ? 'Install Guide' : 'Install Guide (Locked)' },
              ]}
              selected={tab}
              onSelect={setTab}
              theme={theme}
            />

            <View style={{ marginTop: 16 }}>
              {tab === 'schematic' && (
                <>
                  {/* Preview thumbnail */}
                  <GlassCard style={s.schematicPreviewCard} noPadding>
                    <View style={s.schematicPreviewInner}>
                      <View style={{ width: SCREEN_W - 48, height: (SCREEN_W - 48) * (842 / 1190), overflow: 'hidden', borderRadius: 8 }}>
                        {previewHTML ? (
                          <WebView
                            source={{ html: previewHTML }}
                            scrollEnabled={false}
                            scalesPageToFit
                            style={{ flex: 1, backgroundColor: '#F8F9FA' }}
                          />
                        ) : null}
                      </View>
                    </View>
                    {/* Overlay CTA */}
                    <View style={s.previewOverlay}>
                      <View style={s.previewOverlayContent}>
                        <MaterialCommunityIcons name="magnify-expand" size={28} color="#fff" />
                        <Text style={s.previewOverlayText}>Tap to open full schematic</Text>
                        <Text style={s.previewOverlaySub}>Pinch-to-zoom · Download PDF · Email</Text>
                      </View>
                    </View>
                    <TouchableOpacity style={StyleSheet.absoluteFillObject} onPress={openFullSchematic} activeOpacity={0.9} />
                  </GlassCard>

                  {/* Amendment counter */}
                  <View style={[s.amendmentRow, { borderColor: isLimitReached ? 'rgba(231,76,60,0.3)' : `${theme.accent}30` }]}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 12, fontWeight: '700', color: isLimitReached ? '#E74C3C' : theme.textSecondary }}>
                        {salesSuiteUnlocked
                          ? 'Sales Suite unlocked - unlimited schematic regenerations'
                          : isLimitReached
                            ? 'Amendment limit reached'
                            : `${remainingAmendments} amendment${remainingAmendments !== 1 ? 's' : ''} remaining`}
                      </Text>
                      <Text style={{ fontSize: 10, color: theme.textSecondary, marginTop: 2 }}>
                        {salesSuiteUnlocked
                          ? `${regenerations} used (unlimited)`
                          : isLimitReached
                            ? 'Email us for further updates'
                            : `${regenerations}/${MAX_REGENERATIONS} used`}
                      </Text>
                    </View>
                    {isLimitReached && (
                      <TouchableOpacity
                        style={{ backgroundColor: `${theme.accent}20`, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 }}
                        onPress={() => Linking.openURL('mailto:hello@craftedcamper.co?subject=Schematic%20Amendment%20Request%20-%20' + encodeURIComponent(currentProject.name))}
                        activeOpacity={0.7}
                      >
                        <Text style={{ fontSize: 12, fontWeight: '700', color: theme.accent }}>Email Us</Text>
                      </TouchableOpacity>
                    )}
                  </View>

                  {/* Open full schematic button */}
                  <TouchableOpacity
                    style={[s.fullBtn, { backgroundColor: isLimitReached ? `${theme.accent}40` : theme.accent }]}
                    onPress={isLimitReached ? handleGenerateSchematic : openFullSchematic}
                    activeOpacity={0.85}
                  >
                    <MaterialCommunityIcons name="fullscreen" size={18} color="#1A1A1A" />
                    <Text style={s.fullBtnText}>{isLimitReached ? 'Limit Reached — Email Us' : 'Open Full Schematic'}</Text>
                  </TouchableOpacity>

                  {/* Export shortcuts */}
                  <View style={s.exportRow}>
                    <TouchableOpacity style={[s.exportShortcut, { borderColor: `${theme.accent}40` }]} onPress={openFullSchematic} activeOpacity={0.8}>
                      <MaterialCommunityIcons name="file-pdf-box" size={16} color={theme.accent} />
                      <Text style={[s.exportShortcutText, { color: theme.accent }]}>Download PDF</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[s.exportShortcut, { borderColor: `${theme.accent}40` }]} onPress={openFullSchematic} activeOpacity={0.8}>
                      <MaterialCommunityIcons name="email-outline" size={16} color={theme.accent} />
                      <Text style={[s.exportShortcutText, { color: theme.accent }]}>Email Schematic</Text>
                    </TouchableOpacity>
                  </View>

                  {/* Shop shortcut */}
                  <TouchableOpacity
                    style={[s.shopBtn, { backgroundColor: `${theme.accent}18`, borderColor: `${theme.accent}40` }]}
                    onPress={() => router.push('/shop')}
                    activeOpacity={0.85}
                  >
                    <MaterialCommunityIcons name="cart-outline" size={16} color={theme.accent} />
                    <Text style={[s.shopBtnText, { color: theme.accent }]}>Shop These Components →</Text>
                  </TouchableOpacity>
                </>
              )}

              {tab === 'shopping' && (
                <ShoppingListView
                  items={wiringSpec.shoppingList}
                  theme={theme}
                  onAddBundleSelection={handleAddWiringBundleSelection}
                  cartCount={cartCount}
                />
              )}
              {tab === 'install' && (
                installUnlocked ? (
                  <InstallGuideView steps={wiringSpec.installationSteps} theme={theme} />
                ) : (
                  <GlassCard style={s.optionsCard}>
                    <Text style={[s.optLabel, { color: theme.accent }]}>PREMIUM INSTALL GUIDE</Text>
                    <AuthorityBadge text="Bespoke steps for your exact configuration" />
                    <View style={{ marginTop: 8 }}>
                      <CraftedConfidenceBadge />
                    </View>
                    <Text style={{ color: theme.textSecondary, fontSize: 13, lineHeight: 19, marginTop: 10, marginBottom: 12 }}>
                      Unlock your build-specific schematic and 12-step install flow using the private code emailed after bespoke bundle purchase.
                      Your loom pack is pre-cut, pre-crimped, and heat-shrunk to your selected build configuration.
                    </Text>
                    <TouchableOpacity
                      style={[s.shopBtn, { backgroundColor: `${theme.accent}18`, borderColor: `${theme.accent}40`, marginTop: 0 }]}
                      onPress={() => router.push('/club')}
                      activeOpacity={0.85}
                    >
                      <MaterialCommunityIcons name="crown-outline" size={16} color={theme.accent} />
                      <Text style={[s.shopBtnText, { color: theme.accent }]}>Unlock CamperPlan Club →</Text>
                    </TouchableOpacity>
                  </GlassCard>
                )
              )}
            </View>

            {wiringSpec.safetyWarnings.length > 0 && (
              <View style={{ marginTop: 16 }}>
                {wiringSpec.safetyWarnings.filter(w => w.severity === 'danger').slice(0, 2).map(w => (
                  <View key={w.id} style={[s.dangerCard, { backgroundColor: 'rgba(231,76,60,0.08)', borderColor: 'rgba(231,76,60,0.25)' }]}>
                    <Text style={s.dangerText}>{w.text}</Text>
                  </View>
                ))}
              </View>
            )}
          </>
        )}

        <ElectricalDisclaimer />

        <View style={{ height: 40 }} />
      </ScrollView>
      <ProjectPickerModal visible={projectPickerVisible} onClose={() => setProjectPickerVisible(false)} theme={theme} />
    </View>
  );
}

const seg = StyleSheet.create({
  row: { flexDirection: 'row', borderRadius: 10, padding: 3 },
  tab: { flex: 1, paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
  label: { fontSize: 12, fontWeight: '700' },
});

const s = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flex: 1 },
  content: { padding: 24 },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 24 },
  backText: { fontSize: 15, fontWeight: '600' },
  projectRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  switchProjectBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 7, borderRadius: 8, borderWidth: 1, maxWidth: 160 },
  switchProjectText: { fontSize: 11, fontWeight: '700', flexShrink: 1 },
  heading: { fontSize: 26, fontWeight: '800' },
  subheading: { fontSize: 14, lineHeight: 20, marginBottom: 24 },

  optionsCard: { marginBottom: 16 },
  optLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 2, marginBottom: 12 },
  optRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  optText: { fontSize: 15, fontWeight: '600' },
  cableLabel: { fontSize: 11, fontWeight: '600', marginBottom: 8, marginTop: 4 },
  cableRow: { flexDirection: 'row', gap: 8 },
  cableChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  cableChipText: { fontSize: 13, fontWeight: '600' },
  customSizeInput: { flex: 1, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8, fontSize: 13, fontWeight: '600', textAlign: 'center', borderWidth: 1 },

  archCard: { marginBottom: 16 },
  archLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 2, marginBottom: 4 },
  archValue: { fontSize: 18, fontWeight: '800', marginBottom: 2 },
  archSub: { fontSize: 12 },

  schematicPreviewCard: { marginBottom: 12, overflow: 'hidden', position: 'relative' },
  schematicPreviewInner: { overflow: 'hidden' },
  previewOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewOverlayContent: { alignItems: 'center', gap: 8 },
  previewOverlayText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  previewOverlaySub: { color: 'rgba(255,255,255,0.6)', fontSize: 11 },

  fullBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 15,
    borderRadius: 12,
    marginBottom: 12,
  },
  fullBtnText: { color: '#1A1A1A', fontSize: 15, fontWeight: '800' },

  exportRow: { flexDirection: 'row', gap: 10, marginBottom: 8 },
  exportShortcut: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  exportShortcutText: { fontSize: 13, fontWeight: '600' },
  amendmentRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10, paddingHorizontal: 14, borderRadius: 10, borderWidth: 1, marginBottom: 10 },
  shopBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 13, borderRadius: 10, borderWidth: 1, marginTop: 2 },
  shopBtnText: { fontSize: 14, fontWeight: '700' },

  catLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 2, marginBottom: 10 },
  listCard: { marginBottom: 6 },
  listRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  itemName: { fontSize: 13, fontWeight: '700', marginBottom: 2 },
  itemDesc: { fontSize: 11, lineHeight: 15 },
  bundleHint: { fontSize: 11, lineHeight: 16, marginTop: 6, fontStyle: 'italic' },
  listRight: { alignItems: 'flex-end' },
  itemQty: { fontSize: 11, fontWeight: '600' },
  itemPrice: { fontSize: 13, fontWeight: '800', marginTop: 2 },
  totalCard: { borderWidth: 1, marginTop: 8, marginBottom: 16 },
  totalRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  totalLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 2 },
  totalValue: { fontSize: 28, fontWeight: '800' },
  bundleAddBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 10, paddingVertical: 13, marginBottom: 12 },
  bundleAddBtnText: { color: '#1A1A1A', fontSize: 13, fontWeight: '800' },

  stepCard: { marginBottom: 8 },
  stepHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  stepBadge: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  stepNum: { fontSize: 14, fontWeight: '800' },
  stepTitle: { flex: 1, fontSize: 14, fontWeight: '700' },
  stepBody: { marginTop: 12 },
  instrRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  instrBullet: { fontSize: 14, fontWeight: '800', marginTop: -1 },
  instrText: { flex: 1, fontSize: 13, lineHeight: 19 },
  specBlock: { padding: 12, borderRadius: 8, marginTop: 8, marginBottom: 8 },
  specBlockLabel: { fontSize: 9, fontWeight: '700', letterSpacing: 1.5, marginBottom: 6 },
  specBlockText: { fontSize: 12, lineHeight: 17, marginBottom: 2 },
  warnBlock: { padding: 12, borderRadius: 8, borderWidth: 1, marginTop: 8 },
  warnText: { fontSize: 12, lineHeight: 17, fontWeight: '600' },
  dangerCard: { padding: 14, borderRadius: 10, borderWidth: 1, marginBottom: 8 },
  dangerText: { fontSize: 12, lineHeight: 17, fontWeight: '600', color: '#E74C3C' },
  emptyWrap: { flex: 1, padding: 24 },
  emptyCenter: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingBottom: 80, gap: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '700' },
  emptyDesc: { fontSize: 13, textAlign: 'center', maxWidth: 280 },
});
