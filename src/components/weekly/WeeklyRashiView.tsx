import { getTranslations } from "next-intl/server";
import { RashiHoroscopeView } from "@/components/weekly/RashiHoroscopeView";
import type { WeeklyRashiPayload } from "@/lib/weekly-rashi/generate";
import type { Locale } from "@/lib/types";

interface WeeklyRashiViewProps {
  locale: Locale;
  data: WeeklyRashiPayload;
}

export async function WeeklyRashiView({ locale, data }: WeeklyRashiViewProps) {
  const t = await getTranslations("weekly");

  return (
    <RashiHoroscopeView
      locale={locale}
      period="weekly"
      periodLine={t("weekOf", { range: data.weekLabel })}
      horoscopes={data.horoscopes}
    />
  );
}
