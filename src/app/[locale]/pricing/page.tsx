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
  const tServices = await getTranslations("legal.services");
  const catalog = getServiceCatalog();

  return (
    <PolicyPage title={t("title")}>
      <p className="taara-intro mx-auto max-w-2xl text-center mb-8">{t("intro")}</p>

      <div className="taara-pricing-table-wrap">
        <table className="taara-pricing-table">
          <thead>
            <tr>
              <th>{t("columnService")}</th>
              <th>{t("columnPrice")}</th>
              <th>{t("columnAction")}</th>
            </tr>
          </thead>
          <tbody>
            {catalog.map((service) => (
              <tr key={service.id}>
                <td>
                  <strong>{tServices(`items.${service.id}.name`)}</strong>
                  <p className="taara-pricing-desc">{tServices(`items.${service.id}.description`)}</p>
                </td>
                <td>{service.free ? tServices("freeBadge") : formatInr(service.pricePaise)}</td>
                <td>
                  {service.free ? (
                    <Link
                      href={
                        service.id === "kundali-match"
                          ? "/match"
                          : service.id === "horoscope-forecasts"
                            ? "/daily"
                            : "/#chart"
                      }
                      className="taara-btn-ghost taara-pricing-btn"
                    >
                      {t("getStarted")}
                    </Link>
                  ) : (
                    <Link href={service.checkoutPath!} className="taara-btn-primary taara-pricing-btn">
                      {t("buyNow")}
                    </Link>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="taara-legal-muted text-sm text-center mt-8 max-w-xl mx-auto">{t("freeNote")}</p>
      <p className="taara-legal-muted text-sm text-center mt-2 max-w-xl mx-auto">{t("checkoutNote")}</p>
    </PolicyPage>
  );
}
