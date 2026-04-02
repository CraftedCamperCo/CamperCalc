# Week 2 App Store Checklist

## App Store Connect Setup

- [ ] App metadata finalized (title, subtitle, description, keywords)
- [ ] Screenshots uploaded
- [ ] Support URL and privacy URL verified
- [ ] App review notes added (test account + key flows)
- [ ] Age rating + export compliance completed

## Build + Submit

- [ ] `npm run build:ios:production` completed
- [ ] `npm run submit:ios:production` completed
- [ ] Build attached to release version in App Store Connect
- [ ] Submission accepted for review

## Go / No-Go before manual release

- [ ] P0 items in `docs/launch/GO_NO_GO_CHECKLIST.md` passed
- [ ] Stripe live checkout + webhook verified
- [ ] Supabase Edge Function logs healthy
- [ ] Sentry error rate acceptable

## Launch + Monitoring

- [ ] Release manually in App Store Connect
- [ ] Monitor for first 2 hours (payments, webhooks, crash reports)
- [ ] Daily checks for first 14 days
