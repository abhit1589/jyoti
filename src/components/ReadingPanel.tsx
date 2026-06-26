"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { getBirthIdentity } from "@/lib/vedic/birth-identity";
import { parseJsonResponse } from "@/lib/api/client";
import { openRazorpayCheckout } from "@/lib/payments/razorpay-checkout";
import type { FocusAccess } from "@/lib/payments/entitlements";
import { ALL_READING_FOCUSES } from "@/lib/payments/config";
import { getReadingOrderAmount, isFullReadingBundle } from "@/lib/payments/reading-order";
import type { Locale, ReadingFocus, VedicChart } from "@/lib/types";

interface ReadingPanelProps {
  chart: VedicChart;
  pendingReadings?: ReadingFocus[] | null;
  onPendingReadingsCleared?: () => void;
}

type UsageState = {
  used: number;
  limit: number;
  hasApiKey: boolean;
  loaded: boolean;
  paymentsEnabled: boolean;
};

type PaymentConfig = {
  enabled: boolean;
  keyId: string | null;
  amounts: { single: number; bundle: number };
  currency: string;
  brandName: string;
};

type EntitlementState = {
  loaded: boolean;
  focuses: Record<ReadingFocus, FocusAccess>;
  hasBundle: boolean;
};

const DEFAULT_ENTITLEMENTS: EntitlementState = {
  loaded: false,
  focuses: {
    personality: "locked",
    career: "locked",
    dasha: "locked",
    financial: "locked",
    marriage: "locked",
  },
  hasBundle: false,
};

function formatInr(paise: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(paise / 100);
}

async function fetchUsage(): Promise<UsageState> {
  const res = await fetch("/api/interpret", { credentials: "include" });
  const data = await parseJsonResponse<{
    used?: number;
    limit?: number;
    hasApiKey?: boolean;
    paymentsEnabled?: boolean;
    error?: string;
  }>(res);

  if (!res.ok) {
    throw new Error(data.error ?? `Status check failed (${res.status})`);
  }

  return {
    used: data.used ?? 0,
    limit: data.limit ?? 5,
    hasApiKey: Boolean(data.hasApiKey),
    paymentsEnabled: Boolean(data.paymentsEnabled),
    loaded: true,
  };
}

async function fetchPaymentConfig(): Promise<PaymentConfig> {
  const res = await fetch("/api/payments/config");
  const data = await parseJsonResponse<PaymentConfig>(res);
  if (!res.ok) throw new Error("Could not load payment config");
  return data;
}

async function fetchEntitlements(chart: VedicChart): Promise<EntitlementState> {
  const res = await fetch("/api/payments/entitlements", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chart }),
  });
  const data = await parseJsonResponse<{
    focuses?: Record<ReadingFocus, FocusAccess>;
    hasBundle?: boolean;
    error?: string;
  }>(res);

  if (!res.ok) {
    throw new Error(data.error ?? "Could not load entitlements");
  }

  return {
    loaded: true,
    focuses: data.focuses ?? DEFAULT_ENTITLEMENTS.focuses,
    hasBundle: Boolean(data.hasBundle),
  };
}

async function consumeSse(
  response: Response,
  onDelta: (text: string) => void,
): Promise<{ truncated: boolean }> {
  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error("No response stream");
  }

  const decoder = new TextDecoder();
  let buffer = "";
  let truncated = false;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const parts = buffer.split("\n\n");
    buffer = parts.pop() ?? "";

    for (const part of parts) {
      const line = part.trim();
      if (!line.startsWith("data: ")) continue;

      const payload = JSON.parse(line.slice(6)) as {
        type: string;
        text?: string;
        message?: string;
        truncated?: boolean;
      };

      if (payload.type === "delta" && payload.text) {
        onDelta(payload.text);
      } else if (payload.type === "done") {
        truncated = Boolean(payload.truncated);
      } else if (payload.type === "error") {
        throw new Error(payload.message ?? "Stream failed");
      }
    }
  }

  return { truncated };
}

