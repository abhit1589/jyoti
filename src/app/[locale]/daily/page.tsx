import { getTranslations, setRequestLocale } from "next-intl/server";
import { AppNav } from "@/components/AppNav";
import { Link } from "@/i18n/navigation";
import { JsonLd } from "@/components/seo/JsonLd";
import { RashiHoroscopeView } from "@/components/weekly/RashiHoroscopeView";
import { isLocale } from "@/lib/i18n/locales";
import { getDailyRashiHoroscopes } from "@/lib/daily-rashi/service";
import { buildPageMetadata } from "@/lib/seo/metadata";
import {
  buildHoroscopeCollectionJsonLd,
} from "@/lib/seo/horoscope-jsonld";
import { notFound } from "next/navigation";
import type { Locale } from "@/lib/types";

export const maxDuration = 120;
export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: localeParam } = await params;
  if (!isLocale(localeParam)) return {};

  const locale = localeParam as Locale;
  const t = await getTranslations({ locale, namespace: "daily" });

  return buildPageMetadata({
    locale,
    path: "daily",
    title: t("metaTitle"),
    description: t("metaDescription"),
  });
}

export default async function DailyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: localeParam } = await params;
  if (!isLocale(localeParam)) notFound();

  const locale = localeParam as Locale;
  setRequestLocale(locale);
  const t = await getTranslations("daily");

  try {
    const data = await getDailyRashiHoroscopes(locale);

    return (
      <>
        <JsonLd
          data={buildHoroscopeCollectionJsonLd({
            locale,
            period: "daily",
            title: t("metaTitle"),
            description: t("metaDescription"),
          })}
        />
        <RashiHoroscopeView
          locale={locale}
          period="daily"
          periodLine={t("dayOf", { date: data.periodLabel })}
          horoscopes={data.horoscopes}
        />
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
            <Link href="/daily" className="taara-btn-primary">
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
