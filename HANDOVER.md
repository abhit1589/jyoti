# Agent Handover — Taara Jyotishyam

**Last updated:** 2026-06-23  
**Repo:** [abhit1589/jyoti](https://github.com/abhit1589/jyoti) · branch `master`  
**Latest commit:** `9807aac` — *Add teaser, Q&A, kundali matching, and Razorpay scaffolding.*  
**Local path:** `c:\Users\flyam\OneDrive\Desktop\astro`  
**Production:** Vercel (auto-deploy from `master`) · domain `jyotishyam.in`

---

## Stack

Next.js 16 (Turbopack) · TypeScript · Tailwind · `swisseph-wasm` · Anthropic · `next-intl` · Razorpay (scaffolded, not live)

**Locales:** `en`, `hi`, `mr`, `kn`, `te`, `ta`

---

## What's shipped (commit `9807aac`)

| Feature | Status | Notes |
|--------|--------|-------|
| Birth chart (Lahiri) | Live | No rate limit |
| Free AI teaser (3 lines) | Live | Generated with chart if API key set |
| AI readings (personality/career/dasha) | Live | Free daily limit unless Razorpay enabled |
| Chart Q&A agent | Live | `reading.qa` i18n; progeny-aware prompts |
| Kundali matching (Ashtakoot 36pt) | Live | Bride/groom forms; mangal dosha; AI report |
| Razorpay payments | **Code only** | User not onboarded; keys not on Vercel |
| Landing comparison (mobile cards) | Live | Neutrality/no-upsell copy |
| Dev limit bypass | Local | `DISABLE_USAGE_LIMITS=true` in `.env.local` |

---

## API routes

```
POST /api/chart              — chart + optional teaser
GET  /api/interpret          — usage status
POST /api/interpret          — streaming reading
GET  /api/qa                 — Q&A usage
POST /api/qa                 — Q&A SSE
GET  /api/match              — match usage
POST /api/match              — guna milan + mangal dosha
POST /api/match/report       — match reading SSE
GET  /api/payments/config    — Razorpay public config
POST /api/payments/create-order
POST /api/payments/verify
GET  /api/payments/entitlements
POST /api/dev/reset-limits   — dev only, clears usage store
GET  /api/weekly-rashi
GET  /api/cron/weekly-rashi
```

---

## i18n (read this before adding strings)

Messages merge in `src/i18n/request.ts`:

```ts
{ ...en, landing: landingEn, weekly: weeklyEn }
```

**Use nested namespaces** — top-level keys cause `MISSING_MESSAGE` in Turbopack dev:

| UI | Namespace |
|----|-----------|
| Chart section | `landing.chart` |
| Kundali match | `landing.match` |
| Q&A panel | `reading.qa` |
| Readings / payments | `reading.*` |
| Forms | `form.*` |

Strings: `src/messages/*.json` + `src/messages/landing-*.json`

---

## Usage limits (in-memory)

Tracked in `src/lib/usage/limits.ts` per `astro_session` cookie:

| Action | Env var | Default |
|--------|---------|---------|
| Readings | `FREE_DAILY_READINGS` | 5 |
| Q&A | `FREE_DAILY_QA` | 8 |
| Match compare | `FREE_DAILY_MATCH` | 10 |
| Match report | `FREE_DAILY_MATCH_REPORT` | 5 |

- **`DISABLE_USAGE_LIMITS=true`** — bypass all limits (set in local `.env.local`, **must not** be on Vercel prod)
- **`POST /api/dev/reset-limits`** — clears store (dev only)
- Chart generation has **no** limit

When Razorpay keys are set, readings use payment entitlements instead of free daily limit (`PAYMENTS_ENABLED=false` keeps free mode with keys present).

---

## Payments (not live)

- Intended: ₹100 single reading, ₹250 bundle (paise env vars)
- Entitlements: signed cookie, per-chart, per-focus
- **User has not completed Razorpay onboarding**
- Future: Q&A packs (₹49/10), match report (₹199), chart pass (₹299)

Key files: `src/lib/payments/*`, `ReadingPanel.tsx`

---

## Kundali matching

- **Bride** = person1 (left), **Groom** = person2 (right)
- Algorithm: `src/lib/vedic/ashtakoot.ts` + tables in `ashtakoot-data.ts` (node-jhora reference)
- Mangal: `src/lib/vedic/mangal-dosha.ts`
- UI: `MatchSection.tsx` at `#match` on homepage

---

## Dev environment notes

- Project on **OneDrive** — `.next` delete often fails; causes stale i18n cache
- Dev may run on **port 3001**
- `.env.local` is gitignored (contains API key); **`.env.example` is also gitignored** by `.env*` rule — env docs live in this handover + comments in code
- Restart dev after env changes

---

## Known follow-ups

1. **Razorpay onboarding** → add keys to Vercel, test checkout
2. **Monetize Q&A / match** when payments live (entitlement SKUs)
3. **Career reading tone** — user felt old readings were more specific (“unconventional career”); may need prompt tuning in `locale-prompts.ts` / `teaser.ts`
4. **Reduce free Q&A** before paywall (e.g. 2–3/day)
5. **Production env** — confirm `DISABLE_USAGE_LIMITS` is unset on Vercel
6. Optional: un-ignore `.env.example` in `.gitignore`; KV for entitlements; sitemap/analytics

---

## Key files

```
src/components/ChartSection.tsx      — chart + teaser + readings + Q&A
src/components/MatchSection.tsx      — kundali matching
src/components/ReadingPanel.tsx      — readings + Razorpay UI
src/lib/anthropic/                   — interpret, teaser, qa-agent, match-report
src/lib/payments/                    — Razorpay + entitlements
src/lib/usage/limits.ts
src/lib/vedic/                       — chart, ashtakoot, mangal-dosha
src/i18n/request.ts
src/messages/
```

---

## Commands

```bash
npm run dev
npm run build
npm run check:ai
curl -X POST http://localhost:3000/api/dev/reset-limits   # dev only
```

---

## User preferences

- Commit only when asked (done for `9807aac`)
- Minimize scope; match existing patterns
- Six-locale i18n; native AI output for Indian languages
- No remedy/gem upselling in copy or prompts

---

## Commit history (recent)

```
9807aac Add teaser, Q&A, kundali matching, and Razorpay scaffolding.
64356d4 Rebrand to Taara Jyotishyam and polish six-locale UX.
c8a9bb5 Add GitHub Actions cron to warm weekly rashifal cache
```
