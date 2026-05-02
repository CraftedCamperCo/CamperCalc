import GlassCard from '@/components/GlassCard';
import TopographicBackground from '@/components/TopographicBackground';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { supabase } from '@/utils/supabase';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ResetPasswordScreen() {
  const theme = useTheme();
  const { updatePassword } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const isDark = theme.blurTint === 'dark';

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [done, setDone] = useState(false);

  // Web only: when Supabase redirects the user back to /reset-password the
  // recovery tokens land in the URL hash fragment. Our Supabase client has
  // detectSessionInUrl disabled (so the iOS deep-link path can manage its own
  // session), which means we need to extract the tokens manually here on web
  // and hand them to Supabase. Once setSession runs, AuthContext fires
  // PASSWORD_RECOVERY and the user can set a new password.
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;
    const hash = window.location.hash || '';
    const search = window.location.search || '';
    const paramString = hash.startsWith('#')
      ? hash.slice(1)
      : search.startsWith('?') ? search.slice(1) : '';
    if (!paramString.includes('type=recovery')) return;
    const params = new URLSearchParams(paramString);
    const accessToken = params.get('access_token');
    const refreshToken = params.get('refresh_token');
    if (accessToken && refreshToken) {
      supabase.auth
        .setSession({ access_token: accessToken, refresh_token: refreshToken })
        .catch(() => {});
      // Strip the tokens from the URL so a refresh does not re-trigger the flow.
      try {
        window.history.replaceState({}, document.title, window.location.pathname);
      } catch {}
    }
  }, []);

  const placeholderColor = isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.35)';
  const inputStyle = [styles.input, {
    color: theme.text,
    backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
    borderColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.12)',
  }];

  const handleSubmit = async () => {
    Keyboard.dismiss();
    setErrorMsg('');

    if (!password) { setErrorMsg('Please enter a new password'); return; }
    if (password.length < 6) { setErrorMsg('Password must be at least 6 characters'); return; }
    if (password !== confirmPassword) { setErrorMsg('Passwords do not match'); return; }

    setLoading(true);
    const result = await updatePassword(password);
    setLoading(false);

    if (result.error) {
      setErrorMsg(result.error);
      return;
    }

    setDone(true);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <TopographicBackground />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.keyboardWrap}>
        <ScrollView
          contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 60 }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.logoWrap}>
            <Image
              source={require('../assets/images/crafted-logo.png')}
              style={styles.logo}
              resizeMode="contain"
            />
            <Text style={[styles.appName, { color: theme.textSecondary }]}>CamperPlan by Crafted</Text>
          </View>

          <GlassCard style={styles.card}>
            {done ? (
              <>
                <Text style={[styles.title, { color: theme.text }]}>Password Updated</Text>
                <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
                  Your password has been changed successfully. You're now signed in.
                </Text>
                <TouchableOpacity
                  style={[styles.submitBtn, { backgroundColor: theme.accent }]}
                  onPress={() => router.replace('/')}
                  activeOpacity={0.85}
                >
                  <Text style={styles.submitBtnText}>Go to App</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Text style={[styles.title, { color: theme.text }]}>Set New Password</Text>
                <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
                  Choose a new password for your CamperPlan account.
                </Text>

                <TextInput
                  style={inputStyle}
                  placeholder="New password"
                  placeholderTextColor={placeholderColor}
                  value={password}
                  onChangeText={(v) => { setPassword(v); setErrorMsg(''); }}
                  secureTextEntry
                  textContentType="newPassword"
                  autoComplete="new-password"
                  returnKeyType="next"
                />

                <TextInput
                  style={inputStyle}
                  placeholder="Confirm new password"
                  placeholderTextColor={placeholderColor}
                  value={confirmPassword}
                  onChangeText={(v) => { setConfirmPassword(v); setErrorMsg(''); }}
                  secureTextEntry
                  textContentType="newPassword"
                  autoComplete="new-password"
                  returnKeyType="go"
                  onSubmitEditing={handleSubmit}
                />

                {errorMsg ? (
                  <Text style={[styles.errorText, { color: theme.danger }]}>{errorMsg}</Text>
                ) : null}

                <TouchableOpacity
                  style={[styles.submitBtn, { backgroundColor: theme.accent, opacity: loading ? 0.7 : 1 }]}
                  onPress={handleSubmit}
                  activeOpacity={0.85}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text style={styles.submitBtnText}>Update Password</Text>
                  )}
                </TouchableOpacity>
              </>
            )}
          </GlassCard>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  keyboardWrap: { flex: 1 },
  scrollContent: { padding: 24, minHeight: '100%', justifyContent: 'center' },
  logoWrap: { alignItems: 'center', marginBottom: 40 },
  logo: { width: 200, height: 70 },
  appName: { fontSize: 12, fontWeight: '600', letterSpacing: 2, textTransform: 'uppercase', marginTop: 10 },
  card: { marginBottom: 24 },
  title: { fontSize: 26, fontWeight: '800', marginBottom: 6 },
  subtitle: { fontSize: 14, lineHeight: 20, marginBottom: 22 },
  input: { borderRadius: 10, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 13, fontSize: 15, marginBottom: 10 },
  errorText: { fontSize: 13, fontWeight: '600', marginBottom: 8, marginLeft: 4 },
  submitBtn: { paddingVertical: 15, borderRadius: 10, alignItems: 'center', marginTop: 4 },
  submitBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
});
