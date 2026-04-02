#!/usr/bin/env bash
set -euo pipefail

echo "== CamperPlan Access Audit =="
echo

check_cmd() {
  local label="$1"
  local cmd="$2"
  if command -v "$cmd" >/dev/null 2>&1; then
    echo "[ok] ${label}: ${cmd} installed"
  else
    echo "[missing] ${label}: ${cmd} not installed"
  fi
}

check_npm_exec() {
  local label="$1"
  local cmd="$2"
  if npm exec "${cmd}" -- --version >/dev/null 2>&1; then
    echo "[ok] ${label}: ${cmd} available via npm exec"
  else
    echo "[missing] ${label}: ${cmd} not available via npm exec"
  fi
}

check_env() {
  local name="$1"
  if [ -n "${!name:-}" ]; then
    echo "[ok] ${name} is set"
  else
    echo "[missing] ${name} is not set"
  fi
}

check_cmd "Node" "node"
check_cmd "npm" "npm"
check_npm_exec "Expo CLI" "expo"
check_npm_exec "EAS CLI" "eas"
check_npm_exec "Supabase CLI" "supabase"
check_npm_exec "Vercel CLI" "vercel"

echo
echo "== Public App Runtime Variables =="
check_env "EXPO_PUBLIC_SUPABASE_URL"
check_env "EXPO_PUBLIC_SUPABASE_ANON_KEY"
check_env "EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY"
check_env "EXPO_PUBLIC_DVLA_API_KEY"
check_env "EXPO_PUBLIC_SENTRY_DSN"

echo
echo "== Optional Local Identity Checks =="
echo "Run these manually (interactive):"
echo "  npm run eas:whoami"
echo "  npm exec supabase -- projects list"
echo "  npm exec vercel -- whoami"
echo
echo "Account portals to verify:"
echo "  Apple Developer: https://developer.apple.com/account/"
echo "  App Store Connect: https://appstoreconnect.apple.com/"
echo "  Stripe Dashboard: https://dashboard.stripe.com/"
echo "  Supabase Dashboard: https://supabase.com/dashboard"
echo "  Vercel Dashboard: https://vercel.com/dashboard"
