# iOS Launch Execution Status

Updated: 2026-03-29

## Completed in repository

- EAS tooling installed and scripted (`eas-cli`, release scripts in `package.json`).
- iOS identifiers configured in `app.json` (`com.camperplan.crafted`).
- `eas.json` added with `preview` and `production` profiles.
- Public runtime env hardening completed (`utils/supabase.ts` now requires env vars).
- `.env.example` added for launch-critical keys.
- Hardcoded Supabase credentials removed from waitlist template.
- Backend deployment script added (`scripts/release/deploy-backend.sh`).
- iOS release script added (`scripts/release/ios-release.sh`).
- Launch runbooks/checklists added under `docs/launch/`.

## External actions still required (account access)

These require authenticated dashboard/CLI access and cannot be completed from a local repo-only patch:

1. `npm run eas:whoami` and `npm run eas:init` with your Expo account.
2. `npm exec supabase -- login` + `link --project-ref ...`.
3. Set Supabase secrets for Stripe/Resend/MailerLite.
4. Configure Stripe webhook endpoint in live Stripe dashboard.
5. Build and publish TestFlight link.
6. Submit production build in App Store Connect.

## Command verification results

- `npm run release:ios:script:testflight` executed and failed with:
  - `An Expo user account is required to proceed.`
- `npm run release:ios:script:appstore` executed and failed with:
  - `An Expo user account is required to proceed.`

This confirms the remaining blockers are account auth and production secret setup, not missing project config.
