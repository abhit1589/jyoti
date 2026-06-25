import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { RashiHoroscopeDetailView } from "@/components/weekly/RashiHoroscopeDetailView";
import { JsonLd } from "@/components/seo/JsonLd";
import { isLocale } from "@/lib/i18n/locales";
import { RASHIS } from "@/lib/vedic/constants";
import { buildPageMetadata } from "@/lib/seo/metadata";
import {
  buildHoroscopeArticleJsonLd,
  buildHoroscopeBreadcrumbJsonLd,
} from "@/lib/seo/horoscope-jsonld";
import { isRashiSlug, rashiSlugToIndex } from "@/lib/seo/rashi-slugs";
import { getWeeklyRashiHoroscopes } from "@/lib/weekly-rashi/service";
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
  const t = await getTranslations({ locale, namespace: "weekly" });
  const tBrand = await getTranslations({ locale, namespace: "landing" });

  const title = `${t("rashiMetaTitle", { rashi: rashiName })} | ${tBrand("brand.name")}`;
  const description = t("rashiMetaDescription", { rashi: rashiName });

  return buildPageMetadata({
    locale,
    path: `weekly/${slug}`,
    title,
    description,
  });
}

export default async function WeeklyRashiPage({
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

  const t = await getTranslations({ locale, namespace: "weekly" });
  const rashiName = RASHIS[locale][rashiIndex]!;

  try {
    const data = await getWeeklyRashiHoroscopes(locale);
    const text = data.horoscopes[String(rashiIndex + 1)] ?? "";
    const headline = t("rashiMetaTitle", { rashi: rashiName });
    const description = t("rashiMetaDescription", { rashi: rashiName });

    return (
      <>
        <JsonLd
          data={[
            buildHoroscopeArticleJsonLd({
              locale,
              period: "weekly",
              slug,
              headline,
              description,
              periodLabel: data.weekLabel,
              articleBody: text,
            }),
            buildHoroscopeBreadcrumbJsonLd({
              locale,
              period: "weekly",
              periodListTitle: t("title"),
              rashiName,
              slug,
            }),
          ]}
        />
        <RashiHoroscopeDetailView
          locale={locale}
          period="weekly"
          rashiIndex={rashiIndex}
          periodLabel={data.weekLabel}
          horoscopes={data.horoscopes}
        />
      </>
    );
  } catch {
    notFound();
  }
}
