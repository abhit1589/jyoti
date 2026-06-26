# Agent Handover — Taara Jyotishyam

**Last updated:** 2026-06-26  
**Repo:** [abhit1589/jyoti](https://github.com/abhit1589/jyoti) · branch `master`  
**Latest commit:** `c79c62b` — Update HANDOVER.md for horoscope page, pricing, and places search.  
**Latest feature commit:** `17bda0d` — Horoscope page, city search, multi-select chart reading checkout.  
**Local path:** `c:\Users\flyam\OneDrive\Desktop\astro`  
**Production:** Vercel (auto-deploy from `master`) · domain [jyotishyam.in](https://jyotishyam.in)

---

## Stack

Next.js 16 (Turbopack) · TypeScript · Tailwind · `swisseph-wasm` · Anthropic · `next-intl` · Razorpay (scaffolded) · PayU (compliance pages + initiate stub)

**Locales:** `en`, `hi`, `mr`, `kn`, `te`, `ta`

---

## What's shipped (current `master`, feature baseline `17bda0d`)

| Feature | Status | Notes |
|--------|--------|-------|
| Birth chart (Lahiri) | Live | No rate limit |
| **Free horoscope page** (`/horoscope`) | Live | Chart/form first; product copy for chart types + reading options below |
| Free AI teaser | Live | **One paragraph** (not 3 sections); curiosity hook + upsell to paid readings |
| AI readings (5 focuses) | Live | personality, career, dasha, **financial**, **marriage** |
| Multi-select pricing / checkout | Live | Table at `/pricing`; URL `?readings=personality,career,...`; bundle when all 5 selected |
| City autocomplete | Live | ~7,100 Indian places; `CityAutocomplete` on birth form, match, panchang |
| Chart Q&A agent | Live | `reading.qa` i18n |
| Kundali matching (Ashtakoot 36pt) | Live | Bride/groom forms; mangal dosha; AI report |
| Panchang | Live | `/panchang` + card on homepage |
| Daily / weekly / monthly Moon-sign forecasts | Live | `/daily`, `/weekly`, `/monthly` |
| Legal / compliance pages | Live | pricing, services, terms, privacy, refund, cancellation, checkout |
| Razorpay payments | **Code only** | Multi-focus orders; user not fully onboarded |
| PayU | **Partial** | Compliance copy + `/api/payments/payu/initiate` stub |
| Dev limit bypass | Local | `DISABLE_USAGE_LIMITS=true` in `.env.local` |

---

## Pricing (current defaults)

| Product | Default (paise) | Env var |
|---------|-----------------|---------|
| Single reading (per section) | ₹100 (`10000`) | `PAYMENT_AMOUNT_SINGLE_PAISE` |
| Complete chart reading (all 5) | ₹400 (`40000`) | `PAYMENT_AMOUNT_BUNDLE_PAISE` |
| Kundali match detailed report | ₹250 (`25000`) | `PAYMENT_AMOUNT_MATCH_REPORT_PAISE` |

- 2–4 sections selected: `single × count`
- All 5 sections: bundle price (`src/lib/payments/reading-order.ts`)
- Pricing UI: `src/components/pricing/PricingTable.tsx` — free services + complete reading row + checkbox pick list + checkout row

---

## User flows

1. **Home** — hero tiles; “Free Horoscope” → `/horoscope` (not `#chart`)
2. **`/horoscope`** — birth form + chart + teaser + readings panel; below: chart-type cards + paid reading option cards
3. **`/pricing`** — unified table with multi-select readings → `/checkout?readings=...`
4. **Free teaser** — generated with chart (`POST /api/chart`); `ReadingTeaserPanel` shows one paragraph + links to checkout/pricing
5. **Paid readings** — after payment, entitlements unlock sections on `ReadingPanel`

---

## API routes

```
POST /api/chart                    — chart + optional single-paragraph teaser
GET  /api/interpret                — usage status
POST /api/interpret                — streaming reading (focus + brief/detailed)
GET  /api/qa                       — Q&A usage
POST /api/qa                       — Q&A SSE
GET  /api/match                    — match usage
POST /api/match                    — guna milan + mangal dosha
POST /api/match/report             — match reading SSE
GET  /api/places/search?q=         — city typeahead
GET  /api/places?id=&locale=       — place lookup by id
GET  /api/panchang                 — panchang for date/place
GET  /api/payments/config          — Razorpay public config
POST /api/payments/create-order    — supports multiple reading focuses
POST /api/payments/verify
GET  /api/payments/entitlements
POST /api/payments/payu/initiate   — PayU stub
GET  /api/business                 — merchant details for checkout
GET  /api/daily-rashi | weekly-rashi | monthly-rashi
GET  /api/cron/daily-rashi | weekly-rashi | monthly-rashi
POST /api/dev/reset-limits         — dev only
```

---

## i18n (read this before adding strings)

Messages merge in `src/i18n/request.ts`:

```ts
{ ...en, landing: landingEn, weekly, daily, monthly, panchang, legal: legalEn }
```

**Use nested namespaces** — top-level key collisions cause `MISSING_MESSAGE` in Turbopack dev:

| UI | Namespace |
|----|-----------|
| Horoscope page | `landing.horoscope` |
| Chart section (home) | `landing.chart` |
| Kundali match | `landing.match` |
| Panchang | `panchang.*` |
| Q&A panel | `reading.qa` |
| Readings / payments / teaser | `reading.*` |
| Pricing / checkout / legal | `legal.*` |
| Forms | `form.*` |
| Daily/weekly/monthly | `daily.*`, `weekly.*`, `monthly.*` |

Strings: `src/messages/*.json`, `landing-*.json`, `legal-en.json` (legal shared across locales for now), `panchang-*.json`, `daily-*.json`, etc.

---

## Places / cities data

- Runtime: `src/lib/vedic/indian-places.json` (~1.6 MB, committed)
- Build: `npm run build:cities` → fetches GeoNames + merges major cities (`scripts/fetch-geonames-in.mjs`, `scripts/build-cities-data.mjs`)
- Server search: `src/lib/vedic/places-server.ts`
- UI: `src/components/CityAutocomplete.tsx`
- Raw GeoNames dumps gitignored: `data/IN.txt`, `data/IN.zip`

---

## Usage limits (in-memory)

Tracked in `src/lib/usage/limits.ts` per `astro_session` cookie:

| Action | Env var | Default |
|--------|---------|---------|
| Readings | `FREE_DAILY_READINGS` | 5 |
| Q&A | `FREE_DAILY_QA` | 8 |
| Match compare | `FREE_DAILY_MATCH` | 10 |
| Match report | `FREE_DAILY_MATCH_REPORT` | 5 |

- **`DISABLE_USAGE_LIMITS=true`** — bypass all limits (local only; **never** on Vercel prod)
- **`POST /api/dev/reset-limits`** — clears store (dev only)
- Chart generation has **no** limit

When Razorpay keys are set, readings use payment entitlements (`focuses[]` on entitlement) instead of free daily limit unless `PAYMENTS_ENABLED=false`.

---

## Payments

- **Razorpay:** order creation supports `readings` array; `reading-order.ts` computes amount; entitlements in signed cookie
- **Checkout:** `CheckoutView.tsx` — line items, `sessionStorage` key `astro_pending_readings`, legacy `?sku=bundle`
- **PayU:** legal/compliance pages reference PayU; initiate route returns stub until hash/SDK wired
- **User:** Razorpay onboarding may be incomplete — confirm keys on Vercel before going live

Key files: `src/lib/payments/*`, `src/lib/readings/parse-focus.ts`, `ReadingPanel.tsx`, `CheckoutView.tsx`, `PricingTable.tsx`

---

## AI prompts

- **Teaser** (`src/lib/anthropic/teaser.ts`): single JSON `{"teaser":"..."}`; 80–110 words; no Jyotish jargon; must not invent; end hints at paid sections only
- **Readings** (`locale-prompts.ts`): per-focus instructions including `financial`, `marriage`
- **Chart blocks** (`src/lib/vedic/chart.ts`): `formatChartForFinancialReadingPrompt`, `formatChartForMarriageReadingPrompt`, etc.

---

## Kundali matching

- **Bride** = person1 (left), **Groom** = person2 (right)
- Algorithm: `src/lib/vedic/ashtakoot.ts` + `ashtakoot-data.ts`
- Mangal: `src/lib/vedic/mangal-dosha.ts`
- UI: `MatchSection.tsx` at `/match` and `#match` on homepage

---

## Dev environment notes

- Project on **OneDrive** — `.next` delete often fails; use `npm run dev:clean` or manual delete; stale cache causes i18n/Turbopack glitches
- Port **3000** may be another app; this project often runs on **3001**, **3002**, or **3004**
- Only one `next dev` per repo — lock error if duplicate; kill stale node or remove `.next`
- `.env.local` gitignored; **`.env.example` also gitignored** by `.env*` rule
- Restart dev after env or large i18n changes

---

## Known follow-ups

1. **Razorpay / PayU go-live** — keys on Vercel, end-to-end checkout test
2. **PayU hash/SDK** — complete `payu/initiate` integration
3. **Horoscope page i18n** — `landing.horoscope` currently English in non-`en` landing files (fallback copy)
4. **Teaser upsell** — tune prompt if preview feels too generic or too salesy
5. **Production env** — confirm `DISABLE_USAGE_LIMITS` unset on Vercel
6. Optional: KV for entitlements/usage; native translations for new `legal.pricing` keys in all locales

---

## Key files

```
src/app/[locale]/horoscope/page.tsx   — dedicated free horoscope page
src/components/ChartSection.tsx     — chart + teaser + readings + Q&A
src/components/ReadingTeaserPanel.tsx — one-paragraph teaser + upsell list
src/components/pricing/PricingTable.tsx — pricing table + multi-select
src/components/CityAutocomplete.tsx
src/components/panchang/PanchangClient.tsx
src/components/MatchSection.tsx
src/components/ReadingPanel.tsx
src/components/legal/CheckoutView.tsx
src/lib/anthropic/                   — interpret, teaser, qa-agent, match-report
src/lib/payments/reading-order.ts    — multi-focus pricing + checkout URL
src/lib/vedic/places-server.ts
src/lib/vedic/indian-places.json
src/i18n/request.ts
src/messages/
```

---

## Commands

```bash
npm run dev
npm run dev:clean          # rm .next then dev (use when cache stuck)
npm run build
npm run build:cities       # regenerate indian-places.json from GeoNames
npm run check:ai
curl -X POST http://localhost:3000/api/dev/reset-limits   # dev only; adjust port
```

---

## User preferences

- Commit only when asked
- Minimize scope; match existing patterns
- Six-locale i18n; native AI output for Indian languages
- No remedy/gem upselling in copy or prompts
- Paid readings must stay within chart data — no invented claims

---

## Commit history (recent)

```
c79c62b Update HANDOVER.md for horoscope page, pricing, and places search.
17bda0d Add horoscope page, city search, and multi-select chart reading checkout.
a1835f7 Add Panchang and update pricing, checkout, and merchant details.
6e3ed24 Update pricing, merchant details, and footer layout for PayU.
0cfd07b Add PayU compliance pages: legal policies, pricing, and checkout.
bc40c05 Fix Vercel build by skipping AI generation at build time.
0ae6a46 Add daily and monthly horoscopes, SEO pages, and PWA assets.
006c971 Add HANDOVER.md
9807aac Add teaser, Q&A, kundali matching, and Razorpay scaffolding.
```
