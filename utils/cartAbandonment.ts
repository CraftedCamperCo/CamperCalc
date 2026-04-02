import { supabase } from '@/utils/supabase';

export async function sendCartAbandonmentPing(input: {
  email?: string;
  projectName?: string;
  cartCount: number;
}) {
  if (!input.email || input.cartCount <= 0) return;
  await supabase.functions.invoke('cart-abandonment', {
    body: input,
  });
}

