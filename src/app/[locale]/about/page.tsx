import { getTranslations, setRequestLocale } from "next-intl/server";
import { PolicyPage } from "@/components/legal/PolicyPage";
import { BusinessVerificationBlock } from "@/components/legal/BusinessVerificationBlock";
import { ProseBlock } from "@/components/legal/PolicySections";
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
  const t = await getTranslations({ locale, namespace: "legal.about" });

  return buildPageMetadata({
    locale,
    path: "about",
    title: t("metaTitle"),
    description: t("metaDescription"),
  });
}

export default async function AboutPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: localeParam } = await params;
  if (!isLocale(localeParam)) notFound();

  const locale = localeParam as Locale;
  setRequestLocale(locale);
  const t = await getTranslations("legal.about");

  return (
    <PolicyPage title={t("title")}>
      <ProseBlock>
        <p>{t("intro")}</p>
        <BusinessVerificationBlock />
        <section className="taara-legal-section">
          <h2>{t("missionTitle")}</h2>
          <p>{t("missionBody")}</p>
        </section>
      </ProseBlock>
    </PolicyPage>
  );
}