export function ReadingPanel({
  chart,
  pendingReadings = null,
  onPendingReadingsCleared,
}: ReadingPanelProps) {
  const t = useTranslations("reading");
  const locale = useLocale() as Locale;
  const [focus, setFocus] = useState<ReadingFocus>("personality");
  const [reading, setReading] = useState("");
  const [truncated, setTruncated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [paying, setPaying] = useState<"single" | "bundle" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [usage, setUsage] = useState<UsageState>({
    used: 0,
    limit: 5,
    hasApiKey: false,
    loaded: false,
    paymentsEnabled: false,
  });
  const [paymentConfig, setPaymentConfig] = useState<PaymentConfig | null>(null);
  const [entitlements, setEntitlements] = useState<EntitlementState>(DEFAULT_ENTITLEMENTS);
  const mountedRef = useRef(true);

  const refreshEntitlements = useCallback(async () => {
    const data = await fetchEntitlements(chart);
    if (mountedRef.current) setEntitlements(data);
  }, [chart]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    let active = true;

    (async () => {
      try {
        const [usageData, configData] = await Promise.all([
          fetchUsage(),
          fetchPaymentConfig().catch(() => null),
        ]);
        if (!active) return;
        setUsage(usageData);
        setPaymentConfig(configData);
        setError(null);

        if (usageData.paymentsEnabled) {
          await refreshEntitlements();
        } else if (mountedRef.current) {
          setEntitlements({
            loaded: true,
            focuses: {
              personality: "available",
              career: "available",
              dasha: "available",
              financial: "available",
              marriage: "available",
            },
            hasBundle: false,
          });
        }
      } catch {
        if (!active) return;
        setUsage((u) => ({ ...u, loaded: true, hasApiKey: false }));
        setError(t("statusError"));
      }
    })();

    return () => {
      active = false;
    };
  }, [t, refreshEntitlements]);

  const limitReached =
    !usage.paymentsEnabled && usage.loaded && usage.used >= usage.limit;
  const showReadingBox = loading || reading.length > 0;
  const birth = useMemo(() => getBirthIdentity(chart, locale), [chart, locale]);
  const focusAccess = entitlements.focuses[focus];
  const canGenerate =
    usage.hasApiKey &&
    entitlements.loaded &&
    (usage.paymentsEnabled ? focusAccess === "available" : !limitReached);

  async function completePayment(input: {
    sku: "single" | "bundle";
    focuses?: ReadingFocus[];
    focus?: ReadingFocus;
  }) {
    if (!paymentConfig?.enabled || !paymentConfig.keyId) {
      setError(t("payments.notConfigured"));
      return;
    }

    setPaying(input.sku);
    setError(null);

    try {
      const focuses =
        input.focuses ??
        (input.sku === "bundle" ? [...ALL_READING_FOCUSES] : input.focus ? [input.focus] : []);

      const orderRes = await fetch("/api/payments/create-order", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sku: input.sku,
          focus: input.focus,
          focuses,
          chart,
        }),
      });
      const order = await parseJsonResponse<{
        orderId?: string;
        amount?: number;
        currency?: string;
        description?: string;
        keyId?: string;
        error?: string;
      }>(orderRes);

      if (!orderRes.ok || !order.orderId || !order.amount || !order.currency) {
        throw new Error(order.error ?? t("payments.orderFailed"));
      }

      const payment = await openRazorpayCheckout({
        key: order.keyId ?? paymentConfig.keyId,
        amount: order.amount,
        currency: order.currency,
        name: paymentConfig.brandName,
        description: order.description ?? t("payments.readingLabel"),
        order_id: order.orderId,
        theme: { color: "#c2410c" },
      });

      const verifyRes = await fetch("/api/payments/verify", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payment),
      });
      const verified = await parseJsonResponse<{ ok?: boolean; error?: string }>(verifyRes);
      if (!verifyRes.ok || !verified.ok) {
        throw new Error(verified.error ?? t("payments.verifyFailed"));
      }

      await refreshEntitlements();
      onPendingReadingsCleared?.();
    } catch (err) {
      if (mountedRef.current) {
        const message = err instanceof Error ? err.message : t("payments.failed");
        if (message !== "Payment cancelled") {
          setError(message);
        }
      }
    } finally {
      if (mountedRef.current) setPaying(null);
    }
  }

  async function handlePay(sku: "single" | "bundle") {
    await completePayment({
      sku,
      focus: sku === "single" ? focus : undefined,
    });
  }

  async function handlePayPending() {
    if (!pendingReadings?.length) return;
    await completePayment({
      sku: isFullReadingBundle(pendingReadings) ? "bundle" : "single",
      focuses: pendingReadings,
    });
  }

  async function handleGenerate() {
    setLoading(true);
    setError(null);
    setReading("");
    setTruncated(false);

    try {
      const res = await fetch("/api/interpret", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Accept: "text/event-stream",
        },
        body: JSON.stringify({ chart, locale, readingType: "brief", focus, stream: true }),
      });

      if (res.status === 402) {
        setError(t("payments.required"));
        await refreshEntitlements();
        return;
      }

      if (res.status === 409) {
        setError(t("payments.alreadyUsed"));
        await refreshEntitlements();
        return;
      }

      if (res.status === 429) {
        const data = await parseJsonResponse<{ limit?: number }>(res);
        setError(t("limitReached"));
        setUsage((u) => ({
          ...u,
          used: data.limit ?? u.limit,
          limit: data.limit ?? u.limit,
        }));
        return;
      }

      if (!res.ok) {
        const data = await parseJsonResponse<{ error?: string }>(res);
        throw new Error(data.error ?? t("genericError"));
      }

      const contentType = res.headers.get("content-type") ?? "";
      if (contentType.includes("text/event-stream")) {
        let accumulated = "";
        const result = await consumeSse(res, (chunk) => {
          if (!mountedRef.current) return;
          accumulated += chunk;
          setReading(accumulated);
        });

        if (!mountedRef.current) return;

        if (!accumulated.trim()) {
          throw new Error(t("emptyReading"));
        }

        setTruncated(result.truncated);
        if (usage.paymentsEnabled) {
          await refreshEntitlements();
        } else {
          setUsage((u) => ({ ...u, used: u.used + 1 }));
        }
      }
    } catch (err) {
      if (mountedRef.current) {
        setError(err instanceof Error ? err.message : t("genericError"));
      }
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }

  function focusBadge(item: ReadingFocus) {
    const access = entitlements.focuses[item];
    if (!usage.paymentsEnabled || !entitlements.loaded) return null;
    if (access === "available") return t("payments.unlocked");
    if (access === "used") return t("payments.used");
    return t("payments.locked");
  }

  return (
    <div className="card p-6">
      <h2 className="text-lg font-semibold text-slate-800">{t("title")}</h2>
      <p className="mt-1 text-sm text-muted">{t("subtitle")}</p>

      <div className="mt-4 grid gap-3 rounded-xl border border-orange-100 bg-orange-50/60 p-4 sm:grid-cols-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-orange-700/80">
            {t("birthStar")}
          </p>
          <p className="mt-1 text-base font-semibold text-slate-800">
            {birth.janmaNakshatra}
          </p>
          <p className="text-xs text-muted">
            {t("pada")} {birth.janmaNakshatraPada}
          </p>
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-orange-700/80">
            {t("birthRashi")}
          </p>
          <p className="mt-1 text-base font-semibold text-slate-800">
            {birth.janmaRashi}
          </p>
          <p className="text-xs text-muted">{t("moonSign")}</p>
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-orange-700/80">
            {t("lagnaRashi")}
          </p>
          <p className="mt-1 text-base font-semibold text-slate-800">
            {birth.lagnaRashi}
          </p>
          <p className="text-xs text-muted">{t("ascendant")}</p>
        </div>
      </div>

      {!usage.loaded ? (
        <p className="mt-4 text-sm text-muted">{t("checking")}</p>
      ) : !usage.hasApiKey ? (
        <p className="mt-4 text-sm text-orange-700">{t("noApiKey")}</p>
      ) : (
        <>
          {usage.paymentsEnabled && paymentConfig ? (
            <div className="mt-5 space-y-4">
              {pendingReadings && pendingReadings.length > 0 ? (
                <div className="rounded-xl border border-orange-200 bg-orange-50/70 p-4">
                  <p className="text-sm font-semibold text-slate-800">
                    {t("payments.pendingTitle")}
                  </p>
                  <ul className="mt-2 space-y-1 text-sm text-slate-700">
                    {pendingReadings.map((item) => (
                      <li key={item}>• {t(`focus.${item}`)}</li>
                    ))}
                  </ul>
                  <p className="mt-3 text-lg font-bold text-orange-700">
                    {formatInr(getReadingOrderAmount(pendingReadings))}
                  </p>
                  <button
                    type="button"
                    onClick={() => void handlePayPending()}
                    disabled={Boolean(paying) || loading}
                    className="btn-primary mt-4 w-full text-sm"
                  >
                    {paying ? t("payments.processing") : t("payments.payPending")}
                  </button>
                </div>
              ) : null}
              <p className="text-sm text-slate-700">{t("payments.intro")}</p>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-slate-200 bg-white p-4">
                  <p className="text-sm font-semibold text-slate-800">
                    {t("payments.singleTitle")}
                  </p>
                  <p className="mt-1 text-2xl font-bold text-orange-700">
                    {formatInr(paymentConfig.amounts.single)}
                  </p>
                  <p className="mt-2 text-xs text-muted">{t("payments.singleHint")}</p>
                  <button
                    type="button"
                    onClick={() => handlePay("single")}
                    disabled={Boolean(paying) || loading || focusAccess !== "locked"}
                    className="btn-primary mt-4 w-full text-sm"
                  >
                    {paying === "single"
                      ? t("payments.processing")
                      : focusAccess === "locked"
                        ? t("payments.paySingle", {
                            focus: t(`focus.${focus}`),
                          })
                        : t("payments.alreadyUnlocked")}
                  </button>
                </div>

                <div className="rounded-xl border border-orange-200 bg-orange-50/50 p-4">
                  <p className="text-sm font-semibold text-slate-800">
                    {t("payments.bundleTitle")}
                  </p>
                  <p className="mt-1 text-2xl font-bold text-orange-700">
                    {formatInr(paymentConfig.amounts.bundle)}
                  </p>
                  <p className="mt-1 text-xs text-orange-800">
                    {t("payments.bundleSave", {
                      amount: formatInr(
                        paymentConfig.amounts.single * ALL_READING_FOCUSES.length -
                          paymentConfig.amounts.bundle,
                      ),
                    })}
                  </p>
                  <p className="mt-2 text-xs text-muted">{t("payments.bundleHint")}</p>
                  <button
                    type="button"
                    onClick={() => handlePay("bundle")}
                    disabled={Boolean(paying) || loading || entitlements.hasBundle}
                    className="btn-primary mt-4 w-full text-sm"
                  >
                    {paying === "bundle"
                      ? t("payments.processing")
                      : entitlements.hasBundle
                        ? t("payments.bundleOwned")
                        : t("payments.payBundle")}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <p className="mt-3 text-xs text-muted">
              {t("limit", { used: usage.used, limit: usage.limit })}
            </p>
          )}

          {!usage.paymentsEnabled && limitReached && (
            <p className="mt-2 text-sm text-orange-700">{t("limitReached")}</p>
          )}

          <div className="mt-4 flex flex-wrap gap-2">
            {ALL_READING_FOCUSES.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setFocus(item)}
                disabled={loading || Boolean(paying)}
                className={focus === item ? "chip chip-active" : "chip"}
              >
                <span>{t(`focus.${item}`)}</span>
                {focusBadge(item) && (
                  <span className="ml-1 text-[10px] opacity-80">· {focusBadge(item)}</span>
                )}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={handleGenerate}
            disabled={loading || Boolean(paying) || !canGenerate}
            className="btn-primary mt-4 text-sm"
          >
            {loading ? t("loading") : t("generate")}
          </button>

          {usage.paymentsEnabled && focusAccess === "locked" && (
            <p className="mt-2 text-xs text-muted">{t("payments.unlockHint")}</p>
          )}

          {usage.paymentsEnabled && focusAccess === "used" && (
            <p className="mt-2 text-xs text-orange-700">{t("payments.usedHint")}</p>
          )}

          {loading && !reading && (
            <p className="mt-3 text-sm text-muted">{t("waitHint")}</p>
          )}
        </>
      )}

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

      {showReadingBox && (
        <div className="mt-5 min-h-32 rounded-xl border border-slate-200 bg-slate-50/80 p-4">
          {truncated && (
            <p className="mb-2 text-xs text-orange-700">{t("truncated")}</p>
          )}
          {loading && !reading && (
            <p className="text-sm text-muted">{t("streaming")}</p>
          )}
          <div className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
            {reading}
            {loading && reading && (
              <span className="ml-0.5 inline-block h-4 w-0.5 animate-pulse bg-orange-500" />
            )}
          </div>
        </div>
      )}

      <p className="mt-5 text-xs text-slate-400">
        {usage.paymentsEnabled ? t("payments.disclaimer") : t("disclaimer")}
      </p>
    </div>
  );
}
