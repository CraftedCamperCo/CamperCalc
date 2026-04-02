import CollapsibleSection from '@/components/CollapsibleSection';
import { FEATURE_FLAGS } from '@/constants/featureFlags';
import ElectricalDisclaimer from '@/components/ElectricalDisclaimer';
import GlassCard from '@/components/GlassCard';
import { useAuth } from '@/context/AuthContext';
import { useCamper } from '@/context/CamperContext';
import { useCart } from '@/context/CartContext';
import { useProjects } from '@/context/ProjectContext';
import { useTheme } from '@/context/ThemeContext';
import { VICTRON_CATALOG_BY_ID } from '@/data/victronCatalog';
import { useScreenSlide } from '@/hooks/useScreenSlide';
import { trackRecommendationsViewed } from '@/utils/analytics';
import { calculate } from '@/utils/calculator';
import { generateBuildHTML } from '@/utils/exportBuilder';
import { tapHaptic } from '@/utils/haptics';
import { calculateInsulation } from '@/utils/insulationCalculator';
import { calculateValueSaved } from '@/utils/valueSaved';
import { getVariant, variantLabel } from '@/utils/vanDatabase';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import ViewShot from 'react-native-view-shot';
import { Alert, Animated, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const WIRING_KIT_ID = 'wiring_kit_bespoke';

function SpecLine({ label, value, tone = 'normal' }: { label: string; value: string; tone?: 'normal' | 'accent' }) {
  const theme = useTheme();
  return (
    <View style={styles.specLine}>
      <Text style={[styles.specLineLabel, { color: theme.textSecondary }]}>{label}</Text>
      <Text style={[styles.specLineValue, { color: tone === 'accent' ? theme.accent : theme.text }]}>{value}</Text>
    </View>
  );
}

function getRecommendedElectricalIds(
  buildSpec: {
    recommendedBankAh: number;
    recommendedSolarW: number;
    inverterSize: number;
    dcDcChargerSize: number;
  },
) {
  const { recommendedBankAh, recommendedSolarW, inverterSize, dcDcChargerSize } = buildSpec;
  const ids: string[] = [];
  // Launch mode: single bespoke premium recommendation path.
  if (recommendedBankAh <= 105) ids.push('fogstar_105');
  else if (recommendedBankAh <= 230) ids.push('fogstar_230');
  else if (recommendedBankAh <= 280) ids.push('fogstar_280');
  else if (recommendedBankAh <= 300) ids.push('fogstar_300');
  else if (recommendedBankAh <= 460) ids.push('fogstar_460');
  else ids.push('fogstar_608');

  if (inverterSize > 0) {
    if (inverterSize <= 800) ids.push('mp_800');
    else if (inverterSize <= 1600) ids.push('mp_1600');
    else if (inverterSize <= 2000) ids.push('mp_2000');
    else ids.push('mp_3000');
  }

  if (recommendedSolarW > 0) {
    if (recommendedSolarW <= 200) ids.push('mppt_75_15');
    else if (recommendedSolarW <= 300) ids.push('mppt_100_20');
    else if (recommendedSolarW <= 440) ids.push('mppt_100_30');
    else ids.push('mppt_150_35');
  }

  if (dcDcChargerSize > 0) {
    if (dcDcChargerSize <= 18) ids.push('orion_18');
    else if (dcDcChargerSize <= 30) ids.push('orion_30');
    else ids.push('orion_50');
  }

  ids.push('smartshunt_500', 'bp_65');
  ids.push('lynx_dist');

  return ids;
}

export default function YourBuildScreen() {
  const { state } = useCamper();
  const { user, updateProfile } = useAuth();
  const theme = useTheme();
  const router = useRouter();
  const { style: slideStyle, panHandlers } = useScreenSlide(5);
  const { addProductsByIds, addInsulationBundle, count: cartCount, items } = useCart();
  const { currentProject, saveProjectState } = useProjects();

  const result = useMemo(() => calculate(state), [state]);
  const valueSaved = useMemo(
    () =>
      calculateValueSaved({
        recommendedBankAh: result.recommendedBankAh,
        recommendedSolarW: result.recommendedSolarW,
        dailyAh: result.dailyAh,
        inverterSize: result.inverterSize,
        dcDcChargerSize: result.dcDcChargerSize,
      }),
    [result],
  );
  const insulationResult = useMemo(() => {
    if (!state.insulationEnabled || !state.van) return null;
    const variant = getVariant(state.van.manufacturerId, state.van.model, state.van.wheelbase, state.van.roofHeight);
    if (!variant) return null;
    const vanLabel = `${state.van.manufacturerName} ${state.van.model} (${variantLabel(variant)})`;
    return calculateInsulation(variant, state.climates, vanLabel, {
      insulationSeason: state.insulationSeason,
      useVapourBarrier: false,
      windowPlan: state.windowPlan,
    });
  }, [state]);

  const buildSpec = useMemo(() => ({
    recommendedBankAh: result.recommendedBankAh,
    recommendedSolarW: result.recommendedSolarW,
    inverterSize: result.inverterSize,
    dcDcChargerSize: result.dcDcChargerSize,
  }), [result]);

  const recommendedIds = useMemo(() => getRecommendedElectricalIds(buildSpec), [buildSpec]);
  const recommendedProducts = useMemo(
    () => recommendedIds.map((id) => VICTRON_CATALOG_BY_ID[id]).filter(Boolean),
    [recommendedIds],
  );
  const recommendedPrice = recommendedProducts.reduce((sum, p: any) => sum + (p?.estimatedPrice ?? 0), 0);
  const wiringKitProduct = VICTRON_CATALOG_BY_ID[WIRING_KIT_ID];
  const wiringKitPrice = wiringKitProduct?.estimatedPrice ?? 0;
  const bundlePrice = recommendedPrice + wiringKitPrice;

  const [exporting, setExporting] = useState(false);
  const [showProductPreview, setShowProductPreview] = useState(false);
  const [showHowBubble, setShowHowBubble] = useState(false);
  const [selectedElectricalIds, setSelectedElectricalIds] = useState<string[]>([]);
  const [savingProject, setSavingProject] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [shareCode] = useState(() => (user?.id ? user.id.slice(0, 8).toUpperCase() : 'CAMPERPLAN'));
  const shareShotRef = useRef<ViewShot | null>(null);

  const heroAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(heroAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
    trackRecommendationsViewed(result.recommendedBankAh, result.recommendedSolarW, bundlePrice);
  }, []);

  useEffect(() => {
    setSelectedElectricalIds(recommendedIds);
  }, [recommendedIds]);

  const projectPhoto = currentProject?.photos?.[0];

  async function handleExportPDF(method: 'share' | 'email') {
    setExporting(true);
    try {
      const Print = await import('expo-print');
      const Sharing = await import('expo-sharing');
      const sections = {
        camperProfile: true,
        insulation: true,
        electrical: true,
        water: FEATURE_FLAGS.WATER_COMPONENTS_ENABLED,
        buildSummary: true,
      };
      const projectName = currentProject?.name ?? 'My Build';
      const html = generateBuildHTML(state, sections, projectName);
      const { uri } = await Print.printToFileAsync({ html, base64: false });
      const subject = `CamperPlan by Crafted — ${projectName} Build Summary`;

      if (method === 'share') {
        const canShare = await Sharing.isAvailableAsync();
        if (canShare) {
          await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: `${projectName} Build Summary` });
        } else {
          Alert.alert('PDF ready', `Saved to: ${uri}`);
        }
      } else {
        const MailComposer = await import('expo-mail-composer');
        const canEmail = await MailComposer.isAvailableAsync();
        if (canEmail) {
          const sendEmail = async (name: string) => {
            const greeting = name ? `Hi ${name},` : 'Hi,';
            await MailComposer.composeAsync({
              subject,
              body: `${greeting}\n\nAttached is the build specification summary for "${projectName}", generated by CamperPlan by Crafted.\n\nFor a bespoke wiring schematic, consultation, or full van build, please visit craftedcamper.co or email dan@craftedcamper.co.\n\nDan Andrews\nCrafted Camper Co (Yorkshire) LTD\ncraftedcamper.co`,
              attachments: [uri],
            });
          };
          const existing = user?.user_metadata?.first_name || '';
          if (existing) {
            await sendEmail(existing);
          } else {
            Alert.prompt(
              'Your name',
              'Enter your first name so we can personalise your email.',
              [
                { text: 'Skip', style: 'cancel', onPress: () => sendEmail('') },
                {
                  text: 'Save',
                  onPress: (name?: string) => {
                    if (name?.trim()) updateProfile(name.trim()).catch(() => {});
                    sendEmail(name?.trim() || '');
                  },
                },
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

  const handleAddElectrical = () => {
    if (selectedElectricalIds.length === 0) {
      Alert.alert('Select at least one item', 'Choose one or more recommended components before adding to cart.');
      return;
    }
    tapHaptic();
    addProductsByIds([...selectedElectricalIds, WIRING_KIT_ID]);
  };

  const selectedElectricalSet = useMemo(() => new Set(selectedElectricalIds), [selectedElectricalIds]);
  const selectedRecommendedProducts = useMemo(
    () => recommendedProducts.filter((product: any) => selectedElectricalSet.has(product.id)),
    [recommendedProducts, selectedElectricalSet],
  );
  const selectedRecommendedPrice = selectedRecommendedProducts.reduce((sum: number, p: any) => sum + (p?.estimatedPrice ?? 0), 0);
  const cartIds = useMemo(() => new Set(items.map((item) => item.product.id)), [items]);
  const isElectricalBundleInCart = useMemo(
    () => selectedElectricalIds.length > 0 && selectedElectricalIds.every((id) => cartIds.has(id)) && cartIds.has(WIRING_KIT_ID),
    [selectedElectricalIds, cartIds],
  );
  const isInsulationBundleInCart = useMemo(
    () => ['ins_sound_deadening', 'ins_floor_and_sound', 'ins_floor_thermal'].every((id) => cartIds.has(id)),
    [cartIds],
  );

  const toggleElectricalSelection = (id: string) => {
    tapHaptic();
    setSelectedElectricalIds((prev) => (
      prev.includes(id) ? prev.filter((itemId) => itemId !== id) : [...prev, id]
    ));
  };

  const handleAddInsulation = () => {
    if (!insulationResult) return;
    tapHaptic();
    const soundDeadening = insulationResult.products.find((p) => p.id === 'sound_deadening');
    const floorDuo = insulationResult.products.find((p) => p.id === 'floor_duo');
    const recycledBottle = insulationResult.products.find((p) => p.id === 'recycled_bottle');
    addInsulationBundle({
      soundDeadeningM2: soundDeadening?.quantityM2 ?? 0,
      floorAreaM2: floorDuo?.quantityM2 ?? insulationResult.surfaceAreas.floor,
      foamBoardM2: recycledBottle?.quantityM2 ?? 0,
      useVapourBarrier: false,
      tier: 'premium',
    });
  };

  const handleSaveProject = async () => {
    tapHaptic();
    setSavingProject(true);
    setSaveMessage('');
    try {
      await saveProjectState(state);
      setSaveMessage('Project saved.');
    } catch {
      setSaveMessage('Unable to save right now.');
    } finally {
      setSavingProject(false);
    }
  };

  async function handleShareCard() {
    try {
      if (!shareShotRef.current) return;
      tapHaptic();
      const uri = await shareShotRef.current.capture?.();
      if (!uri) return;
      const Sharing = await import('expo-sharing');
      await Sharing.shareAsync(uri);
    } catch (e: any) {
      Alert.alert('Share failed', e?.message ?? 'Unable to share build card');
    }
  }

  return (
    <Animated.View style={[{ flex: 1, backgroundColor: theme.background }, slideStyle]} {...panHandlers}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Animated.View style={{ opacity: heroAnim, transform: [{ translateY: heroAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }}>
          <GlassCard style={styles.hero} float>
            <Text style={[styles.heroLabel, { color: theme.accent }]}>CRAFTED RECOMMENDATIONS FOR YOUR CAMPER</Text>
            <Text style={[styles.heroTitle, { color: theme.text }]}>Your build summary is ready</Text>
            <Text style={[styles.heroSub, { color: theme.textSecondary }]}>
              Save around {valueSaved.timeHoursSaved} hours and approximately £{Math.round(valueSaved.wasteCostAvoided)} with your bespoke package.
            </Text>
          </GlassCard>
        </Animated.View>

        <GlassCard style={styles.card}>
          <View style={styles.sectionHeaderRow}>
            <Text style={[styles.sectionLabel, { color: theme.accent, marginBottom: 0 }]}>BESPOKE ELECTRICAL BUNDLE</Text>
            <TouchableOpacity
              style={[styles.helpIconBtn, { borderColor: `${theme.accent}45` }]}
              onPress={() => setShowHowBubble((s) => !s)}
              activeOpacity={0.8}
            >
              <Text style={[styles.helpIconText, { color: theme.accent }]}>?</Text>
            </TouchableOpacity>
          </View>
          {showHowBubble && (
            <View style={[styles.helpBubble, { borderColor: `${theme.accent}30`, backgroundColor: theme.card }]}>
              <Text style={[styles.helpBubbleText, { color: theme.textSecondary }]}>
                We calculate this from your daily power profile, off-grid days, charging sources, and your exact van setup.
              </Text>
            </View>
          )}
          <SpecLine label="Recommended battery bank" value={`${result.recommendedBankAh}Ah ${result.batteryType}`} tone="accent" />
          <SpecLine label="Recommended solar array" value={`${result.recommendedSolarW}W`} />
          <SpecLine label="Major components subtotal" value={`~£${Math.round(recommendedPrice)}`} />
          <SpecLine label="Bespoke wiring installation kit" value={`~£${Math.round(wiringKitPrice)}`} />
          <Text style={[styles.valueLine, { color: theme.textSecondary }]}>
            Wiring kit includes build-matched cable lengths pre-cut, pre-crimped, and heat-shrunk for your van model.
          </Text>
          <SpecLine label="Bundle estimate" value={`~£${Math.round(bundlePrice)}`} tone="accent" />
          <Text style={[styles.valueLine, { color: theme.textSecondary }]}>
            Bespoke package value: save ~{valueSaved.timeHoursSaved} hours and ~£{Math.round(valueSaved.wasteCostAvoided)} versus piecing it together.
          </Text>
          {isElectricalBundleInCart ? (
            <TouchableOpacity style={[styles.primaryBtn, { backgroundColor: '#2E4C3D' }]} onPress={() => router.push('/basket')} activeOpacity={0.85}>
              <MaterialCommunityIcons name="cart-check" size={15} color="#CDEEDD" />
              <Text style={[styles.primaryBtnText, { color: '#CDEEDD' }]}>Bespoke bundle added ({cartCount} in cart)</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={[styles.primaryBtn, { backgroundColor: theme.accent }]} onPress={handleAddElectrical} activeOpacity={0.85}>
              <MaterialCommunityIcons name="cart-plus" size={15} color="#1A1A1A" />
              <Text style={[styles.primaryBtnText, { color: '#1A1A1A' }]}>
                Add Bespoke Electrical Bundle ({selectedElectricalIds.length + 1} lines) ~£{Math.round(selectedRecommendedPrice + wiringKitPrice)}
              </Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[styles.secondaryBtn, { borderColor: `${theme.accent}45` }]}
            onPress={() => setShowProductPreview((s) => !s)}
            activeOpacity={0.85}
          >
            <Text style={[styles.secondaryBtnText, { color: theme.accent }]}>
              {showProductPreview ? 'Hide recommended item preview' : 'Preview recommended items'}
            </Text>
          </TouchableOpacity>
          {showProductPreview && (
            <View style={[styles.previewCard, { borderColor: `${theme.accent}25`, backgroundColor: `${theme.accent}08` }]}>
              <Text style={[styles.previewTitle, { color: theme.text }]}>Choose which major components to include</Text>
              {recommendedProducts.map((product: any) => {
                const selected = selectedElectricalSet.has(product.id);
                return (
                  <TouchableOpacity
                    key={product.id}
                    style={[styles.previewRow, { borderTopColor: `${theme.accent}18` }]}
                    onPress={() => toggleElectricalSelection(product.id)}
                    activeOpacity={0.85}
                  >
                    <MaterialCommunityIcons
                      name={selected ? 'checkbox-marked-circle' : 'checkbox-blank-circle-outline'}
                      size={18}
                      color={selected ? theme.accent : theme.textSecondary}
                    />
                    <Text style={[styles.previewLabel, { color: theme.text }]}>{product.name}</Text>
                    <Text style={[styles.previewPrice, { color: selected ? theme.accent : theme.textSecondary }]}>
                      £{Math.round(product.estimatedPrice)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
              <View style={[styles.previewRow, { borderTopColor: `${theme.accent}18` }]}>
                <MaterialCommunityIcons name="check-circle" size={18} color={theme.accent} />
                <Text style={[styles.previewLabel, { color: theme.text }]}>{wiringKitProduct?.name ?? 'Crafted Bespoke Wiring Kit'}</Text>
                <Text style={[styles.previewPrice, { color: theme.accent }]}>£{Math.round(wiringKitPrice)}</Text>
              </View>
            </View>
          )}

          <CollapsibleSection title="Technical recommendations" badge="Optional details">
            <SpecLine label="Daily power usage" value={`${result.dailyAh}Ah/day`} />
            <SpecLine label="Daily generated" value={`${result.generation.solar + result.generation.alternator + result.generation.shorePower}Ah/day`} />
            <SpecLine label="Net daily" value={result.netDailyAh > 0 ? `-${result.netDailyAh}Ah/day` : `+${Math.abs(result.netDailyAh)}Ah/day`} />
            <SpecLine label="Inverter" value={result.inverterSize > 0 ? `${result.inverterSize}W` : 'Not required'} />
            <SpecLine label="DC-DC charger" value={`${result.dcDcChargerSize}A`} />
            {result.dailyLPG > 0 && <SpecLine label="LPG estimate" value={`${(result.dailyLPG * state.daysOffGrid).toFixed(1)}L / ${state.daysOffGrid} days`} />}
            {result.dailyDiesel > 0 && <SpecLine label="Diesel estimate" value={`${(result.dailyDiesel * state.daysOffGrid).toFixed(1)}L / ${state.daysOffGrid} days`} />}
          </CollapsibleSection>

          <CollapsibleSection title="Included bundle line items" badge={`${recommendedProducts.length + 1} lines`}>
            {recommendedProducts.map((product: any) => (
              <SpecLine key={product.id} label={product.name} value={`£${Math.round(product.estimatedPrice)}`} />
            ))}
            <SpecLine
              label={wiringKitProduct?.name ?? 'Crafted Bespoke Wiring Kit'}
              value={`£${Math.round(wiringKitPrice)}`}
            />
          </CollapsibleSection>

        </GlassCard>

        {state.insulationEnabled && (
          <GlassCard style={styles.card}>
            <Text style={[styles.sectionLabel, { color: theme.accent }]}>INSULATION RECOMMENDATIONS</Text>
            {insulationResult ? (
              <>
                <SpecLine label="Total coverage area" value={`${insulationResult.surfaceAreas.total} m²`} tone="accent" />
                <SpecLine label="Build season target" value={state.insulationSeason === 'four-season' ? '4-Season' : '3-Season'} />

                <CollapsibleSection title="Insulation products included" badge="Recommended spec">
                  <>
                    <SpecLine label="Dodo Mat DEADN PRO Black (3.7m² pack)" value="£72.14" />
                    <SpecLine label="Dodo Fleece EVO 50mm (DOD-FLEECE-EVO)" value="£35.66" />
                    <SpecLine label="Dodo Mat DEADN DUO (2.5m² floor roll)" value="£63.46" />
                    <SpecLine label="Dodo Pro Metal Roller" value="£5.87" />
                    <SpecLine label="Dodo Aluminium Tape" value="£7.54" />
                    <SpecLine label="Dodo High Temp Adhesive" value="£6.44" />
                  </>
                </CollapsibleSection>

                <TouchableOpacity style={[styles.primaryBtn, { backgroundColor: isInsulationBundleInCart ? '#2E4C3D' : theme.accent }]} onPress={handleAddInsulation} activeOpacity={0.85}>
                  <MaterialCommunityIcons name={isInsulationBundleInCart ? 'cart-check' : 'cart-plus'} size={15} color={isInsulationBundleInCart ? '#CDEEDD' : '#1A1A1A'} />
                  <Text style={[styles.primaryBtnText, { color: isInsulationBundleInCart ? '#CDEEDD' : '#1A1A1A' }]}>
                    {isInsulationBundleInCart ? `Insulation bundle added (${cartCount} in cart)` : 'Add Bespoke Insulation Bundle'}
                  </Text>
                </TouchableOpacity>
              </>
            ) : (
              <Text style={[styles.copy, { color: theme.textSecondary }]}>Insulation recommendations unavailable for this van profile.</Text>
            )}
            <TouchableOpacity style={[styles.secondaryBtn, { borderColor: `${theme.accent}45` }]} onPress={() => router.push('/shop')} activeOpacity={0.85}>
              <Text style={[styles.secondaryBtnText, { color: theme.accent }]}>View insulation in shop</Text>
            </TouchableOpacity>
          </GlassCard>
        )}

        <GlassCard style={styles.card}>
          <Text style={[styles.sectionLabel, { color: theme.accent }]}>WHAT HAPPENS AFTER PURCHASE</Text>
          <Text style={[styles.copy, { color: theme.textSecondary }]}>
            After checkout, we prepare your bespoke electrical package and email your account with a private unlock code.
            That code unlocks your build-specific wiring schematic and 12-step installation guide inside the app.
          </Text>
        </GlassCard>

        <GlassCard style={styles.card}>
          <Text style={[styles.sectionLabel, { color: theme.accent }]}>FINAL ACTIONS</Text>
          <TouchableOpacity style={[styles.primaryBtn, { backgroundColor: theme.text, opacity: savingProject ? 0.75 : 1 }]} onPress={handleSaveProject} activeOpacity={0.85} disabled={savingProject}>
            <MaterialCommunityIcons name="content-save-outline" size={15} color={theme.background} />
            <Text style={[styles.primaryBtnText, { color: theme.background }]}>{savingProject ? 'Saving project...' : 'Save Project'}</Text>
          </TouchableOpacity>
          {!!saveMessage && <Text style={[styles.note, { color: theme.success }]}>{saveMessage}</Text>}

          <View style={styles.exportBtns}>
            <TouchableOpacity style={[styles.exportBtn, { backgroundColor: theme.text, opacity: exporting ? 0.6 : 1 }]} onPress={() => handleExportPDF('share')} activeOpacity={0.85} disabled={exporting}>
              <MaterialCommunityIcons name="download" size={15} color={theme.background} />
              <Text style={[styles.exportBtnText, { color: theme.background }]}>Download Build Summary</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.exportBtnOutline, { borderColor: `${theme.accent}50`, opacity: exporting ? 0.6 : 1 }]} onPress={() => handleExportPDF('email')} activeOpacity={0.85} disabled={exporting}>
              <MaterialCommunityIcons name="email-outline" size={15} color={theme.accent} />
              <Text style={[styles.exportBtnOutlineText, { color: theme.accent }]}>Email</Text>
            </TouchableOpacity>
          </View>

          <ViewShot ref={shareShotRef} options={{ format: 'png', quality: 1 }}>
            <View style={[styles.shareCard, { backgroundColor: `${theme.accent}12`, borderColor: `${theme.accent}30` }]}>
              {!!projectPhoto && (
                <Image source={{ uri: projectPhoto }} style={styles.sharePhoto} resizeMode="cover" />
              )}
              <View style={styles.shareOverlay}>
                <Text style={[styles.shareTitle, { color: theme.text }]}>My CamperPlan Build</Text>
                <Text style={[styles.shareSub, { color: theme.textSecondary }]}>
                  {state.van ? `${state.van.manufacturerName} ${state.van.model}` : 'Custom build'} · {result.recommendedBankAh}Ah · {result.recommendedSolarW}W
                </Text>
                <Text style={[styles.shareCode, { color: theme.accent }]}>Referral code: {shareCode}</Text>
              </View>
            </View>
          </ViewShot>
          <TouchableOpacity style={[styles.exportBtnOutline, { borderColor: `${theme.accent}40`, marginTop: 10 }]} onPress={handleShareCard} activeOpacity={0.85}>
            <MaterialCommunityIcons name="share-variant-outline" size={15} color={theme.accent} />
            <Text style={[styles.exportBtnOutlineText, { color: theme.accent }]}>Share to Social</Text>
          </TouchableOpacity>
        </GlassCard>

        <ElectricalDisclaimer />
        <View style={{ height: 120 }} />
      </ScrollView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 24, paddingTop: 24 },
  hero: { marginBottom: 18 },
  tierCard: { marginBottom: 18 },
  tierHeading: { fontSize: 16, fontWeight: '800', marginBottom: 4 },
  tierSub: { fontSize: 12, lineHeight: 17, marginBottom: 14 },
  tierRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  tierBtn: { flex: 1, borderWidth: 1.5, borderRadius: 12, padding: 14, alignItems: 'center', gap: 4, position: 'relative' },
  tierBtnLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 1.5 },
  tierBtnPrice: { fontSize: 20, fontWeight: '900' },
  tierBtnDesc: { fontSize: 10, textAlign: 'center', lineHeight: 14 },
  tierBadge: { position: 'absolute', top: -10, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  tierBadgeText: { fontSize: 8, fontWeight: '900', letterSpacing: 1, color: '#1A1A1A' },
  tierCompareRow: { flexDirection: 'row', borderTopWidth: 1, paddingTop: 14, gap: 10 },
  tierCompareCol: { flex: 1, gap: 3 },
  tierDivider: { width: 1 },
  tierCompareHeader: { fontSize: 10, fontWeight: '700', letterSpacing: 1, marginBottom: 4 },
  tierCompareItem: { fontSize: 11, lineHeight: 16 },
  heroLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 2, marginBottom: 8 },
  heroTitle: { fontSize: 24, fontWeight: '800', marginBottom: 8 },
  heroSub: { fontSize: 13, lineHeight: 19 },
  card: { marginBottom: 18 },
  sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  helpIconBtn: { width: 24, height: 24, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  helpIconText: { fontSize: 13, fontWeight: '800' },
  helpBubble: { borderWidth: 1, borderRadius: 10, padding: 10, marginBottom: 10 },
  helpBubbleText: { fontSize: 12, lineHeight: 17 },
  sectionLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 2, marginBottom: 12 },
  copy: { fontSize: 13, lineHeight: 19, marginBottom: 10 },
  valueLine: { fontSize: 12, lineHeight: 18, marginTop: 10 },
  specLine: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10, marginTop: 5 },
  specLineLabel: { fontSize: 12, fontWeight: '600', flex: 1 },
  specLineValue: { fontSize: 12, fontWeight: '800', flexShrink: 0 },
  primaryBtn: { marginTop: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 13, borderRadius: 10 },
  primaryBtnText: { fontSize: 13, fontWeight: '800' },
  secondaryBtn: { marginTop: 8, borderWidth: 1, borderRadius: 10, paddingVertical: 11, alignItems: 'center' },
  secondaryBtnText: { fontSize: 12, fontWeight: '800' },
  previewCard: { marginTop: 10, borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingBottom: 8 },
  previewTitle: { fontSize: 12, fontWeight: '700', marginTop: 10, marginBottom: 6 },
  previewRow: { flexDirection: 'row', alignItems: 'center', gap: 8, borderTopWidth: 1, paddingVertical: 10 },
  previewLabel: { flex: 1, fontSize: 12, fontWeight: '600' },
  previewPrice: { fontSize: 12, fontWeight: '700' },
  linkBtn: { marginTop: 10, borderRadius: 10, borderWidth: 1, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  linkBtnText: { fontSize: 12, fontWeight: '700' },
  installCard: { marginBottom: 18, borderWidth: 1 },
  installHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
  installTitle: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
  installSub: { color: 'rgba(217,160,91,0.75)', fontSize: 11, marginTop: 1 },
  installBadge: { backgroundColor: '#D9A05B', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  installBadgeText: { color: '#1A1A1A', fontSize: 14, fontWeight: '800' },
  installDesc: { color: 'rgba(255,255,255,0.75)', fontSize: 13, lineHeight: 18, marginBottom: 10 },
  installThreshold: { color: '#D9A05B', fontSize: 12, lineHeight: 17, marginBottom: 12, fontWeight: '700' },
  installBtn: { backgroundColor: '#D9A05B', borderRadius: 10, paddingVertical: 13, alignItems: 'center' },
  installBtnText: { color: '#1A1A1A', fontSize: 14, fontWeight: '800' },
  exportBtns: { flexDirection: 'row', gap: 10, marginTop: 10 },
  exportBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 13, borderRadius: 10 },
  exportBtnText: { fontSize: 13, fontWeight: '700' },
  exportBtnOutline: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 13, borderRadius: 10, borderWidth: 1 },
  exportBtnOutlineText: { fontSize: 13, fontWeight: '700' },
  note: { marginTop: 8, fontSize: 12, fontWeight: '700' },
  shareCard: { borderWidth: 1, borderRadius: 10, marginTop: 12, overflow: 'hidden', minHeight: 112 },
  sharePhoto: { ...StyleSheet.absoluteFillObject, opacity: 0.3 },
  shareOverlay: { padding: 12 },
  shareTitle: { fontSize: 14, fontWeight: '800', marginBottom: 4 },
  shareSub: { fontSize: 12, marginBottom: 6 },
  shareCode: { fontSize: 12, fontWeight: '800' },
});
