import { cookies } from "next/headers";
import { randomUUID } from "crypto";

const SESSION_COOKIE = "astro_session";
const FREE_DAILY_LIMIT = Number(process.env.FREE_DAILY_READINGS ?? "5");
const PREMIUM_DAILY_LIMIT = Number(process.env.PREMIUM_DAILY_READINGS ?? "20");

type UsageRecord = {
  date: string;
  count: number;
  premium: boolean;
};

type UsageStore = Map<string, UsageRecord>;

const globalForUsage = globalThis as typeof globalThis & {
  usageStore?: UsageStore;
};

function getStore(): UsageStore {
  if (!globalForUsage.usageStore) {
    globalForUsage.usageStore = new Map();
  }
  return globalForUsage.usageStore;
}

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Read session id from cookie only — never mutates cookies here. */
export async function getSessionId(): Promise<string | null> {
  const jar = await cookies();
  return jar.get(SESSION_COOKIE)?.value ?? null;
}

export function createSessionId(): string {
  return randomUUID();
}

export function isPremiumSession(sessionId: string): boolean {
  const betaCode = process.env.BETA_PREMIUM_CODE;
  if (!betaCode) return false;
  return sessionId.startsWith(`premium-${betaCode}`);
}

export function checkAndConsumeReadingForSession(
  sessionId: string,
  premiumRequested = false,
): { allowed: boolean; remaining: number; limit: number; premium: boolean } {
  const store = getStore();
  const today = todayKey();
  const premium = premiumRequested || isPremiumSession(sessionId);
  const limit = premium ? PREMIUM_DAILY_LIMIT : FREE_DAILY_LIMIT;

  const record = store.get(sessionId);
  const count = record?.date === today ? record.count : 0;

  if (count >= limit) {
    return { allowed: false, remaining: 0, limit, premium };
  }

  store.set(sessionId, { date: today, count: count + 1, premium });
  return { allowed: true, remaining: limit - count - 1, limit, premium };
}

export function getUsageStatusForSession(sessionId: string): {
  used: number;
  limit: number;
  premium: boolean;
} {
  const store = getStore();
  const today = todayKey();
  const premium = isPremiumSession(sessionId);
  const limit = premium ? PREMIUM_DAILY_LIMIT : FREE_DAILY_LIMIT;
  const record = store.get(sessionId);
  const used = record?.date === today ? record.count : 0;
  return { used, limit, premium };
}

export const sessionCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  maxAge: 60 * 60 * 24 * 365,
  path: "/",
};

export const SESSION_COOKIE_NAME = SESSION_COOKIE;
