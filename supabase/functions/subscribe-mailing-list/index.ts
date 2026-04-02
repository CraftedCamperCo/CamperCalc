import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';

const MAILERLITE_API_KEY = Deno.env.get('MAILERLITE_API_KEY') || '';
const BASE_URL = 'https://connect.mailerlite.com/api';
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: CORS_HEADERS });
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405, headers: CORS_HEADERS });
  if (!MAILERLITE_API_KEY) {
    return new Response(JSON.stringify({ error: 'MAILERLITE_API_KEY not configured' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
    });
  }

  try {
    const body = await req.json();
    const firstName = String(body?.firstName ?? '').trim();
    const lastName = String(body?.lastName ?? '').trim();
    const email = String(body?.email ?? '').trim();
    const phone = String(body?.phone ?? '').trim();
    const city = String(body?.city ?? '').trim();

    if (!firstName || !lastName || !email) {
      return new Response(JSON.stringify({ error: 'firstName, lastName and email are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
      });
    }

    const fields: Record<string, string> = {
      name: firstName,
      last_name: lastName,
    };
    if (phone) fields.phone = phone;
    if (city) fields.city = city;

    const response = await fetch(`${BASE_URL}/subscribers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: `Bearer ${MAILERLITE_API_KEY}`,
      },
      body: JSON.stringify({ email, fields }),
    });

    if (response.ok) {
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
      });
    }

    const responseData = await response.json().catch(() => ({}));
    return new Response(
      JSON.stringify({ success: false, error: responseData?.message || `Request failed (${response.status})` }),
      { status: response.status, headers: { 'Content-Type': 'application/json', ...CORS_HEADERS } }
    );
  } catch (error: any) {
    return new Response(JSON.stringify({ success: false, error: error?.message || 'Internal error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
    });
  }
});
