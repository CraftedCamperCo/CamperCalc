import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

function requirePublicEnv(name: string): string {
  const value = process.env[name];
  if (!value || !value.trim()) {
    throw new Error(
      `Missing ${name}. Add it to your environment (for local dev use .env.local) and restart Expo.`,
    );
  }
  return value;
}

export const SUPABASE_URL = requirePublicEnv('EXPO_PUBLIC_SUPABASE_URL');
export const SUPABASE_ANON_KEY = requirePublicEnv('EXPO_PUBLIC_SUPABASE_ANON_KEY');

const SecureStoreAdapter = {
  getItem: async (key: string) => {
    if (Platform.OS === 'web') return localStorage.getItem(key);
    return AsyncStorage.getItem(key);
  },
  setItem: async (key: string, value: string) => {
    if (Platform.OS === 'web') { localStorage.setItem(key, value); return; }
    // Supabase auth sessions can exceed SecureStore's practical payload limits.
    // AsyncStorage avoids truncation and keeps auth persistence stable.
    return AsyncStorage.setItem(key, value);
  },
  removeItem: async (key: string) => {
    if (Platform.OS === 'web') { localStorage.removeItem(key); return; }
    await AsyncStorage.removeItem(key);
    // Clean legacy entries if previous versions stored auth in SecureStore.
    try {
      await SecureStore.deleteItemAsync(key);
    } catch {}
  },
};

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: SecureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
