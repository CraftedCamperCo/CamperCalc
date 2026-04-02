import { useTheme } from '@/context/ThemeContext';
import { BlurView } from 'expo-blur';
import React, { useEffect, useRef } from 'react';
import { Animated, Platform, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

interface GlassCardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  float?: boolean;
  intensity?: number;
  noPadding?: boolean;
}

export default function GlassCard({ children, style, float = false, intensity, noPadding = false }: GlassCardProps) {
  const theme = useTheme();
  const isLight = theme.blurTint === 'light';
  const blurIntensity = intensity ?? (isLight ? 40 : 18);

  const floatAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!float) return;
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, { toValue: -3, duration: 2800, useNativeDriver: true }),
        Animated.timing(floatAnim, { toValue: 0, duration: 2800, useNativeDriver: true }),
      ])
    ).start();
  }, [float, floatAnim]);

  const wrapperStyle = isLight
    ? [
        styles.wrapper,
        styles.wrapperLight,
        style,
        float && { transform: [{ translateY: floatAnim }] },
      ]
    : [
        styles.wrapper,
        styles.wrapperDark,
        style,
        float && { transform: [{ translateY: floatAnim }] },
      ];

  return (
    <Animated.View style={wrapperStyle}>
      <BlurView intensity={blurIntensity} tint={theme.blurTint} style={StyleSheet.absoluteFillObject} />

      {/* Glass surface tint — adapts to light/dark */}
      <View style={[styles.surfaceTint, { backgroundColor: isLight ? 'rgba(255,255,255,0.72)' : 'rgba(255,255,255,0.055)' }]} />

      {/* Top edge highlight */}
      <View style={[styles.topHighlight, { backgroundColor: isLight ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.22)' }]} />

      {/* Left edge highlight */}
      <View style={[styles.leftHighlight, { backgroundColor: isLight ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.10)' }]} />

      {/* Chromatic aberration — red channel */}
      <View style={[styles.chromatic, isLight ? styles.chromaticRedLight : styles.chromaticRedDark]} />

      {/* Chromatic aberration — blue channel */}
      <View style={[styles.chromatic, isLight ? styles.chromaticBlueLight : styles.chromaticBlueDark]} />

      <View style={noPadding ? undefined : styles.content}>{children}</View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
  },
  wrapperLight: {
    borderColor: 'rgba(0,0,0,0.06)',
    // Shadow for light mode — cards float above the white canvas
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.07,
        shadowRadius: 12,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  wrapperDark: {
    borderColor: 'rgba(255,255,255,0.10)',
  },
  surfaceTint: {
    ...StyleSheet.absoluteFillObject,
  },
  topHighlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
  },
  leftHighlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    width: 1,
  },
  chromatic: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 16,
  },
  chromaticRedLight: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'rgba(255,60,60,0.03)',
    marginLeft: -1,
    marginTop: 1,
  },
  chromaticRedDark: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'rgba(255,60,60,0.06)',
    marginLeft: -1,
    marginTop: 1,
  },
  chromaticBlueDark: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'rgba(60,60,255,0.06)',
    marginLeft: 1,
    marginTop: -1,
  },
  chromaticBlueLight: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'rgba(60,60,255,0.03)',
    marginLeft: 1,
    marginTop: -1,
  },
  content: {
    padding: 18,
  },
});
