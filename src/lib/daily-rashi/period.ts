import { DateTime } from "luxon";
import { horoscopeNow } from "@/lib/rashi-horoscope/ist";

/** Calendar day in IST, e.g. 2026-06-25 */
export function getDayId(date = horoscopeNow()): string {
  return date.toISODate()!;
}

export function formatDayLabel(locale: string, date = horoscopeNow()): string {
  return date.setLocale(locale).toLocaleString(DateTime.DATE_FULL);
}

/** Seconds until IST midnight — for daily cache expiry. */
export function secondsUntilIstMidnight(date = horoscopeNow()): number {
  const next = date.plus({ days: 1 }).startOf("day");
  return Math.max(60, Math.ceil(next.diff(date, "seconds").seconds));
}
