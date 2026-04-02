import { useCart } from '@/context/CartContext';
import { useTheme } from '@/context/ThemeContext';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function CartShortcut({ bottom = 104 }: { bottom?: number }) {
  const theme = useTheme();
  const router = useRouter();
  const { count } = useCart();

  return (
    <TouchableOpacity
      style={[
        styles.wrap,
        {
          bottom,
          backgroundColor: theme.text,
          shadowColor: theme.text,
        },
      ]}
      onPress={() => router.push('/basket')}
      activeOpacity={0.88}
    >
      <MaterialCommunityIcons name="cart" size={18} color={theme.background} />
      <Text style={[styles.label, { color: theme.background }]}>Cart</Text>
      {count > 0 && (
        <View style={[styles.badge, { backgroundColor: theme.accent }]}>
          <Text style={styles.badgeText}>{count}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    right: 18,
    zIndex: 40,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
    shadowOpacity: 0.18,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
  },
  badge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
  },
  badgeText: {
    color: '#1A1A1A',
    fontSize: 11,
    fontWeight: '800',
  },
});
