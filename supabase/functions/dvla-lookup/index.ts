// Server-side proxy to the UK DVLA Vehicle Enquiry Service.
//
// Why this exists: the DVLA API does not return CORS headers, so calling
// it directly from the browser (Expo Web) fails with a CORS error and the
// project-creation flow on app.craftedcamper.co dies on registration
// lookup. Native apps could call DVLA directly, but routing every lookup
// through this function keeps the API key server-side and gives us one
// place to add caching, rate limiting, and analytics later.
//
// Auth: verify_jwt = true (config.toml). Only signed-in users can call
// it, which protects our DVLA quota from public abuse.

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';

const DVLA_API_URL = 'https://driver-vehicle-licensing.api.gov.uk/vehicle-enquiry/v1/vehicles';
const DVLA_API_KEY = Deno.env.get('DVLA_API_KEY') || '';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  // supabase.functions.invoke() automatically attaches `apikey` and
  // `x-client-info` headers in addition to the auth bearer. The browser
  // preflight will fail unless we explicitly allow them. Listing the
  // standard supabase header set here keeps the function compatible with
  // any future client invocation pattern.
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function jsonResponse(payload: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
  });
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: CORS_HEADERS });
  }
  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }
  if (!DVLA_API_KEY) {
    return jsonResponse({ error: 'DVLA_API_KEY not configured on server' }, 500);
  }

  try {
    const body = await req.json();
    const rawReg = typeof body?.registrationNumber === 'string' ? body.registrationNumber : '';
    const reg = rawReg.trim().toUpperCase().replace(/\s+/g, '');
    if (!reg) {
      return jsonResponse({ error: 'registrationNumber is required' }, 400);
    }

    const dvlaRes = await fetch(DVLA_API_URL, {
      method: 'POST',
      headers: {
        'x-api-key': DVLA_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ registrationNumber: reg }),
    });

    if (!dvlaRes.ok) {
      let message = `DVLA lookup failed (${dvlaRes.status}).`;
      try {
        const errorBody = await dvlaRes.json();
        if (typeof errorBody?.message === 'string' && errorBody.message.trim()) {
          message = `${message} ${errorBody.message.trim()}`;
        }
      } catch {
        // ignore JSON parse issues and keep status-based message
      }
      // Map a couple of common failures into clearer messages for the client.
      if (dvlaRes.status === 404) {
        return jsonResponse({ error: 'No vehicle found for that registration.' }, 404);
      }
      if (dvlaRes.status === 403) {
        return jsonResponse(
          { error: 'DVLA rejected the API key (403). Check key activation in DVLA portal.' },
          502,
        );
      }
      return jsonResponse({ error: message }, 502);
    }

    const data = await dvlaRes.json();
    if (!data?.make) {
      return jsonResponse({ error: 'No vehicle found for that registration.' }, 404);
    }

    return jsonResponse({
      make: String(data.make),
      model: data.model ? String(data.model) : undefined,
      yearOfManufacture: data.yearOfManufacture,
      engineCapacity: data.engineCapacity,
      fuelType: data.fuelType,
      colour: data.colour,
    });
  } catch (e: any) {
    return jsonResponse({ error: e?.message ?? 'Internal error' }, 500);
  }
});
