import { getClient } from "@/lib/anthropic/interpret";
import { READING_LANGUAGE } from "@/lib/i18n/locales";
import type { AshtakootResult } from "@/lib/vedic/ashtakoot";
import type { MangalDoshaResult } from "@/lib/vedic/mangal-dosha";
import { formatMilanSummary } from "@/lib/vedic/match-prompt";
import type { Locale, VedicChart } from "@/lib/types";

const MODEL = process.env.ANTHROPIC_MODEL ?? "claude-sonnet-4-6";
const MATCH_MAX_TOKENS = Number(process.env.MATCH_MAX_TOKENS ?? "1500");

const NATIVE_RULE: Record<Locale, string> = {
  en: "",
  hi: "Write entirely in simple conversational Hindi. No English words.",
  mr: "Write entirely in simple conversational Marathi. No English words.",
  kn: "Write entirely in simple conversational Kannada. No English words.",
  te: "Write entirely in simple conversational Telugu. No English words.",
  ta: "Write entirely in simple conversational Tamil. No English words.",
};

function buildSystemPrompt(
  brideChart: VedicChart,
  groomChart: VedicChart,
  milan: AshtakootResult,
  mangal: MangalDoshaResult,
  locale: Locale,
): string {
  const summary = formatMilanSummary(milan, mangal, brideChart, groomChart, locale);
  const nativeRule = NATIVE_RULE[locale];

  return `You are Taara Jyotishyam's marriage compatibility guide. Explain this kundali match in warm, plain language.

Language: ${READING_LANGUAGE[locale]}. ${nativeRule}

Rules:
- Use the guna milan score and koota breakdown below — do not invent numbers.
- Plain text only: no markdown, no # headings, no **bold**, no bullet lists with * or -.
- Speak to the couple directly ("you two", "your charts").
- Cover: overall harmony, strongest kootas, areas needing understanding, mangal dosha if relevant.
- Be balanced — low scores on one koota are not doom; high total with one weak area is common.
- Never say "do not marry" or use fear tactics. No gemstone, puja, or remedy sales.
- Not medical or legal advice. Astrology is for guidance and entertainment.

Match data:
${summary}`;
}

export async function streamMatchReport(
  brideChart: VedicChart,
  groomChart: VedicChart,
  milan: AshtakootResult,
  mangal: MangalDoshaResult,
  locale: Locale,
  onChunk: (text: string) => void,
): Promise<void> {
  const client = getClient();
  const stream = client.messages.stream({
    model: MODEL,
    max_tokens: MATCH_MAX_TOKENS,
    system: buildSystemPrompt(brideChart, groomChart, milan, mangal, locale),
    messages: [
      {
        role: "user",
        content:
          "Write a clear marriage compatibility reading for this couple based on the match data. About 4–6 short paragraphs.",
      },
    ],
  });

  for await (const event of stream) {
    if (
      event.type === "content_block_delta" &&
      event.delta.type === "text_delta"
    ) {
      onChunk(event.delta.text);
    }
  }

  const finalMessage = await stream.finalMessage();
  const textBlock = finalMessage.content.find((b) => b.type === "text");
  const text = textBlock?.type === "text" ? textBlock.text : "";
  if (!text.trim()) throw new Error("No report was returned");
}

export function canGenerateMatchReport(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY?.trim());
}
