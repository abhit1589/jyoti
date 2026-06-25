import { getClient } from "@/lib/anthropic/interpret";
import { READING_LANGUAGE } from "@/lib/i18n/locales";
import type { AshtakootResult } from "@/lib/vedic/ashtakoot";
import type { MangalDoshaResult } from "@/lib/vedic/mangal-dosha";
import { formatMatchForQaPrompt } from "@/lib/vedic/match-prompt";
import type { Locale, QaMessage, VedicChart } from "@/lib/types";

const MODEL = process.env.ANTHROPIC_MODEL ?? "claude-sonnet-4-6";
const MATCH_QA_MAX_TOKENS = Number(process.env.MATCH_QA_MAX_TOKENS ?? "1024");
const MAX_HISTORY = 12;

const NATIVE_RULE: Record<Locale, string> = {
  en: "",
  hi: "Answer entirely in simple conversational Hindi. No English words.",
  mr: "Answer entirely in simple conversational Marathi. No English words.",
  kn: "Answer entirely in simple conversational Kannada. No English words.",
  te: "Answer entirely in simple conversational Telugu. No English words.",
  ta: "Answer entirely in simple conversational Tamil. No English words.",
};

function buildSystemPrompt(
  brideChart: VedicChart,
  groomChart: VedicChart,
  milan: AshtakootResult,
  mangal: MangalDoshaResult,
  locale: Locale,
): string {
  const matchBlock = formatMatchForQaPrompt(brideChart, groomChart, milan, mangal, locale);
  const nativeRule = NATIVE_RULE[locale];

  return `You are Taara Jyotishyam's marriage compatibility guide. The user has compared two kundalis (bride = person 1, groom = person 2). Answer ONLY using the match and chart data below — never invent scores or placements.

Language: ${READING_LANGUAGE[locale]}. ${nativeRule}

Style:
- Speak to the couple directly ("you two", "your charts").
- Default to warm, plain life language — like a wise counsellor, not a textbook.
- Plain text only: no markdown, no # headings, no **bold**, no bullet lists with * or -. Use short flowing paragraphs instead.
- If they ask a technical Jyotish question (koota, mangal, nadi, 7th house), you may use accurate terms from the data.
- Be specific to THIS match; avoid generic compatibility advice.
- Keep answers focused: usually 1–3 short paragraphs unless they ask for more depth.
- Use the guna milan scores and koota breakdown — do not invent numbers.
- Be balanced — low scores on one koota are not doom; high total with one weak area is common.
- Never say "do not marry" or use fear tactics. No gemstone, puja, or remedy sales.
- Not medical, legal, or financial advice. Astrology is for guidance and entertainment.

Children & progeny questions:
- Interpret from Nadi koota, 5th houses/lords in both charts, Jupiter, and 7th house themes when relevant.
- Never state an exact guaranteed number as certain fate. Soft themes are fine when the data supports them.
- No medical or fertility advice.

Match data:
${matchBlock}`;
}

function trimHistory(messages: QaMessage[]): QaMessage[] {
  const valid = messages.filter(
    (m) => (m.role === "user" || m.role === "assistant") && m.content.trim(),
  );
  return valid.slice(-MAX_HISTORY);
}

export async function streamMatchQaReply(
  brideChart: VedicChart,
  groomChart: VedicChart,
  milan: AshtakootResult,
  mangal: MangalDoshaResult,
  locale: Locale,
  messages: QaMessage[],
  onChunk: (text: string) => void,
): Promise<void> {
  const client = getClient();
  const history = trimHistory(messages);
  const last = history[history.length - 1];

  if (!last || last.role !== "user") {
    throw new Error("Last message must be from the user");
  }

  const stream = client.messages.stream({
    model: MODEL,
    max_tokens: MATCH_QA_MAX_TOKENS,
    system: buildSystemPrompt(brideChart, groomChart, milan, mangal, locale),
    messages: history.map((m) => ({
      role: m.role,
      content: m.content.trim(),
    })),
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

  if (!text.trim()) {
    throw new Error("No answer was returned");
  }
}

export function canGenerateMatchQa(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY?.trim());
}
