# Access Audit - 2026-03-29

Execution source: `scripts/release/access-audit.sh`

## Tooling Status (local machine)

- Node: installed
- npm: installed
- Expo CLI: available via `npm exec expo`
- EAS CLI: available via `npm exec eas`
- Supabase CLI: available via `npm exec supabase`
- Vercel CLI: available via `npm exec vercel`

## Missing Runtime Variables (local)

- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- `EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `EXPO_PUBLIC_DVLA_API_KEY`
- `EXPO_PUBLIC_SENTRY_DSN`

## Interactive Identity Checks Pending

Run manually:

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
