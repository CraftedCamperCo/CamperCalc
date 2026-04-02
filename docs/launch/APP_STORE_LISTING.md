# CamperPlan — App Store & Google Play Listing Copy

> Ready to paste. Review and adjust before submission.  
> Last updated: 2026-02-24

---

## Apple App Store

### App Name (30 chars max)
```
CamperPlan by Crafted
```

### Subtitle (30 chars max)
```
Van Build Planner & Shop
```

### Category
```
Primary:   Utilities
Secondary: Shopping
```

### Rating
```
4+ (no objectionable content)
```

### Keywords (100 chars max, comma separated — no spaces after commas)
```
campervan,van conversion,electrical calculator,solar,battery,LiFePO4,van build,wiring,victron,DIY
```

### Description (4000 chars max)

```
Plan your campervan build the right way — and order everything you need in one place.

CamperPlan is the only app built specifically for van converters in the UK. Whether you're tackling your first ever conversion or you're a seasoned pro, we calculate your exact electrical, insulation, and water system from scratch — based on your answers, not a generic template.

── WHAT WE CALCULATE FOR YOU ──

Tell us how you want to live in your van. We do the rest.

• Recommended battery bank size (Ah) and chemistry
• Solar array size and MPPT charge controller
• DC-DC alternator charger specification
• Inverter or inverter-charger sizing
• Cable gauges, fuse ratings, and busbar spec
• Water system: tank sizes, pump, and hot water
• Insulation: coverage, layers, and products

No electrical knowledge required. No spreadsheets. No guessing.

── SHOP THE EXACT COMPONENTS ──

Once your system is calculated, add the exact recommended products directly to your basket. We stock:

• Fogstar Drift LiFePO4 batteries (105Ah–608Ah)
• Victron Energy inverter-chargers, MPPT controllers, and DC-DC chargers
• Victron SmartShunt battery monitors
• 12V appliances, roof fans, and compressor fridges
• Fresh and grey water tanks, pumps, and water heaters
• Dodo insulation range — thermal liner, sound deadening, floor products

All products are shipped directly to your door.

── BESPOKE WIRING SCHEMATICS ──

Spend £1,500 in the shop and unlock your Sales Suite — a bespoke wiring schematic generated specifically for your van's electrical configuration. Every component, every cable gauge, every fuse rating, exactly as it should be installed. Includes step-by-step installation guidance.

── MANAGE MULTIPLE BUILDS ──

Save and name as many projects as you need. Pick back up exactly where you left off. Attach photos of your build progress. Export your full build summary as a PDF.

── BUILT BY PEOPLE WHO BUILD VANS ──

CamperPlan is made by Crafted Camper Co. (Yorkshire) LTD — a team that has planned, specified, and built campervans. We know what goes wrong when you guess. This app exists so you don't have to.

Free to plan. Only pay for what you order.

──

Questions? hello@craftedcamper.co
Terms, Returns & Shipping: inside the app under Settings
```

### What's New (first release)
```
Welcome to CamperPlan by Crafted. Plan your campervan electrical, water, and insulation systems — then shop the exact components, all in one app.
```

---

## Google Play Store

### App Name (50 chars max)
```
CamperPlan by Crafted — Van Build Planner
```

### Short Description (80 chars max)
```
Plan your campervan build and shop Victron components. Bespoke. Calculated. Yours.
```

### Full Description (4000 chars max)

```
Plan your campervan conversion properly — and order everything you need in one place.

CamperPlan is the only app built for UK van converters. Answer a few questions about how you want to live in your van. We calculate your complete electrical, water, and insulation systems — and recommend the exact products to buy.

WHAT WE CALCULATE

• Battery bank: size, chemistry (LiFePO4), and brand recommendation
• Solar array: panel wattage and MPPT charge controller spec
• DC-DC charger: alternator charging from your starter battery
• Inverter-charger: sizing for your appliance loads
• 240V hookup: consumer unit spec and shore power integration
• Water system: tank sizes, pump spec, and hot water type
• Insulation: thermal liner, sound deadening, and floor products

No technical background needed. No spreadsheets. No wasted money.

SHOP THE EXACT PRODUCTS

Add directly from your recommendations to your basket:

• Fogstar Drift LiFePO4 batteries — 105Ah to 608Ah
• Victron Energy: MultiPlus inverter-chargers, SmartSolar MPPT, Orion DC-DC chargers, SmartShunt
• 12V appliances: compressor fridges, roof fans
• Water tanks, pumps, heaters
• Dodo insulation range

All shipped directly to your door.

BESPOKE WIRING SCHEMATICS

Spend £1,500 in the shop and unlock your Sales Suite — a bespoke wiring schematic for your exact van build configuration, plus step-by-step installation guidance.

MANAGE YOUR BUILD PROJECTS

• Save multiple van projects
• Resume exactly where you left off
• Attach build photos
• Export your full build spec as a PDF

Free to plan. Only pay for what you order.

Questions: hello@craftedcamper.co
```

### Category
```
Tools
```

### Tags
```
campervan, van conversion, DIY, electrical, solar, battery
```

---

## App Store Screenshots Brief (what to show on each slide)

> Design these as 6.7" iPhone (1290×2796px) and 12.9" iPad (2048×2732px).  
> Dark background (#1A1A1A) with amber accent (#D9A05B). Premium, minimal.

| Slide | Headline | Screen to show |
|---|---|---|
| 1 | "Plan your build. Craft your adventure." | Home screen — Your Projects card |
| 2 | "We calculate everything for you." | Electrical Systems tab with selections made |
| 3 | "Your bespoke recommendation, instantly." | Build/Recommendations screen with electrical summary |
| 4 | "Shop the exact components you need." | Shop screen — category view |
| 5 | "Secure checkout. Delivered to your door." | Basket + checkout button |
| 6 | "Unlock your bespoke wiring schematic." | Schematic view or Sales Suite unlock screen |

---

## Three Things Still Needed From You

### 1 — Sentry error monitoring (5 minutes)
1. Go to [sentry.io](https://sentry.io) → free account
2. New Project → React Native → name it `camperplan-app`
3. Copy the DSN (e.g. `https://abc123@o0.ingest.sentry.io/123`)
4. Add to `.env.local`:
   ```
   EXPO_PUBLIC_SENTRY_DSN=https://...your dsn here...
   ```
5. Restart the dev server — crashes and errors will now appear in your Sentry dashboard

### 2 — Order confirmation emails (10 minutes)
1. Go to [Supabase Dashboard](https://supabase.com/dashboard/project/alcvgqpduxugaelxjpbz) → Edge Functions → Secrets
2. Add two secrets:
   ```
   RESEND_API_KEY    =  your Resend API key (from resend.com)
   ORDER_FROM_EMAIL  =  Crafted Camper <orders@craftedcamper.co>
   ```
3. Go to [resend.com](https://resend.com) → free account → API Keys → create one
4. Add/verify your sending domain (`craftedcamper.co`) in Resend

### 3 — Stripe automatic receipts (2 minutes)
1. Log in to [Stripe Dashboard](https://dashboard.stripe.com)
2. Settings → Emails → Customer emails
3. Toggle ON: **Successful payments** and **Refunds**
4. Set the receipt email footer to your support email

---
