# CamperPlan — Product Intelligence Brief

> **Purpose of this document**  
> This is a living brief for AI assistants, marketing collaborators, and team members. It gives a complete picture of the product, brand, audience, features, pricing, and launch strategy so that it can be used directly to plan advertising, social content, email campaigns, and growth strategy.  
> 
> **Last updated:** 2026-02-24 (Budget/Premium tiers added; supplier product list drafted)  
> **Maintained by:** Dan Andrews, Crafted Camper Co  
> **Update frequency:** After every major feature release or commercial change

---

## 1. Business Overview

| Field | Detail |
|---|---|
| **Company name** | Crafted Camper Co. (Yorkshire) LTD |
| **App name** | CamperPlan by Crafted |
| **Tagline** | *Plan your build. Craft your adventure.* |
| **Website (planned)** | camperplan.com |
| **Support email** | hello@craftedcamper.co |
| **Industry** | Campervan conversion planning / e-commerce / DIY build tooling |
| **Platform** | iOS and Android (React Native / Expo) |
| **Business model** | Free planning app + in-app product shop (drop-ship) + premium unlocks |
| **Launched** | Target: 1 April 2026 |

---

## 2. Brand Identity

### Tone of Voice
Premium, authoritative, and bespoke — but never pretentious. We speak to both first-time DIY builders and experienced pro converters. Language is direct, technical where needed, and confident. We use proper vanlife/electrical terminology (e.g. LiFePO4, MPPT, inverter-charger, DC-DC, hookup charging).

### Brand Values
- **Bespoke over generic** — every recommendation is calculated from the customer's own answers
- **No gatekeeping** — the planning tools are free; we earn through product sales and premium kits
- **Crafted quality** — premium Yeti/Land Rover Defender aesthetic: rugged, refined, practical
- **Honest calculations** — the maths is real, transparent, and safe

### Visual Identity
| Element | Value |
|---|---|
| Primary (Charcoal) | `#1A1A1A` |
| Accent (Warm Wood) | `#D9A05B` |
| Background | `#F8F9FA` |
| Body text | `#333333` |
| Success / Go | `#2E4C3D` |
| Corner radius | 12px |
| Style reference | Native iOS feel, glass cards, subtle premium shadows |

---

## 3. Target Audience

### Primary
- **First-time van converters** — people buying or converting their first van. Age 24–45. They want guidance, confidence, and to avoid expensive mistakes.
- **Intermediate self-builders** — people who have done research but want a structured, reliable build calculator before buying anything.

### Secondary
- **Pro converters and small conversion businesses** — want a tool to calculate and spec builds quickly for clients.
- **Van life enthusiasts and content creators** — looking for an authoritative planning tool to recommend to audiences.

### Pain Points We Solve
1. "I don't know how big a battery I need."
2. "I spent money on the wrong components."
3. "I found the information but it was scattered across five YouTube channels and Reddit threads."
4. "I don't know what insulation, wiring, or water system to actually buy."
5. "I wish someone would just tell me exactly what to order."

---

## 4. What the App Does (Core Features)

CamperPlan is a guided build planner that walks the customer through every major system of a campervan conversion and generates a bespoke product recommendation + shopping list.

### 4.1 The Planning Journey (6-tab flow)

| Tab | Name | What it does |
|---|---|---|
| 1 | **Camper** | Lifestyle questions: van type, reg lookup (DVLA), travel style, climate, trip length, crew size, off-grid days |
| 2 | **Systems (Electrical)** | Appliance selection, 240V/mains setup, hookup charging, heating type, hot water type |
| 3 | **Insulation** | Van area inputs, insulation type, climate band — optional toggle if not insulating |
| 4 | **Water** | Fresh and grey tank sizing, pump, water usage — optional toggle if no water system |
| 5 | **Furniture** | CNC furniture kit builder, dimensions, layout options |
| 6 | **Build (Recommendations)** | Full bespoke output: recommended electrical package, water components, insulation list, bespoke wiring kit, actions |

