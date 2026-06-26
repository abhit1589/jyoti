import { getTranslations, setRequestLocale } from "next-intl/server";
import { PolicyPage } from "@/components/legal/PolicyPage";
import { PricingTable } from "@/components/pricing/PricingTable";
import { getReadingPricing, getServiceCatalog } from "@/lib/business/services";
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
  const t = await getTranslations({ locale, namespace: "legal.pricing" });

  return buildPageMetadata({
    locale,
    path: "pricing",
    title: t("metaTitle"),
    description: t("metaDescription"),
  });
}

export default async function PricingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: localeParam } = await params;
  if (!isLocale(localeParam)) notFound();

  const locale = localeParam as Locale;
  setRequestLocale(locale);
  const t = await getTranslations("legal.pricing");
  const catalog = getServiceCatalog();
  const readingPricing = getReadingPricing();

  return (
    <PolicyPage title={t("title")}>
      <p className="taara-intro mx-auto max-w-2xl text-center mb-8">{t("intro")}</p>

      <PricingTable
        catalog={catalog}
        singlePricePaise={readingPricing.singlePaise}
        bundlePricePaise={readingPricing.bundlePaise}
      />

      <p className="taara-legal-muted text-sm text-center mt-8 max-w-xl mx-auto">{t("freeNote")}</p>
      <p className="taara-legal-muted text-sm text-center mt-2 max-w-xl mx-auto">{t("checkoutNote")}</p>
    </PolicyPage>
  );
}
