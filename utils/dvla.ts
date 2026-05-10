// Client-side DVLA helper. This used to call DVLA directly with the
// EXPO_PUBLIC_DVLA_API_KEY, which works on iOS/Android but FAILS on web
// because DVLA does not send CORS headers. We now route every lookup
// through the `dvla-lookup` Supabase edge function. The edge function
// holds the API key as a server-side secret (DVLA_API_KEY) and returns
// the same shape we used before, so callers do not need to change.

import { supabase } from './supabase';

export interface DvlaVehicleResult {
  make: string;
  model?: string;
  yearOfManufacture?: number;
  engineCapacity?: number;
  fuelType?: string;
  colour?: string;
}

export async function lookupUkRegistration(registrationNumber: string): Promise<DvlaVehicleResult | null> {
  const reg = registrationNumber.trim().toUpperCase().replace(/\s+/g, '');
  if (!reg) return null;

  const { data, error } = await supabase.functions.invoke('dvla-lookup', {
    body: { registrationNumber: reg },
  });

  if (error) {
    // supabase.functions.invoke wraps non-2xx responses in `error`. Try to
    // surface the server-supplied message so the user sees something
    // actionable ("No vehicle found...") instead of a generic failure.
    let message: string | null = null;
    try {
      const ctx: any = (error as any)?.context;
      if (ctx && typeof ctx.json === 'function') {
        const body = await ctx.json();
        if (body?.error) message = String(body.error);
      }
    } catch {
      // swallow — fall through to error.message
    }
    const finalMessage = message || error.message || 'DVLA lookup failed.';
    // 404 from the edge function means no match — return null instead of
    // throwing, matching the previous behavior of `if (!data?.make) return null`.
    if (/no vehicle found/i.test(finalMessage)) return null;
    throw new Error(finalMessage);
  }

  if (!data?.make) return null;
  return {
    make: String(data.make),
    model: data.model ? String(data.model) : undefined,
    yearOfManufacture: data.yearOfManufacture,
    engineCapacity: data.engineCapacity,
    fuelType: data.fuelType,
    colour: data.colour,
  };
}
