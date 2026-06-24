import Anthropic from "@anthropic-ai/sdk";
import { RASHIS } from "@/lib/vedic/constants";
import { READING_LANGUAGE } from "@/lib/i18n/locales";
import { getWeeklyTransitContext } from "@/lib/weekly-rashi/transits";
import { formatWeekRange, getIsoWeekId } from "@/lib/weekly-rashi/week";
import type { Locale } from "@/lib/types";

const MODEL = process.env.ANTHROPIC_MODEL ?? "claude-sonnet-4-6";

export interface WeeklyRashiPayload {
  weekId: string;
  weekLabel: string;
  generatedAt: string;
  horoscopes: Record<string, string>;
}

const LANGUAGE_RULE: Record<Locale, string> = {
  en: "Write in warm, simple English. No astrological jargon in the output.",
  hi: "पूरा उत्तर सरल हिंदी में। ज्योतिष शब्द नहीं।",
  mr: "संपूर्ण मराठीत, साधी भाषा. ज्योतिष शब्द नाहीत.",
  kn: "ಸಂಪೂರ್ಣ ಸರಳ ಕನ್ನಡದಲ್ಲಿ. ಜ್ಯೋತಿಷ್ಯ ಪದಗಳಿಲ್ಲ.",
  te: "పూర్తిగా సాధారణ తెలుగులో. జ్యోతిష పదాలు వద్దు.",
  ta: "முழுவதும் எளிய தமிழில். ஜோதிடச் சொற்கள் வேண்டாம்.",
};

function buildPrompt(locale: Locale, transitContext: string, weekLabel: string): string {
  const rashis = RASHIS[locale];
  const rashiList = rashis.map((name, i) => `${i + 1}. ${name}`).join("\n");

  return `You are writing Taaraa's free weekly Chandra-rashi (Moon-sign) outlook for ${weekLabel}.
Language: ${READING_LANGUAGE[locale]}. ${LANGUAGE_RULE[locale]}

Current slow-transit context (use only for tone — do not mention planets, signs, or houses in the output):
${transitContext}

Rashis (keys 1–12):
${rashiList}

Return ONLY valid JSON — no markdown — in this shape:
{"1":"...","2":"...",...,"12":"..."}

Rules for EACH rashi value:
- Exactly 4 or 5 short sentences (one paragraph)
- Generic for everyone with that Chandra rashi — not personalised
- Plain life language: mood, work, relationships, money, energy this week
- No planet names, house numbers, nakshatra, dasha, yoga, or technical terms
- No predictions of death, disease, or guaranteed events
- Practical and balanced — not fear-based`;
}

function parseHoroscopes(text: string): Record<string, string> {
  const trimmed = text.trim();
  const jsonMatch = trimmed.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("Weekly horoscope response was not valid JSON");
  }
  const parsed = JSON.parse(jsonMatch[0]) as Record<string, string>;
  const result: Record<string, string> = {};
  for (let i = 1; i <= 12; i++) {
    const key = String(i);
    const value = parsed[key] ?? parsed[key as unknown as number];
    if (!value?.trim()) {
      throw new Error(`Missing horoscope for rashi ${i}`);
    }
    result[key] = value.trim();
  }
  return result;
}

export async function generateWeeklyRashiHoroscopes(locale: Locale): Promise<WeeklyRashiPayload> {
  const apiKey = process.env.ANTHROPIC_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("Weekly horoscope service is not configured");
  }

  const weekId = getIsoWeekId();
  const weekLabel = formatWeekRange(new Date(), locale);
  const transitContext = await getWeeklyTransitContext(locale);

  const client = new Anthropic({ apiKey });
  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 4096,
    messages: [{ role: "user", content: buildPrompt(locale, transitContext, weekLabel) }],
  });

  const block = response.content.find((b) => b.type === "text");
  if (!block || block.type !== "text") {
    throw new Error("Weekly horoscope returned no text");
  }

  return {
    weekId,
    weekLabel,
    generatedAt: new Date().toISOString(),
    horoscopes: parseHoroscopes(block.text),
  };
}
