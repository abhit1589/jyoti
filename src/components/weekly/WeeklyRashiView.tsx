import { getTranslations } from "next-intl/server";
import { AppNav } from "@/components/AppNav";
import { Link } from "@/i18n/navigation";
import { RASHIS } from "@/lib/vedic/constants";
import { formatRashiNakshatraPadas } from "@/lib/vedic/rashi-nakshatras";
import { RashiSymbol } from "@/components/weekly/RashiSymbol";
import type { WeeklyRashiPayload } from "@/lib/weekly-rashi/generate";
import type { Locale } from "@/lib/types";

interface WeeklyRashiViewProps {
  locale: Locale;
  data: WeeklyRashiPayload;
}

export async function WeeklyRashiView({ locale, data }: WeeklyRashiViewProps) {
  const t = await getTranslations("weekly");
  const tChart = await getTranslations("chart");
  const tBrand = await getTranslations("landing");
  const brandNative = tBrand("brand.native");
  const rashis = RASHIS[locale];

  return (
    <div className="taara-page min-h-screen">
      <AppNav />

      <main className="taara-weekly-main">
        <p className="taara-eyebrow">{t("badge")}</p>
        <h1 className="taara-heading !mb-4">{t("title")}</h1>
        <p className="taara-intro mx-auto max-w-2xl text-center">{t("subtitle")}</p>
        <p className="taara-week-label">{t("weekOf", { range: data.weekLabel })}</p>

        <div className="taara-weekly-grid">
          {rashis.map((name, index) => {
            const key = String(index + 1);
            const text = data.horoscopes[key];
            return (
              <article key={key} className="taara-rashi-card">
                <h2 className="taara-rashi-name">
                  <span className="taara-rashi-symbol" aria-hidden="true">
                    <RashiSymbol index={index} className="taara-rashi-icon" />
                  </span>
                  <span>{name}</span>
                </h2>
                <p className="taara-rashi-nakshatras" title={tChart("nakshatra")}>
                  {formatRashiNakshatraPadas(locale, index)}
                </p>
                <p className="taara-rashi-text">{text}</p>
              </article>
            );
          })}
        </div>

        <p className="taara-weekly-disclaimer">{t("disclaimer")}</p>

        <div className="taara-weekly-actions">
          <Link href="/" className="taara-btn-ghost">
            {t("backHome")}
          </Link>
          <Link href="/#chart" className="taara-btn-primary">
            {t("personalReading")}
          </Link>
        </div>
      </main>

      <footer className="taara-footer">
        <span className="taara-footer-logo">
          {brandNative ? (
            <span className="taara-logo-stack taara-logo-stack-center">
              <span className="taara-logo-primary">{brandNative}</span>
              <span className="taara-logo-sub">{tBrand("brand.name")}</span>
            </span>
          ) : (
            tBrand("brand.name")
          )}
        </span>
        <p className="taara-footer-domain">{tBrand("brand.domain")}</p>
      </footer>
    </div>
  );
}