### 4.2 What the Recommendations Engine Calculates
- Daily amp-hour (Ah) usage from all selected appliances and lighting
- Recommended battery bank size (Ah, LiFePO4)
- Recommended solar array size (W)
- Recommended MPPT solar charge controller
- Recommended DC-DC charger from the vehicle alternator
- Whether an inverter or inverter-charger is needed
- Net daily power balance (solar harvest vs usage)
- Water system sizing (tank size, pump, heater type)
- Insulation coverage (m² required per van size/type)
- Total estimated package price
- Time saved vs self-researching and piecing together
- Cost saved vs buying wrong components

### 4.3 Project Management
- Users can create, save, and name multiple van build projects
- Each project stores the full planning state
- Projects are saved to Supabase (cloud, tied to user account)
- Project photos can be added (van progress pictures)
- Project export: PDF/HTML build summary download, email, share to social

### 4.4 The Shop
- Categories: Batteries, Inverter-Chargers, Solar Charge Controllers, DC-DC Chargers, Monitors, Appliances, Water Systems, Insulation, Accessories
- Products are curated (Victron Energy, Fogstar, Dodo insulation range)
- Product listings show price, specifications, and direct links
- Add to basket, change quantities, remove items
- Drop-ship fulfilment (products shipped directly from supplier partner)

### 4.5 Checkout
- In-app Stripe checkout (WebView — no redirect to external browser)
- Card payment only at launch
- Order confirmation email sent automatically on purchase
- Orders stored in Supabase database

### 4.6 Sales Suite (Premium Unlock)
- Spend £1,500+ cumulatively in the shop and unlock **Sales Suite**
- Sales Suite includes:
  - **Bespoke wiring schematic** generated for the customer's exact build configuration
  - **Step-by-step video installation instructions** bespoke to their setup
  - **Bespoke Electrical Wiring Kit** — wires pre-crimped, heat-shrunk, and labelled by our supplier partner, ready to install
- This is an incentive to push spend over the natural average basket threshold
- Customers who purchase a full electrical system naturally exceed this threshold

### 4.7 Bespoke Wiring Kit (Standalone)
- Also available as a one-off purchase: **£75**
- Includes bespoke wiring schematic + video install guide specific to the customer's calculated system
- The wiring kit itself (crimped/heat-shrunk cables) is fulfilled by our supplier partner to the customer's exact spec

### 4.8 Budget vs Premium Tier Selection

**New feature (2026-02-24):** Customers can now choose between two product tiers throughout their build journey.

| Feature | Budget Tier | Premium Tier |
|---|---|---|
| Battery | Fogstar Drift ECO (100–628Ah) | Fogstar Drift Standard (105–608Ah) |
| MPPT Solar Controller | Victron BlueSolar (no Bluetooth) | Victron SmartSolar (Bluetooth, VE.Smart) |
| DC-DC Charger | Orion-Tr Smart 18A Isolated | Orion-Tr Smart 18/30A or Orion XS 50A |
| Distribution | 12-way blade fuse block | Victron Lynx Distributor |
| Insulation deadening | Dodo Mat DEADN Hex 50-sheet | Dodo Mat DEADN PRO Black |
| Insulation thermal | Dodo Sound Stopper Pro 16mm | Dodo Thermo Liner Pro 10mm |
| Water pump | Shurflo Trail King 7L 20PSI | Shurflo 4009 11LPM high-flow |
| Water tanks | Standard (40L fresh / 40L grey) | Upgraded (70L+ fresh / 55L grey) |

- Tier is selectable on the **Systems (Tab 2)** screen and confirmed on the **Build Summary (Tab 6)** screen
- Both tiers share the same recommendation engine — the size/spec is calculated identically; only the component brand/grade differs
- Both tiers show an estimated package price at-a-glance
- Inverter range is shared between tiers (Victron MultiPlus)
- SmartShunt 500A and SmartBatteryProtect are included in both tiers

