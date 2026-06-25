import { DateTime } from "luxon";

/** Julian day of Unix epoch (1970-01-01 00:00 UTC). */
export const JD_UNIX_EPOCH = 2440587.5;

export function todayInTimezone(timezone: string): string {
  return DateTime.now().setZone(timezone).toISODate() ?? new Date().toISOString().slice(0, 10);
}
