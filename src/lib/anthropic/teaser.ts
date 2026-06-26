import { getClient } from "@/lib/anthropic/interpret";
import { READING_LANGUAGE } from "@/lib/i18n/locales";
import { formatChartForTeaserPrompt } from "@/lib/vedic/chart";
import type { Locale, ReadingTeaser, VedicChart } from "@/lib/types";

const MODEL = process.env.ANTHROPIC_MODEL ?? "claude-sonnet-4-6";
const TEASER_MAX_TOKENS = Number(process.env.TEASER_MAX_TOKENS ?? "300");

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

  return `You are Taara Jyotishyam. Write a free one-paragraph preview (80–110 words) for this birth chart.
Language: ${READING_LANGUAGE[locale]}. ${LANGUAGE_RULE[locale]}

STRICT RULES — follow exactly:
- Write ONLY what the chart data below supports. Do NOT invent or assume anything not shown.
- ONE paragraph only. No headings, no bullet points, no lists, no line breaks within the text.
- Weave together: how this person naturally comes across, the kind of work or direction that suits them, and the flavour of their current life chapter — all from the chart.
- The final 1–2 sentences must honestly signal that the paid readings (Personality, Career & Dharma, Current Dasha, Financial & Wealth, or Marriage & Relationships) go much deeper into specific areas — name only section names that exist on this website. Do not promise anything not on this website.
- Use warm, direct "you" voice. Be specific to this chart — nothing that could apply to anyone.
- Do NOT mention planet names, rashis, house numbers, nakshatras, or any Jyotish technical term.
- No fear, no predictions, no guarantees.

Chart data (for your analysis only — do not repeat these technical details in output):
${chartBlock}

Return ONLY valid JSON with no markdown:
{"teaser":"..."}`;
}

function parseTeaser(text: string): ReadingTeaser {
  const trimmed = text.trim();
  const jsonMatch = trimmed.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("Teaser response was not valid JSON");
  }

  const parsed = JSON.parse(jsonMatch[0]) as Partial<{ teaser: string }>;
  const teaser = parsed.teaser?.trim();

  if (!teaser) {
    throw new Error("Teaser response was missing the teaser field");
  }

  return { teaser };
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
