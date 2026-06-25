import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { PolicyPage } from "@/components/legal/PolicyPage";
import { formatInr, getServiceCatalog } from "@/lib/business/services";
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
  const t = await getTranslations({ locale, namespace: "legal.services" });

  return buildPageMetadata({
    locale,
    path: "services",
    title: t("metaTitle"),
    description: t("metaDescription"),
  });
}

export default async function ServicesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: localeParam } = await params;
  if (!isLocale(localeParam)) notFound();

  const locale = localeParam as Locale;
  setRequestLocale(locale);
  const t = await getTranslations("legal.services");
  const tPricing = await getTranslations("legal.pricing");
  const catalog = getServiceCatalog();

  return (
    <PolicyPage title={t("title")}>
      <p className="taara-intro mx-auto max-w-2xl text-center mb-10">{t("intro")}</p>
      <ul className="taara-services-list">
        {catalog.map((service) => (
          <li key={service.id} className="taara-legal-card">
            <div className="taara-services-list-head">
              <h2>{t(`items.${service.id}.name`)}</h2>
              <span className={service.free ? "taara-badge-free" : "taara-badge-paid"}>
                {service.free ? t("freeBadge") : t("paidBadge")}
              </span>
            </div>
            <p>{t(`items.${service.id}.description`)}</p>
            {!service.free ? (
              <div className="taara-services-list-actions">
                <p className="taara-services-price">{formatInr(service.pricePaise)}</p>
                <Link href={service.checkoutPath!} className="taara-btn-primary taara-pricing-btn">
                  {tPricing("buyNow")}
                </Link>
              </div>
            ) : null}
          </li>
        ))}
      </ul>
    </PolicyPage>
  );
}
