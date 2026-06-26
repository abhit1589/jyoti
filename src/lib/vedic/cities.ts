import "server-only";

import type { Locale } from "@/lib/types";
import type { IndianPlace } from "@/lib/vedic/place-types";
import placesData from "@/lib/vedic/indian-places.json";
import { getPlaceById, searchPlaces } from "@/lib/vedic/places-server";

export type { IndianPlace as IndianCity, PlaceSearchResult } from "@/lib/vedic/place-types";
export { getPlaceById as getCityById, searchPlaces };

const LOCALE_SORT: Record<Locale, string> = {
  en: "en-IN",
  hi: "hi-IN",
  mr: "mr-IN",
  kn: "kn-IN",
  te: "te-IN",
  ta: "ta-IN",
};

/** @deprecated Use searchPlaces via API on the client. Server-side listing only. */
export function getCitiesForLocale(locale: Locale): IndianPlace[] {
  const collator = new Intl.Collator(LOCALE_SORT[locale], { sensitivity: "base" });
  return [...(placesData as IndianPlace[])].sort((a, b) =>
    collator.compare(a.name[locale] || a.name.en, b.name[locale] || b.name.en),
  );
}
