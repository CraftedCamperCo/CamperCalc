// Supabase Edge Function: invoice-notification
// Triggered via HTTP POST when an invoice is generated client-side.
// Sends a notification email to dan@craftedcamper.co via Resend.
//
// Deploy: supabase functions deploy invoice-notification
// Set secrets:
//   supabase secrets set RESEND_API_KEY=re_xxxxx
//
// Required Supabase table (run in SQL editor):
//
// CREATE TABLE invoices (
//   id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
//   reference TEXT NOT NULL,
//   customer_name TEXT NOT NULL,
//   customer_email TEXT NOT NULL,
//   customer_phone TEXT NOT NULL,
//   items JSONB NOT NULL DEFAULT '[]',
//   total_rrp NUMERIC(10,2) NOT NULL,
//   total_crafted NUMERIC(10,2) NOT NULL,
//   savings NUMERIC(10,2) NOT NULL DEFAULT 0,
//   has_discount BOOLEAN DEFAULT FALSE,
//   user_id UUID REFERENCES auth.users(id),
//   created_at TIMESTAMPTZ DEFAULT NOW()
// );

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') || '';
const NOTIFY_EMAIL = 'dan@craftedcamper.co';
const FROM_EMAIL = 'Crafted Camper <notifications@craftedcamper.co>';

interface InvoicePayload {
  reference: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  items: Array<{ name: string; price: number }>;
  total_rrp: number;
  total_crafted: number;
  savings: number;
  has_discount: boolean;
}

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

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
  }

  try {
    const payload: InvoicePayload = await req.json();
    const { reference, customer_name, customer_email, customer_phone, items, total_rrp, total_crafted, savings, has_discount } = payload;

    if (!reference || !customer_name || !customer_email) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400 });
    }

    const itemList = items.map(i => `<li>${i.name} — £${i.price.toFixed(2)}</li>`).join('');
    const displayTotal = has_discount ? total_crafted : total_rrp;

    const htmlBody = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #D9A05B; font-size: 20px; border-bottom: 2px solid #D9A05B; padding-bottom: 12px;">New Invoice Generated</h1>
        
        <div style="background: #f8f8f6; padding: 16px; border-radius: 8px; margin: 16px 0;">
          <p style="margin: 4px 0;"><strong>Reference:</strong> ${reference}</p>
          <p style="margin: 4px 0;"><strong>Customer:</strong> ${customer_name}</p>
          <p style="margin: 4px 0;"><strong>Email:</strong> <a href="mailto:${customer_email}">${customer_email}</a></p>
          <p style="margin: 4px 0;"><strong>Phone:</strong> <a href="tel:${customer_phone}">${customer_phone}</a></p>
        </div>

        <h3 style="color: #333; margin-top: 20px;">Components (${items.length} items)</h3>
        <ul style="padding-left: 20px; color: #666;">${itemList}</ul>

        <div style="background: #1A1A1A; color: #fff; padding: 16px; border-radius: 8px; margin-top: 16px;">
          <p style="margin: 4px 0; font-size: 14px;">Total (RRP): £${total_rrp.toFixed(2)}</p>
          ${has_discount ? `<p style="margin: 4px 0; color: #4CAF50;">Discount Applied: -£${savings.toFixed(2)}</p>` : ''}
          <p style="margin: 8px 0 0; font-size: 20px; font-weight: 800; color: #D9A05B;">Total: £${displayTotal.toFixed(2)}</p>
        </div>

        <p style="color: #999; font-size: 12px; margin-top: 20px;">
          This is an automated notification from CamperPlan by Crafted.
        </p>
      </div>
    `;

    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: NOTIFY_EMAIL,
        subject: `New Invoice: ${reference} — ${customer_name} (£${displayTotal.toFixed(2)})`,
        html: htmlBody,
      }),
    });

    if (!resendResponse.ok) {
      const err = await resendResponse.text();
      console.error('Resend API error:', err);
      return new Response(JSON.stringify({ error: 'Failed to send notification email', detail: err }), { status: 502 });
    }

    return new Response(JSON.stringify({ success: true, reference }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Edge function error:', error);
    return new Response(JSON.stringify({ error: error.message || 'Internal error' }), { status: 500 });
  }
});
