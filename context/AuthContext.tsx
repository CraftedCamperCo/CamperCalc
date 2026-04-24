import { clearUser, identifyUser } from '@/utils/analytics';
import { supabase } from '@/utils/supabase';
import { Session, User } from '@supabase/supabase-js';
import React, { createContext, useContext, useEffect, useState } from 'react';

interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isRecoveringPassword: boolean;
  signUp: (email: string, password: string, firstName?: string, lastName?: string) => Promise<{ error?: string }>;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  deleteAccount: () => Promise<{ error?: string }>;
  forgotPassword: (email: string) => Promise<{ error?: string }>;
  updatePassword: (password: string) => Promise<{ error?: string }>;
  updateProfile: (firstName: string, lastName?: string) => Promise<{ error?: string }>;
}

const AuthContext = createContext<AuthState>({
  user: null,
  session: null,
  loading: true,
  isRecoveringPassword: false,
  signUp: async () => ({}),
  signIn: async () => ({}),
  signOut: async () => {},
  deleteAccount: async () => ({}),
  forgotPassword: async () => ({}),
  updatePassword: async () => ({}),
  updateProfile: async () => ({}),
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRecoveringPassword, setIsRecoveringPassword] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      setUser(s?.user ?? null);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (_event === 'PASSWORD_RECOVERY') {
        setIsRecoveringPassword(true);
      }
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

  const deleteAccount = async () => {
    try {
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      if (!currentSession?.access_token) return { error: 'Not signed in' };

      const response = await supabase.functions.invoke('delete-account', {
        headers: { Authorization: `Bearer ${currentSession.access_token}` },
      });

      if (response.error) return { error: response.error.message || 'Failed to delete account' };

      // Sign out locally after successful deletion
      await supabase.auth.signOut();
      return {};
    } catch (e: any) {
      return { error: e.message || 'Failed to delete account' };
    }
  };

  const forgotPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'https://camperplan.com/reset-password.html',
    });
    if (error) return { error: error.message };
    return {};
  };

  const updatePassword = async (password: string) => {
    const { error } = await supabase.auth.updateUser({ password });
    if (error) return { error: error.message };
    setIsRecoveringPassword(false);
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
    <AuthContext.Provider value={{ user, session, loading, isRecoveringPassword, signUp, signIn, signOut, deleteAccount, forgotPassword, updatePassword, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
