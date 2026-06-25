import { getTranslations } from "next-intl/server";
import { AppNav } from "@/components/AppNav";
import { Link } from "@/i18n/navigation";
import { RASHIS } from "@/lib/vedic/constants";
import { formatRashiNakshatraPadas } from "@/lib/vedic/rashi-nakshatras";
import { RashiSymbol } from "@/components/weekly/RashiSymbol";
import { SiteFooter } from "@/components/legal/SiteFooter";
import type { HoroscopePeriod } from "@/lib/rashi-horoscope/types";
import type { Locale } from "@/lib/types";

interface RashiHoroscopeDetailViewProps {
  locale: Locale;
  period: HoroscopePeriod;
  rashiIndex: number;
  periodLabel: string;
  horoscopes: Record<string, string>;
}

export async function RashiHoroscopeDetailView({
  locale,
  period,
  rashiIndex,
  periodLabel,
  horoscopes,
}: RashiHoroscopeDetailViewProps) {
  const t = await getTranslations(period);
  const tChart = await getTranslations("chart");
  const rashis = RASHIS[locale];
  const rashiName = rashis[rashiIndex]!;
  const text = horoscopes[String(rashiIndex + 1)] ?? "";

  return (
    <div className="taara-page min-h-screen">
      <AppNav />

      <main className="taara-weekly-main">
        <p className="taara-eyebrow">{t("badge")}</p>
        <h1 className="taara-heading !mb-4">
          {t("rashiTitle", { rashi: rashiName })}
        </h1>
        <p className="taara-intro mx-auto max-w-2xl text-center">{t("rashiSubtitle")}</p>
        <p className="taara-week-label">
          {period === "weekly"
            ? t("weekOf", { range: periodLabel })
            : period === "daily"
              ? t("dayOf", { date: periodLabel })
              : t("monthOf", { month: periodLabel })}
        </p>

        <article className="taara-rashi-card mx-auto max-w-2xl">
          <h2 className="taara-rashi-name">
            <span className="taara-rashi-symbol" aria-hidden="true">
              <RashiSymbol index={rashiIndex} className="taara-rashi-icon" />
            </span>
            <span>{rashiName}</span>
          </h2>
          <p className="taara-rashi-nakshatras" title={tChart("nakshatra")}>
            {formatRashiNakshatraPadas(locale, rashiIndex)}
          </p>
          <p className="taara-rashi-text">{text}</p>
        </article>

        <p className="taara-weekly-disclaimer">{t("disclaimer")}</p>

        <div className="taara-weekly-actions">
          <Link href={`/${period}`} className="taara-btn-ghost">
            {t("allRashis")}
          </Link>
          <Link href="/#chart" className="taara-btn-primary">
            {t("personalReading")}
          </Link>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
