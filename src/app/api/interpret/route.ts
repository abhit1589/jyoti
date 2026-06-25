import { NextResponse } from "next/server";
import { buildReadingMessages, streamReading } from "@/lib/anthropic/interpret";
import { getChartId } from "@/lib/payments/chart-id";
import { isPaymentsEnabled } from "@/lib/payments/config";
import {
  canConsumeEntitlement,
  consumeEntitlement,
  entitlementCookieOptions,
  ENTITLEMENTS_COOKIE,
  findActiveEntitlement,
  getChartEntitlementStatus,
  readEntitlementStore,
  serializeEntitlementStore,
} from "@/lib/payments/entitlements";
import {
  checkAndConsumeReadingForSession,
  createSessionId,
  getSessionId,
  getUsageStatusForSession,
  SESSION_COOKIE_NAME,
  sessionCookieOptions,
} from "@/lib/usage/limits";
import type { InterpretRequest, ReadingFocus } from "@/lib/types";
import { parseLocale } from "@/lib/i18n/locales";

export const runtime = "nodejs";
export const maxDuration = 120;

function hasApiKey(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY?.trim());
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

function jsonWithSessionAndEntitlements(
  data: Record<string, unknown>,
  sessionId: string,
  isNewSession: boolean,
  entitlementCookie?: string,
  init?: ResponseInit,
) {
  const response = jsonWithSession(data, sessionId, isNewSession, init);
  if (entitlementCookie) {
    response.cookies.set(
      ENTITLEMENTS_COOKIE,
      entitlementCookie,
      entitlementCookieOptions(),
    );
  }
  return response;
}

async function resolveSession(): Promise<{ sessionId: string; isNew: boolean }> {
  const existing = await getSessionId();
  if (existing) return { sessionId: existing, isNew: false };
  return { sessionId: createSessionId(), isNew: true };
}

function parseBody(body: InterpretRequest): InterpretRequest {
  const focus: ReadingFocus =
    body.focus === "career" || body.focus === "dasha" ? body.focus : "personality";

  return {
    chart: body.chart,
    locale: parseLocale(body.locale),
    readingType: body.readingType === "detailed" ? "detailed" : "brief",
    focus,
    stream: body.stream,
  };
}

export async function GET() {
  try {
    const { sessionId, isNew } = await resolveSession();
    const paymentsEnabled = isPaymentsEnabled();
    const status = getUsageStatusForSession(sessionId);

    return jsonWithSession(
      {
        ...status,
        hasApiKey: hasApiKey(),
        paymentsEnabled,
      },
      sessionId,
      isNew,
    );
  } catch (error) {
    console.error("Interpret GET error:", error);
    return NextResponse.json(
      {
        error: "Could not load reading status",
        hasApiKey: hasApiKey(),
        used: 0,
        limit: 5,
        premium: false,
        paymentsEnabled: isPaymentsEnabled(),
      },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  if (!hasApiKey()) {
    return NextResponse.json({ error: "Readings not configured" }, { status: 503 });
  }

  const { sessionId, isNew } = await resolveSession();
  const paymentsEnabled = isPaymentsEnabled();

  try {
    const body = (await request.json()) as InterpretRequest;

    if (!body.chart?.planets?.length) {
      return jsonWithSession(
        { error: "Generate a chart first" },
        sessionId,
        isNew,
        { status: 400 },
      );
    }

    const parsed = parseBody(body);
    const chartId = getChartId(parsed.chart);
    let entitlementStore = await readEntitlementStore();
    let entitlementCookie: string | undefined;

    if (paymentsEnabled) {
      const access = canConsumeEntitlement(
        entitlementStore,
        parsed.chart,
        parsed.focus ?? "personality",
        true,
      );

      if (!access.allowed) {
        const status = getChartEntitlementStatus(entitlementStore, chartId, true);
        return jsonWithSession(
          {
            error: access.reason ?? "payment_required",
            paymentsEnabled: true,
            focuses: status.focuses,
          },
          sessionId,
          isNew,
          { status: access.reason === "already_used" ? 409 : 402 },
        );
      }

      const active = findActiveEntitlement(
        entitlementStore,
        chartId,
        parsed.focus ?? "personality",
      );
      if (active?.sku === "bundle") {
        parsed.readingType = "detailed";
      }

      entitlementStore = consumeEntitlement(
        entitlementStore,
        parsed.chart,
        parsed.focus ?? "personality",
      );
      entitlementCookie = serializeEntitlementStore(entitlementStore);
    } else {
      const usage = checkAndConsumeReadingForSession(sessionId, false);
      if (!usage.allowed) {
        return jsonWithSession(
          {
            error: "daily_limit_reached",
            limit: usage.limit,
            premium: usage.premium,
            paymentsEnabled: false,
          },
          sessionId,
          isNew,
          { status: 429 },
        );
      }
    }

    const wantsStream =
      body.stream !== false ||
      request.headers.get("accept")?.includes("text/event-stream");

    if (!wantsStream) {
      const { generateReading } = await import("@/lib/anthropic/interpret");
      const { text, truncated } = await generateReading(parsed);
      const usage = paymentsEnabled
        ? null
        : getUsageStatusForSession(sessionId);

      return jsonWithSessionAndEntitlements(
        {
          reading: text,
          truncated,
          remaining: usage ? usage.limit - usage.used : undefined,
          limit: usage?.limit,
          hasApiKey: true,
          paymentsEnabled,
        },
        sessionId,
        isNew,
        entitlementCookie,
      );
    }

    buildReadingMessages(parsed);

    const encoder = new TextEncoder();
    let hasContent = false;
    const usage = paymentsEnabled ? null : getUsageStatusForSession(sessionId);

    const readable = new ReadableStream({
      async start(controller) {
        const send = (payload: Record<string, unknown>) => {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(payload)}\n\n`),
          );
        };

        try {
          send({
            type: "meta",
            remaining: usage ? usage.limit - usage.used : undefined,
            limit: usage?.limit,
            paymentsEnabled,
          });

          const { truncated } = await streamReading(parsed, (chunk) => {
            if (chunk) {
              hasContent = true;
              send({ type: "delta", text: chunk });
            }
          });

          if (!hasContent) {
            send({ type: "error", message: "Reading returned no text" });
          } else {
            send({ type: "done", truncated });
          }
        } catch (error) {
          const message =
            error instanceof Error ? error.message : "Interpretation failed";
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
    if (entitlementCookie) {
      response.headers.append(
        "Set-Cookie",
        `${ENTITLEMENTS_COOKIE}=${entitlementCookie}; Path=/; Max-Age=31536000; HttpOnly; SameSite=Lax`,
      );
    }

    return response;
  } catch (error) {
    console.error("Interpretation error:", error);
    const message =
      error instanceof Error ? error.message : "Interpretation failed";

    return jsonWithSession({ error: message, hasApiKey: true }, sessionId, isNew, {
      status: 500,
    });
  }
}
