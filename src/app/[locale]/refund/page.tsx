import { getTranslations, setRequestLocale } from "next-intl/server";
import { PolicyPage } from "@/components/legal/PolicyPage";
import { PolicySections } from "@/components/legal/PolicySections";
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
  const t = await getTranslations({ locale, namespace: "legal.refund" });

  return buildPageMetadata({
    locale,
    path: "refund",
    title: t("metaTitle"),
    description: t("metaDescription"),
  });
}

export default async function RefundPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: localeParam } = await params;
  if (!isLocale(localeParam)) notFound();

  const locale = localeParam as Locale;
  setRequestLocale(locale);
  const t = await getTranslations("legal.refund");

  return (
    <PolicyPage title={t("title")} lastUpdated={t("lastUpdated")}>
      <PolicySections namespace="refund" />
    </PolicyPage>
  );
}
