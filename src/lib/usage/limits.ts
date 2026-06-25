import { cookies } from "next/headers";
import { randomUUID } from "crypto";

const SESSION_COOKIE = "astro_session";
const FREE_DAILY_LIMIT = Number(process.env.FREE_DAILY_READINGS ?? "5");
const PREMIUM_DAILY_LIMIT = Number(process.env.PREMIUM_DAILY_READINGS ?? "20");
const FREE_DAILY_QA = Number(process.env.FREE_DAILY_QA ?? "8");
const PREMIUM_DAILY_QA = Number(process.env.PREMIUM_DAILY_QA ?? "30");
const FREE_DAILY_MATCH = Number(process.env.FREE_DAILY_MATCH ?? "10");
const FREE_DAILY_MATCH_REPORT = Number(process.env.FREE_DAILY_MATCH_REPORT ?? "5");

export function isUsageLimitsDisabled(): boolean {
  return process.env.DISABLE_USAGE_LIMITS === "true";
}

type UsageRecord = {
  date: string;
  count: number;
  qaCount: number;
  matchCount: number;
  matchReportCount: number;
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

/** Dev helper — clears in-memory daily usage for one session or everyone. */
export function resetUsageStore(sessionId?: string): void {
  const store = getStore();
  if (sessionId) store.delete(sessionId);
  else store.clear();
}

function unlimited(limit: number) {
  return { allowed: true as const, remaining: limit, limit };
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

  if (isUsageLimitsDisabled()) return { ...unlimited(limit), premium };

  const record = store.get(sessionId);
  const count = record?.date === today ? record.count : 0;

  if (count >= limit) {
    return { allowed: false, remaining: 0, limit, premium };
  }

  const qaCount = record?.date === today ? (record.qaCount ?? 0) : 0;
  const matchCount = record?.date === today ? (record.matchCount ?? 0) : 0;
  const matchReportCount = record?.date === today ? (record.matchReportCount ?? 0) : 0;
  store.set(sessionId, {
    date: today,
    count: count + 1,
    qaCount,
    matchCount,
    matchReportCount,
    premium,
  });
  return { allowed: true, remaining: limit - count - 1, limit, premium };
}

export function checkAndConsumeQaForSession(
  sessionId: string,
  premiumRequested = false,
): { allowed: boolean; remaining: number; limit: number; premium: boolean } {
  const store = getStore();
  const today = todayKey();
  const premium = premiumRequested || isPremiumSession(sessionId);
  const limit = premium ? PREMIUM_DAILY_QA : FREE_DAILY_QA;

  if (isUsageLimitsDisabled()) return { ...unlimited(limit), premium };

  const record = store.get(sessionId);
  const qaCount = record?.date === today ? (record.qaCount ?? 0) : 0;
  const readingCount = record?.date === today ? record.count : 0;

  if (qaCount >= limit) {
    return { allowed: false, remaining: 0, limit, premium };
  }

  store.set(sessionId, {
    date: today,
    count: readingCount,
    qaCount: qaCount + 1,
    matchCount: record?.date === today ? (record.matchCount ?? 0) : 0,
    matchReportCount: record?.date === today ? (record.matchReportCount ?? 0) : 0,
    premium,
  });
  return { allowed: true, remaining: limit - qaCount - 1, limit, premium };
}

export function getUsageStatusForSession(sessionId: string): {
  used: number;
  limit: number;
  premium: boolean;
} {
  const premium = isPremiumSession(sessionId);
  const limit = premium ? PREMIUM_DAILY_LIMIT : FREE_DAILY_LIMIT;
  if (isUsageLimitsDisabled()) return { used: 0, limit, premium };

  const store = getStore();
  const today = todayKey();
  const record = store.get(sessionId);
  const used = record?.date === today ? record.count : 0;
  return { used, limit, premium };
}

export function checkAndConsumeMatchForSession(sessionId: string): {
  allowed: boolean;
  remaining: number;
  limit: number;
} {
  const limit = FREE_DAILY_MATCH;
  if (isUsageLimitsDisabled()) return unlimited(limit);

  const store = getStore();
  const today = todayKey();
  const record = store.get(sessionId);
  const matchCount = record?.date === today ? (record.matchCount ?? 0) : 0;

  if (matchCount >= limit) {
    return { allowed: false, remaining: 0, limit };
  }

  store.set(sessionId, {
    date: today,
    count: record?.date === today ? record.count : 0,
    qaCount: record?.date === today ? (record.qaCount ?? 0) : 0,
    matchCount: matchCount + 1,
    matchReportCount: record?.date === today ? (record.matchReportCount ?? 0) : 0,
    premium: record?.date === today ? record.premium : false,
  });
  return { allowed: true, remaining: limit - matchCount - 1, limit };
}

export function checkAndConsumeMatchReportForSession(sessionId: string): {
  allowed: boolean;
  remaining: number;
  limit: number;
} {
  const limit = FREE_DAILY_MATCH_REPORT;
  if (isUsageLimitsDisabled()) return unlimited(limit);

  const store = getStore();
  const today = todayKey();
  const record = store.get(sessionId);
  const matchReportCount = record?.date === today ? (record.matchReportCount ?? 0) : 0;

  if (matchReportCount >= limit) {
    return { allowed: false, remaining: 0, limit };
  }

  store.set(sessionId, {
    date: today,
    count: record?.date === today ? record.count : 0,
    qaCount: record?.date === today ? (record.qaCount ?? 0) : 0,
    matchCount: record?.date === today ? (record.matchCount ?? 0) : 0,
    matchReportCount: matchReportCount + 1,
    premium: record?.date === today ? record.premium : false,
  });
  return { allowed: true, remaining: limit - matchReportCount - 1, limit };
}

export function getMatchStatusForSession(sessionId: string): {
  used: number;
  limit: number;
  reportUsed: number;
  reportLimit: number;
} {
  if (isUsageLimitsDisabled()) {
    return {
      used: 0,
      limit: FREE_DAILY_MATCH,
      reportUsed: 0,
      reportLimit: FREE_DAILY_MATCH_REPORT,
    };
  }

  const store = getStore();
  const today = todayKey();
  const record = store.get(sessionId);
  const used = record?.date === today ? (record.matchCount ?? 0) : 0;
  const reportUsed = record?.date === today ? (record.matchReportCount ?? 0) : 0;
  return {
    used,
    limit: FREE_DAILY_MATCH,
    reportUsed,
    reportLimit: FREE_DAILY_MATCH_REPORT,
  };
}

export function getQaStatusForSession(sessionId: string): {
  used: number;
  limit: number;
  premium: boolean;
} {
  const premium = isPremiumSession(sessionId);
  const limit = premium ? PREMIUM_DAILY_QA : FREE_DAILY_QA;
  if (isUsageLimitsDisabled()) return { used: 0, limit, premium };

  const store = getStore();
  const today = todayKey();
  const record = store.get(sessionId);
  const used = record?.date === today ? (record.qaCount ?? 0) : 0;
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
