import { getTranslations } from "next-intl/server";
import { CheckoutView } from "@/components/legal/CheckoutView";
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
  const t = await getTranslations({ locale, namespace: "legal.checkout" });

  return buildPageMetadata({
    locale,
    path: "checkout",
    title: t("metaTitle"),
    description: t("metaDescription"),
  });
}

export default async function CheckoutPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ sku?: string; readings?: string }>;
}) {
  const { locale: localeParam } = await params;
  if (!isLocale(localeParam)) notFound();

  const { sku, readings } = await searchParams;

  return <CheckoutView skuParam={sku ?? null} readingsParam={readings ?? null} />;
}
