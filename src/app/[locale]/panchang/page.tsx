import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { AppNav } from "@/components/AppNav";
import { PanchangClient } from "@/components/panchang/PanchangClient";
import { Link } from "@/i18n/navigation";
import { JsonLd } from "@/components/seo/JsonLd";
import { SiteFooter } from "@/components/legal/SiteFooter";
import { calculatePanchang } from "@/lib/panchang/calculate";
import { todayInTimezone } from "@/lib/panchang/date";
import { isLocale } from "@/lib/i18n/locales";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { getCityById } from "@/lib/vedic/cities";
import type { Locale } from "@/lib/types";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: localeParam } = await params;
  if (!isLocale(localeParam)) return {};

  const locale = localeParam as Locale;
  const t = await getTranslations({ locale, namespace: "panchang" });

  return buildPageMetadata({
    locale,
    path: "panchang",
    title: t("metaTitle"),
    description: t("metaDescription"),
  });
}

export default async function PanchangPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ city?: string; date?: string }>;
}) {
  const { locale: localeParam } = await params;
  if (!isLocale(localeParam)) notFound();

  const locale = localeParam as Locale;
  setRequestLocale(locale);
  const t = await getTranslations("panchang");

  const query = await searchParams;
  const cityId = query.city && getCityById(query.city) ? query.city : "hyderabad";
  const city = getCityById(cityId)!;
  const date =
    query.date && /^\d{4}-\d{2}-\d{2}$/.test(query.date)
      ? query.date
      : todayInTimezone(city.timezone);

  try {
    const data = await calculatePanchang(date, cityId, locale);

    return (
      <>
        <JsonLd
          data={{
            "@context": "https://schema.org",
            "@type": "WebPage",
            name: t("metaTitle"),
            description: t("metaDescription"),
            inLanguage: locale,
          }}
        />
        <div className="taara-page min-h-screen">
          <AppNav />
          <main className="taara-weekly-main">
            <p className="taara-eyebrow">{t("badge")}</p>
            <h1 className="taara-heading !mb-4">{t("title")}</h1>
            <p className="taara-intro mx-auto max-w-2xl text-center">{t("subtitle")}</p>

            <div className="taara-panchang-page-wrap">
              <PanchangClient
                initialData={data}
                initialCityId={cityId}
                initialDate={date}
              />
            </div>

            <div className="taara-weekly-actions justify-center">
              <Link href="/" className="taara-btn-ghost">
                {t("backHome")}
              </Link>
            </div>
          </main>
          <SiteFooter />
        </div>
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
            <Link href="/panchang" className="taara-btn-primary">
              {t("retry")}
            </Link>
            <Link href="/" className="taara-btn-ghost">
              {t("backHome")}
            </Link>
          </div>
        </main>
        <SiteFooter />
      </div>
    );
  }
}
