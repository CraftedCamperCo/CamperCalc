import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import LottieView from 'lottie-react-native';

export default function LottieOrFallback({
  source,
  size = 180,
  loop = true,
}: {
  source?: any;
  size?: number;
  loop?: boolean;
}) {
  const pulse = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.9, duration: 700, useNativeDriver: true }),
      ]),
    ).start();
  }, [pulse]);

  if (source) {
    return <LottieView source={source} autoPlay loop={loop} style={{ width: size, height: size }} />;
  }

  return (
    <Animated.View style={[s.fallback, { width: size, height: size, transform: [{ scale: pulse }] }]} />
  );
}

const s = StyleSheet.create({
  fallback: {
    borderRadius: 999,
    borderWidth: 2,
    borderColor: 'rgba(217,160,91,0.5)',
    backgroundColor: 'rgba(217,160,91,0.15)',
  },
});

