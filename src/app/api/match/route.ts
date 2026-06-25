import { NextResponse } from "next/server";
import { parseLocale } from "@/lib/i18n/locales";
import { calculateAshtakoot } from "@/lib/vedic/ashtakoot";
import { checkMangalDosha } from "@/lib/vedic/mangal-dosha";
import { calculateVedicChart } from "@/lib/vedic/chart";
import {
  checkAndConsumeMatchForSession,
  createSessionId,
  getMatchStatusForSession,
  getSessionId,
  SESSION_COOKIE_NAME,
  sessionCookieOptions,
} from "@/lib/usage/limits";
import type { BirthInput, MatchRequest } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;

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

async function resolveSession(): Promise<{ sessionId: string; isNew: boolean }> {
  const existing = await getSessionId();
  if (existing) return { sessionId: existing, isNew: false };
  return { sessionId: createSessionId(), isNew: true };
}

function validateBirth(body: BirthInput): string | null {
  if (!body.date || !body.time || !body.timezone) {
    return "Missing birth date, time, or timezone";
  }
  if (
    typeof body.latitude !== "number" ||
    typeof body.longitude !== "number" ||
    Number.isNaN(body.latitude) ||
    Number.isNaN(body.longitude)
  ) {
    return "Invalid coordinates";
  }
  return null;
}

export async function GET() {
  try {
    const { sessionId, isNew } = await resolveSession();
    const status = getMatchStatusForSession(sessionId);
    return jsonWithSession(
      {
        ...status,
        hasApiKey: Boolean(process.env.ANTHROPIC_API_KEY?.trim()),
      },
      sessionId,
      isNew,
    );
  } catch (error) {
    console.error("Match GET error:", error);
    return NextResponse.json({ error: "Status check failed" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { sessionId, isNew } = await resolveSession();
    const usage = checkAndConsumeMatchForSession(sessionId);
    if (!usage.allowed) {
      return jsonWithSession(
        { error: "daily_match_limit_reached", remaining: 0, limit: usage.limit },
        sessionId,
        isNew,
        { status: 429 },
      );
    }

    const body = (await request.json()) as MatchRequest;
    const locale = parseLocale(body.locale);

    const err1 = validateBirth(body.person1);
    const err2 = validateBirth(body.person2);
    if (err1 || err2) {
      return jsonWithSession(
        { error: err1 ?? err2 },
        sessionId,
        isNew,
        { status: 400 },
      );
    }

    const [person1Chart, person2Chart] = await Promise.all([
      calculateVedicChart(body.person1),
      calculateVedicChart(body.person2),
    ]);

    const gunaMilan = calculateAshtakoot(person1Chart, person2Chart);
    const mangalDosha = checkMangalDosha(person1Chart, person2Chart);

    return jsonWithSession(
      {
        person1Chart,
        person2Chart,
        gunaMilan,
        mangalDosha,
        remaining: usage.remaining,
        limit: usage.limit,
      },
      sessionId,
      isNew,
    );
  } catch (error) {
    console.error("Match POST error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Match calculation failed" },
      { status: 500 },
    );
  }
}
