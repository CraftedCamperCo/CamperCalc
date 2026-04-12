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
const NOTIFY_EMAIL = 'dan@craftedcamper.co';
const NOTIFY_FROM_EMAIL = 'Crafted Camper <orders@craftedcamper.co>';

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

async function sendFulfilmentNotification(input: {
  orderId: string;
  customerEmail: string;
  amountTotal: number;
  currency: string;
  lineItems: Array<{ product_id: string; name: string; quantity: number; unit_price: number }>;
  camperState: any;
  projectName: string;
}) {
  if (!RESEND_API_KEY) return;

  const cs = input.camperState || {};
  const van = cs.van;
  const vanDisplay = van
    ? `${van.manufacturerName || 'Unknown'} ${van.model || ''} (${van.wheelbase || '?'} wheelbase, ${van.roofHeight || '?'} roof)`
    : 'Not specified';

  const usageType = cs.usage || 'Not specified';
  const climates = Array.isArray(cs.climates) ? cs.climates.join(', ') : 'Not specified';
  const partySize = cs.partySize || 'Not specified';
  const daysOffGrid = cs.daysOffGrid || 'Not specified';
  const buildTier = cs.buildTier || 'Not specified';

  // Appliances
  const selectedAppliances = cs.selectedAppliances || {};
  const activeAppliances = Object.entries(selectedAppliances)
    .filter(([_, v]) => v === true)
    .map(([k]) => k.replace(/_/g, ' '));
  const customAppliances = Array.isArray(cs.customAppliances) ? cs.customAppliances : [];
  const allAppliances = [
    ...activeAppliances,
    ...customAppliances.map((a: any) => `${a.name || 'Custom'} (${a.watts || '?'}W, ${a.hoursPerDay || '?'}h/day, ${a.voltage || '?'}V)`)
  ];

  // Power specs
  const solarWatts = cs.solarWatts || 'N/A';
  const dcDcSize = cs.dcDcSize || 'N/A';
  const driveHours = cs.driveHours || 'N/A';
  const needs240v = cs.needs240v ? 'Yes' : 'No';

  // Water specs
  const waterEnabled = cs.waterEnabled ? 'Yes' : 'No';
  const waterFixtures = cs.selectedWaterFixtures || {};
  const activeFixtures = Object.entries(waterFixtures)
    .filter(([_, v]) => v === true)
    .map(([k]) => k.replace(/_/g, ' '));

  // Insulation
  const insulationEnabled = cs.insulationEnabled ? 'Yes' : 'No';
  const season = cs.season ? `${cs.season}-season` : 'N/A';

  // Check if wiring kit is in the order
  const hasWiringKit = input.lineItems.some(
    (i) => i.product_id.includes('wiring_kit') || i.product_id.includes('wiring-kit')
  );

  const itemRows = input.lineItems
    .map((item) => {
      const qty = Number(item.quantity) || 1;
      const unit = Number(item.unit_price) || 0;
      const line = qty * unit;
      const isWiring = item.product_id.includes('wiring_kit') || item.product_id.includes('wiring-kit');
      const highlight = isWiring ? 'background-color:#FFF8E7;' : '';
      return `<tr style="${highlight}"><td style="padding:8px 6px;border-bottom:1px solid #eee;">${item.name || item.product_id}${isWiring ? ' <strong style="color:#D9A05B;">[WIRING KIT - REQUIRES FULFILMENT]</strong>' : ''}</td><td style="padding:8px 6px;text-align:center;border-bottom:1px solid #eee;">${qty}</td><td style="padding:8px 6px;text-align:right;border-bottom:1px solid #eee;">\u00a3${unit.toFixed(2)}</td><td style="padding:8px 6px;text-align:right;border-bottom:1px solid #eee;">\u00a3${line.toFixed(2)}</td></tr>`;
    })
    .join('');

  const applianceList = allAppliances.length > 0
    ? allAppliances.map((a) => `<li style="padding:2px 0;">${a}</li>`).join('')
    : '<li>None selected</li>';

  const fixtureList = activeFixtures.length > 0
    ? activeFixtures.map((f) => `<li style="padding:2px 0;">${f}</li>`).join('')
    : '<li>None</li>';

  const html = `
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:700px;margin:0 auto;padding:20px;">
      <div style="background:#1A1A1A;color:#fff;padding:20px 24px;border-radius:8px 8px 0 0;">
        <h1 style="margin:0;font-size:22px;color:#D9A05B;">New Order - Fulfilment Required</h1>
        <p style="margin:8px 0 0;color:#B8B0A4;font-size:14px;">Order ${input.orderId}</p>
      </div>

      <div style="background:#fff;padding:24px;border:1px solid #e0e0e0;border-top:none;">

        <h2 style="margin:0 0 12px;font-size:16px;color:#1A1A1A;border-bottom:2px solid #D9A05B;padding-bottom:8px;">Customer Details</h2>
        <p style="margin:4px 0;"><strong>Email:</strong> <a href="mailto:${input.customerEmail}">${input.customerEmail}</a></p>
        <p style="margin:4px 0;"><strong>Project:</strong> ${input.projectName || 'Unnamed project'}</p>
        <p style="margin:4px 0 16px;"><strong>Order total:</strong> \u00a3${input.amountTotal.toFixed(2)} ${input.currency.toUpperCase()}</p>

        <h2 style="margin:0 0 12px;font-size:16px;color:#1A1A1A;border-bottom:2px solid #D9A05B;padding-bottom:8px;">Van Specification</h2>
        <p style="margin:4px 0;"><strong>Van:</strong> ${vanDisplay}</p>
        <p style="margin:4px 0;"><strong>Usage:</strong> ${usageType}</p>
        <p style="margin:4px 0;"><strong>Climates:</strong> ${climates}</p>
        <p style="margin:4px 0;"><strong>Party size:</strong> ${partySize}</p>
        <p style="margin:4px 0;"><strong>Days off-grid:</strong> ${daysOffGrid}</p>
        <p style="margin:4px 0 16px;"><strong>Build tier:</strong> ${buildTier}</p>

        <h2 style="margin:0 0 12px;font-size:16px;color:#1A1A1A;border-bottom:2px solid #D9A05B;padding-bottom:8px;">Order Items</h2>
        <table style="width:100%;border-collapse:collapse;margin-bottom:16px;">
          <thead>
            <tr style="background:#f5f5f5;"><th style="text-align:left;padding:8px 6px;font-size:13px;">Product</th><th style="text-align:center;padding:8px 6px;font-size:13px;">Qty</th><th style="text-align:right;padding:8px 6px;font-size:13px;">Unit</th><th style="text-align:right;padding:8px 6px;font-size:13px;">Total</th></tr>
          </thead>
          <tbody>${itemRows}</tbody>
          <tfoot>
            <tr><td colspan="3" style="padding:10px 6px;text-align:right;font-weight:700;">Order Total</td><td style="padding:10px 6px;text-align:right;font-weight:700;font-size:16px;color:#D9A05B;">\u00a3${input.amountTotal.toFixed(2)}</td></tr>
          </tfoot>
        </table>

        <h2 style="margin:0 0 12px;font-size:16px;color:#1A1A1A;border-bottom:2px solid #D9A05B;padding-bottom:8px;">Electrical Specification</h2>
        <p style="margin:4px 0;"><strong>Solar:</strong> ${solarWatts}W</p>
        <p style="margin:4px 0;"><strong>DC-DC:</strong> ${dcDcSize}A</p>
        <p style="margin:4px 0;"><strong>Drive hours/day:</strong> ${driveHours}</p>
        <p style="margin:4px 0;"><strong>Needs 240V:</strong> ${needs240v}</p>
        <p style="margin:4px 0 8px;"><strong>Appliances:</strong></p>
        <ul style="margin:0 0 16px;padding-left:20px;color:#555;">${applianceList}</ul>

        <h2 style="margin:0 0 12px;font-size:16px;color:#1A1A1A;border-bottom:2px solid #D9A05B;padding-bottom:8px;">Water System</h2>
        <p style="margin:4px 0;"><strong>Water system:</strong> ${waterEnabled}</p>
        <p style="margin:4px 0 8px;"><strong>Fixtures:</strong></p>
        <ul style="margin:0 0 16px;padding-left:20px;color:#555;">${fixtureList}</ul>

        <h2 style="margin:0 0 12px;font-size:16px;color:#1A1A1A;border-bottom:2px solid #D9A05B;padding-bottom:8px;">Insulation</h2>
        <p style="margin:4px 0;"><strong>Insulation:</strong> ${insulationEnabled}</p>
        <p style="margin:4px 0 16px;"><strong>Season rating:</strong> ${season}</p>

        ${hasWiringKit ? `
        <div style="background:#FFF8E7;border:2px solid #D9A05B;border-radius:8px;padding:16px;margin:16px 0;">
          <h3 style="margin:0 0 8px;color:#1A1A1A;">Wiring Kit Fulfilment Action</h3>
          <p style="margin:0;color:#555;">This order includes a bespoke wiring kit. Use the van model and electrical spec above to prepare the wiring package. All wires to be pre-cut to length, crimped, and heat-shrunk for this specific build.</p>
          <p style="margin:8px 0 0;color:#555;"><strong>Forward this email to Grace at Batteries &amp; Solar for fulfilment.</strong></p>
        </div>
        ` : ''}

      </div>

      <div style="background:#f5f5f5;padding:12px 24px;border-radius:0 0 8px 8px;border:1px solid #e0e0e0;border-top:none;">
        <p style="margin:0;color:#999;font-size:12px;">Automated notification from CamperPlan by Crafted. Review this order before forwarding to suppliers.</p>
      </div>
    </div>
  `;

  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: NOTIFY_FROM_EMAIL,
      to: NOTIFY_EMAIL,
      subject: `[NEW ORDER] ${input.customerEmail} - \u00a3${input.amountTotal.toFixed(2)}${hasWiringKit ? ' - WIRING KIT FULFILMENT' : ''}`,
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

  // Send fulfilment notification to Dan with full build details
  try {
    let camperState = {};
    let projectName = '';
    if (projectId) {
      const projectRes = await supabaseAdmin
        .from('projects')
        .select('name, camper_state')
        .eq('id', projectId)
        .maybeSingle();
      if (projectRes.data) {
        camperState = projectRes.data.camper_state || {};
        projectName = projectRes.data.name || '';
      }
    }

    await sendFulfilmentNotification({
      orderId: session.id,
      customerEmail: session.customer_email || metadata.email || 'Unknown',
      amountTotal,
      currency: (session.currency ?? 'gbp').toLowerCase(),
      lineItems,
      camperState,
      projectName,
    });
  } catch (e) {
    console.error('fulfilment notification email failed', e);
  }

  return new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
});

