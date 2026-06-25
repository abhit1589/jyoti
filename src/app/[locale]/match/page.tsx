import { getTranslations, setRequestLocale } from "next-intl/server";
import { AppNav } from "@/components/AppNav";
import { MatchSection } from "@/components/MatchSection";
import { Link } from "@/i18n/navigation";
import { isLocale } from "@/lib/i18n/locales";
import { notFound } from "next/navigation";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = await getTranslations({ locale, namespace: "landing" });
  return {
    title: `${t("brand.name")} — ${t("match.label")}`,
    description: t("match.intro"),
  };
}

export default async function MatchPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: localeParam } = await params;
  if (!isLocale(localeParam)) notFound();

  setRequestLocale(localeParam);
  const t = await getTranslations("landing");
  const tWeekly = await getTranslations("weekly");
  const brandNative = t("brand.native");

  return (
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
      <footer className="taara-footer">
        <span className="taara-footer-logo">
          {brandNative ? (
            <span className="taara-logo-stack taara-logo-stack-center">
              <span className="taara-logo-primary">{brandNative}</span>
              <span className="taara-logo-sub">{t("brand.name")}</span>
            </span>
          ) : (
            t("brand.name")
          )}
        </span>
        <p className="taara-footer-domain">{t("brand.domain")}</p>
        <p>{t("footer.tagline")}</p>
        <p className="taara-footer-disclaimer">{t("match.disclaimer")}</p>
      </footer>
    </div>
  );
}
