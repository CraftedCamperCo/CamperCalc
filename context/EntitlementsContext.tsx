import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/utils/supabase';
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

export type Entitlement =
  | 'sales_suite_access'
  | 'electrical_install_guide'
  | 'electrical_schematic_access'
  | 'insulation_install_guide'
  | 'water_install_guide'
  | 'club_all_access';

interface EntitlementsContextValue {
  entitlements: Entitlement[];
  loading: boolean;
  has: (entitlement: Entitlement) => boolean;
  refresh: () => Promise<void>;
}

const EntitlementsContext = createContext<EntitlementsContextValue>({
  entitlements: [],
  loading: false,
  has: () => false,
  refresh: async () => {},
});

export function EntitlementsProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [entitlements, setEntitlements] = useState<Entitlement[]>([]);
  const [loading, setLoading] = useState(false);

  async function refresh() {
    if (!user) {
      setEntitlements([]);
      return;
    }
    setLoading(true);
    const { data, error } = await supabase
      .from('user_entitlements')
      .select('entitlement_type')
      .eq('user_id', user.id);

    if (error) {
      setEntitlements([]);
      setLoading(false);
      return;
    }
    const types = (data ?? [])
      .map((row: any) => row.entitlement_type)
      .filter(Boolean) as Entitlement[];
    setEntitlements(types);
    setLoading(false);
  }

  useEffect(() => {
    refresh();
  }, [user?.id]);

  const value = useMemo<EntitlementsContextValue>(
    () => ({
      entitlements,
      loading,
      has: (entitlement) =>
        entitlements.includes('club_all_access') ||
        entitlements.includes('sales_suite_access') ||
        entitlements.includes(entitlement),
      refresh,
    }),
    [entitlements, loading],
  );

  return <EntitlementsContext.Provider value={value}>{children}</EntitlementsContext.Provider>;
}

export function useEntitlements() {
  return useContext(EntitlementsContext);
}

