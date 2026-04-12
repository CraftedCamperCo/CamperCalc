// Supabase Edge Function: test-order-notification
// Simulates a fulfilment notification email WITHOUT processing a real payment.
// Call this with a project_id to test the full email Dan receives on a real order.
//
// Deploy: supabase functions deploy test-order-notification
// Required secrets: RESEND_API_KEY, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_URL
//
// Usage (curl):
//   curl -X POST https://<project-ref>.supabase.co/functions/v1/test-order-notification \
//     -H "Authorization: Bearer <anon-key>" \
//     -H "Content-Type: application/json" \
//     -d '{"project_id": "<uuid>"}'
//
// Or from the app (test button in dev mode):
//   await supabase.functions.invoke('test-order-notification', { body: { project_id: 'xxx' } })

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') || '';
const NOTIFY_EMAIL = 'dan@craftedcamper.co';
const NOTIFY_FROM_EMAIL = 'Crafted Camper <notifications@craftedcamper.co>';

serve(async (req: Request) => {
  // CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
  }

  if (!RESEND_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return new Response(JSON.stringify({ error: 'Missing environment config' }), { status: 500 });
  }

  try {
    const body = await req.json();
    const projectId = body.project_id;

    if (!projectId) {
      return new Response(JSON.stringify({ error: 'project_id is required' }), { status: 400 });
    }

    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    // Fetch the project with camper_state
    const projectRes = await supabaseAdmin
      .from('projects')
      .select('id, name, user_id, camper_state, purchased_items')
      .eq('id', projectId)
      .maybeSingle();

    if (projectRes.error || !projectRes.data) {
      return new Response(
        JSON.stringify({ error: 'Project not found', detail: projectRes.error?.message }),
        { status: 404 }
      );
    }

    const project = projectRes.data;
    const cs = project.camper_state || {};

    // Fetch user email
    let customerEmail = 'test-customer@example.com';
    if (project.user_id) {
      const userRes = await supabaseAdmin.auth.admin.getUserById(project.user_id);
      if (userRes.data?.user?.email) {
        customerEmail = userRes.data.user.email;
      }
    }

    // Build mock line items from the camper_state recommendations
    // In a real order these come from the cart, but for testing we simulate them
    const mockLineItems = [
      { product_id: 'fogstar_drift_105', name: 'Fogstar Drift 105Ah LiFePO4 Battery', quantity: 1, unit_price: 269.99 },
      { product_id: 'victron_mppt_100_20', name: 'Victron SmartSolar MPPT 100/20', quantity: 1, unit_price: 129.00 },
      { product_id: 'victron_dcdc_orion_30', name: 'Victron Orion-Tr Smart 12/12-30 DC-DC', quantity: 1, unit_price: 199.00 },
      { product_id: 'wiring_kit_bespoke', name: 'Bespoke Wiring Kit (Pre-cut, crimped, heat-shrunk)', quantity: 1, unit_price: 495.00 },
    ];

    // Use actual cart data if the project has purchased items
    const lineItems = mockLineItems;

    const van = cs.van;
    const vanDisplay = van
      ? `${van.manufacturerName || 'Unknown'} ${van.model || ''} (${van.wheelbase || '?'} wheelbase, ${van.roofHeight || '?'} roof)`
      : 'Not specified';

    const usageType = cs.usage || 'Not specified';
    const climates = Array.isArray(cs.climates) ? cs.climates.join(', ') : 'Not specified';
    const partySize = cs.partySize || 'Not specified';
    const daysOffGrid = cs.daysOffGrid || 'Not specified';
    const buildTier = cs.buildTier || 'Not specified';

    const selectedAppliances = cs.selectedAppliances || {};
    const activeAppliances = Object.entries(selectedAppliances)
      .filter(([_, v]) => v === true)
      .map(([k]) => k.replace(/_/g, ' '));
    const customAppliances = Array.isArray(cs.customAppliances) ? cs.customAppliances : [];
    const allAppliances = [
      ...activeAppliances,
      ...customAppliances.map((a: any) => `${a.name || 'Custom'} (${a.watts || '?'}W, ${a.hoursPerDay || '?'}h/day, ${a.voltage || '?'}V)`),
    ];

    const solarWatts = cs.solarWatts || 'N/A';
    const dcDcSize = cs.dcDcSize || 'N/A';
    const driveHours = cs.driveHours || 'N/A';
    const needs240v = cs.needs240v ? 'Yes' : 'No';

    const waterEnabled = cs.waterEnabled ? 'Yes' : 'No';
    const waterFixtures = cs.selectedWaterFixtures || {};
    const activeFixtures = Object.entries(waterFixtures)
      .filter(([_, v]) => v === true)
      .map(([k]) => k.replace(/_/g, ' '));

    const insulationEnabled = cs.insulationEnabled ? 'Yes' : 'No';
    const season = cs.season ? `${cs.season}-season` : 'N/A';

    const hasWiringKit = lineItems.some(
      (i) => i.product_id.includes('wiring_kit') || i.product_id.includes('wiring-kit')
    );

    const amountTotal = lineItems.reduce((sum, i) => sum + i.quantity * i.unit_price, 0);

    const itemRows = lineItems
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
        <div style="background:#FF6600;color:#fff;padding:12px 24px;border-radius:8px 8px 0 0;text-align:center;">
          <strong>TEST ORDER - NOT A REAL TRANSACTION</strong>
        </div>
        <div style="background:#1A1A1A;color:#fff;padding:20px 24px;">
          <h1 style="margin:0;font-size:22px;color:#D9A05B;">New Order - Fulfilment Required</h1>
          <p style="margin:8px 0 0;color:#B8B0A4;font-size:14px;">Order TEST-${Date.now()}</p>
        </div>

        <div style="background:#fff;padding:24px;border:1px solid #e0e0e0;border-top:none;">

          <h2 style="margin:0 0 12px;font-size:16px;color:#1A1A1A;border-bottom:2px solid #D9A05B;padding-bottom:8px;">Customer Details</h2>
          <p style="margin:4px 0;"><strong>Email:</strong> <a href="mailto:${customerEmail}">${customerEmail}</a></p>
          <p style="margin:4px 0;"><strong>Project:</strong> ${project.name || 'Unnamed project'}</p>
          <p style="margin:4px 0 16px;"><strong>Order total:</strong> \u00a3${amountTotal.toFixed(2)} GBP</p>

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
              <tr><td colspan="3" style="padding:10px 6px;text-align:right;font-weight:700;">Order Total</td><td style="padding:10px 6px;text-align:right;font-weight:700;font-size:16px;color:#D9A05B;">\u00a3${amountTotal.toFixed(2)}</td></tr>
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

        <div style="background:#FF6600;color:#fff;padding:12px 24px;border-radius:0 0 8px 8px;text-align:center;">
          <strong>TEST ORDER - This is a simulation. No payment was processed.</strong>
        </div>
      </div>
    `;

    const resendRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: NOTIFY_FROM_EMAIL,
        to: NOTIFY_EMAIL,
        subject: `[TEST ORDER] ${customerEmail} - \u00a3${amountTotal.toFixed(2)} - WIRING KIT FULFILMENT`,
        html,
      }),
    });

    if (!resendRes.ok) {
      const err = await resendRes.text();
      return new Response(JSON.stringify({ error: 'Resend failed', detail: err }), { status: 502 });
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Test fulfilment notification sent to ${NOTIFY_EMAIL}`,
        project: project.name,
        van: vanDisplay,
        items: lineItems.length,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Test notification error:', error);
    return new Response(JSON.stringify({ error: error.message || 'Internal error' }), { status: 500 });
  }
});
