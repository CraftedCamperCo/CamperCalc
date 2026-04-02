# CamperPlan iOS Launch Runbook (2 Weeks)

This is the execution runbook for:
- Week 1: TestFlight public link
- Week 2: App Store release

---

## 1) Access Audit (Day 1)

Run local audit:

```bash
scripts/release/access-audit.sh
```

Latest recorded audit template: `docs/launch/ACCESS_AUDIT_2026-03-29.md`

Interactive identity checks:

```bash
npm run eas:whoami
npm exec supabase -- projects list
npm exec vercel -- whoami
```

Portal checks:
- Apple Developer: <https://developer.apple.com/account/>
- App Store Connect: <https://appstoreconnect.apple.com/>
- Expo: <https://expo.dev/accounts>
- Supabase: <https://supabase.com/dashboard>
- Stripe: <https://dashboard.stripe.com/>
- Vercel: <https://vercel.com/dashboard>

---

## 2) iOS Build/Submit Configuration (Day 1-2)

Already configured in repo:
- EAS config: `eas.json`
- iOS bundle identifier and build number in `app.json`
- iOS release scripts in `package.json`

Initial setup (one-time):

```bash
npm install
npm run eas:init
npm run release:check
```

If EAS asks for credentials/signing, choose managed credentials.

---

## 3) Environment Hardening (Day 1-2)

The app now requires runtime env vars (no hardcoded Supabase key in source).

Copy template:

```bash
cp .env.example .env.local
```

Fill required values:
- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- `EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `EXPO_PUBLIC_DVLA_API_KEY`
- `EXPO_PUBLIC_SENTRY_DSN`

Restart Expo after changes.

---

## 4) Backend Release (Day 2-3)

Deploy Supabase DB/functions:

```bash
scripts/release/deploy-backend.sh
```

Required secrets (production):
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `RESEND_API_KEY`
- `ORDER_FROM_EMAIL`
- `MAILERLITE_API_KEY`

Stripe webhook endpoint:

```text
https://<your-project-ref>.supabase.co/functions/v1/stripe-webhook
```

Stripe event required:
- `checkout.session.completed`

Reference:
- `docs/launch/STRIPE_WEBHOOK_SETUP.md`

---

## 5) Week 1 - TestFlight Release Candidate

Build and upload:

```bash
scripts/release/ios-release.sh testflight
```

Then in App Store Connect:
1. Open TestFlight
2. Select the latest build
3. Add testing notes + compliance details
4. Enable Public Link (target end of Week 1)

Mandatory QA pass before public link:
- Checkout start from basket
- Payment success/cancel return paths
- Stripe webhook creates `orders` row
- Confirmation email received
- No P0 crashes in auth/projects/shop/basket/checkout

Use:
- `LAUNCH_CHECKLIST.md`
- `docs/launch/GO_NO_GO_CHECKLIST.md`
- `docs/launch/TESTFLIGHT_WEEK1_CHECKLIST.md`

---

## 6) Week 2 - App Store Submission and Release

Build and submit:

```bash
scripts/release/ios-release.sh appstore
```

In App Store Connect:
1. Finalize listing metadata/screenshots
2. Attach production build to version
3. Submit for review
4. Monitor review questions and respond quickly
5. Release manually after final go/no-go

Post-release monitoring (first 14 days):
- Stripe failed payments/webhooks
- Supabase function logs
- Sentry crash/error rate
- Week 2 checklist: `docs/launch/APPSTORE_WEEK2_CHECKLIST.md`

---

## Rollback

If a critical issue is discovered:
1. Pause App Store release (if in review)
2. Disable sale or remove released version in App Store Connect if needed
3. Roll back backend by redeploying known-good Supabase functions
4. Rotate webhook secret if webhook integrity is in doubt

---

## Command Quick Reference

```bash
# Access
scripts/release/access-audit.sh

# EAS setup
npm run eas:init
npm run eas:whoami

# iOS
npm run build:ios:preview
npm run build:ios:production
npm run submit:ios:production

# Backend
scripts/release/deploy-backend.sh
```
