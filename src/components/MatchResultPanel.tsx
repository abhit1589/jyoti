"use client";

import { useTranslations } from "next-intl";
import type { AshtakootResult, KootaId } from "@/lib/vedic/ashtakoot";
import type { MangalDoshaResult } from "@/lib/vedic/mangal-dosha";
import { stripMarkdown } from "@/lib/text/strip-markdown";

const KOOTA_ORDER: KootaId[] = [
  "varna",
  "vashya",
  "tara",
  "yoni",
  "grahaMaitri",
  "gana",
  "bhakoot",
  "nadi",
];

interface MatchResultPanelProps {
  gunaMilan: AshtakootResult;
  mangalDosha: MangalDoshaResult;
  report: string | null;
  reportLoading: boolean;
  onGenerateReport: () => void;
  canGenerateReport: boolean;
  reportLimitReached: boolean;
}

export function MatchResultPanel({
  gunaMilan,
  mangalDosha,
  report,
  reportLoading,
  onGenerateReport,
  canGenerateReport,
  reportLimitReached,
}: MatchResultPanelProps) {
  const t = useTranslations("landing.match");

  const scoreColor =
    gunaMilan.totalScore >= 28
      ? "text-emerald-700"
      : gunaMilan.totalScore >= 18
        ? "text-orange-700"
        : "text-red-700";

  return (
    <div className="space-y-6">
      <div className="card p-6 text-center">
        <p className="text-sm font-medium uppercase tracking-wide text-orange-700/80">
          {t("scoreLabel")}
        </p>
        <p className={`mt-2 text-5xl font-bold tabular-nums ${scoreColor}`}>
          {gunaMilan.totalScore}
          <span className="text-2xl font-semibold text-slate-400"> / {gunaMilan.maxScore}</span>
        </p>
        <p className="mt-2 text-sm text-muted">
          {gunaMilan.isCompatible ? t("verdictGood") : t("verdictLow")}
          {" · "}
          {t("percentage", { value: gunaMilan.percentage })}
        </p>
        <div className="mx-auto mt-4 h-2 max-w-md overflow-hidden rounded-full bg-slate-200">
          <div
            className="h-full rounded-full bg-gradient-to-r from-orange-400 to-orange-600 transition-all"
            style={{ width: `${Math.min(100, gunaMilan.percentage)}%` }}
          />
        </div>
      </div>

      <div className="card overflow-hidden p-0">
        <div className="border-b border-slate-100 px-5 py-3">
          <h3 className="font-semibold text-slate-800">{t("kootaTitle")}</h3>
        </div>
        <div className="divide-y divide-slate-100">
          {KOOTA_ORDER.map((id) => {
            const koota = gunaMilan.kootas.find((k) => k.id === id);
            if (!koota) return null;
            return (
              <div
                key={id}
                className="flex flex-wrap items-center justify-between gap-2 px-5 py-3 text-sm"
              >
                <div>
                  <p className="font-medium text-slate-800">{t(`kootas.${id}.name`)}</p>
                  <p className="text-xs text-muted">{t(`kootas.${id}.desc`)}</p>
                </div>
                <div className="text-right">
                  <p
                    className={`font-semibold tabular-nums ${koota.isCompatible ? "text-emerald-700" : "text-orange-700"}`}
                  >
                    {koota.score} / {koota.maxScore}
                  </p>
                  <p className="text-xs text-muted">
                    {koota.person1Value} · {koota.person2Value}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="card p-5">
        <h3 className="font-semibold text-slate-800">{t("mangalTitle")}</h3>
        <p className="mt-2 text-sm text-slate-700">
          {t(`mangal.${mangalDosha.matchStatus}`)}
        </p>
        <div className="mt-3 grid gap-2 text-xs text-muted sm:grid-cols-2">
          <p>
            {t("partner1")}:{" "}
            {mangalDosha.person1.hasDosha
              ? t("mangal.personPresent")
              : mangalDosha.person1.cancelled
                ? t("mangal.personCancelled")
                : t("mangal.personNone")}
          </p>
          <p>
            {t("partner2")}:{" "}
            {mangalDosha.person2.hasDosha
              ? t("mangal.personPresent")
              : mangalDosha.person2.cancelled
                ? t("mangal.personCancelled")
                : t("mangal.personNone")}
          </p>
        </div>
      </div>

      <div className="card p-6">
        <h3 className="font-semibold text-slate-800">{t("reportTitle")}</h3>
        <p className="mt-1 text-sm text-muted">{t("reportHint")}</p>

        {!report && !reportLoading && (
          <button
            type="button"
            onClick={onGenerateReport}
            disabled={!canGenerateReport || reportLimitReached}
            className="btn-primary mt-4"
          >
            {reportLimitReached
              ? t("reportLimitReached")
              : canGenerateReport
                ? t("reportGenerate")
                : t("reportUnavailable")}
          </button>
        )}

        {reportLoading && !report && (
          <p className="mt-4 text-sm text-muted">{t("reportLoading")}</p>
        )}

        {report && (
          <div className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
            {stripMarkdown(report)}
          </div>
        )}
      </div>

      <p className="text-xs text-slate-400">{t("disclaimer")}</p>
    </div>
  );
}