### 4.9 Legal and Support Pages (In-App)
- Terms of Service
- Privacy Policy
- Returns & Refunds Policy
- Shipping & Fulfilment Policy
- Cookie Policy
- FAQ (15 questions)
- Support (email contact)

---

## 5. Pricing Summary

| Item | Price |
|---|---|
| App download | Free |
| Planning tools | Free (all tabs) |
| Shop products | Market price (battery kits from ~£288) |
| Bespoke Wiring Kit (standalone) | £75 |
| Sales Suite unlock | Automatic at £1,500 cumulative spend |
| Typical full electrical build basket | £800–£2,500+ |
| Typical insulation bundle | £150–£300 |
| Typical water system | £300–£600 |

---

## 6. Product Catalogue (Key Lines)

### Batteries (LiFePO4, Fogstar Drift)
| Product | Capacity | Price |
|---|---|---|
| Fogstar Drift 105Ah | 105Ah | £288 |
| Fogstar Drift 230Ah | 230Ah | £488 |
| Fogstar Drift 280Ah | 280Ah | £533 |
| Fogstar Drift 300Ah | 300Ah | £623 |
| Fogstar Drift 460Ah | 460Ah | £767 |
| Fogstar Drift 608Ah | 608Ah | £900 |

### Inverter-Chargers (Victron MultiPlus)
| Product | Continuous Power | Price |
|---|---|---|
| MultiPlus 12/800 | 800VA | £550 |
| MultiPlus 12/1600 | 1600VA | £750 |
| MultiPlus 12/2000 | 2000VA | £950 |
| MultiPlus 12/3000 | 3000VA | £1,300 |

### Solar Charge Controllers (Victron SmartSolar)
| Product | Max Solar Input | Price |
|---|---|---|
| MPPT 75/15 | 200W | £85 |
| MPPT 100/20 | 290W | £110 |
| MPPT 100/30 | 440W | £165 |
| MPPT 150/35 | 500W | £220 |

### DC-DC Chargers (Victron Orion)
| Product | Output | Price |
|---|---|---|
| Orion-Tr Smart 12/12-18 Isolated | 18A / 220W | £160 |
| Orion-Tr Smart 12/12-30 Isolated | 30A / 360W | £220 |
| Orion XS 12/12-50 Non-Isolated | 50A / 600W | £280 |

### Appliances
- 12V Compressor Fridge 50L — £429
- 12V Roof Vent Fan — £179

### Water Systems
- Fresh Water Tank 70L — £129
- Grey Water Tank 55L — £109
- 12V Pressure Water Pump — £69

### Insulation (Dodo range)
- Dodo Thermo Liner Pro 10mm (5m²) — £79.33
- Dodo Mat DEADN DUO 2-in-1 (2.5m²) — £63.46
- Dodo Mat DEADN PRO Black (3.7m²) — £72.14
- SupaSoft Insulation Roll — £25.78
- Accessories: tape, roller, adhesive — from £5.87

---

## 7. Differentiators

| CamperPlan | Typical competitor / alternative |
|---|---|
| Bespoke calculation per customer | Generic guides and YouTube videos |
| Integrated shop with exact recommended products | Separate Google search, multiple websites |
| Bespoke wiring kit fulfil by our supplier | DIY buying from Amazon, wrong cables, wrong sizes |
| Sales Suite reward system at £1,500 | No loyalty/incentive on competitors |
| Native iOS/Android app (no browser needed) | Websites only, not optimised for mobile build research |
| Saves project, exports PDF, shares to social | No equivalent in existing build planning tools |
| Pre-planned for launch with policies, FAQ, support | Many indie apps launch without these |

---

## 8. Customer Journey (Marketing Context)

