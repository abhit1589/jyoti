import type { Locale } from "@/lib/types";

export interface PanchangInput {
  date: string;
  cityId: string;
  locale: Locale;
}

export interface PanchangAnga {
  index: number;
  name: string;
  endsAt: string | null;
}

export interface PanchangTimings {
  sunrise: string;
  sunset: string;
  rahukaal: { start: string; end: string };
  yamagandam: { start: string; end: string };
  gulika: { start: string; end: string };
}

export interface PanchangResult {
  date: string;
  cityId: string;
  cityName: string;
  timezone: string;
  computedAt: string;
  paksha: "shukla" | "krishna";
  pakshaLabel: string;
  moonRashi: number;
  moonRashiName: string;
  vara: PanchangAnga;
  tithi: PanchangAnga;
  nakshatra: PanchangAnga;
  yoga: PanchangAnga;
  karana: PanchangAnga;
  timings: PanchangTimings;
}
