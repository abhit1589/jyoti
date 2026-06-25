import { unstable_cache } from "next/cache";
import { getDayId, secondsUntilIstMidnight } from "@/lib/daily-rashi/period";
import { generateDailyRashiHoroscopes } from "@/lib/daily-rashi/generate";
import type { RashiHoroscopePayload } from "@/lib/rashi-horoscope/types";
import type { Locale } from "@/lib/types";

const cacheByKey = new Map<string, () => Promise<RashiHoroscopePayload>>();

function dailyLocaleCache(locale: Locale, dayId: string) {
  const key = `${locale}:${dayId}`;
  if (!cacheByKey.has(key)) {
    cacheByKey.set(
      key,
      unstable_cache(
        () => generateDailyRashiHoroscopes(locale),
        ["daily-rashi", locale, dayId],
        {
          revalidate: secondsUntilIstMidnight(),
          tags: [`daily-rashi-${dayId}-${locale}`],
        },
      ),
    );
  }
  return cacheByKey.get(key)!;
}

export async function getDailyRashiHoroscopes(locale: Locale): Promise<RashiHoroscopePayload> {
  const dayId = getDayId();
  return dailyLocaleCache(locale, dayId)();
}

export async function warmDailyRashiHoroscopes(locales: Locale[]): Promise<void> {
  for (const locale of locales) {
    await getDailyRashiHoroscopes(locale);
  }
}
