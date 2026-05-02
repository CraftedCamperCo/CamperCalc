# CamperPlan Web Deployment

This app is web-ready via Expo Router and can be deployed at `camperplan.com`.

## Build

```bash
npm install
npm run web
```

## Environment Variables

Set these in Vercel/Netlify:

- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- `EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `EXPO_PUBLIC_DVLA_API_KEY`
- `EXPO_PUBLIC_SENTRY_DSN`
- `EXPO_PUBLIC_META_PIXEL_ID` (Meta Pixel, fires PageView on web for ad tracking)

## Deploy on Vercel

1. Import this repository into Vercel
2. Set framework to `Other`
3. Build command: `npm run web`
4. Output directory: `dist`
5. Add variables listed above
6. Point `camperplan.com` DNS to Vercel project

## Notes

- Mobile-only haptics gracefully no-op on web
- Shared Supabase backend syncs auth, projects, cart, entitlements, and orders across devices
- Stripe checkout URLs work for both mobile and desktop
- The app now requires the Supabase public env vars at runtime; keep `.env.local` for local dev and platform env vars for hosted builds

