import GlassCard from '@/components/GlassCard';
import { FEATURE_FLAGS } from '@/constants/featureFlags';
import { useAuth } from '@/context/AuthContext';
import { useProjects } from '@/context/ProjectContext';
import { useTheme } from '@/context/ThemeContext';
import { calculate } from '@/utils/calculator';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

function GridTool({ icon, label, onPress, delay, theme }: { icon: React.ReactNode; label: string; onPress: () => void; delay: number; theme: any }) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(anim, { toValue: 1, duration: 400, delay, useNativeDriver: true }).start();
  }, []);
  const isDark = theme.blurTint === 'dark';
  return (
    <Animated.View style={[s.gridCell, { opacity: anim, transform: [{ scale: anim.interpolate({ inputRange: [0, 1], outputRange: [0.92, 1] }) }] }]}>
      <TouchableOpacity
        style={[s.gridBtn, {
          backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#FFFFFF',
          borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
        }]}
        onPress={onPress}
        activeOpacity={0.7}
      >
        <View style={[s.gridIconWrap, { backgroundColor: `${theme.accent}12` }]}>{icon}</View>
        <Text style={[s.gridLabel, { color: theme.text }]}>{label}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

function StripTool({ icon, label, onPress, theme }: { icon: React.ReactNode; label: string; onPress: () => void; theme: any }) {
  const isDark = theme.blurTint === 'dark';
  return (
    <TouchableOpacity
      style={[s.stripBtn, {
        backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#FFFFFF',
        borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
      }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {icon}
      <Text style={[s.stripLabel, { color: theme.textSecondary }]}>{label}</Text>
    </TouchableOpacity>
  );
}

function YourProject({ theme }: { theme: any }) {
  const { user } = useAuth();
  const { projects, loading, selectProject } = useProjects();
  const router = useRouter();

  if (!user) {
    return (
      <TouchableOpacity onPress={() => router.push('/auth')} activeOpacity={0.8}>
        <GlassCard style={s.projectCard}>
          <View style={s.projectInner}>
            <View style={[s.projectIcon, { backgroundColor: `${theme.accent}10` }]}>
              <FontAwesome name="lock" size={13} color={theme.accent} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[s.projectTitle, { color: theme.text }]}>Sign in to save projects</Text>
              <Text style={[s.projectSub, { color: theme.textSecondary }]}>Keep your builds safe across devices</Text>
            </View>
            <FontAwesome name="chevron-right" size={11} color={theme.accent} />
          </View>
        </GlassCard>
      </TouchableOpacity>
    );
  }

  if (loading) return null;

  if (projects.length === 0) {
    return (
      <View>
        <TouchableOpacity onPress={() => router.push('/projects')} activeOpacity={0.8}>
          <GlassCard style={[s.projectCard, s.primaryStartCard]}>
            <View style={s.projectInner}>
              <View style={[s.projectIcon, { backgroundColor: `${theme.accent}10` }]}>
                <FontAwesome name="plus" size={13} color={theme.accent} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[s.projectTitle, { color: theme.text }]}>Start your build</Text>
                <Text style={[s.projectSub, { color: theme.textSecondary }]}>Answer a few lifestyle questions - we'll recommend exactly what you need.</Text>
              </View>
              <FontAwesome name="chevron-right" size={11} color={theme.accent} />
            </View>
          </GlassCard>
        </TouchableOpacity>
        <View style={s.projectActionsRow}>
          <TouchableOpacity
            style={[s.projectActionBtn, { borderColor: `${theme.accent}45`, backgroundColor: `${theme.accent}10` }]}
            onPress={() => router.push('/projects?new=1')}
            activeOpacity={0.8}
          >
            <FontAwesome name="folder-open-o" size={12} color={theme.accent} />
            <Text style={[s.projectActionText, { color: theme.accent }]}>Manage Projects</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[s.projectActionBtn, { borderColor: `${theme.accent}45`, backgroundColor: `${theme.accent}10` }]}
            onPress={() => router.push('/projects')}
            activeOpacity={0.8}
          >
            <FontAwesome name="plus" size={12} color={theme.accent} />
            <Text style={[s.projectActionText, { color: theme.accent }]}>New Project</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const recent = projects[0];
  const state = recent.camper_state;
  const hasState = state && typeof state === 'object' && Object.keys(state).length > 0;
  const spec = hasState && state.usage ? calculate(state as any) : null;
  const van = state?.van;

  const handleContinue = () => {
    selectProject(recent);
    router.push('/(tabs)');
  };

  return (
    <View>
      <TouchableOpacity onPress={handleContinue} activeOpacity={0.8}>
        <GlassCard style={s.projectCard}>
          <View style={s.projectInner}>
            <View style={[s.projectIcon, { backgroundColor: `${theme.accent}10` }]}>
              <MaterialCommunityIcons name="van-utility" size={16} color={theme.accent} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[s.projectTitle, { color: theme.text }]} numberOfLines={1}>{recent.name}</Text>
              <Text style={[s.projectSub, { color: theme.textSecondary }]} numberOfLines={1}>
                {van ? `${van.manufacturerName} ${van.model}` : 'Tap to continue'}
                {spec ? `  ·  ${spec.recommendedBankAh}Ah` : ''}
              </Text>
            </View>
            <View style={[s.continuePill, { backgroundColor: theme.accent }]}>
              <Text style={s.continuePillText}>Continue →</Text>
            </View>
          </View>
        </GlassCard>
      </TouchableOpacity>
      <View style={s.projectActionsRow}>
        <TouchableOpacity
          style={[s.projectActionBtn, { borderColor: `${theme.accent}45`, backgroundColor: `${theme.accent}10` }]}
          onPress={() => router.push('/projects?new=1')}
          activeOpacity={0.8}
        >
          <FontAwesome name="folder-open-o" size={12} color={theme.accent} />
          <Text style={[s.projectActionText, { color: theme.accent }]}>
            {projects.length > 1 ? `Manage Projects (${projects.length})` : 'Manage Projects'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[s.projectActionBtn, { borderColor: `${theme.accent}45`, backgroundColor: `${theme.accent}10` }]}
          onPress={() => router.push('/projects')}
          activeOpacity={0.8}
        >
          <FontAwesome name="plus" size={12} color={theme.accent} />
          <Text style={[s.projectActionText, { color: theme.accent }]}>New Project</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function HomeHub() {
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const isDark = theme.blurTint === 'dark';

  const fadeIn = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(fadeIn, { toValue: 1, duration: 800, useNativeDriver: true }).start();
  }, []);

  const footerColor = isDark ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.18)';

  return (
    <View style={[s.container, { backgroundColor: theme.background }]}>
      <ScrollView
        style={s.scroll}
        contentContainerStyle={[s.content, { paddingTop: insets.top + 48 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── HERO ── */}
        <Animated.View style={[s.hero, { opacity: fadeIn, transform: [{ translateY: fadeIn.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }]}>
          <Image
            source={require('../assets/images/crafted-logo.png')}
            style={s.logo}
            resizeMode="contain"
          />

          <Text style={[s.heroHeadline, { color: theme.text }]}>
            Take the guesswork out{'\n'}of your camper build.
          </Text>

          <Text style={[s.statLine, { color: theme.textSecondary }]}>
            Save 40+ hours of research with bespoke recommendations.
          </Text>
        </Animated.View>

        {/* ── YOUR PROJECTS ── */}
        <View style={s.section}>
          <Text style={[s.sectionLabel, { color: theme.accent }]}>YOUR PROJECTS</Text>
          <YourProject theme={theme} />
        </View>

        {/* ── SHOP & BESPOKE PACKAGES ── */}
        <View style={s.section}>
          <Text style={[s.sectionLabel, { color: theme.accent }]}>SHOP & BESPOKE PACKAGES</Text>
          <View style={s.shopStack}>
            <TouchableOpacity onPress={() => router.push('/shop')} activeOpacity={0.8}>
              <View style={[s.shopCard, {
                backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#FFFFFF',
                borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
              }]}>
                <View style={[s.gridIconWrap, { backgroundColor: `${theme.accent}12` }]}>
                  <MaterialCommunityIcons name="lightning-bolt-outline" size={24} color={theme.accent} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[s.shopCardTitle, { color: theme.text }]}>Bespoke Electrical Package</Text>
                  <Text style={[s.shopCardDesc, { color: theme.textSecondary }]}>
                    Components and wiring tailored to your exact build.
                  </Text>
                </View>
                <FontAwesome name="chevron-right" size={11} color={theme.accent} />
              </View>
            </TouchableOpacity>
            {FEATURE_FLAGS.THREE_D_KITS_ENABLED && (
              <TouchableOpacity onPress={() => router.push('/furniture-kit')} activeOpacity={0.8}>
                <View style={[s.shopCard, {
                  backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#FFFFFF',
                  borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                }]}>
                  <View style={[s.gridIconWrap, { backgroundColor: `${theme.accent}12` }]}>
                    <MaterialCommunityIcons name="sofa-outline" size={24} color={theme.accent} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[s.shopCardTitle, { color: theme.text }]}>Bespoke Furniture Kits</Text>
                    <Text style={[s.shopCardDesc, { color: theme.textSecondary }]}>
                      CNC-cut flat-pack camper furniture with 3D configurator.
                    </Text>
                  </View>
                  <FontAwesome name="chevron-right" size={11} color={theme.accent} />
                </View>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* ── CALCULATORS ── */}
        <View style={s.section}>
          <Text style={[s.sectionLabel, { color: theme.accent }]}>CALCULATORS</Text>
          <View style={s.grid}>
            <GridTool icon={<MaterialCommunityIcons name="van-utility" size={24} color={theme.accent} />} label="Your Camper" onPress={() => router.push('/(tabs)')} delay={80} theme={theme} />
            <GridTool icon={<MaterialCommunityIcons name="shield-home" size={24} color={theme.accent} />} label="Insulation" onPress={() => router.push('/(tabs)/insulation')} delay={140} theme={theme} />
            <GridTool icon={<FontAwesome name="bolt" size={22} color={theme.accent} />} label="Electrics" onPress={() => router.push('/(tabs)/two')} delay={200} theme={theme} />
            <GridTool icon={<MaterialCommunityIcons name="water" size={24} color={theme.accent} />} label="Water" onPress={() => router.push('/(tabs)/water')} delay={260} theme={theme} />
          </View>
        </View>

        {/* ── BUILD TOOLS ── */}
        <View style={s.section}>
          <Text style={[s.sectionLabel, { color: theme.accent }]}>BUILD TOOLS</Text>
          <View style={s.strip}>
            <StripTool icon={<MaterialCommunityIcons name="file-export" size={18} color={theme.accent} />} label="Export PDF" onPress={() => router.push('/export')} theme={theme} />
            {FEATURE_FLAGS.ELECTRICAL_SCHEMATICS_ENABLED && (
              <StripTool icon={<MaterialCommunityIcons name="sitemap" size={18} color={theme.accent} />} label="Schematics" onPress={() => router.push('/wiring')} theme={theme} />
            )}
            <StripTool icon={<MaterialCommunityIcons name="cart-outline" size={18} color={theme.accent} />} label="Shop" onPress={() => router.push('/shop')} theme={theme} />
            <StripTool icon={<MaterialCommunityIcons name="hammer-wrench" size={18} color={theme.accent} />} label="Craft With Us" onPress={() => router.push('/craft')} theme={theme} />
          </View>
        </View>

        {/* ── FOOTER ── */}
        <View style={s.footer}>
          <Text style={[s.footerText, { color: footerColor }]}>
            © Crafted Camper Co (Yorkshire) LTD
          </Text>
          <View style={s.legalRow}>
            <TouchableOpacity onPress={() => router.push('/terms')}>
              <Text style={[s.legalLink, { color: footerColor }]}>Terms</Text>
            </TouchableOpacity>
            <Text style={[s.legalDot, { color: footerColor }]}>·</Text>
            <TouchableOpacity onPress={() => router.push('/privacy')}>
              <Text style={[s.legalLink, { color: footerColor }]}>Privacy</Text>
            </TouchableOpacity>
            <Text style={[s.legalDot, { color: footerColor }]}>·</Text>
            <TouchableOpacity onPress={() => router.push('/cookies')}>
              <Text style={[s.legalLink, { color: footerColor }]}>Cookies</Text>
            </TouchableOpacity>
          </View>
          <View style={s.legalRow}>
            <TouchableOpacity onPress={() => router.push('/returns')}>
              <Text style={[s.legalLink, { color: footerColor }]}>Returns</Text>
            </TouchableOpacity>
            <Text style={[s.legalDot, { color: footerColor }]}>·</Text>
            <TouchableOpacity onPress={() => router.push('/shipping')}>
              <Text style={[s.legalLink, { color: footerColor }]}>Shipping</Text>
            </TouchableOpacity>
            <Text style={[s.legalDot, { color: footerColor }]}>·</Text>
            <TouchableOpacity onPress={() => router.push('/faq')}>
              <Text style={[s.legalLink, { color: footerColor }]}>FAQ</Text>
            </TouchableOpacity>
            <Text style={[s.legalDot, { color: footerColor }]}>·</Text>
            <TouchableOpacity onPress={() => router.push('/support')}>
              <Text style={[s.legalLink, { color: footerColor }]}>Support</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ height: 56 }} />
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 28 },

  hero: { alignItems: 'center', marginBottom: 52 },
  logo: { width: 140, height: 50, marginBottom: 32 },
  heroHeadline: {
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 35,
    letterSpacing: -0.5,
    marginBottom: 14,
  },
  heroBody: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    maxWidth: 300,
    fontWeight: '400',
    marginBottom: 28,
  },
  ctaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 999,
    marginBottom: 20,
  },
  ctaBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1A1A1A',
    letterSpacing: 0.2,
  },
  statLine: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
    letterSpacing: 0.1,
    opacity: 0.7,
  },

  section: { marginBottom: 40 },
  sectionLabel: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 2.5,
    marginBottom: 16,
    textTransform: 'uppercase',
  },

  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  gridCell: { width: '47.5%' },
  gridBtn: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    alignItems: 'center',
    gap: 10,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  gridIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gridLabel: { fontSize: 13, fontWeight: '600', textAlign: 'center' },

  strip: { flexDirection: 'row', gap: 8 },
  stripBtn: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 14,
    alignItems: 'center',
    gap: 6,
  },
  stripLabel: { fontSize: 9, fontWeight: '600', textAlign: 'center', letterSpacing: 0.3 },

  shopStack: { gap: 10 },
  shopCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderRadius: 16,
    borderWidth: 1,
    padding: 18,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  shopCardTitle: { fontSize: 15, fontWeight: '700', marginBottom: 3 },
  shopCardDesc: { fontSize: 12, lineHeight: 17 },

  projectCard: { marginBottom: 4 },
  primaryStartCard: {
    borderWidth: 2,
    borderColor: '#D9A05B',
  },
  projectInner: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  projectIcon: { width: 38, height: 38, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  projectTitle: { fontSize: 14, fontWeight: '600', marginBottom: 2 },
  projectSub: { fontSize: 11, lineHeight: 15 },
  continuePill: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  continuePillText: { color: '#FFF', fontSize: 11, fontWeight: '700' },
  projectActionsRow: { flexDirection: 'row', gap: 8, marginTop: 8 },
  projectActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 10,
  },
  projectActionText: { fontSize: 11, fontWeight: '700' },

  footer: { alignItems: 'center', marginTop: 12 },
  footerText: { fontSize: 10, textAlign: 'center' },
  legalRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 },
  legalLink: { fontSize: 10, textDecorationLine: 'underline' },
  legalDot: { fontSize: 10 },
});
