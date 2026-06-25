"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

const FORECAST_PERIODS = [
  { id: "daily", href: "/daily" },
  { id: "weekly", href: "/weekly" },
  { id: "monthly", href: "/monthly" },
] as const;

export function LandingServiceTiles() {
  const t = useTranslations("landing.services");

  return (
    <div className="taara-service-tiles" role="navigation" aria-label={t("ariaLabel")}>
      <a href="#chart" className="taara-service-tile taara-service-tile-primary">
        <span className="taara-service-icon" aria-hidden>
          {t("chart.icon")}
        </span>
        <span className="taara-service-label">{t("chart.label")}</span>
        <span className="taara-service-hint">{t("chart.hint")}</span>
      </a>

      <Link href="/match" className="taara-service-tile">
        <span className="taara-service-icon" aria-hidden>
          {t("match.icon")}
        </span>
        <span className="taara-service-label">{t("match.label")}</span>
        <span className="taara-service-hint">{t("match.hint")}</span>
      </Link>

      <div className="taara-service-tile taara-service-tile-forecasts">
        <span className="taara-service-icon" aria-hidden>
          {t("forecasts.icon")}
        </span>
        <span className="taara-service-label">{t("forecasts.label")}</span>
        <span className="taara-service-hint">{t("forecasts.hint")}</span>
        <div className="taara-service-periods" role="group" aria-label={t("forecasts.periodsAria")}>
          {FORECAST_PERIODS.map((period) => (
            <Link key={period.id} href={period.href} className="taara-service-period">
              {t(`forecasts.${period.id}`)}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
