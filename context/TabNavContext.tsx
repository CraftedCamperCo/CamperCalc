import { usePathname, useRouter } from 'expo-router';
import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { FEATURE_FLAGS } from '@/constants/featureFlags';
import { tapHaptic } from '@/utils/haptics';

const ROUTES = FEATURE_FLAGS.THREE_D_KITS_ENABLED
  ? ['/', '/two', '/insulation', '/water', '/furniture', '/three']
  : ['/', '/two', '/insulation', '/water', '/three'];

interface TabNavState {
  currentIndex: number;
  prevIndex: number;
  totalTabs: number;
  navigate: (index: number) => void;
}

const TabNavContext = createContext<TabNavState>({
  currentIndex: 0,
  prevIndex: 0,
  totalTabs: ROUTES.length,
  navigate: () => {},
});

export function TabNavProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [currentIndex, setCurrentIndex] = useState(0);
  const prevRef = useRef(0);

  useEffect(() => {
    let idx = ROUTES.indexOf(pathname as any);
    if (idx === -1) {
      if (pathname === '' || pathname === '/index') idx = 0;
      else if (pathname.includes('two')) idx = 1;
      else if (pathname.includes('insulation')) idx = 2;
      else if (pathname.includes('water')) idx = 3;
      else if (pathname.includes('furniture')) idx = FEATURE_FLAGS.THREE_D_KITS_ENABLED ? 4 : 3;
      else if (pathname.includes('three')) idx = FEATURE_FLAGS.THREE_D_KITS_ENABLED ? 5 : 4;
      else idx = 0;
    }
    if (idx !== currentIndex) {
      prevRef.current = currentIndex;
      setCurrentIndex(idx);
    }
  }, [pathname]);

  const navigate = (index: number) => {
    if (index === currentIndex) return;
    tapHaptic();
    prevRef.current = currentIndex;
    setCurrentIndex(index);
    router.push(ROUTES[index] as any);
  };

  return (
    <TabNavContext.Provider value={{ currentIndex, prevIndex: prevRef.current, totalTabs: ROUTES.length, navigate }}>
      {children}
    </TabNavContext.Provider>
  );
}

export function useTabNav() {
  return useContext(TabNavContext);
}

