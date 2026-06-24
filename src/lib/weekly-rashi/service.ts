import { unstable_cache } from "next/cache";
import { generateWeeklyRashiHoroscopes, type WeeklyRashiPayload } from "@/lib/weekly-rashi/generate";
import { getIsoWeekId } from "@/lib/weekly-rashi/week";
import type { Locale } from "@/lib/types";

const WEEK_SECONDS = 60 * 60 * 24 * 7;

export async function getWeeklyRashiHoroscopes(locale: Locale): Promise<WeeklyRashiPayload> {
  const weekId = getIsoWeekId();

  const cached = unstable_cache(
    () => generateWeeklyRashiHoroscopes(locale),
    ["weekly-rashi", locale, weekId],
    { revalidate: WEEK_SECONDS, tags: [`weekly-rashi-${weekId}-${locale}`] },
  );

  return cached();
}

export async function warmWeeklyRashiHoroscopes(locales: Locale[]): Promise<void> {
  await Promise.all(locales.map((locale) => getWeeklyRashiHoroscopes(locale)));
}
