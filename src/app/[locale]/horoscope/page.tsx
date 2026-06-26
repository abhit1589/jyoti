import { getTranslations, setRequestLocale } from "next-intl/server";
import { AppNav } from "@/components/AppNav";
import { ChartSection } from "@/components/ChartSection";
import { SiteFooter } from "@/components/legal/SiteFooter";
import { isLocale } from "@/lib/i18n/locales";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { notFound } from "next/navigation";
import type { Locale } from "@/lib/types";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: localeParam } = await params;
  if (!isLocale(localeParam)) return {};

  const locale = localeParam as Locale;
  const t = await getTranslations({ locale, namespace: "landing.horoscope" });

  return buildPageMetadata({
    locale,
    path: "horoscope",
    title: t("metaTitle"),
    description: t("metaDescription"),
  });
}

export default async function HoroscopePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: localeParam } = await params;
  if (!isLocale(localeParam)) notFound();

  const locale = localeParam as Locale;
  setRequestLocale(locale);
  const t = await getTranslations("landing.horoscope");

  const chartCards = ["birthChart", "planetaryPositions", "dasha"] as const;
  const readingCards = [
    "personality",
    "career",
    "dasha",
    "financial",
    "marriage",
    "complete",
  ] as const;

  return (
    <div className="taara-page min-h-screen">
      <AppNav />

      <main>
        <ChartSection />

        <p className="taara-ornament" aria-hidden>✦ &nbsp; ✦ &nbsp; ✦</p>
        <hr className="taara-hr" />

        <section className="taara-section text-center">
          <p className="taara-label">{t("eyebrow")}</p>
          <h1 className="taara-heading">
            {t.rich("title", { em: (c) => <em>{c}</em>, br: () => <br /> })}
          </h1>
          <p className="taara-intro mx-auto">{t("intro")}</p>

          <div className="taara-science-grid mt-10 text-left">
            {chartCards.map((key) => (
              <article key={key} className="taara-science-card">
                <div className="text-3xl">{t(`charts.items.${key}.icon`)}</div>
                <h3>{t(`charts.items.${key}.title`)}</h3>
                <p>{t(`charts.items.${key}.body`)}</p>
              </article>
            ))}
          </div>
        </section>

        <div className="taara-band">
          <section className="taara-section !py-0 text-center">
            <p className="taara-label">{t("readings.label")}</p>
            <h2 className="taara-heading">
              {t.rich("readings.title", { em: (c) => <em>{c}</em>, br: () => <br /> })}
            </h2>
            <p className="taara-intro mx-auto">{t("readings.intro")}</p>

            <div className="taara-readings-grid text-left">
              {readingCards.map((key) => (
                <article
                  key={key}
                  className={`taara-reading-card ${key === "complete" ? "taara-reading-featured" : ""}`}
                >
                  {key === "complete" ? (
                    <span className="taara-reading-badge-free">{t("readings.bundleBadge")}</span>
                  ) : null}
                  <div className="text-3xl">{t(`readings.items.${key}.icon`)}</div>
                  <h3>{t(`readings.items.${key}.title`)}</h3>
                  <p className="taara-reading-native">{t(`readings.items.${key}.tag`)}</p>
                  <p>{t(`readings.items.${key}.body`)}</p>
                </article>
              ))}
            </div>
          </section>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
