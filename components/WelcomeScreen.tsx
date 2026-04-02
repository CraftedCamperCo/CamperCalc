import GlassCard from '@/components/GlassCard';
import TopographicBackground from '@/components/TopographicBackground';
import { ExperienceLevel, useCamper } from '@/context/CamperContext';
import { useTheme } from '@/context/ThemeContext';
import React, { useEffect, useRef } from 'react';
import { Animated, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const OPTIONS: { level: ExperienceLevel; icon: string; title: string; desc: string }[] = [
  {
    level: 'first-timer',
    icon: '🌱',
    title: 'First-Time Builder',
    desc: 'New to van electrics? We\'ll keep it simple and guide you through everything step by step.',
  },
  {
    level: 'experienced',
    icon: '⚡',
    title: 'Experienced Builder',
    desc: 'Know your Ah from your watts? Get full access to detailed settings and fine-tuning controls.',
  },
  {
    level: 'seasoned',
    icon: '🔧',
    title: 'Seasoned Builder',
    desc: 'Professional or repeat builder? All controls unlocked — dial in every parameter to spec.',
  },
];

export default function WelcomeScreen() {
  const { set } = useCamper();
  const theme = useTheme();
  const logoAnim = useRef(new Animated.Value(0)).current;
  const titleAnim = useRef(new Animated.Value(0)).current;
  const cardAnims = OPTIONS.map(() => useRef(new Animated.Value(0)).current);

  useEffect(() => {
    Animated.stagger(180, [
      Animated.timing(logoAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(titleAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      ...cardAnims.map(a => Animated.timing(a, { toValue: 1, duration: 500, useNativeDriver: true })),
    ]).start();
  }, []);

  const choose = (level: ExperienceLevel) => {
    set('experienceLevel', level);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <TopographicBackground />
      <ScrollView contentContainerStyle={styles.inner} showsVerticalScrollIndicator={false}>
        <Animated.View style={[styles.logoWrap, { opacity: logoAnim, transform: [{ translateY: logoAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }]}>
          <Image
            source={require('../assets/images/crafted-logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </Animated.View>

        <Animated.View style={{ opacity: titleAnim, transform: [{ translateY: titleAnim.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }] }}>
          <Text style={[styles.title, { color: theme.text }]}>Welcome to CamperPlan</Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            Tell us about your experience level so we can tailor the app for you.
          </Text>
        </Animated.View>

        <View style={styles.optionsWrap}>
          {OPTIONS.map((opt, i) => (
            <Animated.View
              key={opt.level}
              style={{
                opacity: cardAnims[i],
                transform: [{ translateY: cardAnims[i].interpolate({ inputRange: [0, 1], outputRange: [24, 0] }) }],
              }}
            >
              <TouchableOpacity activeOpacity={0.8} onPress={() => choose(opt.level)}>
                <GlassCard style={styles.optionCard}>
                  <Text style={styles.optionIcon}>{opt.icon}</Text>
                  <Text style={[styles.optionTitle, { color: theme.text }]}>{opt.title}</Text>
                  <Text style={[styles.optionDesc, { color: theme.textSecondary }]}>{opt.desc}</Text>
                  <View style={[styles.optionCta, { backgroundColor: `${theme.accent}18`, borderColor: `${theme.accent}44` }]}>
                    <Text style={[styles.optionCtaText, { color: theme.accent }]}>Select →</Text>
                  </View>
                </GlassCard>
              </TouchableOpacity>
            </Animated.View>
          ))}
        </View>

        <Text style={[styles.footer, { color: theme.textSecondary }]}>
          You can change this any time from the app settings.
        </Text>
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  inner: {
    paddingHorizontal: 28,
    paddingTop: 90,
    paddingBottom: 40,
  },
  logoWrap: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logo: {
    width: 180,
    height: 65,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 32,
  },
  optionsWrap: {
    gap: 14,
  },
  optionCard: {
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 20,
  },
  optionIcon: {
    fontSize: 32,
    marginBottom: 10,
  },
  optionTitle: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 6,
  },
  optionDesc: {
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
    marginBottom: 14,
  },
  optionCta: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  optionCtaText: {
    fontSize: 13,
    fontWeight: '700',
  },
  footer: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 20,
  },
});
