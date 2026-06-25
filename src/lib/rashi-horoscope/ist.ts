import { DateTime } from "luxon";

export const HOROSCOPE_TZ = "Asia/Kolkata";

export function horoscopeNow(): DateTime {
  return DateTime.now().setZone(HOROSCOPE_TZ);
}
