import GlassCard from '@/components/GlassCard';
import TopographicBackground from '@/components/TopographicBackground';
import { useTheme } from '@/context/ThemeContext';
import { APP_CATALOG_BY_ID } from '@/data/catalog';
import { goBackOrHome } from '@/utils/navigation';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function RepositoryItemScreen() {
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ id?: string }>();
  const item = params.id ? APP_CATALOG_BY_ID[params.id] : undefined;

  return (
    <View style={[s.container, { backgroundColor: theme.background }]}>
      <TopographicBackground />
      <ScrollView style={s.scroll} contentContainerStyle={[s.content, { paddingTop: insets.top + 18 }]}>
        <TouchableOpacity onPress={() => goBackOrHome(router)} style={s.backBtn} activeOpacity={0.7}>
          <FontAwesome name="chevron-left" size={14} color={theme.accent} />
          <Text style={[s.backText, { color: theme.accent }]}>Back</Text>
        </TouchableOpacity>

        {!item ? (
          <GlassCard>
            <Text style={[s.title, { color: theme.text }]}>Item not found</Text>
            <Text style={[s.body, { color: theme.textSecondary }]}>The selected repository entry could not be loaded.</Text>
          </GlassCard>
        ) : (
          <>
            <Text style={[s.title, { color: theme.text }]}>{item.name}</Text>
            <Text style={[s.subtitle, { color: theme.textSecondary }]}>
              {item.sku ?? 'No SKU'} · {item.brand ?? 'Supplier'} · {item.category}
            </Text>

            <GlassCard style={s.card}>
              <Text style={[s.section, { color: theme.accent }]}>Overview</Text>
              <Text style={[s.body, { color: theme.textSecondary }]}>
                {item.longDescription || item.shortDescription || 'No description available.'}
              </Text>
            </GlassCard>

            <GlassCard style={s.card}>
              <Text style={[s.section, { color: theme.accent }]}>Commerce Data</Text>
              <Text style={[s.body, { color: theme.textSecondary }]}>
                Price: £{Number(item.price.incVat ?? item.price.listPrice ?? 0).toLocaleString()}
              </Text>
              <Text style={[s.body, { color: theme.textSecondary }]}>
                Stock: {item.stockLabel ?? item.stockStatus}
              </Text>
              <Text style={[s.body, { color: theme.textSecondary }]}>
                Tier: {item.tier}
              </Text>
              {!!item.leadTime && (
                <Text style={[s.body, { color: theme.textSecondary }]}>
                  Lead time: {item.leadTime}
                </Text>
              )}
            </GlassCard>

            <GlassCard style={s.card}>
              <Text style={[s.section, { color: theme.accent }]}>Compatibility</Text>
              <Text style={[s.body, { color: theme.textSecondary }]}>
                Recommendation eligible: {item.compatibility.recommendationEligible ? 'Yes' : 'No'}
              </Text>
              <Text style={[s.body, { color: theme.textSecondary }]}>
                Roles: {item.compatibility.systemRoles.join(', ') || 'None'}
              </Text>
            </GlassCard>

            <View style={s.actions}>
              <TouchableOpacity
                style={[s.btn, { borderColor: `${theme.accent}35` }]}
                onPress={() => router.push('/shop')}
                activeOpacity={0.8}
              >
                <Text style={[s.btnText, { color: theme.accent }]}>Open shop</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.btn, { backgroundColor: theme.accent, borderColor: theme.accent }]}
                onPress={() => item.manualUrl && Linking.openURL(item.manualUrl)}
                activeOpacity={0.8}
              >
                <Text style={[s.btnText, { color: '#1A1A1A' }]}>Manual</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flex: 1 },
  content: { padding: 24, paddingBottom: 40 },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 20 },
  backText: { fontSize: 14, fontWeight: '600' },
  title: { fontSize: 28, fontWeight: '800', marginBottom: 4 },
  subtitle: { fontSize: 12, marginBottom: 14 },
  card: { marginBottom: 10 },
  section: { fontSize: 10, letterSpacing: 1.5, fontWeight: '800', marginBottom: 8 },
  body: { fontSize: 13, lineHeight: 19 },
  actions: { marginTop: 6, flexDirection: 'row', gap: 8 },
  btn: { flex: 1, borderWidth: 1, borderRadius: 10, alignItems: 'center', paddingVertical: 12 },
  btnText: { fontSize: 13, fontWeight: '800' },
});

