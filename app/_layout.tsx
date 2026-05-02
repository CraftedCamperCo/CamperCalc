import AppErrorBoundary from '@/components/AppErrorBoundary';
import CartAbandonmentWatcher from '@/components/CartAbandonmentWatcher';
import MailingListPopup from '@/components/MailingListPopup';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { CartProvider } from '@/context/CartContext';
import { EntitlementsProvider } from '@/context/EntitlementsContext';
import { ProjectProvider } from '@/context/ProjectContext';
import { ThemeProvider, useTheme } from '@/context/ThemeContext';
import { supabase } from '@/utils/supabase';
import { trackAppOpen } from '@/utils/analytics';
import { initialiseSentry } from '@/utils/sentry';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ResizeMode, Video } from 'expo-av';
import * as Linking from 'expo-linking';
import { Stack, usePathname, useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Dimensions, Image, Platform, StyleSheet, View } from 'react-native';
import * as Sentry from '@sentry/react-native';

initialiseSentry();
void SplashScreen.preventAutoHideAsync().catch(() => {
  // Expo Go and dev reloads can race with native splash registration.
});

const { width, height } = Dimensions.get('window');

function StripeProviderCompat({ children }: { children: React.ReactNode }) {
  const publishableKey = process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? '';
  if (!publishableKey) return <>{children}</>;

  try {
    // Avoid hard crash in Expo Go clients where native Stripe modules are unavailable.
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const stripeModule = require('@stripe/stripe-react-native');
    const RuntimeStripeProvider = stripeModule?.StripeProvider as React.ComponentType<{
      publishableKey: string;
      merchantIdentifier?: string;
      children: React.ReactNode;
    }> | undefined;
    if (!RuntimeStripeProvider) return <>{children}</>;
    return (
      <RuntimeStripeProvider
        publishableKey={publishableKey}
        merchantIdentifier="merchant.com.camperplan.crafted"
      >
        {children}
      </RuntimeStripeProvider>
    );
  } catch {
    return <>{children}</>;
  }
}

function OrbitalSplash({ onDone }: { onDone: () => void }) {
  const brandOpacity = useRef(new Animated.Value(0)).current;
  const cardScale = useRef(new Animated.Value(0.92)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const contentScale = useRef(new Animated.Value(1)).current;
  const screenOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    void SplashScreen.hideAsync().catch(() => {
      // Ignore if splash is already hidden or unavailable in this runtime.
    });
    trackAppOpen();

    Animated.sequence([
      Animated.parallel([
        Animated.timing(brandOpacity, { toValue: 1, duration: 650, useNativeDriver: true }),
        Animated.spring(cardScale, { toValue: 1, friction: 6, tension: 40, useNativeDriver: true }),
      ]),
      Animated.delay(320),
      Animated.timing(logoOpacity, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.delay(3600),
      Animated.parallel([
        Animated.timing(contentScale, { toValue: 1.2, duration: 550, useNativeDriver: true }),
        Animated.timing(screenOpacity, { toValue: 0, duration: 550, useNativeDriver: true }),
      ]),
    ]).start(onDone);
  }, []);

  return (
    <Animated.View style={[styles.splash, { backgroundColor: '#F8F9FA', opacity: screenOpacity }]}>
      <Animated.View style={{ transform: [{ scale: contentScale }], alignItems: 'center', gap: 28 }}>
        {Platform.OS !== 'web' && (
          <Animated.View style={[styles.videoCard, { opacity: brandOpacity, transform: [{ scale: cardScale }] }]}>
            <Video
              source={require('../assets/videos/intro.mp4')}
              style={styles.video}
              resizeMode={ResizeMode.CONTAIN}
              shouldPlay
              isLooping={false}
              isMuted
              useNativeControls={false}
            />
          </Animated.View>
        )}
        <Animated.View style={{ opacity: logoOpacity, alignItems: 'center' }}>
          <Image source={require('../assets/images/crafted-logo.png')} style={styles.logoImage} resizeMode="contain" />
        </Animated.View>
        <Animated.Text style={styles.tagline}>
          CamperPlan by Crafted
        </Animated.Text>
      </Animated.View>
    </Animated.View>
  );
}

const POPUP_STORAGE_KEY = '@crafted_mailing_popup_shown';
const POPUP_TIMER_MS = 90_000;

function useMailingPopup() {
  const [showPopup, setShowPopup] = useState(false);
  const hasFired = useRef(false);
  const pathname = usePathname();

  const triggerPopup = useCallback(async () => {
    if (hasFired.current) return;
    try {
      const stored = await AsyncStorage.getItem(POPUP_STORAGE_KEY);
      if (stored === 'true') { hasFired.current = true; return; }
    } catch {}
    hasFired.current = true;
    setShowPopup(true);
  }, []);

  const dismissPopup = useCallback(async () => {
    setShowPopup(false);
    try { await AsyncStorage.setItem(POPUP_STORAGE_KEY, 'true'); } catch {}
  }, []);

  useEffect(() => {
    if (pathname?.includes('results')) triggerPopup();
  }, [pathname]);

  useEffect(() => {
    const timer = setTimeout(triggerPopup, POPUP_TIMER_MS);
    return () => clearTimeout(timer);
  }, []);

  return { showPopup, dismissPopup };
}

