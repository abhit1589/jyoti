"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { PanchangClient } from "@/components/panchang/PanchangClient";
import { parseJsonResponse } from "@/lib/api/client";
import type { PanchangResult } from "@/lib/panchang/types";
import type { Locale } from "@/lib/types";

export function PanchangCard() {
  const t = useTranslations("panchang");
  const locale = useLocale() as Locale;
  const [initialData, setInitialData] = useState<PanchangResult | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch(`/api/panchang?city=hyderabad&locale=${locale}`);
        const data = await parseJsonResponse<PanchangResult>(res);
        if (!res.ok) throw new Error("failed");
        if (!cancelled) setInitialData(data);
      } catch {
        if (!cancelled) setError(true);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [locale]);

  if (error) return null;

  return (
    <section className="taara-section taara-panchang-section scroll-mt-24" id="panchang">
      <p className="taara-label">{t("badge")}</p>
      <h2 className="taara-heading !mb-4">{t("title")}</h2>
      <p className="taara-intro mx-auto max-w-2xl text-center">{t("subtitle")}</p>

      <div className="taara-panchang-card-wrap">
        {initialData ? (
          <PanchangClient initialData={initialData} compact />
        ) : (
          <p className="taara-panchang-loading">{t("loading")}</p>
        )}
      </div>

      <p className="taara-panchang-more">
        <Link href="/panchang" className="taara-link-accent">
          {t("viewFull")}
        </Link>
      </p>
    </section>
  );
}
