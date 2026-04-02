#!/usr/bin/env bash
set -euo pipefail

if ! npm exec supabase -- --version >/dev/null 2>&1; then
  echo "Supabase CLI not found. Run: npm install"
  exit 1
fi

if [ ! -f "supabase/schema.sql" ]; then
  echo "Run this script from repository root."
  exit 1
fi

echo "== Supabase Backend Release =="
echo "This deploys schema + Edge Functions for checkout and launch flows."
echo

read -r -p "Have you logged in and linked the production project? (y/N) " ACK
if [[ "${ACK}" != "y" && "${ACK}" != "Y" ]]; then
  echo "Aborted. Run:"
  echo "  npm exec supabase -- login"
  echo "  npm exec supabase -- link --project-ref <your-project-ref>"
  exit 1
fi

echo
echo "Applying database migration(s)..."
npm exec supabase -- db push

echo
echo "Deploying Edge Functions..."
npm exec supabase -- functions deploy create-checkout-session
npm exec supabase -- functions deploy stripe-webhook
npm exec supabase -- functions deploy invoice-notification
npm exec supabase -- functions deploy subscribe-mailing-list
npm exec supabase -- functions deploy cart-abandonment

echo
echo "Set or rotate required secrets (run once per environment):"
cat <<'EOF'
npm exec supabase -- secrets set STRIPE_SECRET_KEY=...
npm exec supabase -- secrets set STRIPE_WEBHOOK_SECRET=...
npm exec supabase -- secrets set SUPABASE_URL=...
npm exec supabase -- secrets set SUPABASE_SERVICE_ROLE_KEY=...
npm exec supabase -- secrets set RESEND_API_KEY=...
npm exec supabase -- secrets set ORDER_FROM_EMAIL="Crafted Camper <orders@craftedcamper.co>"
npm exec supabase -- secrets set MAILERLITE_API_KEY=...
EOF

echo
echo "Backend release script complete."
