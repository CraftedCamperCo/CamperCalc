# CamperPlan Launch Checklist (April 1 Plan)

Last updated: 2026-02-24 (progress pass)  
Target hard launch: **2026-04-01**  
Status legend: `[ ]` not started, `[-]` in progress, `[x]` done

This plan assumes execution by one person (you) with implementation support from me.

---

## Launch Milestones

- [-] **By 2026-03-13**: Legal/policy baseline complete + support pages live
- [ ] **By 2026-03-16**: Marketing prep complete (mid-March launch assets + list setup)
- [ ] **By 2026-03-18**: Tester build ready + payment flow stable
- [ ] **By 2026-03-24**: Soft launch ("Launch Bento") to controlled users
- [ ] **By 2026-03-28**: Critical bug fixes complete + go/no-go review
- [ ] **By 2026-04-01**: Hard launch

---

## Phase A - Must-Do Foundation (Now to Mar 13)

- [-] **Return & Refund Policy**
  - Finalize and publish (app + website). Use editable draft in `docs/policies/RETURN_REFUND_POLICY_DRAFT.md`.
- [-] **Shipping & Fulfilment Policy**
  - Publish shipping methods, delivery windows, surcharge logic, damaged/missing process.
- [-] **Terms of Service review**
  - Ensure terms cover digital + physical products, liability, and checkout flow.
- [-] **Privacy Policy review**
  - Ensure policy matches real data flows (Supabase, Stripe, analytics, email providers).
- [-] **Cookie Policy**
  - Add web cookie categories and consent behavior (strictly necessary, analytics, optional).
- [-] **Business operations checks**
  - Confirm legal entity details, VAT/tax treatment, records retention, and complaints route.
- [x] **Contact Support page**
  - Add support email, response SLA, and escalation path.
- [x] **FAQ page**
  - Add top 15 launch FAQs (shipping, returns, support, checkout, compatibility).

---

## Phase B - Commerce and Supplier Readiness (Mar 10 to Mar 18)

- [ ] **Dropship supplier agreement**
  - Confirm who owns stock, lead time commitments, packaging, and RMA process.
- [-] **Supplier product master list**
  - Full product request document drafted: `docs/SUPPLIER_PRODUCT_REQUEST.md`. Covers 15 categories, 100+ SKUs, Budget + Premium tier spec for each system type. Sent/pending supplier response for pricing, stock, images.
- [-] **Supplier API/scoped access**
  - Obtain API docs + auth + rate limits; define fallback if API unavailable.
- [ ] **Order fulfilment workflow**
  - Define exact order handoff from app -> supplier, with retries and failure alerts.
- [ ] **Order status model**
  - Implement/confirm statuses: paid, processing, fulfilled, cancelled, refunded.
- [x] **Order confirmation emails**
  - Webhook deployed. `RESEND_API_KEY` + `ORDER_FROM_EMAIL` set as Supabase secrets. Emails fire automatically on `checkout.session.completed`.
- [x] **Invoice process**
  - Stripe automatic payment receipts enabled (live mode). VAT invoice workflow can follow post-launch.

---

## Phase C - Product and QA Readiness (Mar 12 to Mar 24)

- [ ] **Crash-free baseline**
  - Goal: no critical crashes in auth, projects, tabs, shop, basket, checkout.
- [-] **Full purchase flow test (mandatory)**
  - Test: add to cart -> checkout -> payment success -> success screen -> order record -> email.
- [ ] **Failure-path tests**
  - Cancelled payment, declined card, network drop, duplicate webhook delivery.
- [-] **Tester release prep**
  - Build stable test version and release notes for basic testers.
- [ ] **Basic tester round**
  - Collect structured feedback (bugs, unclear UX, broken links, friction points).
- [ ] **Bug triage and fix pass**
  - Fix P0/P1 issues before soft launch.
- [ ] **Load and resilience checks**
  - Stress checkout/session function and webhook handling under realistic burst traffic.

---

## Phase D - Marketing and Analytics (Mid-March)

- [ ] **Marketing list setup**
  - Mailing list segmentation, welcome flow, and launch sequence prepared.
- [ ] **Mid-March marketing launch**
  - Go live with first campaign wave and tester signup CTA.
- [ ] **Google Analytics / product analytics**
  - Analytics abstraction layer built (`utils/analytics.ts`). All funnel events instrumented. Needs provider connected (PostHog/Mixpanel — see TODO in file).
