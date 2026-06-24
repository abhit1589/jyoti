# Jyoti — Vedic Astrology (India)

Vedic birth chart app with Lahiri sidereal calculations, **English + Telugu** UI, and personalised Jyotish readings. Built for India; Razorpay payments deferred until after testing.

## Features

- Lahiri sidereal D1 (Rashi) chart — South Indian layout
- Planetary positions: rashi, nakshatra, pada, house (whole sign)
- Vimshottari dasha (birth balance + 9 mahadasha periods)
- 10 major Indian cities (IST / Asia-Kolkata)
- Jyotish interpretation in English or Telugu
- Daily reading limits (no Razorpay yet)

## Quick start

```bash
npm install
cp .env.example .env.local
# Add your reading API key to .env.local (see ANTHROPIC_API_KEY)
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — defaults to English. Telugu: [http://localhost:3000/te](http://localhost:3000/te)

## Environment

| Variable | Required | Description |
|----------|----------|-------------|
| `ANTHROPIC_API_KEY` | For readings | Your reading provider API key |
| `FREE_DAILY_READINGS` | No | Default `2` per session per day |
| `BETA_PREMIUM_CODE` | No | Unlocks higher limits for testers |

Charts work without an API key. Readings require `ANTHROPIC_API_KEY`.

## Roadmap

- [ ] Razorpay subscriptions (after testing)
- [ ] Divisional charts (D9, D10)
- [ ] Custom birth place (lat/lon search)
- [ ] Separate Western astrology app (tropical zodiac)

## Stack

- Next.js 16, TypeScript, Tailwind CSS
- Sidereal ephemeris (Lahiri ayanamsa)
- Personalised Jyotish readings
- `next-intl` — English / Telugu
- `luxon` — timezone handling (IST)

## Disclaimer

Astrology readings are for guidance and entertainment only. Not medical, legal, or financial advice.
