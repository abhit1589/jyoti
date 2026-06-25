import Anthropic from "@anthropic-ai/sdk";
import {
  formatChartForCareerReadingPrompt,
  formatChartForDashaReadingPrompt,
  formatChartForReadingPrompt,
} from "@/lib/vedic/chart";
import {
  buildSystemPrompt,
  buildUserInstructions,
  CONTINUE_PROMPT,
} from "@/lib/anthropic/locale-prompts";
import type { InterpretRequest, Locale, ReadingFocus, VedicChart } from "@/lib/types";

const MODEL = process.env.ANTHROPIC_MODEL ?? "claude-sonnet-4-6";

export const TOKEN_LIMITS = {
  brief: Number(process.env.READING_MAX_TOKENS_BRIEF ?? "2500"),
  detailed: Number(process.env.READING_MAX_TOKENS_DETAILED ?? "5000"),
} as const;

export function getClient(): Anthropic {
  const apiKey = process.env.ANTHROPIC_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("Reading service is not configured");
  }
  return new Anthropic({ apiKey });
}

function chartBlockForFocus(chart: VedicChart, locale: Locale, focus: ReadingFocus): string {
  if (focus === "career") return formatChartForCareerReadingPrompt(chart, locale);
  if (focus === "dasha") return formatChartForDashaReadingPrompt(chart, locale);
  return formatChartForReadingPrompt(chart, locale);
}

function buildUserPrompt(chart: VedicChart, locale: Locale, focus: ReadingFocus): string {
  return `${chartBlockForFocus(chart, locale, focus)}\n\n${buildUserInstructions(locale, focus)}`;
}

export function buildReadingMessages(request: InterpretRequest): {
  system: string;
  messages: { role: "user" | "assistant"; content: string }[];
  maxTokens: number;
} {
  const { chart, locale } = request;
  const focus = request.focus ?? "personality";

  return {
    system: buildSystemPrompt(locale, focus),
    messages: [{ role: "user", content: buildUserPrompt(chart, locale, focus) }],
    maxTokens:
      request.readingType === "detailed" ? TOKEN_LIMITS.detailed : TOKEN_LIMITS.brief,
  };
}

export async function streamReading(
  request: InterpretRequest,
  onChunk: (text: string) => void,
): Promise<{ truncated: boolean }> {
  const client = getClient();
  const { system, messages, maxTokens } = buildReadingMessages(request);
  let truncated = false;

  for (let attempt = 0; attempt < 3; attempt++) {
    const stream = client.messages.stream({
      model: MODEL,
      max_tokens: maxTokens,
      system,
      messages,
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
    if (finalMessage.stop_reason !== "max_tokens") {
      return { truncated: false };
    }

    truncated = true;
    const textBlock = finalMessage.content.find((block) => block.type === "text");
    const partial = textBlock?.type === "text" ? textBlock.text : "";
    messages.push({ role: "assistant", content: partial });
    messages.push({
      role: "user",
      content: CONTINUE_PROMPT[request.locale],
    });
    onChunk("\n\n");
  }

  return { truncated };
}

export async function generateReading(request: InterpretRequest): Promise<{
  text: string;
  truncated: boolean;
}> {
  let text = "";
  const { truncated } = await streamReading(request, (chunk) => {
    text += chunk;
  });
  if (!text.trim()) {
    throw new Error("Reading returned no text");
  }
  return { text: text.trim(), truncated };
}
