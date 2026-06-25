import Anthropic from "@anthropic-ai/sdk";
import { RASHIS } from "@/lib/vedic/constants";
import { READING_LANGUAGE } from "@/lib/i18n/locales";
import { formatMonthLabel, getMonthId } from "@/lib/monthly-rashi/period";
import { LANGUAGE_RULE, parseHoroscopes } from "@/lib/rashi-horoscope/parse";
import type { RashiHoroscopePayload } from "@/lib/rashi-horoscope/types";
import { getWeeklyTransitContext } from "@/lib/weekly-rashi/transits";
import type { Locale } from "@/lib/types";

const MODEL = process.env.ANTHROPIC_MODEL ?? "claude-sonnet-4-6";

function buildPrompt(locale: Locale, transitContext: string, monthLabel: string): string {
  const rashis = RASHIS[locale];
  const rashiList = rashis.map((name, i) => `${i + 1}. ${name}`).join("\n");

  return `You are writing Taara Jyotishyam's free monthly Chandra-rashi (Moon-sign) outlook for ${monthLabel}.
Language: ${READING_LANGUAGE[locale]}. ${LANGUAGE_RULE[locale]}

Current slow-transit context (use only for tone — do not mention planets, signs, or houses in the output):
${transitContext}

Rashis (keys 1–12):
${rashiList}

Return ONLY valid JSON — no markdown — in this shape:
{"1":"...","2":"...",...,"12":"..."}

Rules for EACH rashi value:
- Exactly 5 or 6 short sentences (one paragraph)
- Generic for everyone with that Chandra rashi — not personalised
- Plain life language: overall themes for the month — work, relationships, money, health, energy
- No planet names, house numbers, nakshatra, dasha, yoga, or technical terms
- No predictions of death, disease, or guaranteed events
- Practical and balanced — not fear-based`;
}

export async function generateMonthlyRashiHoroscopes(locale: Locale): Promise<RashiHoroscopePayload> {
  const apiKey = process.env.ANTHROPIC_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("Monthly horoscope service is not configured");
  }

  const periodId = getMonthId();
  const periodLabel = formatMonthLabel(locale);
  const transitContext = await getWeeklyTransitContext(locale);

  const client = new Anthropic({ apiKey });
  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 6144,
    messages: [{ role: "user", content: buildPrompt(locale, transitContext, periodLabel) }],
  });

  const block = response.content.find((b) => b.type === "text");
  if (!block || block.type !== "text") {
    throw new Error("Monthly horoscope returned no text");
  }

  return {
    periodId,
    periodLabel,
    generatedAt: new Date().toISOString(),
    horoscopes: parseHoroscopes(block.text),
  };
}

export type MonthlyRashiPayload = RashiHoroscopePayload;
