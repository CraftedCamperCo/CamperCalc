import { clearUser, identifyUser } from '@/utils/analytics';
import { supabase } from '@/utils/supabase';
import { Session, User } from '@supabase/supabase-js';
import React, { createContext, useContext, useEffect, useState } from 'react';

interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, firstName?: string, lastName?: string) => Promise<{ error?: string }>;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  forgotPassword: (email: string) => Promise<{ error?: string }>;
  updateProfile: (firstName: string, lastName?: string) => Promise<{ error?: string }>;
}

const AuthContext = createContext<AuthState>({
  user: null,
  session: null,
  loading: true,
  signUp: async () => ({}),
  signIn: async () => ({}),
  signOut: async () => {},
  forgotPassword: async () => ({}),
  updateProfile: async () => ({}),
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      setUser(s?.user ?? null);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) identifyUser(s.user.id, s.user.email);
      else clearUser();
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, firstName?: string, lastName?: string) => {
    const referralCode = Math.random().toString(36).slice(2, 10).toUpperCase();
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: firstName || '',
          last_name: lastName || '',
          full_name: [firstName, lastName].filter(Boolean).join(' '),
          referral_code: referralCode,
        },
      },
    });
    if (error) return { error: error.message };
    return {};
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message };
    return {};
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const forgotPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) return { error: error.message };
    return {};
  };

  const updateProfile = async (firstName: string, lastName?: string) => {
    const { data, error } = await supabase.auth.updateUser({
      data: {
        first_name: firstName,
        last_name: lastName || '',
        full_name: [firstName, lastName].filter(Boolean).join(' '),
      },
    });
    if (error) return { error: error.message };
    if (data.user) setUser(data.user);
    return {};
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signUp, signIn, signOut, forgotPassword, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
