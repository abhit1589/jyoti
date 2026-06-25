import { NextResponse } from "next/server";
import {
  canGenerateMatchReport,
  streamMatchReport,
} from "@/lib/anthropic/match-report";
import { parseLocale } from "@/lib/i18n/locales";
import { calculateAshtakoot } from "@/lib/vedic/ashtakoot";
import { checkMangalDosha } from "@/lib/vedic/mangal-dosha";
import {
  checkAndConsumeMatchReportForSession,
  createSessionId,
  getSessionId,
  SESSION_COOKIE_NAME,
  sessionCookieOptions,
} from "@/lib/usage/limits";
import type { MatchReportRequest, VedicChart } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 120;

async function resolveSession(): Promise<{ sessionId: string; isNew: boolean }> {
  const existing = await getSessionId();
  if (existing) return { sessionId: existing, isNew: false };
  return { sessionId: createSessionId(), isNew: true };
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

export async function POST(request: Request) {
  if (!canGenerateMatchReport()) {
    return NextResponse.json({ error: "Match reports are not configured" }, { status: 503 });
  }

  const { sessionId, isNew } = await resolveSession();
  const usage = checkAndConsumeMatchReportForSession(sessionId);
  if (!usage.allowed) {
    const response = NextResponse.json(
      { error: "daily_match_report_limit_reached", remaining: 0, limit: usage.limit },
      { status: 429 },
    );
    if (isNew) {
      response.cookies.set(SESSION_COOKIE_NAME, sessionId, sessionCookieOptions);
    }
    return response;
  }

  let body: MatchReportRequest;
  try {
    body = (await request.json()) as MatchReportRequest;
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (!isChart(body.person1Chart) || !isChart(body.person2Chart)) {
    return NextResponse.json({ error: "Invalid chart data" }, { status: 400 });
  }

  const locale = parseLocale(body.locale);
  const gunaMilan = calculateAshtakoot(body.person1Chart, body.person2Chart);
  const mangalDosha = checkMangalDosha(body.person1Chart, body.person2Chart);

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (payload: Record<string, unknown>) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(payload)}\n\n`));
      };

      try {
        send({ type: "meta", remaining: usage.remaining, limit: usage.limit });

        await streamMatchReport(
          body.person1Chart,
          body.person2Chart,
          gunaMilan,
          mangalDosha,
          locale,
          (text) => send({ type: "delta", text }),
        );

        send({ type: "done" });
      } catch (error) {
        send({
          type: "error",
          message: error instanceof Error ? error.message : "Report failed",
        });
      } finally {
        controller.close();
      }
    },
  });

  const response = new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });

  if (isNew) {
    response.headers.append(
      "Set-Cookie",
      `${SESSION_COOKIE_NAME}=${sessionId}; Path=${sessionCookieOptions.path}; Max-Age=${sessionCookieOptions.maxAge}; SameSite=Lax${sessionCookieOptions.secure ? "; Secure" : ""}; HttpOnly`,
    );
  }

  return response;
}
