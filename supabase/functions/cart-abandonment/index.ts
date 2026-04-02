import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') || '';
const FROM_EMAIL = 'CamperPlan by Crafted <notifications@craftedcamper.co>';

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  }
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });

  const { email, cartCount, projectName } = await req.json();
  if (!email || !cartCount) return new Response('Missing fields', { status: 400 });

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, sans-serif; max-width: 560px; margin: 0 auto;">
      <h2 style="color:#1A1A1A;">Your bespoke package is waiting</h2>
      <p>You still have <strong>${cartCount}</strong> item(s) in your CamperPlan basket${projectName ? ` for <strong>${projectName}</strong>` : ''}.</p>
      <p>We built this package from your exact lifestyle answers so you avoid waste, uncertainty and overbuying.</p>
      <p><a href="https://camperplan.com/shop?cart=1">Resume checkout</a></p>
    </div>
  `;

  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: FROM_EMAIL,
      to: email,
      subject: 'Your CamperPlan bespoke package is waiting',
      html,
    }),
  });

  return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { 'Content-Type': 'application/json' } });
});

