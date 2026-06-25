"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { MatchResultPanel } from "@/components/MatchResultPanel";
import {
  defaultPartnerBirth,
  PartnerBirthFields,
  partnerBirthToInput,
  type PartnerBirth,
} from "@/components/PartnerBirthFields";
import { parseJsonResponse } from "@/lib/api/client";
import type { AshtakootResult } from "@/lib/vedic/ashtakoot";
import type { MangalDoshaResult } from "@/lib/vedic/mangal-dosha";
import type { Locale, VedicChart } from "@/lib/types";

type MatchUsage = {
  used: number;
  limit: number;
  reportUsed: number;
  reportLimit: number;
  hasApiKey: boolean;
  loaded: boolean;
};

type MatchData = {
  person1Chart: VedicChart;
  person2Chart: VedicChart;
  gunaMilan: AshtakootResult;
  mangalDosha: MangalDoshaResult;
};

async function fetchMatchUsage(): Promise<MatchUsage> {
  const res = await fetch("/api/match", { credentials: "include" });
  const data = await parseJsonResponse<{
    used?: number;
    limit?: number;
    reportUsed?: number;
    reportLimit?: number;
    hasApiKey?: boolean;
  }>(res);
  if (!res.ok) throw new Error("Status check failed");
  return {
    used: data.used ?? 0,
    limit: data.limit ?? 10,
    reportUsed: data.reportUsed ?? 0,
    reportLimit: data.reportLimit ?? 5,
    hasApiKey: Boolean(data.hasApiKey),
    loaded: true,
  };
}

async function consumeReportSse(
  response: Response,
  onDelta: (text: string) => void,
): Promise<void> {
  const reader = response.body?.getReader();
  if (!reader) throw new Error("No response stream");

  const decoder = new TextDecoder();
  let buffer = "";

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
      };

      if (payload.type === "delta" && payload.text) {
        onDelta(payload.text);
      } else if (payload.type === "error") {
        throw new Error(payload.message ?? "Report failed");
      }
    }
  }
}

export function MatchSection() {
  const t = useTranslations("landing.match");
  const locale = useLocale() as Locale;
  const [partner1, setPartner1] = useState<PartnerBirth>(() => ({
    ...defaultPartnerBirth(),
    birthDateTime: { date: "1994-03-20", time: "08:30" },
    cityId: "delhi",
  }));
  const [partner2, setPartner2] = useState<PartnerBirth>(() => defaultPartnerBirth());
  const [loading, setLoading] = useState(false);
  const [reportLoading, setReportLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [matchData, setMatchData] = useState<MatchData | null>(null);
  const [report, setReport] = useState<string | null>(null);
  const [usage, setUsage] = useState<MatchUsage>({
    used: 0,
    limit: 10,
    reportUsed: 0,
    reportLimit: 5,
    hasApiKey: false,
    loaded: false,
  });
  const mountedRef = useRef(true);

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
        const data = await fetchMatchUsage();
        if (active) setUsage(data);
      } catch {
        if (active) setUsage((u) => ({ ...u, loaded: true }));
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const limitReached = usage.loaded && usage.used >= usage.limit;
  const reportLimitReached = usage.loaded && usage.reportUsed >= usage.reportLimit;

  async function handleCompare(e: React.FormEvent) {
    e.preventDefault();
    if (limitReached) return;

    setLoading(true);
    setError(null);
    setMatchData(null);
    setReport(null);

    try {
      const res = await fetch("/api/match", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          person1: partnerBirthToInput(partner1, locale),
          person2: partnerBirthToInput(partner2, locale),
          locale,
        }),
      });

      const data = await parseJsonResponse<
        MatchData & { error?: string; remaining?: number; limit?: number }
      >(res);

      if (res.status === 429) {
        setError(t("limitReached"));
        setUsage((u) => ({ ...u, used: u.limit }));
        return;
      }

      if (!res.ok) throw new Error(data.error ?? t("genericError"));

      if (!mountedRef.current) return;
      setMatchData(data);
      if (data.remaining !== undefined && data.limit !== undefined) {
        setUsage((u) => ({
          ...u,
          used: data.limit! - data.remaining!,
          limit: data.limit!,
        }));
      } else {
        setUsage((u) => ({ ...u, used: u.used + 1 }));
      }
    } catch (err) {
      if (mountedRef.current) {
        setError(err instanceof Error ? err.message : t("genericError"));
      }
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }

  async function handleGenerateReport() {
    if (!matchData || reportLimitReached || !usage.hasApiKey) return;

    setReportLoading(true);
    setReport("");
    setError(null);

    try {
      const res = await fetch("/api/match/report", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Accept: "text/event-stream",
        },
        body: JSON.stringify({
          person1Chart: matchData.person1Chart,
          person2Chart: matchData.person2Chart,
          locale,
        }),
      });

      if (res.status === 429) {
        setError(t("reportLimitReached"));
        setUsage((u) => ({ ...u, reportUsed: u.reportLimit }));
        return;
      }

      if (!res.ok) {
        const data = await parseJsonResponse<{ error?: string }>(res);
        throw new Error(data.error ?? t("reportError"));
      }

      let text = "";
      await consumeReportSse(res, (chunk) => {
        if (!mountedRef.current) return;
        text += chunk;
        setReport(text);
      });

      if (!text.trim()) throw new Error(t("reportEmpty"));
      setUsage((u) => ({ ...u, reportUsed: u.reportUsed + 1 }));
    } catch (err) {
      if (!mountedRef.current) return;
      setReport(null);
      setError(err instanceof Error ? err.message : t("reportError"));
    } finally {
      if (mountedRef.current) setReportLoading(false);
    }
  }

  return (
    <section id="match" className="taara-section scroll-mt-24">
      <p className="taara-label">{t("label")}</p>
      <h2 className="taara-heading">
        {t.rich("title", { em: (c) => <em>{c}</em>, br: () => <br /> })}
      </h2>
      <p className="taara-intro mb-2">{t("intro")}</p>
      <p className="mb-8 text-sm text-[var(--brown-light)]">{t("roleHint")}</p>

      {usage.loaded && (
        <p className="mb-6 text-xs text-muted">
          {t("limit", { used: usage.used, limit: usage.limit })}
        </p>
      )}

      <form onSubmit={handleCompare}>
        <div className="grid gap-6 lg:grid-cols-2">
          <PartnerBirthFields
            idPrefix="p1"
            label={t("partner1")}
            value={partner1}
            onChange={setPartner1}
          />
          <PartnerBirthFields
            idPrefix="p2"
            label={t("partner2")}
            value={partner2}
            onChange={setPartner2}
          />
        </div>

        {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={loading || limitReached}
          className="btn-primary mt-6 w-full sm:w-auto"
        >
          {loading ? t("comparing") : limitReached ? t("limitReached") : t("compare")}
        </button>
      </form>

      {matchData && (
        <div className="mt-10">
          <MatchResultPanel
            gunaMilan={matchData.gunaMilan}
            mangalDosha={matchData.mangalDosha}
            report={report}
            reportLoading={reportLoading}
            onGenerateReport={() => void handleGenerateReport()}
            canGenerateReport={usage.hasApiKey}
            reportLimitReached={reportLimitReached}
          />
        </div>
      )}
    </section>
  );
}
