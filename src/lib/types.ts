export type Locale = "en" | "hi" | "te" | "ta" | "mr" | "kn";

export type PlanetId =
  | "sun"
  | "moon"
  | "mars"
  | "mercury"
  | "jupiter"
  | "venus"
  | "saturn"
  | "rahu"
  | "ketu";

export interface PlanetPosition {
  id: PlanetId;
  longitude: number;
  rashi: number;
  rashiDegree: number;
  nakshatra: number;
  pada: number;
  house: number;
  retrograde: boolean;
}

export interface DashaPeriod {
  lord: PlanetId;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
}

export interface VedicChart {
  birth: {
    date: string;
    time: string;
    timezone: string;
    latitude: number;
    longitude: number;
    placeName?: string;
  };
  ayanamsa: number;
  lagna: {
    longitude: number;
    rashi: number;
    rashiDegree: number;
    nakshatra: number;
    pada: number;
  };
  planets: PlanetPosition[];
  houses: Record<number, PlanetId[]>;
  vimshottari: {
    birthLord: PlanetId;
    balanceYears: number;
    periods: DashaPeriod[];
  };
  calculatedAt: string;
}

export interface BirthInput {
  name?: string;
  date: string;
  time: string;
  timezone: string;
  latitude: number;
  longitude: number;
  placeName?: string;
}

export type ReadingFocus = "personality" | "career" | "dasha";

export interface InterpretRequest {
  chart: VedicChart;
  locale: Locale;
  readingType: "brief" | "detailed";
  focus?: ReadingFocus;
  stream?: boolean;
}
