import GlassCard from '@/components/GlassCard';
import TopographicBackground from '@/components/TopographicBackground';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { identifyUser, trackAuthError, trackAuthSuccess } from '@/utils/analytics';
import { subscribeToMailerLite } from '@/utils/mailerlite';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type Mode = 'login' | 'signup' | 'forgot';

export default function AuthScreen() {
  const theme = useTheme();
  const { signIn, signUp, forgotPassword, user, loading: authLoading } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const isDark = theme.blurTint === 'dark';

  const [mode, setMode] = useState<Mode>('login');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [mailingOptIn, setMailingOptIn] = useState(true);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const fadeAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!authLoading && user) {
      router.replace('/');
    }
  }, [authLoading, user, router]);

  const switchMode = (to: Mode) => {
    Animated.timing(fadeAnim, { toValue: 0, duration: 150, useNativeDriver: true }).start(() => {
      setMode(to);
      setErrorMsg('');
      setSuccessMsg('');
      Animated.timing(fadeAnim, { toValue: 1, duration: 250, useNativeDriver: true }).start();
    });
  };

  const handleSubmit = async () => {
    Keyboard.dismiss();
    setErrorMsg('');
    setSuccessMsg('');

    if (!email.trim()) { setErrorMsg('Please enter your email'); return; }

    if (mode === 'forgot') {
      setLoading(true);
      const result = await forgotPassword(email.trim());
      setLoading(false);
      if (result.error) { setErrorMsg(result.error); return; }
      setSuccessMsg('Password reset link sent to your email.');
      return;
    }

    if (!password) { setErrorMsg('Please enter your password'); return; }

    if (mode === 'signup') {
      if (!firstName.trim()) { setErrorMsg('Please enter your first name'); return; }
      if (password.length < 6) { setErrorMsg('Password must be at least 6 characters'); return; }
      if (password !== confirmPassword) { setErrorMsg('Passwords do not match'); return; }
      if (!termsAccepted) { setErrorMsg('Please accept the Terms of Use to continue'); return; }
      setLoading(true);
      const result = await signUp(email.trim(), password, firstName.trim(), lastName.trim());
      setLoading(false);
      if (result.error) { setErrorMsg(result.error); return; }
      if (mailingOptIn) {
        subscribeToMailerLite({
          email: email.trim(),
          firstName: firstName.trim(),
          lastName: lastName.trim(),
        }).catch(() => {});
      }
      setSuccessMsg('Check your email to confirm your account, then sign in.');
      setMode('login');
      return;
    }

    setLoading(true);
    const result = await signIn(email.trim(), password);
    setLoading(false);
    if (result.error) {
      setErrorMsg(result.error);
      trackAuthError(result.error);
      return;
    }
    trackAuthSuccess('email');
    router.replace('/');
  };

  const placeholderColor = isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.35)';
  const inputStyle = [styles.input, {
    color: theme.text,
    backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
    borderColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.12)',
  }];

  const titles: Record<Mode, string> = {
    login: 'Welcome Back',
    signup: 'Create Account',
    forgot: 'Reset Password',
  };

  const subtitles: Record<Mode, string> = {
    login: 'Sign in to access your saved projects.',
    signup: 'Start saving and managing your van build projects.',
    forgot: 'Enter your email and we\'ll send a reset link.',
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <TopographicBackground />

      <TouchableOpacity
        style={[styles.backBtn, { top: insets.top + 10 }]}
        onPress={() => router.canGoBack() ? router.back() : router.replace('/')}
        activeOpacity={0.7}
      >
        <FontAwesome name="chevron-left" size={16} color={theme.accent} />
        <Text style={[styles.backText, { color: theme.accent }]}>Home</Text>
      </TouchableOpacity>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.keyboardWrap}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

          <View style={styles.logoWrap}>
            <Image
              source={require('../assets/images/crafted-logo.png')}
              style={styles.logo}
              resizeMode="contain"
            />
            <Text style={[styles.appName, { color: theme.textSecondary }]}>CamperPlan by Crafted</Text>
          </View>

          <Animated.View style={{ opacity: fadeAnim }}>
            <GlassCard style={styles.card}>
              <Text style={[styles.title, { color: theme.text }]}>{titles[mode]}</Text>
              <Text style={[styles.subtitle, { color: theme.textSecondary }]}>{subtitles[mode]}</Text>

              {mode === 'signup' && (
                <View style={styles.nameRow}>
                  <TextInput
                    style={[inputStyle, styles.nameInput]}
                    placeholder="First name"
                    placeholderTextColor={placeholderColor}
                    value={firstName}
                    onChangeText={(v) => { setFirstName(v); setErrorMsg(''); }}
                    autoCapitalize="words"
                    textContentType="givenName"
                    autoComplete="given-name"
                    returnKeyType="next"
                  />
                  <TextInput
                    style={[inputStyle, styles.nameInput]}
                    placeholder="Last name"
                    placeholderTextColor={placeholderColor}
                    value={lastName}
                    onChangeText={(v) => { setLastName(v); setErrorMsg(''); }}
                    autoCapitalize="words"
                    textContentType="familyName"
                    autoComplete="family-name"
                    returnKeyType="next"
                  />
                </View>
              )}

              <TextInput
                style={inputStyle}
                placeholder="Email address"
                placeholderTextColor={placeholderColor}
                value={email}
                onChangeText={(v) => { setEmail(v); setErrorMsg(''); }}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                textContentType="emailAddress"
                autoComplete="email"
                returnKeyType={mode === 'forgot' ? 'go' : 'next'}
                onSubmitEditing={mode === 'forgot' ? handleSubmit : undefined}
              />

              {mode !== 'forgot' && (
                <TextInput
                  style={inputStyle}
                  placeholder="Password"
                  placeholderTextColor={placeholderColor}
                  value={password}
                  onChangeText={(v) => { setPassword(v); setErrorMsg(''); }}
                  secureTextEntry
                  textContentType={mode === 'signup' ? 'newPassword' : 'password'}
                  autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                  returnKeyType={mode === 'signup' ? 'next' : 'go'}
                  onSubmitEditing={mode === 'login' ? handleSubmit : undefined}
                />
              )}

              {mode === 'signup' && (
                <TextInput
                  style={inputStyle}
                  placeholder="Confirm password"
                  placeholderTextColor={placeholderColor}
                  value={confirmPassword}
                  onChangeText={(v) => { setConfirmPassword(v); setErrorMsg(''); }}
                  secureTextEntry
                  textContentType="newPassword"
                  autoComplete="new-password"
                  returnKeyType="go"
                  onSubmitEditing={handleSubmit}
                />
              )}

              {mode === 'signup' && (
                <>
                  <TouchableOpacity style={styles.optInRow} onPress={() => setTermsAccepted(!termsAccepted)} activeOpacity={0.8}>
                    <Switch value={termsAccepted} onValueChange={setTermsAccepted} trackColor={{ false: isDark ? '#2C2C2E' : '#D1D1D6', true: theme.success }} thumbColor="#fff" style={{ transform: [{ scale: 0.8 }] }} />
                    <Text style={[styles.optInText, { color: theme.textSecondary }]}>
                      I agree to the{' '}
                      <Text style={{ color: theme.accent, fontWeight: '700' }} onPress={() => router.push('/terms')}>Terms of Use</Text>
                      {' '}and{' '}
                      <Text style={{ color: theme.accent, fontWeight: '700' }} onPress={() => router.push('/privacy')}>Privacy Policy</Text>
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.optInRow} onPress={() => setMailingOptIn(!mailingOptIn)} activeOpacity={0.8}>
                    <Switch value={mailingOptIn} onValueChange={setMailingOptIn} trackColor={{ false: isDark ? '#2C2C2E' : '#D1D1D6', true: theme.success }} thumbColor="#fff" style={{ transform: [{ scale: 0.8 }] }} />
                    <Text style={[styles.optInText, { color: theme.textSecondary }]}>Get exclusive discounts and build tips via email</Text>
                  </TouchableOpacity>
                </>
              )}

              {errorMsg ? <Text style={[styles.errorText, { color: theme.danger }]}>{errorMsg}</Text> : null}
              {successMsg ? <Text style={[styles.successText, { color: theme.successBright }]}>{successMsg}</Text> : null}

              <TouchableOpacity
                style={[styles.submitBtn, { backgroundColor: theme.accent, opacity: loading ? 0.7 : 1 }]}
                onPress={handleSubmit}
                activeOpacity={0.85}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.submitBtnText}>
                    {mode === 'login' ? 'Sign In' : mode === 'signup' ? 'Create Account' : 'Send Reset Link'}
                  </Text>
                )}
              </TouchableOpacity>

              {mode === 'login' && (
                <TouchableOpacity onPress={() => switchMode('forgot')} style={styles.linkBtn}>
                  <Text style={[styles.linkText, { color: theme.textSecondary }]}>Forgot your password?</Text>
                </TouchableOpacity>
              )}
            </GlassCard>
          </Animated.View>

          <View style={styles.switchRow}>
            {mode === 'login' ? (
              <TouchableOpacity onPress={() => switchMode('signup')}>
                <Text style={[styles.switchText, { color: theme.textSecondary }]}>
                  Don't have an account? <Text style={{ color: theme.accent, fontWeight: '700' }}>Sign up</Text>
                </Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity onPress={() => switchMode('login')}>
                <Text style={[styles.switchText, { color: theme.textSecondary }]}>
                  Already have an account? <Text style={{ color: theme.accent, fontWeight: '700' }}>Sign in</Text>
                </Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.legalLinks}>
            <TouchableOpacity onPress={() => router.push('/terms')}>
              <Text style={[styles.legalLinkText, { color: theme.textSecondary }]}>Terms of Use</Text>
            </TouchableOpacity>
            <Text style={[styles.legalSep, { color: theme.textSecondary }]}>·</Text>
            <TouchableOpacity onPress={() => router.push('/privacy')}>
              <Text style={[styles.legalLinkText, { color: theme.textSecondary }]}>Privacy Policy</Text>
            </TouchableOpacity>
            <Text style={[styles.legalSep, { color: theme.textSecondary }]}>·</Text>
            <TouchableOpacity onPress={() => router.push('/cookies')}>
              <Text style={[styles.legalLinkText, { color: theme.textSecondary }]}>Cookie Policy</Text>
            </TouchableOpacity>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  backBtn: { position: 'absolute', left: 20, zIndex: 10, flexDirection: 'row', alignItems: 'center', gap: 6 },
  backText: { fontSize: 15, fontWeight: '600' },
  keyboardWrap: { flex: 1 },
  scrollContent: { padding: 24, paddingTop: 100, minHeight: '100%', justifyContent: 'center' },
  logoWrap: { alignItems: 'center', marginBottom: 40 },
  logo: { width: 200, height: 70 },
  appName: { fontSize: 12, fontWeight: '600', letterSpacing: 2, textTransform: 'uppercase', marginTop: 10 },
  card: { marginBottom: 24 },
  title: { fontSize: 26, fontWeight: '800', marginBottom: 6 },
  subtitle: { fontSize: 14, lineHeight: 20, marginBottom: 22 },
  input: { borderRadius: 10, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 13, fontSize: 15, marginBottom: 10 },
  nameRow: { flexDirection: 'row', gap: 10 },
  nameInput: { flex: 1 },
  errorText: { fontSize: 13, fontWeight: '600', marginBottom: 8, marginLeft: 4 },
  successText: { fontSize: 13, fontWeight: '600', marginBottom: 8, marginLeft: 4 },
  submitBtn: { paddingVertical: 15, borderRadius: 10, alignItems: 'center', marginTop: 4 },
  submitBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  linkBtn: { alignItems: 'center', marginTop: 14 },
  linkText: { fontSize: 13 },
  switchRow: { alignItems: 'center', marginTop: 8 },
  switchText: { fontSize: 14 },
  optInRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10, paddingVertical: 4 },
  optInText: { fontSize: 12, flex: 1, lineHeight: 16 },
  legalLinks: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, marginTop: 16, marginBottom: 20 },
  legalLinkText: { fontSize: 12, textDecorationLine: 'underline' },
  legalSep: { fontSize: 12 },
});
