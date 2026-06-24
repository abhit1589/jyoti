import { getTranslations } from "next-intl/server";

export default async function WeeklyLoading() {
  const t = await getTranslations("weekly");

  return (
    <div className="taara-page min-h-screen">
      <div className="taara-weekly-main text-center">
        <p className="taara-eyebrow">{t("badge")}</p>
        <h1 className="taara-heading">{t("title")}</h1>
        <p className="taara-intro mx-auto max-w-md animate-pulse">{t("loading")}</p>
      </div>
    </div>
  );
}
