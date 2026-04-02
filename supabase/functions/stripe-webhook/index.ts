import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

// Deploy with:
// supabase functions deploy stripe-webhook
// Required secrets:
// STRIPE_WEBHOOK_SECRET, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_URL

const STRIPE_WEBHOOK_SECRET = Deno.env.get('STRIPE_WEBHOOK_SECRET') || '';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') || '';
const ORDER_FROM_EMAIL = Deno.env.get('ORDER_FROM_EMAIL') || 'Crafted Camper <orders@craftedcamper.co>';

type StripeSession = {
  id: string;
  status?: string;
  payment_status?: string;
  customer_email?: string;
  amount_total?: number;
  currency?: string;
  client_reference_id?: string;
  metadata?: Record<string, string>;
};

type StripeEvent = {
  type?: string;
  data?: { object?: StripeSession };
};

type CompactCartItem = {
  id?: string;
  n?: string;
  q?: number;
  p?: number;
};

const SALES_SUITE_THRESHOLD_GBP = 1500;
const SALES_SUITE_ENTITLEMENTS = [
  'sales_suite_access',
  'club_all_access',
  'electrical_install_guide',
  'insulation_install_guide',
  'water_install_guide',
];

const encoder = new TextEncoder();

function parseSignatureHeader(value: string | null): { timestamp: string; v1: string } | null {
  if (!value) return null;
  const parts = value.split(',').map((p) => p.trim());
  const timestamp = parts.find((p) => p.startsWith('t='))?.slice(2) ?? '';
  const v1 = parts.find((p) => p.startsWith('v1='))?.slice(3) ?? '';
  if (!timestamp || !v1) return null;
  return { timestamp, v1 };
}

async function signHmacHex(secret: string, payload: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(payload));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function safeJsonParse<T>(value: string | undefined, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function dedupeStrings(input: string[]): string[] {
  return Array.from(new Set(input.filter(Boolean)));
}

function inferEntitlements(productIds: string[]): string[] {
  const idsLower = productIds.map((id) => id.toLowerCase());
  const out: string[] = [];
  if (idsLower.some((id) => id.includes('club'))) {
    out.push('club_all_access');
  }
  if (
    idsLower.some(
      (id) =>
        id.includes('schematic') ||
        id.includes('install_guide') ||
        id.includes('install-guide') ||
        id.includes('install_package') ||
        id.includes('install-package')
    )
  ) {
    out.push('electrical_install_guide');
  }
  return dedupeStrings(out);
}

async function sendOrderConfirmationEmail(input: {
  toEmail: string;
  orderId: string;
  amountTotal: number;
  currency: string;
  lineItems: Array<{ name: string; quantity: number; unit_price: number }>;
}) {
  if (!RESEND_API_KEY) return;
  const rows = input.lineItems
    .map((item) => {
      const qty = Number(item.quantity) || 1;
      const unit = Number(item.unit_price) || 0;
      const line = qty * unit;
      return `<tr><td style="padding:6px 0;">${item.name || 'Item'}</td><td style="padding:6px 0;text-align:center;">${qty}</td><td style="padding:6px 0;text-align:right;">£${line.toFixed(2)}</td></tr>`;
    })
    .join('');

  const html = `
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:620px;margin:0 auto;padding:20px;">
      <h2 style="margin:0 0 12px;color:#1A1A1A;">Your order is confirmed</h2>
      <p style="margin:0 0 14px;color:#444;">Thank you for ordering with CamperPlan by Crafted.</p>
      <p style="margin:0 0 8px;color:#444;"><strong>Order:</strong> ${input.orderId}</p>
      <p style="margin:0 0 16px;color:#444;"><strong>Total:</strong> £${input.amountTotal.toFixed(2)} ${input.currency.toUpperCase()}</p>
      <table style="width:100%;border-collapse:collapse;margin-bottom:16px;">
        <thead>
          <tr><th style="text-align:left;padding-bottom:8px;border-bottom:1px solid #ddd;">Item</th><th style="text-align:center;padding-bottom:8px;border-bottom:1px solid #ddd;">Qty</th><th style="text-align:right;padding-bottom:8px;border-bottom:1px solid #ddd;">Line total</th></tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
      <p style="margin:0;color:#666;font-size:13px;">Need help? Reply to this email or contact dan@craftedcamper.co.</p>
    </div>
  `;

  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: ORDER_FROM_EMAIL,
      to: input.toEmail,
      subject: `Order Confirmation - ${input.orderId}`,
      html,
    }),
  });
}

