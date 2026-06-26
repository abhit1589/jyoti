import type { Locale } from "@/lib/types";

export interface IndianPlace {
  id: string;
  name: Record<Locale, string>;
  latitude: number;
  longitude: number;
  timezone: string;
  state?: string;
  population?: number;
}

export interface PlaceSearchResult {
  id: string;
  label: string;
  state?: string;
  latitude: number;
  longitude: number;
  timezone: string;
}
