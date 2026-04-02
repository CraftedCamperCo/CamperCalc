import GlassCard from '@/components/GlassCard';
import LottieOrFallback from '@/components/LottieOrFallback';
import TopographicBackground from '@/components/TopographicBackground';
import { VanSelection } from '@/context/CamperContext';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { Project, useProjects } from '@/context/ProjectContext';
import { calculate } from '@/utils/calculator';
import { lookupUkRegistration } from '@/utils/dvla';
import { tapHaptic } from '@/utils/haptics';
import { Manufacturer, VanModel, VanVariant, VAN_DATABASE, variantLabel, matchModelFromDvla } from '@/utils/vanDatabase';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Image,
  LayoutAnimation,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  UIManager,
  View,
} from 'react-native';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

function ProjectCard({ project, onSelect, onDelete, onAddPhoto, onRemovePhoto, theme }: {
  project: Project; onSelect: () => void; onDelete: () => void; onAddPhoto: () => void; onRemovePhoto: (uri: string) => void; theme: any;
}) {
  const isDark = theme.blurTint === 'dark';
  const state = project.camper_state;
  const hasState = state && state.usage;
  const spec = hasState ? calculate(state as any) : null;
  const updated = new Date(project.updated_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  const van = state?.van;
  const ownedCount = project.purchased_items?.length ?? 0;
  const photos = project.photos ?? [];

  return (
    <TouchableOpacity onPress={onSelect} activeOpacity={0.85}>
      <GlassCard style={styles.projectCard}>
        <View style={styles.cardHeader}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.projectName, { color: theme.text }]}>{project.name}</Text>
            {van && (
              <Text style={[styles.projectVan, { color: theme.accent }]}>
                {van.manufacturerName} {van.model} · {van.wheelbase}
              </Text>
            )}
            <Text style={[styles.projectDate, { color: theme.textSecondary }]}>Last updated {updated}</Text>
            {ownedCount > 0 && (
              <Text style={[styles.projectVan, { color: theme.success }]}>
                {ownedCount} purchased item{ownedCount === 1 ? '' : 's'} linked
              </Text>
            )}
          </View>
          <TouchableOpacity
            onPress={onDelete}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            style={styles.deleteBtn}
          >
            <FontAwesome name="trash-o" size={16} color={theme.danger} />
          </TouchableOpacity>
        </View>
        {spec && (
          <View style={[styles.specRow, { borderTopColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }]}>
            <View style={styles.specItem}>
              <Text style={[styles.specNum, { color: theme.accent }]}>{spec.recommendedBankAh}</Text>
              <Text style={[styles.specLabel, { color: theme.textSecondary }]}>Ah</Text>
            </View>
            <View style={styles.specItem}>
              <Text style={[styles.specNum, { color: theme.text }]}>{state.party}</Text>
              <Text style={[styles.specLabel, { color: theme.textSecondary }]}>Crew</Text>
            </View>
            <View style={styles.specItem}>
              <Text style={[styles.specNum, { color: theme.text }]}>{state.daysOffGrid || '-'}</Text>
              <Text style={[styles.specLabel, { color: theme.textSecondary }]}>Days</Text>
            </View>
          </View>
        )}
        {!hasState && (
          <Text style={[styles.emptyHint, { color: theme.textSecondary }]}>No data yet — tap to start building</Text>
        )}
        <View style={[styles.photoRow, { borderTopColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }]}>
          <View style={{ flexDirection: 'row', gap: 8, flex: 1 }}>
            {photos.slice(0, 3).map((uri) => (
              <TouchableOpacity key={uri} onPress={() => onRemovePhoto(uri)} activeOpacity={0.8}>
                <Image source={{ uri }} style={styles.photoThumb} />
              </TouchableOpacity>
            ))}
            {photos.length === 0 && (
              <Text style={[styles.emptyHint, { color: theme.textSecondary, marginTop: 0 }]}>No project photos yet</Text>
            )}
          </View>
          <TouchableOpacity style={[styles.photoBtn, { borderColor: `${theme.accent}40` }]} onPress={onAddPhoto} activeOpacity={0.8}>
            <FontAwesome name="camera" size={12} color={theme.accent} />
            <Text style={[styles.photoBtnText, { color: theme.accent }]}>Add Photo</Text>
          </TouchableOpacity>
        </View>
      </GlassCard>
    </TouchableOpacity>
  );
}

