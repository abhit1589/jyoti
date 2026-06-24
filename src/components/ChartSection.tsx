"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import type { VedicChart } from "@/lib/types";
import { BirthForm } from "@/components/BirthForm";
import { ChartDisplay } from "@/components/ChartDisplay";
import { ReadingPanel } from "@/components/ReadingPanel";

export function ChartSection() {
  const t = useTranslations("landing.chart");
  const [chart, setChart] = useState<VedicChart | null>(null);

  return (
    <section id="chart" className="taara-section scroll-mt-24">
      <p className="taara-label">{t("label")}</p>
      <h2 className="taara-heading">
        {t.rich("title", { em: (c) => <em>{c}</em>, br: () => <br /> })}
      </h2>
      <p className="taara-intro mb-10">{t("intro")}</p>

      <div className="grid gap-8 lg:grid-cols-2">
        <BirthForm onChart={setChart} />
        {chart ? (
          <ChartDisplay chart={chart} />
        ) : (
          <div className="taara-card flex min-h-64 items-center justify-center p-8 text-center text-[var(--brown-light)]">
            {t("placeholder")}
          </div>
        )}
      </div>

      {chart && (
        <div className="mt-8">
          <ReadingPanel chart={chart} />
        </div>
      )}
    </section>
  );
}
