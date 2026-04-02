# Week 1 TestFlight Checklist

## Build + Distribution

- [ ] `.env.local` populated from `.env.example`
- [ ] `npm run eas:whoami` confirms Expo account
- [ ] `npm run build:ios:preview` build completed
- [ ] Build appears in App Store Connect TestFlight
- [ ] Public invite link enabled

## Mandatory QA

- [ ] Auth works (sign in / sign out)
- [ ] Project creation + van selection works
- [ ] Electrical bundle can be added/removed and re-added
- [ ] Insulation bundle can be added/removed and re-added
- [ ] Checkout starts from basket
- [ ] Stripe payment success flow returns correctly
- [ ] Stripe payment cancel flow returns correctly
- [ ] `orders` row created via webhook
- [ ] Confirmation email received
- [ ] No P0 crash during main journey

## Issue Triage

- [ ] P0 fixed immediately
- [ ] P1 scheduled before App Store submit
- [ ] Release notes updated for next build
