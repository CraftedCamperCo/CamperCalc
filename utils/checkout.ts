import { SUPABASE_ANON_KEY, SUPABASE_URL } from '@/utils/supabase';

export interface CheckoutLineItem {
  product_id: string;
  name: string;
  quantity: number;
  unit_price: number;
}

export interface StartCheckoutInput {
  userId?: string;
  projectId?: string;
  email?: string;
  successUrl?: string;
  cancelUrl?: string;
  lineItems: CheckoutLineItem[];
}

async function extractEdgeErrorMessage(err: any): Promise<string | null> {
  const ctx = err?.context;
  if (!ctx) return null;
  try {
    const res = typeof ctx.clone === 'function' ? ctx.clone() : ctx;
    const status = typeof res?.status === 'number' ? ` (${res.status})` : '';
    try {
      const payload = await res.json();
      if (payload?.error) return `${String(payload.error)}${status}`;
    } catch {
      // fallback to plain text
    }
    if (typeof res?.text === 'function') {
      const txt = (await res.text())?.trim();
      if (txt) return `${txt}${status}`;
    }
  } catch {
    // ignore extraction failures
  }
  return null;
}

export async function startCheckoutSession(input: StartCheckoutInput): Promise<{ url?: string; error?: string }> {
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/create-checkout-session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify(input),
    });

    const statusText = `(${response.status})`;
    let payload: any = null;
    let textBody = '';
    try {
      payload = await response.json();
    } catch {
      try {
        textBody = (await response.text()).trim();
      } catch {
        // ignore parse failures
      }
    }

    if (!response.ok) {
      if (typeof payload?.error === 'string' && payload.error.trim()) {
        return { error: `${payload.error} ${statusText}` };
      }
      if (textBody) return { error: `${textBody} ${statusText}` };
      return { error: `Checkout session request failed ${statusText}` };
    }

    if (!payload?.url) return { error: 'No checkout URL returned' };
    return { url: payload.url };
  } catch (e: any) {
    const extracted = await extractEdgeErrorMessage(e);
    if (extracted) return { error: extracted };
    return { error: e?.message ?? 'Checkout failed' };
  }
}