function usePasswordRecoveryNavigation() {
  const { isRecoveringPassword } = useAuth();
  const router = useRouter();

  // Navigate to reset-password whenever Supabase fires a PASSWORD_RECOVERY event
  useEffect(() => {
    if (isRecoveringPassword) {
      router.push('/reset-password');
    }
  }, [isRecoveringPassword]);
}

function useDeepLinkRecovery() {
  // Parse recovery tokens from the deep link URL and hand them to Supabase.
  // Supabase then fires onAuthStateChange with PASSWORD_RECOVERY.
  useEffect(() => {
    const handleUrl = async (url: string) => {
      if (!url.includes('type=recovery')) return;

      // Tokens can be in the fragment (#) or query string (?)
      const fragmentIndex = url.indexOf('#');
      const queryIndex = url.indexOf('?');
      const paramString = fragmentIndex !== -1
        ? url.slice(fragmentIndex + 1)
        : queryIndex !== -1 ? url.slice(queryIndex + 1) : '';

      if (!paramString) return;

      const params = new URLSearchParams(paramString);
      const accessToken = params.get('access_token');
      const refreshToken = params.get('refresh_token');

      if (accessToken && refreshToken) {
        await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
      }
    };

    // Cold-start deep link
    Linking.getInitialURL().then((url) => { if (url) void handleUrl(url); });

    // Foreground deep link
    const sub = Linking.addEventListener('url', ({ url }) => { void handleUrl(url); });
    return () => sub.remove();
  }, []);
}

function AppNavigator() {
  const theme = useTheme();
  const { showPopup, dismissPopup } = useMailingPopup();

  useDeepLinkRecovery();
  usePasswordRecoveryNavigation();

  return (
    <>
      <Stack screenOptions={{ headerShown: false, animation: 'fade', contentStyle: { backgroundColor: theme.background } }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="auth" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
        <Stack.Screen name="projects" />
        <Stack.Screen name="craft" />
        <Stack.Screen name="export" />
        <Stack.Screen name="wiring" />
        <Stack.Screen name="recommendations-explainer" />
        <Stack.Screen name="schematic-detail" options={{ presentation: 'fullScreenModal', animation: 'slide_from_bottom' }} />
        <Stack.Screen name="shop" />
        <Stack.Screen name="repository-item" />
        <Stack.Screen name="basket" />
        <Stack.Screen name="checkout-web" />
        <Stack.Screen name="furniture-kit" />
        <Stack.Screen name="compare" />
        <Stack.Screen name="club" />
        <Stack.Screen name="checkout-success" />
        <Stack.Screen name="checkout-cancel" />
        <Stack.Screen name="terms" />
        <Stack.Screen name="privacy" />
        <Stack.Screen name="returns" />
        <Stack.Screen name="shipping" />
        <Stack.Screen name="cookies" />
        <Stack.Screen name="faq" />
        <Stack.Screen name="support" />
        <Stack.Screen name="reset-password" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
        <Stack.Screen name="(calc)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="+not-found" />
      </Stack>
      <CartAbandonmentWatcher />
      <MailingListPopup visible={showPopup} onDismiss={dismissPopup} />
    </>
  );
}

export default Sentry.wrap(function RootLayout() {
  // Skip the orbital splash screen on web. The intro video is iOS-only branding
  // and feels heavy/slow when loading the web app in a browser. iOS users still
  // get the full splash experience.
  const [splashDone, setSplashDone] = useState(Platform.OS === 'web');

  return (
    <AppErrorBoundary>
      <StripeProviderCompat>
        <ThemeProvider>
          <AuthProvider>
            <CartProvider>
              <EntitlementsProvider>
                <ProjectProvider>
                  {!splashDone ? (
                    <OrbitalSplash onDone={() => setSplashDone(true)} />
                  ) : (
                    <AppNavigator />
                  )}
                </ProjectProvider>
              </EntitlementsProvider>
            </CartProvider>
          </AuthProvider>
        </ThemeProvider>
      </StripeProviderCompat>
    </AppErrorBoundary>
  );
});

const styles = StyleSheet.create({
  splash: {
    position: 'absolute',
    top: 0, left: 0,
    width, height,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
  },
  logoImage: {
    width: 260,
    height: 95,
  },
  videoCard: {
    width: Math.min(width - 52, 330),
    aspectRatio: 9 / 16,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
  },
  video: {
    width: '100%',
    height: '100%',
  },
  tagline: {
    fontSize: 12,
    fontWeight: '500',
    letterSpacing: 2.5,
    color: '#333333',
    textTransform: 'uppercase',
  },
});
