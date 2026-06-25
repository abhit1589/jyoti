import { getClient } from "@/lib/anthropic/interpret";
import { READING_LANGUAGE } from "@/lib/i18n/locales";
import { formatChartForQaPrompt } from "@/lib/vedic/chart";
import type { Locale, QaMessage, VedicChart } from "@/lib/types";

const MODEL = process.env.ANTHROPIC_MODEL ?? "claude-sonnet-4-6";
const QA_MAX_TOKENS = Number(process.env.QA_MAX_TOKENS ?? "1024");
const MAX_HISTORY = 12;

const NATIVE_RULE: Record<Locale, string> = {
  en: "",
  hi: "Answer entirely in simple conversational Hindi. No English words.",
  mr: "Answer entirely in simple conversational Marathi. No English words.",
  kn: "Answer entirely in simple conversational Kannada. No English words.",
  te: "Answer entirely in simple conversational Telugu. No English words.",
  ta: "Answer entirely in simple conversational Tamil. No English words.",
};

function buildSystemPrompt(chart: VedicChart, locale: Locale): string {
  const chartBlock = formatChartForQaPrompt(chart, locale);
  const nativeRule = NATIVE_RULE[locale];

  return `You are Taara Jyotishyam's personal chart guide. The user has generated their Vedic birth chart. Answer ONLY using the chart data below — never invent placements.

Language: ${READING_LANGUAGE[locale]}. ${nativeRule}

Style:
- Speak directly to the person ("you", "your").
- Default to warm, plain life language — like a wise counsellor, not a textbook.
- Plain text only: no markdown, no # headings, no **bold**, no bullet lists with * or -. Use short flowing paragraphs instead.
- If they ask a technical Jyotish question (nakshatra, dasha, house, planet), you may use accurate terms from the chart data.
- Be specific to THIS chart; avoid generic sun-sign style advice.
- Keep answers focused: usually 1–3 short paragraphs unless they ask for more depth.
- No gemstone, puja, or remedy sales. No fear-based predictions (death, disease, guaranteed loss).
- Not medical, legal, or financial advice.

Children & progeny questions:
- Do NOT refuse these outright. Interpret from the 5th house, 5th lord, Jupiter (putrakaraka), 7th house/lord, and current dasha when relevant.
- If they ask "how many children", give chart-based tendencies — e.g. strong vs moderate emphasis, possible delay, blessings through children, creative legacy themes — not a blank refusal.
- Never state an exact guaranteed number as certain fate. Soft ranges or themes are fine when the chart clearly supports them (e.g. "often one strong child focus" vs "several").
- No medical or fertility advice. Do not diagnose inability to have children.

Chart data:
${chartBlock}`;
}

function trimHistory(messages: QaMessage[]): QaMessage[] {
  const valid = messages.filter(
    (m) => (m.role === "user" || m.role === "assistant") && m.content.trim(),
  );
  return valid.slice(-MAX_HISTORY);
}

export async function streamQaReply(
  chart: VedicChart,
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
    max_tokens: QA_MAX_TOKENS,
    system: buildSystemPrompt(chart, locale),
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
