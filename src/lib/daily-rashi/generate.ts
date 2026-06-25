import Anthropic from "@anthropic-ai/sdk";
import { RASHIS } from "@/lib/vedic/constants";
import { LOCALES, READING_LANGUAGE } from "@/lib/i18n/locales";
import { formatDayLabel, getDayId } from "@/lib/daily-rashi/period";
import { LANGUAGE_RULE, parseHoroscopes } from "@/lib/rashi-horoscope/parse";
import type { AllLocalesHoroscopePayload } from "@/lib/rashi-horoscope/disk-cache";
import type { RashiHoroscopePayload } from "@/lib/rashi-horoscope/types";
import { getWeeklyTransitContext } from "@/lib/weekly-rashi/transits";
import type { Locale } from "@/lib/types";

const MODEL = process.env.ANTHROPIC_MODEL ?? "claude-sonnet-4-6";

function formatAnthropicError(error: unknown): string {
  if (error instanceof Anthropic.APIError) {
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return "Failed to generate daily horoscopes";
}

function buildPrompt(locale: Locale, transitContext: string, dayLabel: string): string {
  const rashis = RASHIS[locale];
  const rashiList = rashis.map((name, i) => `${i + 1}. ${name}`).join("\n");

  return `You are writing Taara Jyotishyam's free daily Chandra-rashi (Moon-sign) outlook for ${dayLabel}.
Language: ${READING_LANGUAGE[locale]}. ${LANGUAGE_RULE[locale]}

Current slow-transit context (use only for tone — do not mention planets, signs, or houses in the output):
${transitContext}

Rashis (keys 1–12):
${rashiList}

Return ONLY valid JSON — no markdown — in this shape:
{"1":"...","2":"...",...,"12":"..."}

Rules for EACH rashi value:
- Exactly 2 or 3 short sentences (one paragraph)
- Generic for everyone with that Chandra rashi — not personalised
- Plain life language: mood, work, relationships, energy today
- No planet names, house numbers, nakshatra, dasha, yoga, or technical terms
- No predictions of death, disease, or guaranteed events
- Practical and balanced — not fear-based`;
}

/** Generate one locale only — used by page loads and API. */
export async function generateDailyRashiHoroscopes(locale: Locale): Promise<RashiHoroscopePayload> {
  const apiKey = process.env.ANTHROPIC_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("Daily horoscope service is not configured");
  }

  const periodId = getDayId();
  const periodLabel = formatDayLabel(locale);
  const transitContext = await getWeeklyTransitContext(locale);
  const client = new Anthropic({ apiKey });

  try {
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 3072,
      messages: [{ role: "user", content: buildPrompt(locale, transitContext, periodLabel) }],
    });

    const block = response.content.find((b) => b.type === "text");
    if (!block || block.type !== "text") {
      throw new Error("Daily horoscope returned no text");
    }

    return {
      periodId,
      periodLabel,
      generatedAt: new Date().toISOString(),
      horoscopes: parseHoroscopes(block.text),
    };
  } catch (error) {
    throw new Error(formatAnthropicError(error));
  }
}

/** Cron pre-warm: generate each locale separately. */
export async function generateDailyRashiHoroscopesAllLocales(): Promise<AllLocalesHoroscopePayload> {
  const result = {} as AllLocalesHoroscopePayload;

  for (const locale of LOCALES) {
    result[locale] = await generateDailyRashiHoroscopes(locale);
  }

  return result;
}

export type DailyRashiPayload = RashiHoroscopePayload;
