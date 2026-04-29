/**
 * Paywall shown in place of the wiring schematic for users who have not yet
 * purchased any electrical products from CamperPlan. The unlock rule
 * (`electrical_schematic_access` entitlement, granted by the Stripe webhook
 * on any electrical purchase) is intentionally NOT advertised in this copy:
 * we do not want customers to learn they can buy a low-value item just to
 * unlock the schematic.
 */
import GlassCard from '@/components/GlassCard';
import { useTheme } from '@/context/ThemeContext';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface SchematicPaywallProps {
  /** Optional override for the page title shown above the lock card. */
  title?: string;
  /** When false, hides the secondary "Browse the shop" link. Defaults to true. */
  showSecondaryAction?: boolean;
}

export default function SchematicPaywall({
  title = 'Your wiring schematic is ready',
  showSecondaryAction = true,
}: SchematicPaywallProps) {
  const theme = useTheme();
  const router = useRouter();

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <GlassCard style={styles.card}>
        <View style={[styles.iconWrap, { backgroundColor: `${theme.accent}1A`, borderColor: `${theme.accent}40` }]}>
          <MaterialCommunityIcons name="lock-outline" size={28} color={theme.accent} />
        </View>

        <Text style={[styles.title, { color: theme.text }]}>{title}</Text>

        <Text style={[styles.body, { color: theme.textSecondary }]}>
          Purchase your bespoke electrical package, or part of it, through CamperPlan to unlock the full diagram, install guide, and PDF export.
        </Text>

        <Text style={[styles.subBody, { color: theme.textSecondary }]}>
          Your schematic has been generated from your exact build spec and will be available the moment your order is confirmed.
        </Text>

        <TouchableOpacity
          style={[styles.primaryBtn, { backgroundColor: theme.accent }]}
          activeOpacity={0.85}
          onPress={() => router.push('/shop')}
        >
          <Text style={styles.primaryBtnText}>View electrical package</Text>
        </TouchableOpacity>

        {showSecondaryAction && (
          <TouchableOpacity
            style={styles.secondaryBtn}
            activeOpacity={0.7}
            onPress={() => router.push('/(tabs)/three')}
          >
            <Text style={[styles.secondaryBtnText, { color: theme.accent }]}>Review my recommendations</Text>
          </TouchableOpacity>
        )}
      </GlassCard>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 24,
  },
  card: {
    padding: 24,
    alignItems: 'center',
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 12,
  },
  body: {
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
    marginBottom: 10,
  },
  subBody: {
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
    marginBottom: 22,
  },
  primaryBtn: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  primaryBtnText: {
    color: '#1A1A1A',
    fontSize: 14,
    fontWeight: '800',
  },
  secondaryBtn: {
    paddingVertical: 12,
  },
  secondaryBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
});
