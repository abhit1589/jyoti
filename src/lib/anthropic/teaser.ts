import { getClient } from "@/lib/anthropic/interpret";
import { READING_LANGUAGE } from "@/lib/i18n/locales";
import { formatChartForTeaserPrompt } from "@/lib/vedic/chart";
import type { Locale, ReadingTeaser, VedicChart } from "@/lib/types";

const MODEL = process.env.ANTHROPIC_MODEL ?? "claude-sonnet-4-6";
const TEASER_MAX_TOKENS = Number(process.env.TEASER_MAX_TOKENS ?? "450");

const PLAIN_OUTPUT_RULE =
  "In your JSON values, use everyday life language only. Do NOT mention planet names, rashis, houses, nakshatras, dasha, or other Jyotish terms.";

const LANGUAGE_RULE: Record<Locale, string> = {
  en: "Write in warm, simple English.",
  hi: "पूरा उत्तर सरल हिंदी में। अंग्रेज़ी शब्द नहीं।",
  mr: "संपूर्ण मराठीत, साधी भाषा.",
  kn: "ಸಂಪೂರ್ಣ ಸರಳ ಕನ್ನಡದಲ್ಲಿ.",
  te: "పూర్తిగా సాధారణ తెలుగులో.",
  ta: "முழுவதும் எளிய தமிழில்.",
};

function buildTeaserPrompt(chart: VedicChart, locale: Locale): string {
  const chartBlock = formatChartForTeaserPrompt(chart, locale);

  return `You are Taara Jyotishyam. Write a FREE brief preview of this birth chart.
Language: ${READING_LANGUAGE[locale]}. ${LANGUAGE_RULE[locale]}
${PLAIN_OUTPUT_RULE}

Chart data (for your analysis only — do not repeat technical details in the output):
${chartBlock}

Return ONLY valid JSON — no markdown — in this exact shape:
{"personality":"...","career":"...","dasha":"..."}

Rules for EACH value:
- Exactly 2 or 3 short sentences (one brief paragraph)
- personality: how they come across and one distinctive inner trait or contradiction — not generic praise
- career: name at least one concrete field or way of working; include an unconventional or non-obvious path if the chart supports it (e.g. independent, creative, research, service, tech, teaching)
- dasha: the flavor of this chapter right now — tie to the current period in the chart data; name what feels emphasised (work, relationships, change, rest, etc.)
- Warm, direct "you" voice
- Chart-specific only — nothing that could apply to anyone
- No fear-based predictions`;
}

function parseTeaser(text: string): ReadingTeaser {
  const trimmed = text.trim();
  const jsonMatch = trimmed.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("Teaser response was not valid JSON");
  }

  const parsed = JSON.parse(jsonMatch[0]) as Partial<ReadingTeaser>;
  const personality = parsed.personality?.trim();
  const career = parsed.career?.trim();
  const dasha = parsed.dasha?.trim();

  if (!personality || !career || !dasha) {
    throw new Error("Teaser response was missing a section");
  }

  return { personality, career, dasha };
}

export function canGenerateTeaser(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY?.trim());
}

export async function generateReadingTeaser(
  chart: VedicChart,
  locale: Locale,
): Promise<ReadingTeaser> {
  const client = getClient();
  const response = await client.messages.create({
    model: MODEL,
    max_tokens: TEASER_MAX_TOKENS,
    messages: [{ role: "user", content: buildTeaserPrompt(chart, locale) }],
  });

  const block = response.content.find((b) => b.type === "text");
  if (!block || block.type !== "text") {
    throw new Error("Teaser returned no text");
  }

  return parseTeaser(block.text);
}
