import { NextResponse } from "next/server";
import { streamQaReply } from "@/lib/anthropic/qa-agent";
import { parseLocale } from "@/lib/i18n/locales";
import type { QaMessage, QaRequest } from "@/lib/types";
import {
  checkAndConsumeQaForSession,
  createSessionId,
  getQaStatusForSession,
  getSessionId,
  SESSION_COOKIE_NAME,
  sessionCookieOptions,
} from "@/lib/usage/limits";

export const runtime = "nodejs";
export const maxDuration = 120;

function hasApiKey(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY?.trim());
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
    const status = getQaStatusForSession(sessionId);
    return jsonWithSession({ ...status, hasApiKey: hasApiKey() }, sessionId, isNew);
  } catch (error) {
    console.error("QA GET error:", error);
    return NextResponse.json(
      {
        error: "Could not load Q&A status",
        hasApiKey: hasApiKey(),
        used: 0,
        limit: 8,
        premium: false,
      },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  if (!hasApiKey()) {
    return NextResponse.json({ error: "Q&A is not configured" }, { status: 503 });
  }

  const { sessionId, isNew } = await resolveSession();

  try {
    const body = (await request.json()) as QaRequest;

    if (!body.chart?.planets?.length) {
      return jsonWithSession({ error: "Generate a chart first" }, sessionId, isNew, {
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

    const usage = checkAndConsumeQaForSession(sessionId, false);
    if (!usage.allowed) {
      return jsonWithSession(
        {
          error: "daily_qa_limit_reached",
          limit: usage.limit,
          premium: usage.premium,
        },
        sessionId,
        isNew,
        { status: 429 },
      );
    }

    const locale = parseLocale(body.locale);
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

          await streamQaReply(body.chart, locale, messages, (chunk) => {
            if (chunk) {
              hasContent = true;
              send({ type: "delta", text: chunk });
            }
          });

          if (!hasContent) {
            send({ type: "error", message: "No answer was returned" });
          } else {
            send({ type: "done" });
          }
        } catch (error) {
          const message = error instanceof Error ? error.message : "Q&A failed";
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
    console.error("QA POST error:", error);
    const message = error instanceof Error ? error.message : "Q&A failed";
    return jsonWithSession({ error: message, hasApiKey: true }, sessionId, isNew, {
      status: 500,
    });
  }
}