- [ ] **Funnel dashboard**
  - Build simple launch dashboard for traffic, conversion, payment success rate.
- [x] **Error monitoring**
  - Sentry fully configured: SDK installed, DSN live, source maps wired in via wizard, plugin in `app.json`. Crash reports and checkout breadcrumbs active in production.

---

## Phase E - Launch Execution (Mar 24 to Apr 1)

- [ ] **Soft launch (Launch Bento)**
  - Controlled rollout for 24-72h, monitor metrics and support load.
- [ ] **Fix soft-launch bugs**
  - Prioritize payment, checkout redirect, and order capture issues first.
- [-] **Final go/no-go checklist**
  - Pass criteria:
    - Payment success path stable
    - Webhook/order storage stable
    - Confirmation emails sent
    - Policies/support/FAQ published
    - No critical crashes
- [ ] **Hard launch (Apr 1)**
  - Launch publicly.
- [ ] **Stripe monitoring daily (first 14 days)**
  - Watch failed payments, disputes, payout and webhook errors.

---

## Immediate Next 14-Day Focus (Priority Order)

1. [-] Finalize and publish policies from `docs/policies/`.
2. [ ] Decide invoice method for launch (Stripe receipts now; VAT invoice add-on next).
3. [-] Complete supplier product and API access request.
4. [-] Complete full end-to-end payment + order + success redirect tests.
5. [-] Add/verify order confirmation transactional emails.
6. [x] Publish Support and FAQ pages.
7. [-] Set up analytics purchase funnel events (instrumented — connect provider when chosen).
8. [-] Enable error monitoring — Sentry installed, add EXPO_PUBLIC_SENTRY_DSN to .env.local.
9. [-] Run tester build and collect top bug list.
10. [ ] Fix top payment/checkout/fulfilment bugs.

---

## Progress Notes (2026-02-24)

- Added and routed launch pages in-app: Returns, Shipping, Cookies, FAQ, Support.
- Updated Home/Auth legal links to surface these pages.
- Expanded FAQ to launch-ready list (15 core questions).
- Updated in-app Terms and Privacy copy for checkout/order realities.
- Draft policy documents added under `docs/policies/`.
- Checkout flow moved to in-app web checkout screen with success/cancel interception.
- Stripe checkout edge function updated and deployed (card-only + minimum amount handling).
- Stripe webhook updated and deployed with customer order confirmation email via Resend (`RESEND_API_KEY` + `ORDER_FROM_EMAIL` required).
- Added launch operations docs: go/no-go checklist, tester script, bug report template, supplier API request template under `docs/launch/`.
- Added global quick links in header menu for FAQ/Support/Terms/Privacy across screens.
- Sentry error monitoring: SDK installed, app.json plugin registered, `utils/sentry.ts` configured. Awaiting `EXPO_PUBLIC_SENTRY_DSN` from Dan.
- Analytics: full funnel instrumentation built (`utils/analytics.ts`) — app open, auth, project created, tab viewed, product viewed, add to basket, begin checkout, success, cancel, error, Sales Suite unlock, schematic viewed/exported.
- Zero TypeScript errors, zero linter errors across entire codebase.
- App Store + Google Play listing copy written: `docs/launch/APP_STORE_LISTING.md`.
- Screenshots brief included. Three manual action items (Sentry DSN, Resend secrets, Stripe receipts) clearly documented.
- Sentry error monitoring installed and wired into _layout.tsx (awaiting DSN from sentry.io).
- Analytics utility fully instrumented: app_open, auth, project, tab, recommendations, add_to_basket, begin_checkout, checkout_success/cancel/error, Sales Suite, schematic.
- App Store listing copy written and ready to paste (docs/launch/APP_STORE_LISTING.md).
- ORDER_FROM_EMAIL secret set in Supabase production (camperplan@craftedcamper.co).
- RESEND_API_KEY set as Supabase secret.
- **Budget/Premium tier feature shipped:** Customers can now select Budget (Fogstar ECO, BlueSolar, fuse block) or Premium (Fogstar Drift, SmartSolar, Lynx) across electrical, insulation, and water recommendations. Tier selector on Systems tab (2) and Build tab (6). Both packages show live price estimates. Cart respects active tier.
- Comprehensive supplier product request document drafted: `docs/SUPPLIER_PRODUCT_REQUEST.md`. 15 product categories, 100+ lines, Budget + Premium spec for every system. Ready to send to Batteries & Solar.
