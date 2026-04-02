import { BlurView } from 'expo-blur';
import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { useCamper } from '../context/CamperContext';
import { calculate } from '../utils/calculator';

export default function FloatingAhBadge() {
  const { state } = useCamper();
  const spec = calculate(state);

  const scaleAnim = useRef(new Animated.Value(1)).current;
  const prevAh = useRef(spec.recommendedBankAh);

  useEffect(() => {
    if (prevAh.current !== spec.recommendedBankAh) {
      prevAh.current = spec.recommendedBankAh;
      Animated.sequence([
        Animated.timing(scaleAnim, { toValue: 1.18, duration: 120, useNativeDriver: true }),
        Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, friction: 4 }),
      ]).start();
    }
  }, [spec.recommendedBankAh, scaleAnim]);

  return (
    <View style={styles.container} pointerEvents="none">
      <Animated.View style={[styles.badge, { transform: [{ scale: scaleAnim }] }]}>
        <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFillObject} />
        <View style={styles.surface} />
        <View style={styles.topEdge} />
        <View style={styles.row}>
          <Text style={styles.number}>{spec.recommendedBankAh}</Text>
          <Text style={styles.unit}> Ah</Text>
          {spec.dailyLPG > 0 && (
            <Text style={styles.extra}>  {(spec.dailyLPG * state.daysOffGrid).toFixed(1)}L LPG</Text>
          )}
          {spec.dailyDiesel > 0 && (
            <Text style={styles.extra}>  {(spec.dailyDiesel * state.daysOffGrid).toFixed(1)}L Diesel</Text>
          )}
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 16,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 99,
  },
  badge: {
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(217,160,91,0.35)',
  },
  surface: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(217,160,91,0.08)',
  },
  topEdge: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(217,160,91,0.4)',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'baseline',
    paddingHorizontal: 18,
    paddingVertical: 6,
  },
  number: {
    color: '#D9A05B',
    fontSize: 16,
    fontWeight: '800',
  },
  unit: {
    color: '#D9A05B',
    fontSize: 12,
    fontWeight: '600',
  },
  extra: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 11,
    fontWeight: '500',
  },
});