function PickerChip({ label, selected, onPress, theme }: {
  label: string; selected: boolean; onPress: () => void; theme: any;
}) {
  const isDark = theme.blurTint === 'dark';
  return (
    <TouchableOpacity
      style={[
        styles.chip,
        selected
          ? { backgroundColor: `${theme.accent}22`, borderColor: theme.accent }
          : { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)', borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)' },
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text style={[styles.chipText, { color: selected ? theme.accent : theme.text }]}>{label}</Text>
    </TouchableOpacity>
  );
}

export default function ProjectListScreen() {
  const theme = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{ new?: string }>();
  const { signOut } = useAuth();
  const { projects, loading, createProject, selectProject, deleteProject, updateProjectPhotos } = useProjects();
  const isDark = theme.blurTint === 'dark';

  const [showForm, setShowForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [registration, setRegistration] = useState('');
  const [lookingUpReg, setLookingUpReg] = useState(false);
  const [regLookupStatus, setRegLookupStatus] = useState<'idle' | 'found' | 'not_found' | 'not_in_db'>('idle');
  const [creating, setCreating] = useState(false);
  const [formError, setFormError] = useState('');

  // Van picker state
  const [selectedMfr, setSelectedMfr] = useState<Manufacturer | null>(null);
  const [selectedModel, setSelectedModel] = useState<VanModel | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<VanVariant | null>(null);
  const handledDeepLinkNew = useRef(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  React.useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
  }, []);

  React.useEffect(() => {
    const wantsNew = params.new === '1' || params.new === 'true';
    if (!wantsNew || handledDeepLinkNew.current) return;
    handledDeepLinkNew.current = true;
    setShowForm(true);
  }, [params.new]);

  const resetForm = () => {
    setNewName('');
    setRegistration('');
    setSelectedMfr(null);
    setSelectedModel(null);
    setSelectedVariant(null);
    setFormError('');
    setRegLookupStatus('idle');
  };

  const handleCreate = async () => {
    const name = newName.trim();
    if (!name) { setFormError('Please enter a project name'); return; }
    if (!selectedMfr || !selectedModel || !selectedVariant) {
      setFormError('Please select your van');
      return;
    }
    setFormError('');
    setCreating(true);
    tapHaptic();

    const van: VanSelection = {
      manufacturerId: selectedMfr.id,
      manufacturerName: selectedMfr.name,
      model: selectedModel.name,
      wheelbase: selectedVariant.wheelbase,
      roofHeight: selectedVariant.roofHeight,
    };

    const result = await createProject(name, { van });
    setCreating(false);
    if (!result) {
      setFormError('Failed to create project. Please check your connection and try again.');
      return;
    }
    resetForm();
    setShowForm(false);
    router.push('/(tabs)');
  };

  const handleDelete = (project: Project) => {
    Alert.alert(
      'Delete Project',
      `Are you sure you want to delete "${project.name}"? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => deleteProject(project.id) },
      ],
    );
  };

  const handleAddProjectPhoto = async (project: Project) => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission needed', 'Allow photo library access to attach project photos.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: false,
      quality: 0.7,
    });
    if (result.canceled || !result.assets?.[0]?.uri) return;
    const current = project.photos ?? [];
    const next = Array.from(new Set([...current, result.assets[0].uri]));
    await updateProjectPhotos(project.id, next);
  };

  const handleRemoveProjectPhoto = async (project: Project, uri: string) => {
    const next = (project.photos ?? []).filter((p) => p !== uri);
    await updateProjectPhotos(project.id, next);
  };

  const toggleForm = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    if (showForm) resetForm();
    setShowForm(s => !s);
  };

  const handleRegLookup = async () => {
    if (!registration.trim()) {
      setFormError('Please enter a registration number');
      setRegLookupStatus('idle');
      return;
    }
    setLookingUpReg(true);
    setFormError('');
    setRegLookupStatus('idle');
    try {
      const vehicle = await lookupUkRegistration(registration);
      if (!vehicle?.make) {
        setRegLookupStatus('not_found');
        setFormError('Vehicle not in database. Please enter a valid UK registration or choose your van manually.');
        return;
      }
      const make = vehicle.make.toLowerCase();
      const manufacturer = VAN_DATABASE.find((m) => m.name.toLowerCase().includes(make) || make.includes(m.name.toLowerCase()));
      if (!manufacturer) {
        setRegLookupStatus('not_in_db');
        setFormError('Vehicle not in database. Registration found but we don\'t have that van in our list — please pick manually.');
        return;
      }
      const matchedModel = matchModelFromDvla(vehicle.model, manufacturer.models);
      if (matchedModel) {
        setSelectedMfr(manufacturer);
        setSelectedModel(matchedModel);
        // Only auto-select a variant when there is exactly one possible option.
        // DVLA does not reliably return wheelbase/roof data for our selector.
        setSelectedVariant(matchedModel.variants.length === 1 ? matchedModel.variants[0] : null);
        setRegLookupStatus('found');
      }
    } catch (e: any) {
      setRegLookupStatus('not_found');
      const message = String(e?.message ?? '');
      if (
        message.includes('DVLA API key is missing') ||
        message.includes('403 Forbidden') ||
        message.includes('DVLA rejected the API key')
      ) {
        setFormError('DVLA lookup is unavailable right now. Please select your van manually below to continue.');
      } else {
        setFormError(message || 'Registration lookup failed. You can still choose your van manually below.');
      }
    } finally {
      setLookingUpReg(false);
    }
  };

  const pickMfr = (m: Manufacturer) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setSelectedMfr(m);
    setSelectedModel(null);
    setSelectedVariant(null);
    setFormError('');
  };

  const pickModel = (m: VanModel) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setSelectedModel(m);
    setSelectedVariant(null);
    if (m.variants.length === 1) setSelectedVariant(m.variants[0]);
    setFormError('');
  };

  const pickVariant = (v: VanVariant) => {
    setSelectedVariant(v);
    setFormError('');
  };

  const placeholderColor = isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.35)';
  const inputBg = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';
  const inputBorder = isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.12)';

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <TopographicBackground />
      <Animated.View style={[styles.innerContainer, { opacity: fadeAnim }]}>
        <View style={styles.header}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/')} activeOpacity={0.7}>
              <FontAwesome name="chevron-left" size={16} color={theme.accent} />
            </TouchableOpacity>
            <Image
              source={require('../assets/images/crafted-logo.png')}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>
          <TouchableOpacity onPress={signOut} style={styles.signOutBtn} activeOpacity={0.7}>
            <FontAwesome name="sign-out" size={16} color={theme.textSecondary} />
            <Text style={[styles.signOutText, { color: theme.textSecondary }]}>Sign Out</Text>
          </TouchableOpacity>
        </View>

        <Text style={[styles.heading, { color: theme.text }]}>Your Projects</Text>
        <Text style={[styles.subheading, { color: theme.textSecondary }]}>
          {projects.length === 0
            ? 'Create your first project to start planning your build.'
            : 'Select a project to continue, or create a new one.'}
        </Text>

        <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
          {loading && (
            <View style={styles.loadingWrap}>
              <LottieOrFallback size={56} />
            </View>
          )}

          {!loading && projects.map(project => (
            <ProjectCard
              key={project.id}
              project={project}
              onSelect={() => { selectProject(project); router.push('/(tabs)'); }}
              onDelete={() => handleDelete(project)}
              onAddPhoto={() => handleAddProjectPhoto(project)}
              onRemovePhoto={(uri) => handleRemoveProjectPhoto(project, uri)}
              theme={theme}
            />
          ))}

          {showForm ? (
            <GlassCard style={styles.createCard}>
              <Text style={[styles.createLabel, { color: theme.accent }]}>NEW PROJECT</Text>

              {/* Project Name */}
              <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>PROJECT NAME</Text>
              <TextInput
                style={[styles.nameInput, { color: theme.text, backgroundColor: inputBg, borderColor: formError && !newName.trim() ? theme.danger : inputBorder }]}
                placeholder="e.g. My Sprinter LWB Build"
                placeholderTextColor={placeholderColor}
                value={newName}
                onChangeText={(v) => { setNewName(v); setFormError(''); }}
                autoFocus
                returnKeyType="next"
              />

              <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>UK REGISTRATION (OPTIONAL)</Text>
              <View style={styles.regRow}>
                <TextInput
                  style={[styles.nameInput, styles.regInput, { color: theme.text, backgroundColor: inputBg, borderColor: inputBorder }]}
                  placeholder="e.g. AB12 CDE"
                  placeholderTextColor={placeholderColor}
                  value={registration}
                  onChangeText={(v) => { setRegistration(v); setRegLookupStatus('idle'); setFormError(''); }}
                  autoCapitalize="characters"
                />
                <TouchableOpacity
                  style={[styles.regLookupBtn, { backgroundColor: theme.accent, opacity: lookingUpReg ? 0.7 : 1 }]}
                  onPress={handleRegLookup}
                  activeOpacity={0.8}
                  disabled={lookingUpReg}
                >
                  {lookingUpReg ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.regLookupText}>Lookup</Text>}
                </TouchableOpacity>
              </View>
              {regLookupStatus === 'found' && (
                <View style={[styles.regStatusRow, { backgroundColor: `${theme.success}18`, borderColor: `${theme.success}40` }]}>
                  <FontAwesome name="check-circle" size={14} color={theme.success} />
                  <Text style={[styles.regStatusText, { color: theme.success }]}>
                    {selectedVariant ? 'Reg found' : 'Reg found - select wheelbase / roof'}
                  </Text>
                </View>
              )}
              {(regLookupStatus === 'not_found' || regLookupStatus === 'not_in_db') && (
                <View style={[styles.regStatusRow, { backgroundColor: `${theme.danger}12`, borderColor: `${theme.danger}30` }]}>
                  <FontAwesome name="exclamation-circle" size={14} color={theme.danger} />
                  <Text style={[styles.regStatusText, { color: theme.danger }]}>Vehicle not in database</Text>
                </View>
              )}

              {/* Manufacturer Picker */}
              <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>MANUFACTURER</Text>
              <View style={styles.visualMfrGrid}>
                {VAN_DATABASE.map(mfr => (
                  <TouchableOpacity
                    key={mfr.id}
                    onPress={() => {
                      tapHaptic();
                      pickMfr(mfr);
                    }}
                    style={[
                      styles.visualMfrCard,
                      selectedMfr?.id === mfr.id
                        ? { borderColor: theme.accent, backgroundColor: `${theme.accent}18` }
                        : { borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)', backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)' },
                    ]}
                    activeOpacity={0.8}
                  >
                    <FontAwesome name="truck" size={16} color={selectedMfr?.id === mfr.id ? theme.accent : theme.textSecondary} />
                    <Text style={[styles.visualMfrText, { color: selectedMfr?.id === mfr.id ? theme.accent : theme.text }]}>{mfr.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Model Picker */}
              {selectedMfr && (
                <>
                  <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>MODEL</Text>
                  <View style={styles.chipGrid}>
                    {selectedMfr.models.map(m => (
                      <PickerChip
                        key={m.name}
                        label={m.name}
                        selected={selectedModel?.name === m.name}
                        onPress={() => pickModel(m)}
                        theme={theme}
                      />
                    ))}
                  </View>
                </>
              )}

              {/* Variant Picker */}
              {selectedModel && selectedModel.variants.length > 1 && (
                <>
                  <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>WHEELBASE / ROOF</Text>
                  <View style={styles.chipGrid}>
                    {selectedModel.variants.map((v, i) => (
                      <PickerChip
                        key={`${v.wheelbase}-${v.roofHeight || i}`}
                        label={variantLabel(v)}
                        selected={selectedVariant === v}
                        onPress={() => pickVariant(v)}
                        theme={theme}
                      />
                    ))}
                  </View>
                </>
              )}

              {/* Selected Van Summary */}
              {selectedVariant && (
                <View style={[styles.vanSummary, { backgroundColor: `${theme.accent}10`, borderColor: `${theme.accent}30` }]}>
                  <FontAwesome name="truck" size={14} color={theme.accent} />
                  <Text style={[styles.vanSummaryText, { color: theme.text }]}>
                    {selectedMfr!.name} {selectedModel!.name} — {variantLabel(selectedVariant)}
                  </Text>
                </View>
              )}

              {formError ? <Text style={[styles.formError, { color: theme.danger }]}>{formError}</Text> : null}

              <View style={styles.createBtnRow}>
                <TouchableOpacity
                  style={[styles.createBtn, { backgroundColor: theme.accent, opacity: creating ? 0.7 : 1 }]}
                  onPress={handleCreate}
                  disabled={creating}
                  activeOpacity={0.85}
                >
                  {creating ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.createBtnText}>Craft My Camper</Text>}
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.cancelBtn, { borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)' }]}
                  onPress={toggleForm}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.cancelBtnText, { color: theme.textSecondary }]}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </GlassCard>
          ) : (
            <TouchableOpacity style={[styles.addBtn, { borderColor: `${theme.accent}44` }]} onPress={toggleForm} activeOpacity={0.8}>
              <FontAwesome name="plus" size={14} color={theme.accent} />
              <Text style={[styles.addBtnText, { color: theme.accent }]}>New Project</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  innerContainer: { flex: 1, padding: 24, paddingTop: 70 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 },
  logo: { width: 140, height: 50 },
  signOutBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  signOutText: { fontSize: 13, fontWeight: '500' },
  heading: { fontSize: 28, fontWeight: '800', marginBottom: 6 },
  subheading: { fontSize: 14, lineHeight: 20, marginBottom: 24 },
  scroll: { flex: 1 },
  loadingWrap: { paddingVertical: 40, alignItems: 'center' },
  projectCard: { marginBottom: 14 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  projectName: { fontSize: 18, fontWeight: '700', marginBottom: 2 },
  projectVan: { fontSize: 12, fontWeight: '600', marginBottom: 4 },
  projectDate: { fontSize: 12 },
  deleteBtn: { padding: 6 },
  specRow: { flexDirection: 'row', marginTop: 14, paddingTop: 14, borderTopWidth: 1, gap: 28 },
  specItem: { alignItems: 'center' },
  specNum: { fontSize: 18, fontWeight: '800' },
  specLabel: { fontSize: 10, fontWeight: '600', letterSpacing: 0.5, marginTop: 2, textTransform: 'uppercase' },
  emptyHint: { fontSize: 12, marginTop: 10, fontStyle: 'italic' },
  photoRow: { marginTop: 14, paddingTop: 12, borderTopWidth: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
  photoThumb: { width: 42, height: 42, borderRadius: 8 },
  photoBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8 },
  photoBtnText: { fontSize: 11, fontWeight: '700' },
  createCard: { marginBottom: 14 },
  createLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 2, marginBottom: 16 },
  fieldLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 1.5, marginBottom: 8, marginTop: 4 },
  nameInput: { borderRadius: 10, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 13, fontSize: 15, marginBottom: 14 },
  chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 },
  regRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  regInput: { flex: 1, marginBottom: 0 },
  regLookupBtn: { borderRadius: 10, paddingHorizontal: 14, alignItems: 'center', justifyContent: 'center' },
  regStatusRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 10, borderWidth: 1, marginBottom: 14 },
  regStatusText: { fontSize: 13, fontWeight: '700' },
  regLookupText: { color: '#fff', fontWeight: '800', fontSize: 13 },
  visualMfrGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 },
  visualMfrCard: { width: '48%', borderWidth: 1, borderRadius: 10, paddingVertical: 10, paddingHorizontal: 10, flexDirection: 'row', alignItems: 'center', gap: 7 },
  visualMfrText: { fontSize: 12, fontWeight: '700' },
  chip: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 10, borderWidth: 1 },
  chipText: { fontSize: 13, fontWeight: '600' },
  vanSummary: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingVertical: 12, borderRadius: 10, borderWidth: 1, marginBottom: 14 },
  vanSummaryText: { fontSize: 14, fontWeight: '700', flex: 1 },
  formError: { fontSize: 13, fontWeight: '600', marginBottom: 10, marginLeft: 4 },
  createBtnRow: { flexDirection: 'row', gap: 8 },
  createBtn: { flex: 1, paddingVertical: 13, borderRadius: 10, alignItems: 'center' },
  createBtnText: { color: '#fff', fontSize: 15, fontWeight: '800' },
  cancelBtn: { flex: 1, paddingVertical: 13, borderRadius: 10, alignItems: 'center', borderWidth: 1 },
  cancelBtnText: { fontSize: 15, fontWeight: '600' },
  addBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 16, borderRadius: 12, borderWidth: 1, borderStyle: 'dashed', marginTop: 4 },
  addBtnText: { fontSize: 15, fontWeight: '700' },
});
