"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { getBirthIdentity } from "@/lib/vedic/birth-identity";
import { parseJsonResponse } from "@/lib/api/client";
import type { Locale, ReadingFocus, VedicChart } from "@/lib/types";

interface ReadingPanelProps {
  chart: VedicChart;
}

type UsageState = {
  used: number;
  limit: number;
  hasApiKey: boolean;
  loaded: boolean;
};

async function fetchUsage(): Promise<UsageState> {
  const res = await fetch("/api/interpret", { credentials: "include" });
  const data = await parseJsonResponse<{
    used?: number;
    limit?: number;
    hasApiKey?: boolean;
    error?: string;
  }>(res);

  if (!res.ok) {
    throw new Error(data.error ?? `Status check failed (${res.status})`);
  }

  return {
    used: data.used ?? 0,
    limit: data.limit ?? 5,
    hasApiKey: Boolean(data.hasApiKey),
    loaded: true,
  };
}

async function consumeSse(
  response: Response,
  onDelta: (text: string) => void,
): Promise<{ truncated: boolean; remaining?: number; limit?: number }> {
  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error("No response stream");
  }

  const decoder = new TextDecoder();
  let buffer = "";
  let truncated = false;
  let remaining: number | undefined;
  let limit: number | undefined;

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
        remaining?: number;
        limit?: number;
      };

      if (payload.type === "meta") {
        remaining = payload.remaining;
        limit = payload.limit;
      } else if (payload.type === "delta" && payload.text) {
        onDelta(payload.text);
      } else if (payload.type === "done") {
        truncated = Boolean(payload.truncated);
      } else if (payload.type === "error") {
        throw new Error(payload.message ?? "Stream failed");
      }
    }
  }

  return { truncated, remaining, limit };
}

export function ReadingPanel({ chart }: ReadingPanelProps) {
  const t = useTranslations("reading");
  const locale = useLocale() as Locale;
  const [focus, setFocus] = useState<ReadingFocus>("personality");
  const [reading, setReading] = useState("");
  const [truncated, setTruncated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [usage, setUsage] = useState<UsageState>({
    used: 0,
    limit: 5,
    hasApiKey: false,
    loaded: false,
  });

  const refreshUsage = useCallback(async () => {
    try {
      setUsage(await fetchUsage());
      setError(null);
    } catch {
      setUsage((u) => ({ ...u, loaded: true, hasApiKey: false }));
      setError(t("statusError"));
    }
  }, [t]);

  useEffect(() => {
    refreshUsage();
  }, [refreshUsage]);

  const limitReached = usage.loaded && usage.used >= usage.limit;
  const showReadingBox = loading || reading.length > 0;
  const birth = useMemo(() => getBirthIdentity(chart, locale), [chart, locale]);

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
          accumulated += chunk;
          setReading(accumulated);
        });

        if (!accumulated.trim()) {
          throw new Error(t("emptyReading"));
        }

        setTruncated(result.truncated);
        if (result.limit !== undefined && result.remaining !== undefined) {
          setUsage((u) => ({
            ...u,
            hasApiKey: true,
            used: result.limit! - result.remaining!,
            limit: result.limit!,
          }));
        }
      } else {
        const data = await parseJsonResponse<{
          reading?: string;
          truncated?: boolean;
          remaining?: number;
          limit?: number;
        }>(res);
        setReading(data.reading ?? "");
        setTruncated(Boolean(data.truncated));
        setUsage((u) => ({
          ...u,
          hasApiKey: true,
          used: (data.limit ?? u.limit) - (data.remaining ?? 0),
          limit: data.limit ?? u.limit,
        }));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t("genericError"));
    } finally {
      setLoading(false);
    }
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
          <p className="mt-3 text-xs text-muted">
            {t("limit", { used: usage.used, limit: usage.limit })}
          </p>

          {limitReached && (
            <p className="mt-2 text-sm text-orange-700">{t("limitReached")}</p>
          )}

          <div className="mt-4 flex flex-wrap gap-2">
            {(["personality", "career", "dasha"] as const).map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setFocus(item)}
                disabled={loading}
                className={focus === item ? "chip chip-active" : "chip"}
              >
                {t(`focus.${item}`)}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={handleGenerate}
            disabled={loading || limitReached}
            className="btn-primary mt-4 text-sm"
          >
            {loading ? t("loading") : t("generate")}
          </button>

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

      <p className="mt-5 text-xs text-slate-400">{t("disclaimer")}</p>
    </div>
  );
}
