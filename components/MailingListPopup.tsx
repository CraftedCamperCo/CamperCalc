import { useTheme } from '@/context/ThemeContext';
import { FEATURE_FLAGS } from '@/constants/featureFlags';
import { subscribeToMailerLite } from '@/utils/mailerlite';
import { BlurView } from 'expo-blur';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

const { width, height } = Dimensions.get('window');

interface Props {
  visible: boolean;
  onDismiss: () => void;
}

export default function MailingListPopup({ visible, onDismiss }: Props) {
  const theme = useTheme();
  const isDark = theme.blurTint === 'dark';
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.85)).current;

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: 350, useNativeDriver: true }),
        Animated.spring(scale, { toValue: 1, friction: 7, tension: 60, useNativeDriver: true }),
      ]).start();
    } else {
      opacity.setValue(0);
      scale.setValue(0.85);
    }
  }, [visible]);

  const dismiss = () => {
    Keyboard.dismiss();
    Animated.parallel([
      Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }),
      Animated.timing(scale, { toValue: 0.85, duration: 200, useNativeDriver: true }),
    ]).start(() => onDismiss());
  };

  const isValidEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

  const handleSubmit = async () => {
    if (!firstName.trim()) { setErrorMsg('Please enter your first name'); setStatus('error'); return; }
    if (!email.trim()) { setErrorMsg('Please enter your email'); setStatus('error'); return; }
    if (!isValidEmail(email.trim())) { setErrorMsg('Please enter a valid email'); setStatus('error'); return; }

    Keyboard.dismiss();
    setStatus('loading');
    setErrorMsg('');

    const result = await subscribeToMailerLite({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim(),
      phone: phone.trim() || undefined,
      city: city.trim() || undefined,
    });

    if (result.success) {
      setStatus('success');
    } else {
      setErrorMsg(result.error || 'Something went wrong');
      setStatus('error');
    }
  };

  if (!visible) return null;

  const inputStyle = [styles.input, {
    color: theme.text,
    backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
    borderColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.1)',
  }];

  return (
    <Animated.View style={[styles.overlay, { opacity }]}>
      <Pressable style={StyleSheet.absoluteFillObject} onPress={dismiss} />
      <BlurView intensity={40} tint={theme.blurTint} style={StyleSheet.absoluteFillObject} />
      <View style={[StyleSheet.absoluteFillObject, { backgroundColor: isDark ? 'rgba(0,0,0,0.5)' : 'rgba(0,0,0,0.3)' }]} />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.keyboardWrap}>
        <Animated.View style={[styles.cardWrap, { transform: [{ scale }] }]}>
          <View style={[styles.card, {
            backgroundColor: isDark ? 'rgba(40,40,46,0.95)' : 'rgba(255,255,255,0.97)',
            borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
          }]}>
            <ScrollView showsVerticalScrollIndicator={false} bounces={false} keyboardShouldPersistTaps="handled">

              {/* Close button */}
              <TouchableOpacity style={styles.closeBtn} onPress={dismiss} activeOpacity={0.7} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Text style={[styles.closeBtnText, { color: theme.textSecondary }]}>✕</Text>
              </TouchableOpacity>

              {status === 'success' ? (
                <View style={styles.successWrap}>
                  <View style={[styles.successCircle, { backgroundColor: `${theme.successBright}22`, borderColor: theme.successBright }]}>
                    <Text style={[styles.successCheck, { color: theme.successBright }]}>✓</Text>
                  </View>
                  <Text style={[styles.successTitle, { color: theme.text }]}>You're on the list.</Text>
                  <Text style={[styles.successSub, { color: theme.textSecondary }]}>
                    We'll keep you updated with new releases and build guidance. Keep an eye on your inbox.
                  </Text>
                  <TouchableOpacity style={[styles.successBtn, { backgroundColor: theme.accent }]} onPress={dismiss} activeOpacity={0.85}>
                    <Text style={styles.successBtnText}>Done</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <>
                  {/* Founder intro */}
                  <View style={styles.founderRow}>
                    <Image
                      source={require('../assets/images/dan-founder.png')}
                      style={styles.founderPhoto}
                    />
                    <View style={styles.founderInfo}>
                      <Text style={[styles.founderName, { color: theme.text }]}>Dan Andrews</Text>
                      <Text style={[styles.founderRole, { color: theme.accent }]}>Founder, Crafted Camper Co.</Text>
                    </View>
                  </View>

                  <Text style={[styles.founderQuote, { color: theme.text }]}>
                    I built CamperPlan to give every builder — whether it's your first van or your fiftieth — the confidence to get their systems right. No gatekeeping, no paywall. Just honest calculations that work.
                  </Text>
                  <Text style={[styles.founderQuoteSub, { color: theme.textSecondary }]}>
                    This app is free because I believe everyone deserves access to the knowledge that makes a safe, reliable build.
                  </Text>

                  {/* Divider */}
                  <View style={[styles.divider, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }]} />

                  {FEATURE_FLAGS.THREE_D_KITS_ENABLED && (
                    <>
                      {/* Flat-pack teaser */}
                      <View style={[styles.badge, { backgroundColor: `${theme.accent}18`, borderColor: `${theme.accent}40` }]}>
                        <Text style={[styles.badgeText, { color: theme.accent }]}>COMING SOON</Text>
                      </View>

                      <Text style={[styles.teaseTitle, { color: theme.text }]}>DIY Flat-Pack Furniture Kits</Text>
                      <Text style={[styles.teaseBody, { color: theme.textSecondary }]}>
                        Precision CNC-cut van life furniture — flat-packed and shipped to your door, just like IKEA. Designed by us, assembled by you. Be the first to know when they drop.
                      </Text>
                    </>
                  )}

                  {/* Form */}
                  <View style={styles.nameRow}>
                    <TextInput
                      style={[inputStyle, { flex: 1 }]}
                      placeholder="First name *"
                      placeholderTextColor={theme.textSecondary}
                      value={firstName}
                      onChangeText={setFirstName}
                      autoCapitalize="words"
                      returnKeyType="next"
                    />
                    <TextInput
                      style={[inputStyle, { flex: 1 }]}
                      placeholder="Last name"
                      placeholderTextColor={theme.textSecondary}
                      value={lastName}
                      onChangeText={setLastName}
                      autoCapitalize="words"
                      returnKeyType="next"
                    />
                  </View>

                  <TextInput
                    style={inputStyle}
                    placeholder="Email address *"
                    placeholderTextColor={theme.textSecondary}
                    value={email}
                    onChangeText={(v) => { setEmail(v); if (status === 'error') setStatus('idle'); }}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    returnKeyType="next"
                  />

                  <View style={styles.nameRow}>
                    <TextInput
                      style={[inputStyle, { flex: 1 }]}
                      placeholder="Phone (optional)"
                      placeholderTextColor={theme.textSecondary}
                      value={phone}
                      onChangeText={setPhone}
                      keyboardType="phone-pad"
                      returnKeyType="next"
                    />
                    <TextInput
                      style={[inputStyle, { flex: 1 }]}
                      placeholder="City (optional)"
                      placeholderTextColor={theme.textSecondary}
                      value={city}
                      onChangeText={setCity}
                      autoCapitalize="words"
                      returnKeyType="go"
                      onSubmitEditing={handleSubmit}
                    />
                  </View>

                  {status === 'error' && errorMsg ? (
                    <Text style={[styles.errorText, { color: theme.danger }]}>{errorMsg}</Text>
                  ) : null}

                  <TouchableOpacity
                    style={[styles.submitBtn, { backgroundColor: theme.accent, opacity: status === 'loading' ? 0.7 : 1 }]}
                    onPress={handleSubmit}
                    activeOpacity={0.85}
                    disabled={status === 'loading'}
                  >
                    {status === 'loading' ? (
                      <ActivityIndicator color="#fff" size="small" />
                    ) : (
                      <Text style={styles.submitBtnText}>
                        {FEATURE_FLAGS.THREE_D_KITS_ENABLED ? 'Join the Waitlist' : 'Join the List'}
                      </Text>
                    )}
                  </TouchableOpacity>

                  <Text style={[styles.privacy, { color: theme.textSecondary }]}>
                    No spam, ever. Unsubscribe anytime.
                  </Text>
                </>
              )}
            </ScrollView>
          </View>
        </Animated.View>
      </KeyboardAvoidingView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0, left: 0,
    width, height,
    zIndex: 10000,
    justifyContent: 'center',
    alignItems: 'center',
  },
  keyboardWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 20,
  },
  cardWrap: {
    width: '100%',
    maxWidth: 400,
    maxHeight: height * 0.85,
  },
  card: {
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 30,
    shadowOffset: { width: 0, height: 12 },
    elevation: 20,
    maxHeight: height * 0.82,
  },
  closeBtn: {
    position: 'absolute',
    top: 0,
    right: 0,
    zIndex: 10,
  },
  closeBtnText: {
    fontSize: 18,
    fontWeight: '300',
  },
  founderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 16,
    marginRight: 28,
  },
  founderPhoto: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  founderInfo: {
    flex: 1,
  },
  founderName: {
    fontSize: 16,
    fontWeight: '800',
  },
  founderRole: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  founderQuote: {
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '500',
    marginBottom: 8,
  },
  founderQuoteSub: {
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 4,
  },
  divider: {
    height: 1,
    marginVertical: 18,
  },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 12,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  teaseTitle: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 8,
  },
  teaseBody: {
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 18,
  },
  nameRow: {
    flexDirection: 'row',
    gap: 8,
  },
  input: {
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 14,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
    marginLeft: 4,
  },
  submitBtn: {
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 4,
  },
  submitBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
  },
  privacy: {
    fontSize: 11,
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 4,
  },
  successWrap: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  successCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  successCheck: {
    fontSize: 28,
    fontWeight: '800',
  },
  successTitle: {
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 8,
  },
  successSub: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 24,
  },
  successBtn: {
    paddingVertical: 12,
    paddingHorizontal: 40,
    borderRadius: 10,
  },
  successBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '800',
  },
});
