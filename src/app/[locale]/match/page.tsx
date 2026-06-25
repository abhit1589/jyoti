import { getTranslations, setRequestLocale } from "next-intl/server";
import { AppNav } from "@/components/AppNav";
import { MatchSection } from "@/components/MatchSection";
import { SiteFooter } from "@/components/legal/SiteFooter";
import { Link } from "@/i18n/navigation";
import { JsonLd } from "@/components/seo/JsonLd";
import { isLocale } from "@/lib/i18n/locales";
import { buildPageMetadata, SITE_NAME, SITE_URL } from "@/lib/seo/metadata";
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
  const t = await getTranslations({ locale, namespace: "landing" });

  return buildPageMetadata({
    locale,
    path: "match",
    title: `${t("match.label")} | ${t("brand.name")}`,
    description: t("match.intro"),
  });
}

export default async function MatchPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: localeParam } = await params;
  if (!isLocale(localeParam)) notFound();

  const locale = localeParam as Locale;
  setRequestLocale(locale);
  const t = await getTranslations("landing");
  const tWeekly = await getTranslations("weekly");

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebApplication",
          name: t("match.label"),
          description: t("match.intro"),
          url: `${SITE_URL}/${locale}/match`,
          applicationCategory: "LifestyleApplication",
          operatingSystem: "Web",
          offers: { "@type": "Offer", price: "0", priceCurrency: "INR" },
          provider: { "@type": "Organization", name: SITE_NAME, url: SITE_URL },
        }}
      />
      <div className="taara-page min-h-screen">
        <AppNav />
        <MatchSection />
        <div className="taara-section !pt-0">
          <div className="taara-weekly-actions justify-center">
            <Link href="/" className="taara-btn-ghost">
              {tWeekly("backHome")}
            </Link>
            <Link href="/#chart" className="taara-btn-primary">
              {tWeekly("personalReading")}
            </Link>
          </div>
        </div>
        <SiteFooter disclaimer={t("match.disclaimer")} />
      </div>
    </>
  );
}
