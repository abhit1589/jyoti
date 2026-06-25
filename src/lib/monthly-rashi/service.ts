import { unstable_cache } from "next/cache";
import { getMonthId, secondsUntilIstMonthEnd } from "@/lib/monthly-rashi/period";
import { generateMonthlyRashiHoroscopes } from "@/lib/monthly-rashi/generate";
import type { RashiHoroscopePayload } from "@/lib/rashi-horoscope/types";
import type { Locale } from "@/lib/types";

export async function getMonthlyRashiHoroscopes(locale: Locale): Promise<RashiHoroscopePayload> {
  const monthId = getMonthId();

  const cached = unstable_cache(
    () => generateMonthlyRashiHoroscopes(locale),
    ["monthly-rashi", locale, monthId],
    {
      revalidate: secondsUntilIstMonthEnd(),
      tags: [`monthly-rashi-${monthId}-${locale}`],
    },
  );

  return cached();
}

export async function warmMonthlyRashiHoroscopes(locales: Locale[]): Promise<void> {
  await Promise.all(locales.map((locale) => getMonthlyRashiHoroscopes(locale)));
}
