import { getTranslations, setRequestLocale } from "next-intl/server";
import { AppNav } from "@/components/AppNav";
import { Link } from "@/i18n/navigation";
import { JsonLd } from "@/components/seo/JsonLd";
import { isLocale } from "@/lib/i18n/locales";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { buildHoroscopeCollectionJsonLd } from "@/lib/seo/horoscope-jsonld";
import { getWeeklyRashiHoroscopes } from "@/lib/weekly-rashi/service";
import { WeeklyRashiView } from "@/components/weekly/WeeklyRashiView";
import { notFound } from "next/navigation";
import type { Locale } from "@/lib/types";

export const maxDuration = 60;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: localeParam } = await params;
  if (!isLocale(localeParam)) return {};

  const locale = localeParam as Locale;
  const t = await getTranslations({ locale, namespace: "weekly" });

  return buildPageMetadata({
    locale,
    path: "weekly",
    title: t("metaTitle"),
    description: t("metaDescription"),
  });
}

export default async function WeeklyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: localeParam } = await params;
  if (!isLocale(localeParam)) notFound();

  const locale = localeParam as Locale;
  setRequestLocale(locale);
  const t = await getTranslations("weekly");

  try {
    const data = await getWeeklyRashiHoroscopes(locale);

    return (
      <>
        <JsonLd
          data={buildHoroscopeCollectionJsonLd({
            locale,
            period: "weekly",
            title: t("metaTitle"),
            description: t("metaDescription"),
          })}
        />
        <WeeklyRashiView locale={locale} data={data} />
      </>
    );
  } catch {
    return (
      <div className="taara-page min-h-screen">
        <AppNav />
        <main className="taara-weekly-main text-center">
          <h1 className="taara-heading">{t("errorTitle")}</h1>
          <p className="taara-intro mx-auto max-w-md">{t("error")}</p>
          <div className="taara-weekly-actions justify-center">
            <Link href="/weekly" className="taara-btn-primary">
              {t("retry")}
            </Link>
            <Link href="/" className="taara-btn-ghost">
              {t("backHome")}
            </Link>
          </div>
        </main>
      </div>
    );
  }
}
