import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { useProjects } from '@/context/ProjectContext';
import { sendCartAbandonmentPing } from '@/utils/cartAbandonment';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect } from 'react';

const LAST_SENT_KEY = '@crafted_cart_abandonment_last_sent';
const DAY_MS = 24 * 60 * 60 * 1000;

export default function CartAbandonmentWatcher() {
  const { user } = useAuth();
  const { count, updatedAt } = useCart();
  const { currentProject } = useProjects();

  useEffect(() => {
    async function run() {
      if (!user?.email || !updatedAt || count <= 0) return;
      if (Date.now() - updatedAt < DAY_MS) return;
      const last = await AsyncStorage.getItem(LAST_SENT_KEY);
      if (last && Date.now() - Number(last) < DAY_MS) return;
      await sendCartAbandonmentPing({
        email: user.email,
        projectName: currentProject?.name,
        cartCount: count,
      });
      await AsyncStorage.setItem(LAST_SENT_KEY, String(Date.now()));
    }
    run();
  }, [user?.email, updatedAt, count, currentProject?.name]);

  return null;
}

