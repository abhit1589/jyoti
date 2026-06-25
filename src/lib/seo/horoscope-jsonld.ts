import { RASHIS } from "@/lib/vedic/constants";
import { absoluteUrl, SITE_NAME, SITE_URL } from "@/lib/seo/metadata";
import { RASHI_SLUGS } from "@/lib/seo/rashi-slugs";
import type { HoroscopePeriod } from "@/lib/rashi-horoscope/types";
import type { Locale } from "@/lib/types";

export function buildHoroscopeCollectionJsonLd({
  locale,
  period,
  title,
  description,
}: {
  locale: Locale;
  period: HoroscopePeriod;
  title: string;
  description: string;
}) {
  const rashis = RASHIS[locale];
  const pageUrl = absoluteUrl(locale, period);

  return [
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: title,
      description,
      url: pageUrl,
      inLanguage: locale,
      isPartOf: { "@type": "WebSite", name: SITE_NAME, url: SITE_URL },
    },
    {
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: title,
      numberOfItems: 12,
      itemListElement: RASHI_SLUGS.map((slug, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: rashis[index],
        url: absoluteUrl(locale, `${period}/${slug}`),
      })),
    },
  ];
}

export function buildHoroscopeArticleJsonLd({
  locale,
  period,
  slug,
  headline,
  description,
  periodLabel,
  articleBody,
}: {
  locale: Locale;
  period: HoroscopePeriod;
  slug: string;
  headline: string;
  description: string;
  periodLabel: string;
  articleBody: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline,
    description,
    url: absoluteUrl(locale, `${period}/${slug}`),
    dateModified: periodLabel,
    author: { "@type": "Organization", name: SITE_NAME },
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      url: SITE_URL,
    },
    articleBody,
    inLanguage: locale,
  };
}

export function buildHoroscopeBreadcrumbJsonLd({
  locale,
  period,
  periodListTitle,
  rashiName,
  slug,
}: {
  locale: Locale;
  period: HoroscopePeriod;
  periodListTitle: string;
  rashiName: string;
  slug: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: SITE_NAME,
        item: absoluteUrl(locale),
      },
      {
        "@type": "ListItem",
        position: 2,
        name: periodListTitle,
        item: absoluteUrl(locale, period),
      },
      {
        "@type": "ListItem",
        position: 3,
        name: rashiName,
        item: absoluteUrl(locale, `${period}/${slug}`),
      },
    ],
  };
}
