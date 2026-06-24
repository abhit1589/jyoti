"use client";

import { useLocale, useTranslations } from "next-intl";
import {
  NAKSHATRAS,
  PLANET_LABELS,
  RASHIS,
  SOUTH_INDIAN_GRID,
} from "@/lib/vedic/constants";
import type { Locale, PlanetId, VedicChart } from "@/lib/types";

function formatDeg(deg: number): string {
  const d = Math.floor(deg);
  const m = Math.floor((deg - d) * 60);
  return `${d}°${m.toString().padStart(2, "0")}'`;
}

interface ChartDisplayProps {
  chart: VedicChart;
}

export function ChartDisplay({ chart }: ChartDisplayProps) {
  const t = useTranslations("chart");
  const locale = useLocale() as Locale;
  const rashis = RASHIS[locale];
  const nakshatras = NAKSHATRAS[locale];
  const labels = PLANET_LABELS[locale];

  const moon = chart.planets.find((p) => p.id === "moon")!;

  const currentDasha = chart.vimshottari.periods.find((p) => p.isCurrent);

  return (
    <div className="space-y-6">
      <div className="card p-6">
        <h2 className="mb-4 text-lg font-semibold text-slate-800">{t("title")}</h2>

        <div className="mb-4 grid gap-2 text-sm text-slate-600 sm:grid-cols-2">
          <p>
            <span className="font-medium text-accent">{t("lagna")}:</span>{" "}
            {rashis[chart.lagna.rashi - 1]} ({formatDeg(chart.lagna.rashiDegree)})
          </p>
          <p>
            <span className="font-medium text-accent">{t("birthStar")}:</span>{" "}
            {nakshatras[moon.nakshatra - 1]} — {t("pada")} {moon.pada}
          </p>
          <p>
            <span className="font-medium text-accent">{t("lagnaNakshatra")}:</span>{" "}
            {nakshatras[chart.lagna.nakshatra - 1]} — {t("pada")} {chart.lagna.pada}
          </p>
          <p>
            <span className="font-medium text-accent">{t("ayanamsa")}:</span>{" "}
            {chart.ayanamsa.toFixed(4)}°
          </p>
        </div>

        <div className="mx-auto grid max-w-md grid-cols-4 gap-1.5">
          {SOUTH_INDIAN_GRID.flat().map((rashiNum, idx) => {
            if (rashiNum === 0) {
              return (
                <div
                  key={`empty-${idx}`}
                  className="flex min-h-20 items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50/50"
                />
              );
            }

            const planetsInRashi = chart.planets.filter((p) => p.rashi === rashiNum);
            const isLagna = chart.lagna.rashi === rashiNum;

            return (
              <div
                key={`rashi-${rashiNum}`}
                className={`min-h-20 rounded-lg border p-2 ${
                  isLagna
                    ? "border-orange-300 bg-orange-50"
                    : "border-slate-200 bg-slate-50/80"
                }`}
              >
                <div className="text-xs font-semibold text-slate-700">
                  {rashis[rashiNum - 1]}
                </div>
                <div className="mt-1 flex flex-wrap gap-1">
                  {isLagna && (
                    <span className="rounded-full bg-orange-200/70 px-1.5 text-[10px] font-medium text-orange-800">
                      Lagna
                    </span>
                  )}
                  {planetsInRashi.map((p) => (
                    <span
                      key={p.id}
                      className="rounded-full bg-white px-1.5 text-[10px] font-medium text-slate-700 ring-1 ring-slate-200"
                      title={labels[p.id]}
                    >
                      {planetAbbr(p.id)}
                      {p.retrograde ? "℞" : ""}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="card overflow-x-auto p-6">
        <h3 className="mb-3 font-semibold text-slate-800">{t("planets")}</h3>
        <table className="w-full min-w-[520px] text-left text-sm text-slate-600">
          <thead>
            <tr className="border-b border-slate-200 text-accent">
              <th className="py-2 pr-4 font-semibold">Graha</th>
              <th className="py-2 pr-4 font-semibold">{t("rashi")}</th>
              <th className="py-2 pr-4 font-semibold">{t("nakshatra")}</th>
              <th className="py-2 pr-4 font-semibold">{t("house")}</th>
            </tr>
          </thead>
          <tbody>
            {chart.planets.map((p) => (
              <tr key={p.id} className="border-b border-slate-100">
                <td className="py-2.5 pr-4 text-slate-800">
                  {labels[p.id]}
                  {p.retrograde ? ` (${t("retrograde")})` : ""}
                </td>
                <td className="py-2.5 pr-4">
                  {rashis[p.rashi - 1]} {formatDeg(p.rashiDegree)}
                </td>
                <td className="py-2.5 pr-4">
                  {nakshatras[p.nakshatra - 1]} — {t("pada")} {p.pada}
                </td>
                <td className="py-2.5 pr-4">{p.house}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card p-6">
        <h3 className="mb-3 font-semibold text-slate-800">{t("dasha")}</h3>
        {currentDasha && (
          <p className="mb-3 text-sm text-slate-600">
            {t("currentDasha")}: {labels[currentDasha.lord]} ({currentDasha.startDate} —{" "}
            {currentDasha.endDate})
          </p>
        )}
        <div className="grid gap-2 sm:grid-cols-2">
          {chart.vimshottari.periods.map((period) => (
            <div
              key={`${period.lord}-${period.startDate}`}
              className={`rounded-xl border px-3 py-2.5 text-sm ${
                period.isCurrent
                  ? "border-orange-200 bg-orange-50 text-slate-800"
                  : "border-slate-100 bg-slate-50/50 text-slate-600"
              }`}
            >
              <span className="font-medium">{labels[period.lord]}</span>
              <span className="ml-2 text-xs text-slate-400">
                {period.startDate} → {period.endDate}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function planetAbbr(id: PlanetId): string {
  const map: Record<PlanetId, string> = {
    sun: "Su",
    moon: "Mo",
    mars: "Ma",
    mercury: "Me",
    jupiter: "Ju",
    venus: "Ve",
    saturn: "Sa",
    rahu: "Ra",
    ketu: "Ke",
  };
  return map[id];
}
