import { getTranslations, setRequestLocale } from "next-intl/server";
import { AppNav } from "@/components/AppNav";
import { Link } from "@/i18n/navigation";
import { isLocale } from "@/lib/i18n/locales";
import { getWeeklyRashiHoroscopes } from "@/lib/weekly-rashi/service";
import { WeeklyRashiView } from "@/components/weekly/WeeklyRashiView";
import { notFound } from "next/navigation";

export const maxDuration = 60;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = await getTranslations({ locale, namespace: "weekly" });
  return {
    title: `Taaraa — ${t("title")}`,
    description: t("subtitle"),
  };
}

export default async function WeeklyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: localeParam } = await params;
  if (!isLocale(localeParam)) notFound();

  setRequestLocale(localeParam);
  const t = await getTranslations("weekly");

  try {
    const data = await getWeeklyRashiHoroscopes(localeParam);
    return <WeeklyRashiView locale={localeParam} data={data} />;
  } catch {
    return (
      <div className="taara-page min-h-screen">
        <AppNav />
        <main className="taara-weekly-main text-center">
          <h1 className="taara-heading">{t("errorTitle")}</h1>
          <p className="taara-intro mx-auto max-w-md">{t("error")}</p>
          <div className="taara-weekly-actions justify-center">
            <Link href="/weekly" className="taara-btn-primary">
              {t("retry")}
            </Link>
            <Link href="/" className="taara-btn-ghost">
              {t("backHome")}
            </Link>
          </div>
        </main>
      </div>
    );
  }
}
