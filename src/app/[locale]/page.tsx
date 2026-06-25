import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { LandingPage } from "@/components/landing/LandingPage";
import { JsonLd } from "@/components/seo/JsonLd";
import { isLocale } from "@/lib/i18n/locales";
import { buildPageMetadata, SITE_NAME, SITE_URL } from "@/lib/seo/metadata";
import type { Locale } from "@/lib/types";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: localeParam } = await params;
  if (!isLocale(localeParam)) return {};

  const locale = localeParam as Locale;
  const t = await getTranslations({ locale });

  return buildPageMetadata({
    locale,
    path: "",
    title: t("meta.title"),
    description: t("meta.description"),
  });
}

export default async function Page({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: localeParam } = await params;
  if (!isLocale(localeParam)) notFound();

  setRequestLocale(localeParam);

  return (
    <>
      <JsonLd
        data={[
          {
            "@context": "https://schema.org",
            "@type": "WebSite",
            name: SITE_NAME,
            url: `${SITE_URL}/${localeParam}`,
            inLanguage: localeParam,
            description: "Free Vedic birth charts and Jyotish readings in six Indian languages.",
          },
          {
            "@context": "https://schema.org",
            "@type": "Organization",
            name: SITE_NAME,
            url: SITE_URL,
            logo: `${SITE_URL}/icon/512`,
          },
        ]}
      />
      <LandingPage />
    </>
  );
}
