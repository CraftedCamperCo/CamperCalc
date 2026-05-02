import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';

const STRIPE_SECRET_KEY = Deno.env.get('STRIPE_SECRET_KEY') || '';
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

type IncomingLineItem = {
  product_id?: string;
  name?: string;
  quantity?: number;
  unit_price?: number;
};
const MIN_GBP_UNIT_PRICE = 0.3;

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
  if (!STRIPE_SECRET_KEY) {
    return jsonResponse({ error: 'STRIPE_SECRET_KEY not configured' }, 500);
  }

  try {
    const body = await req.json();
    const {
      lineItems = [],
      email,
      userId,
      projectId,
      successUrl = 'https://camperplan.com/checkout-success',
      cancelUrl = 'https://camperplan.com/checkout-cancel',
    } = body ?? {};

    const cleanedItems = (lineItems as IncomingLineItem[])
      .map((i) => ({
        product_id: i.product_id ?? '',
        name: i.name ?? 'CamperPlan Item',
        quantity: Math.max(1, Number(i.quantity) || 1),
        unit_price: Math.max(0, Number(i.unit_price) || 0),
      }))
      .filter((i) => i.name.trim().length > 0 && i.unit_price > 0);

    if (cleanedItems.length === 0) {
      return jsonResponse({ error: 'No valid line items provided' }, 400);
    }
    const tooLow = cleanedItems.find((i) => i.unit_price < MIN_GBP_UNIT_PRICE);
    if (tooLow) {
      return jsonResponse(
        { error: `Stripe minimum for GBP is £${MIN_GBP_UNIT_PRICE.toFixed(2)} per item. Please increase "${tooLow.name}" price.` },
        400,
      );
    }

    const stripeLineItems = cleanedItems.map((i) => ({
      price_data: {
        currency: 'gbp',
        product_data: { name: i.name },
        unit_amount: Math.round(i.unit_price * 100),
      },
      quantity: i.quantity,
    }));

    const compactCart = cleanedItems.map((i) => ({
      id: i.product_id,
      n: i.name,
      q: i.quantity,
      p: i.unit_price,
    }));
    const compactCartJson = JSON.stringify(compactCart);
    const compactCartFits = compactCartJson.length <= 500;
    const uniqueProductIds = Array.from(
      new Set(cleanedItems.map((i) => i.product_id).filter(Boolean))
    );
    const productIdsCsv = uniqueProductIds.join(',');
    const productIdsFit = productIdsCsv.length <= 500;

    const response = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${STRIPE_SECRET_KEY}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        mode: 'payment',
        success_url: successUrl,
        cancel_url: cancelUrl,
        // Show the "Add promotion code" link on the Stripe Checkout page so
        // customers can paste codes (SUMMERPLAN5, friend & family, etc.)
        // managed in the Stripe dashboard. Stripe handles validation,
        // single-use enforcement, and expiry server-side.
        allow_promotion_codes: 'true',
        // Collect a shipping address from the customer at checkout. Required
        // for physical fulfillment of the wiring kit and components. Limited
        // to UK addresses since Crafted Camper currently ships UK only.
        'shipping_address_collection[allowed_countries][]': 'GB',
        // Capture the customer's phone number too — useful for delivery
        // coordination on bulky items.
        phone_number_collection: 'enabled',
        ...(userId ? { 'metadata[user_id]': String(userId) } : {}),
        ...(projectId ? { 'metadata[project_id]': String(projectId) } : {}),
        ...(compactCartFits ? { 'metadata[cart_compact]': compactCartJson } : {}),
        ...(productIdsFit ? { 'metadata[product_ids]': productIdsCsv } : {}),
        'payment_method_types[]': 'card',
        ...(email ? { customer_email: email } : {}),
        ...(projectId ? { client_reference_id: projectId } : {}),
        ...stripeLineItems.reduce((acc, item, idx) => {
          acc[`line_items[${idx}][price_data][currency]`] = item.price_data.currency;
          acc[`line_items[${idx}][price_data][product_data][name]`] = item.price_data.product_data.name;
          acc[`line_items[${idx}][price_data][unit_amount]`] = String(item.price_data.unit_amount);
          acc[`line_items[${idx}][quantity]`] = String(item.quantity);
          return acc;
        }, {} as Record<string, string>),
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      return jsonResponse({ error: data?.error?.message ?? 'Stripe session failed' }, 502);
    }
    return jsonResponse({ url: data.url, id: data.id });
  } catch (e: any) {
    return jsonResponse({ error: e?.message ?? 'Internal error' }, 500);
  }
});

