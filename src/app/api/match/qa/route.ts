import { NextResponse } from "next/server";
import { canGenerateMatchQa, streamMatchQaReply } from "@/lib/anthropic/match-qa-agent";
import { parseLocale } from "@/lib/i18n/locales";
import type { MatchQaRequest, QaMessage, VedicChart } from "@/lib/types";
import {
  checkAndConsumeMatchQaForSession,
  createSessionId,
  getMatchQaStatusForSession,
  getSessionId,
  SESSION_COOKIE_NAME,
  sessionCookieOptions,
} from "@/lib/usage/limits";
import { calculateAshtakoot } from "@/lib/vedic/ashtakoot";
import { checkMangalDosha } from "@/lib/vedic/mangal-dosha";

export const runtime = "nodejs";
export const maxDuration = 120;

function hasApiKey(): boolean {
  return canGenerateMatchQa();
}

async function resolveSession(): Promise<{ sessionId: string; isNew: boolean }> {
  const existing = await getSessionId();
  if (existing) return { sessionId: existing, isNew: false };
  return { sessionId: createSessionId(), isNew: true };
}

function jsonWithSession(
  data: Record<string, unknown>,
  sessionId: string,
  isNewSession: boolean,
  init?: ResponseInit,
) {
  const response = NextResponse.json(data, init);
  if (isNewSession) {
    response.cookies.set(SESSION_COOKIE_NAME, sessionId, sessionCookieOptions);
  }
  return response;
}

function isChart(value: unknown): value is VedicChart {
  return (
    typeof value === "object" &&
    value !== null &&
    "planets" in value &&
    "lagna" in value &&
    "birth" in value
  );
}

function parseMessages(raw: unknown): QaMessage[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter(
      (item): item is QaMessage =>
        typeof item === "object" &&
        item !== null &&
        (item.role === "user" || item.role === "assistant") &&
        typeof item.content === "string",
    )
    .map((m) => ({ role: m.role, content: m.content.trim() }))
    .filter((m) => m.content.length > 0);
}

export async function GET() {
  try {
    const { sessionId, isNew } = await resolveSession();
    const status = getMatchQaStatusForSession(sessionId);
    return jsonWithSession({ ...status, hasApiKey: hasApiKey() }, sessionId, isNew);
  } catch (error) {
    console.error("Match QA GET error:", error);
    return NextResponse.json(
      {
        error: "Could not load match Q&A status",
        hasApiKey: hasApiKey(),
        used: 0,
        limit: 8,
      },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  if (!hasApiKey()) {
    return NextResponse.json({ error: "Match Q&A is not configured" }, { status: 503 });
  }

  const { sessionId, isNew } = await resolveSession();

  try {
    const body = (await request.json()) as MatchQaRequest;

    if (!isChart(body.person1Chart) || !isChart(body.person2Chart)) {
      return jsonWithSession({ error: "Compare charts first" }, sessionId, isNew, {
        status: 400,
      });
    }

    const messages = parseMessages(body.messages);
    const last = messages[messages.length - 1];

    if (!last || last.role !== "user") {
      return jsonWithSession({ error: "A user question is required" }, sessionId, isNew, {
        status: 400,
      });
    }

    if (last.content.length > 2000) {
      return jsonWithSession({ error: "Question is too long" }, sessionId, isNew, {
        status: 400,
      });
    }

    const usage = checkAndConsumeMatchQaForSession(sessionId);
    if (!usage.allowed) {
      return jsonWithSession(
        {
          error: "daily_match_qa_limit_reached",
          limit: usage.limit,
        },
        sessionId,
        isNew,
        { status: 429 },
      );
    }

    const locale = parseLocale(body.locale);
    const gunaMilan = calculateAshtakoot(body.person1Chart, body.person2Chart);
    const mangalDosha = checkMangalDosha(body.person1Chart, body.person2Chart);
    const encoder = new TextEncoder();
    let hasContent = false;

    const readable = new ReadableStream({
      async start(controller) {
        const send = (payload: Record<string, unknown>) => {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(payload)}\n\n`));
        };

        try {
          send({
            type: "meta",
            remaining: usage.remaining,
            limit: usage.limit,
          });

          await streamMatchQaReply(
            body.person1Chart,
            body.person2Chart,
            gunaMilan,
            mangalDosha,
            locale,
            messages,
            (chunk) => {
              if (chunk) {
                hasContent = true;
                send({ type: "delta", text: chunk });
              }
            },
          );

          if (!hasContent) {
            send({ type: "error", message: "No answer was returned" });
          } else {
            send({ type: "done" });
          }
        } catch (error) {
          const message = error instanceof Error ? error.message : "Match Q&A failed";
          send({ type: "error", message });
        } finally {
          controller.close();
        }
      },
    });

    const response = new Response(readable, {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
      },
    });

    if (isNew) {
      response.headers.append(
        "Set-Cookie",
        `${SESSION_COOKIE_NAME}=${sessionId}; Path=/; Max-Age=31536000; HttpOnly; SameSite=Lax`,
      );
    }

    return response;
  } catch (error) {
    console.error("Match QA POST error:", error);
    const message = error instanceof Error ? error.message : "Match Q&A failed";
    return jsonWithSession({ error: message, hasApiKey: true }, sessionId, isNew, {
      status: 500,
    });
  }
}