```
AWARENESS
  ↓ Van life content / social ad / YouTube mention
DISCOVERY
  ↓ App store listing / landing page
ONBOARDING
  ↓ Experience level selection → Create account → First project
PLANNING (App engagement)
  ↓ Camper → Electrical → Insulation → Water → Furniture → Recommendations
ADD TO BASKET
  ↓ "Add Electrical Package" / "Add Water Components"
CHECKOUT (In-app Stripe)
  ↓ Card payment → Success screen
POST-PURCHASE
  ↓ Order confirmation email → Build instructions delivered → Bespoke kit fulfilled
LOYALTY
  ↓ Cumulative spend tracking → Sales Suite unlock at £1,500
ADVOCACY
  ↓ Share build on social → Refer friends to CamperPlan
```

---

## 9. Social Media and Marketing Notes

### Key Messages for Ads/Content

1. **"Stop guessing. Start building."** — The single biggest pain point is confidence. We solve it.
2. **"Your bespoke electrical system in 5 minutes."** — Speed + bespoke combination is unique.
3. **"We calculate everything. You just answer a few questions."** — Removes technical intimidation.
4. **"Save hours. Save money. Get it right first time."** — The value saved angle (time + cost).
5. **"Victron-grade electrical kits, spec'd for your exact van."** — Trust via brand association.
6. **"Free to plan. Only pay for what you need."** — Low-barrier entry.

### Content Ideas

- "What battery size does a [van type] need for full-time living?" → Direct app answer
- "The 3 most common electrical mistakes in van builds" → Educational, links to app
- "We calculated 10 different van builds — here's what the data shows" → Authority content
- "I got my wiring kit pre-made — here's what was in the box" → Unboxing / bespoke kit content
- Build progress posts using the app's project photo feature
- "From zero to quote in under 5 minutes" — screen recording demo

### Platforms to Focus On
- **Instagram / TikTok** — van life lifestyle, build reels, before/after
- **YouTube** — tutorial explainers, "what CamperPlan recommended for my van"
- **Facebook Groups** — vanlife, campervan conversion communities (UK-focused to start)
- **Pinterest** — van conversion inspiration boards with app links

### Target Keywords (SEO / Ads)
- campervan electrical calculator
- van conversion electrical system
- LiFePO4 battery size calculator van
- Victron solar setup campervan
- van build calculator UK
- campervan wiring kit
- van conversion planner app

---

## 10. Launch Timeline

| Date | Milestone |
|---|---|
| Now → Mar 13 | Legal/policy baseline, support pages, FAQ live |
| Mar 10–18 | Supplier API + product list confirmed |
| Mid-March | Marketing launch wave 1, mailing list activated |
| Mar 18 | Tester build ready, payment flow stable |
| Mar 24 | Soft launch (controlled rollout) |
| Mar 28 | Go/no-go decision |
| **Apr 1** | **Hard launch** |

---

## 11. Technology (High Level)

| Component | Technology |
|---|---|
| App framework | React Native + Expo Router |
| Backend + auth + database | Supabase |
| Payments | Stripe (in-app WebView checkout) |
| Email (transactional) | Resend |
| Vehicle reg lookup | DVLA Open Data API |
| App store | iOS App Store + Google Play (via Expo) |

---

## 12. What We Need Help With (For AI/Marketing Collaborators)

If you are an AI assistant helping with advertising and growth for CamperPlan, here is what we are currently working on:

- **Social content calendar** — Instagram, TikTok, Facebook — van build content, app demos, educational posts
- **Email marketing sequences** — welcome flow, post-purchase, re-engagement, launch announcement
- **App store listing copy** — App Store + Google Play descriptions, keywords, screenshots brief
- **Paid ad copy** — Facebook/Instagram and Google Ads campaigns targeting UK van builders
- **Influencer outreach templates** — targeting van life creators with 10k–500k followers
- **Launch PR brief** — for van conversion community blogs, magazines, YouTube channels
- **Post-purchase follow-up sequence** — email flow from order to bespoke kit delivery

---

*This document is confidential to Crafted Camper Co. and authorised collaborators.*  
*To request the latest version, contact: hello@craftedcamper.co*
