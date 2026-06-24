import type { Locale } from "@/lib/types";
import { CITY_SEEDS } from "@/lib/vedic/indian-cities-data";

export interface IndianCity {
  id: string;
  name: Record<Locale, string>;
  latitude: number;
  longitude: number;
  timezone: string;
}

const IST = "Asia/Kolkata";

export const INDIAN_CITIES: IndianCity[] = CITY_SEEDS.map((seed) => ({
  ...seed,
  timezone: IST,
}));

const LOCALE_SORT: Record<Locale, string> = {
  en: "en-IN",
  hi: "hi-IN",
  mr: "mr-IN",
  kn: "kn-IN",
  te: "te-IN",
  ta: "ta-IN",
};

/** Cities sorted alphabetically by display name in the active locale. */
export function getCitiesForLocale(locale: Locale): IndianCity[] {
  const collator = new Intl.Collator(LOCALE_SORT[locale], { sensitivity: "base" });
  return [...INDIAN_CITIES].sort((a, b) =>
    collator.compare(a.name[locale], b.name[locale]),
  );
}

export function getCityById(id: string): IndianCity | undefined {
  return INDIAN_CITIES.find((c) => c.id === id);
}
