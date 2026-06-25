import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { RashiHoroscopeDetailView } from "@/components/weekly/RashiHoroscopeDetailView";
import { JsonLd } from "@/components/seo/JsonLd";
import { isLocale } from "@/lib/i18n/locales";
import { RASHIS } from "@/lib/vedic/constants";
import { getMonthlyRashiHoroscopes } from "@/lib/monthly-rashi/service";
import { buildPageMetadata } from "@/lib/seo/metadata";
import {
  buildHoroscopeArticleJsonLd,
  buildHoroscopeBreadcrumbJsonLd,
} from "@/lib/seo/horoscope-jsonld";
import { isRashiSlug, rashiSlugToIndex } from "@/lib/seo/rashi-slugs";
import type { Locale } from "@/lib/types";

export const maxDuration = 60;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale: localeParam, slug } = await params;
  if (!isLocale(localeParam) || !isRashiSlug(slug)) return {};

  const locale = localeParam as Locale;
  const index = rashiSlugToIndex(slug)!;
  const rashiName = RASHIS[locale][index]!;
  const t = await getTranslations({ locale, namespace: "monthly" });
  const tBrand = await getTranslations({ locale, namespace: "landing" });

  return buildPageMetadata({
    locale,
    path: `monthly/${slug}`,
    title: `${t("rashiMetaTitle", { rashi: rashiName })} | ${tBrand("brand.name")}`,
    description: t("rashiMetaDescription", { rashi: rashiName }),
  });
}

export default async function MonthlyRashiPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale: localeParam, slug } = await params;
  if (!isLocale(localeParam) || !isRashiSlug(slug)) notFound();

  const locale = localeParam as Locale;
  const rashiIndex = rashiSlugToIndex(slug);
  if (rashiIndex === null) notFound();

  setRequestLocale(locale);

  const t = await getTranslations({ locale, namespace: "monthly" });
  const rashiName = RASHIS[locale][rashiIndex]!;

  try {
    const data = await getMonthlyRashiHoroscopes(locale);
    const text = data.horoscopes[String(rashiIndex + 1)] ?? "";
    const headline = t("rashiMetaTitle", { rashi: rashiName });
    const description = t("rashiMetaDescription", { rashi: rashiName });

    return (
      <>
        <JsonLd
          data={[
            buildHoroscopeArticleJsonLd({
              locale,
              period: "monthly",
              slug,
              headline,
              description,
              periodLabel: data.periodLabel,
              articleBody: text,
            }),
            buildHoroscopeBreadcrumbJsonLd({
              locale,
              period: "monthly",
              periodListTitle: t("title"),
              rashiName,
              slug,
            }),
          ]}
        />
        <RashiHoroscopeDetailView
          locale={locale}
          period="monthly"
          rashiIndex={rashiIndex}
          periodLabel={data.periodLabel}
          horoscopes={data.horoscopes}
        />
      </>
    );
  } catch {
    notFound();
  }
}
