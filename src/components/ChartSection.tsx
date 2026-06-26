"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import type { ReadingTeaser, ReadingFocus, VedicChart } from "@/lib/types";
import { BirthForm } from "@/components/BirthForm";
import { ChartDisplay } from "@/components/ChartDisplay";
import { ReadingPanel } from "@/components/ReadingPanel";
import { ReadingTeaserPanel } from "@/components/ReadingTeaserPanel";
import { ChartQaPanel } from "@/components/ChartQaPanel";
import { PENDING_READINGS_KEY } from "@/components/legal/CheckoutView";
import { parseReadingsQuery } from "@/lib/payments/reading-order";

export function ChartSection() {
  const t = useTranslations("landing.chart");
  const [chart, setChart] = useState<VedicChart | null>(null);
  const [teaser, setTeaser] = useState<ReadingTeaser | null>(null);
  const [pendingReadings, setPendingReadings] = useState<ReadingFocus[] | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const fromUrl = parseReadingsQuery(params.get("readings"));
    const fromStorage =
      typeof sessionStorage !== "undefined"
        ? parseReadingsQuery(sessionStorage.getItem(PENDING_READINGS_KEY))
        : [];
    const merged = fromUrl.length > 0 ? fromUrl : fromStorage;
    if (merged.length > 0) {
      setPendingReadings(merged);
    }
  }, []);

  function handleChart(chartResult: VedicChart, teaserResult: ReadingTeaser | null) {
    setChart(chartResult);
    setTeaser(teaserResult);
  }

  function clearPendingReadings() {
    sessionStorage.removeItem(PENDING_READINGS_KEY);
    setPendingReadings(null);
  }

  return (
    <section id="chart" className="taara-section scroll-mt-24">
      <p className="taara-label">{t("label")}</p>
      <h2 className="taara-heading">
        {t.rich("title", { em: (c) => <em>{c}</em>, br: () => <br /> })}
      </h2>
      <p className="taara-intro mb-10">{t("intro")}</p>

      <div className="grid gap-8 lg:grid-cols-2">
        <BirthForm onChart={handleChart} />
        {chart ? (
          <ChartDisplay chart={chart} />
        ) : (
          <div className="taara-card flex min-h-64 items-center justify-center p-8 text-center text-[var(--brown-light)]">
            {t("placeholder")}
          </div>
        )}
      </div>

      {teaser && (
        <div className="mt-8">
          <ReadingTeaserPanel teaser={teaser} />
        </div>
      )}

      {chart && (
        <div className="mt-8">
          <ReadingPanel
            chart={chart}
            pendingReadings={pendingReadings}
            onPendingReadingsCleared={clearPendingReadings}
          />
        </div>
      )}

      {chart && (
        <div className="mt-8">
          <ChartQaPanel chart={chart} />
        </div>
      )}
    </section>
  );
}
