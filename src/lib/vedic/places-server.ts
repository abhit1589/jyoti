import "server-only";

import type { Locale } from "@/lib/types";
import type { IndianPlace, PlaceSearchResult } from "@/lib/vedic/place-types";
import placesData from "@/lib/vedic/indian-places.json";

const PLACES = placesData as IndianPlace[];
const BY_ID = new Map(PLACES.map((p) => [p.id, p]));

function normalizeQuery(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "");
}

function placeLabel(place: IndianPlace, locale: Locale): string {
  return place.name[locale] || place.name.en;
}

function scorePlace(place: IndianPlace, locale: Locale, query: string): number {
  const label = normalizeQuery(placeLabel(place, locale));
  const state = normalizeQuery(place.state ?? "");
  const id = normalizeQuery(place.id.replace(/-/g, " "));

  if (!query) return 0;
  if (label === query) return 1000;
  if (label.startsWith(query)) return 800 + (place.population ?? 0) / 1_000_000;
  if (state.startsWith(query)) return 600;
  if (id.startsWith(query)) return 550;

  const words = label.split(/\s+/);
  if (words.some((w) => w.startsWith(query))) return 500 + (place.population ?? 0) / 2_000_000;

  if (label.includes(query)) return 300 + (place.population ?? 0) / 5_000_000;
  if (state.includes(query)) return 200;
  if (id.includes(query)) return 150;

  return 0;
}

export function getPlaceById(id: string): IndianPlace | undefined {
  return BY_ID.get(id);
}

export function searchPlaces(
  query: string,
  locale: Locale,
  limit = 12,
): PlaceSearchResult[] {
  const normalized = normalizeQuery(query);
  if (normalized.length < 1) {
    return PLACES.slice(0, limit).map((place) => toSearchResult(place, locale));
  }

  const ranked: { place: IndianPlace; score: number }[] = [];
  for (const place of PLACES) {
    const score = scorePlace(place, locale, normalized);
    if (score > 0) ranked.push({ place, score });
  }

  ranked.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return (b.place.population ?? 0) - (a.place.population ?? 0);
  });

  return ranked.slice(0, limit).map(({ place }) => toSearchResult(place, locale));
}

function toSearchResult(place: IndianPlace, locale: Locale): PlaceSearchResult {
  return {
    id: place.id,
    label: placeLabel(place, locale),
    state: place.state,
    latitude: place.latitude,
    longitude: place.longitude,
    timezone: place.timezone,
  };
}
