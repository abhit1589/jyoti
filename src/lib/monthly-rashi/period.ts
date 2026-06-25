import { DateTime } from "luxon";
import { HOROSCOPE_TZ, horoscopeNow } from "@/lib/rashi-horoscope/ist";

/** Month id in IST, e.g. 2026-06 */
export function getMonthId(date = horoscopeNow()): string {
  return date.toFormat("yyyy-MM");
}

export function formatMonthLabel(locale: string, date = horoscopeNow()): string {
  return date.setLocale(locale).toFormat("MMMM yyyy");
}

/** Seconds until the first moment of next month in IST. */
export function secondsUntilIstMonthEnd(date = horoscopeNow()): number {
  const next = date.plus({ months: 1 }).startOf("month");
  return Math.max(3600, Math.ceil(next.diff(date, "seconds").seconds));
}

export function monthStartInIst(monthId: string): DateTime {
  return DateTime.fromFormat(`${monthId}-01`, "yyyy-MM-dd", { zone: HOROSCOPE_TZ });
}
