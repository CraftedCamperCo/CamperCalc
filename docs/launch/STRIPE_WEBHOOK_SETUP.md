# Stripe Webhook Setup (Production)

## Endpoint

Add webhook endpoint in Stripe Dashboard:

```text
https://<your-project-ref>.supabase.co/functions/v1/stripe-webhook
```

## Events

Enable:
- `checkout.session.completed`

## Secrets

Copy signing secret from Stripe and set it in Supabase:

```bash
npm exec supabase -- secrets set STRIPE_WEBHOOK_SECRET=whsec_xxx
```

Also ensure:

```bash
npm exec supabase -- secrets set STRIPE_SECRET_KEY=sk_live_xxx
npm exec supabase -- secrets set SUPABASE_URL=https://<your-project-ref>.supabase.co
npm exec supabase -- secrets set SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
```

## Verification

1. Complete a test checkout session in live-safe or test mode (matching keys used).
2. Confirm Stripe event is delivered (`200`).
3. Confirm new row exists in `orders`.
4. Confirm confirmation email delivery if `RESEND_API_KEY` is configured.
