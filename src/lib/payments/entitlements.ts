import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import {
  ALL_READING_FOCUSES,
  getRazorpayKeySecret,
  type PaymentSku,
} from "@/lib/payments/config";
import type { ReadingFocus, VedicChart } from "@/lib/types";
import { getChartId } from "@/lib/payments/chart-id";

export const ENTITLEMENTS_COOKIE = "astro_entitlements";

export type Entitlement = {
  orderId: string;
  paymentId: string;
  chartId: string;
  sku: PaymentSku;
  /** Set for legacy single-SKU purchases. */
  focus?: ReadingFocus;
  /** Set when multiple reading sections were purchased together. */
  focuses?: ReadingFocus[];
  consumed: ReadingFocus[];
  createdAt: string;
};

type EntitlementStore = {
  items: Entitlement[];
};

export type FocusAccess = "available" | "used" | "locked";

export type ChartEntitlementStatus = {
  paymentsEnabled: boolean;
  focuses: Record<ReadingFocus, FocusAccess>;
  hasBundle: boolean;
};

function signingSecret(): string {
  return (
    process.env.PAYMENT_ENTITLEMENT_SECRET?.trim() ||
    getRazorpayKeySecret()
  );
}

function signPayload(encoded: string): string {
  return createHmac("sha256", signingSecret()).update(encoded).digest("base64url");
}

function encodeStore(store: EntitlementStore): string {
  const json = JSON.stringify(store);
  const encoded = Buffer.from(json, "utf8").toString("base64url");
  return `${encoded}.${signPayload(encoded)}`;
}

function decodeStore(value: string): EntitlementStore | null {
  const [encoded, signature] = value.split(".");
  if (!encoded || !signature) return null;

  const expected = signPayload(encoded);
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  try {
    const parsed = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8")) as EntitlementStore;
    if (!Array.isArray(parsed.items)) return null;
    return parsed;
  } catch {
    return null;
  }
}

export async function readEntitlementStore(): Promise<EntitlementStore> {
  const jar = await cookies();
  const raw = jar.get(ENTITLEMENTS_COOKIE)?.value;
  if (!raw) return { items: [] };
  return decodeStore(raw) ?? { items: [] };
}

export function serializeEntitlementStore(store: EntitlementStore): string {
  return encodeStore(store);
}

export function entitlementCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 365,
    path: "/",
  };
}

function focusesForEntitlement(entitlement: Entitlement): ReadingFocus[] {
  if (entitlement.sku === "bundle") return ALL_READING_FOCUSES;
  if (entitlement.focuses?.length) return entitlement.focuses;
  return entitlement.focus ? [entitlement.focus] : [];
}

export function getChartEntitlementStatus(
  store: EntitlementStore,
  chartId: string,
  paymentsEnabled: boolean,
): ChartEntitlementStatus {
  const focuses: Record<ReadingFocus, FocusAccess> = {
    personality: paymentsEnabled ? "locked" : "available",
    career: paymentsEnabled ? "locked" : "available",
    dasha: paymentsEnabled ? "locked" : "available",
    financial: paymentsEnabled ? "locked" : "available",
    marriage: paymentsEnabled ? "locked" : "available",
  };

  if (!paymentsEnabled) {
    return { paymentsEnabled: false, focuses, hasBundle: false };
  }

  let hasBundle = false;
  const relevant = store.items.filter((item) => item.chartId === chartId);

  for (const item of relevant) {
    if (item.sku === "bundle") hasBundle = true;
    for (const focus of focusesForEntitlement(item)) {
      if (item.consumed.includes(focus)) {
        focuses[focus] = "used";
      } else if (focuses[focus] !== "used") {
        focuses[focus] = "available";
      }
    }
  }

  return { paymentsEnabled: true, focuses, hasBundle };
}

export function addEntitlement(
  store: EntitlementStore,
  entitlement: Entitlement,
): EntitlementStore {
  const duplicate = store.items.some(
    (item) => item.orderId === entitlement.orderId && item.paymentId === entitlement.paymentId,
  );
  if (duplicate) return store;
  return { items: [...store.items, entitlement] };
}

export function consumeEntitlement(
  store: EntitlementStore,
  chart: VedicChart,
  focus: ReadingFocus,
): EntitlementStore {
  const chartId = getChartId(chart);
  const items = store.items.map((item) => {
    if (item.chartId !== chartId) return item;
    const allowedFocuses = focusesForEntitlement(item);
    if (!allowedFocuses.includes(focus) || item.consumed.includes(focus)) {
      return item;
    }
    return { ...item, consumed: [...item.consumed, focus] };
  });

  return { items };
}

export function findActiveEntitlement(
  store: EntitlementStore,
  chartId: string,
  focus: ReadingFocus,
): Entitlement | null {
  for (const item of store.items) {
    if (item.chartId !== chartId) continue;
    const allowedFocuses = focusesForEntitlement(item);
    if (!allowedFocuses.includes(focus)) continue;
    if (item.consumed.includes(focus)) continue;
    return item;
  }
  return null;
}

export function canConsumeEntitlement(
  store: EntitlementStore,
  chart: VedicChart,
  focus: ReadingFocus,
  paymentsEnabled: boolean,
): { allowed: boolean; reason?: "payment_required" | "already_used" } {
  if (!paymentsEnabled) return { allowed: true };

  const chartId = getChartId(chart);
  if (findActiveEntitlement(store, chartId, focus)) {
    return { allowed: true };
  }

  const status = getChartEntitlementStatus(store, chartId, true);
  if (status.focuses[focus] === "used") {
    return { allowed: false, reason: "already_used" };
  }
  return { allowed: false, reason: "payment_required" };
}