serve(async (req: Request) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }
  if (!STRIPE_WEBHOOK_SECRET || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return new Response('Webhook environment is not configured', { status: 500 });
  }

  const rawBody = await req.text();
  const sigHeader = parseSignatureHeader(req.headers.get('stripe-signature'));
  if (!sigHeader) {
    return new Response('Missing Stripe signature', { status: 400 });
  }

  const signedPayload = `${sigHeader.timestamp}.${rawBody}`;
  const expected = await signHmacHex(STRIPE_WEBHOOK_SECRET, signedPayload);
  if (expected !== sigHeader.v1) {
    return new Response('Invalid Stripe signature', { status: 400 });
  }

  const event = safeJsonParse<StripeEvent>(rawBody, {});
  if (event?.type !== 'checkout.session.completed') {
    return new Response(JSON.stringify({ received: true, ignored: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const session = event?.data?.object;
  if (!session?.id) {
    return new Response('Missing session id', { status: 400 });
  }

  const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // Idempotency: do nothing if this session was already processed.
  const existingOrder = await supabaseAdmin
    .from('orders')
    .select('id')
    .eq('stripe_session_id', session.id)
    .maybeSingle();
  if (existingOrder.data?.id) {
    return new Response(JSON.stringify({ received: true, duplicate: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const metadata = session.metadata ?? {};
  const userId = metadata.user_id || null;
  const projectId = metadata.project_id || session.client_reference_id || null;
  const compactCart = safeJsonParse<CompactCartItem[]>(metadata.cart_compact, []);
  const productIdsFromCart = compactCart.map((i) => i.id ?? '').filter(Boolean);
  const productIdsFromCsv = (metadata.product_ids ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  const productIds = dedupeStrings([...productIdsFromCart, ...productIdsFromCsv]);
  const entitlements = inferEntitlements(productIds);
  const lineItems = compactCart.map((i) => ({
    product_id: i.id ?? '',
    name: i.n ?? '',
    quantity: Number(i.q) || 1,
    unit_price: Number(i.p) || 0,
  }));

  const amountTotal = (Number(session.amount_total) || 0) / 100;
  const orderStatus = session.payment_status === 'paid' ? 'paid' : (session.status ?? 'completed');
  const { error: orderInsertError } = await supabaseAdmin.from('orders').insert({
    user_id: userId,
    project_id: projectId,
    stripe_session_id: session.id,
    status: orderStatus,
    currency: (session.currency ?? 'gbp').toLowerCase(),
    amount_total: amountTotal,
    line_items: lineItems,
  });
  if (orderInsertError) {
    return new Response(`Order insert failed: ${orderInsertError.message}`, { status: 500 });
  }

  if (userId && entitlements.length > 0) {
    const entitlementRows = entitlements.map((entitlementType) => ({
      user_id: userId,
      entitlement_type: entitlementType,
    }));
    await supabaseAdmin.from('user_entitlements').upsert(entitlementRows, {
      onConflict: 'user_id,entitlement_type',
      ignoreDuplicates: true,
    });
  }

  if (userId) {
    const paidOrdersRes = await supabaseAdmin
      .from('orders')
      .select('amount_total, status, currency')
      .eq('user_id', userId);

    if (!paidOrdersRes.error) {
      const cumulativeGbp = (paidOrdersRes.data ?? [])
        .filter((order: any) =>
          (order?.currency ?? 'gbp').toLowerCase() === 'gbp' &&
          ((order?.status ?? '').toLowerCase() === 'paid' || (order?.status ?? '').toLowerCase() === 'completed')
        )
        .reduce((sum: number, order: any) => sum + (Number(order?.amount_total) || 0), 0);

      if (cumulativeGbp >= SALES_SUITE_THRESHOLD_GBP) {
        const salesSuiteRows = SALES_SUITE_ENTITLEMENTS.map((entitlementType) => ({
          user_id: userId,
          entitlement_type: entitlementType,
        }));
        await supabaseAdmin.from('user_entitlements').upsert(salesSuiteRows, {
          onConflict: 'user_id,entitlement_type',
          ignoreDuplicates: true,
        });
      }
    }
  }

  if (projectId && productIds.length > 0) {
    const projectRes = await supabaseAdmin
      .from('projects')
      .select('purchased_items')
      .eq('id', projectId)
      .maybeSingle();
    if (!projectRes.error && projectRes.data) {
      const existing = Array.isArray(projectRes.data.purchased_items) ? projectRes.data.purchased_items : [];
      const next = dedupeStrings([...existing, ...productIds]);
      await supabaseAdmin.from('projects').update({ purchased_items: next }).eq('id', projectId);
    }
  }

  if (session.customer_email) {
    try {
      await sendOrderConfirmationEmail({
        toEmail: session.customer_email,
        orderId: session.id,
        amountTotal,
        currency: (session.currency ?? 'gbp').toLowerCase(),
        lineItems,
      });
    } catch (e) {
      console.error('order confirmation email failed', e);
    }
  }

  return new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
});

