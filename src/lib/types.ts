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
  locale?: Locale;
}

export interface ReadingTeaser {
  personality: string;
  career: string;
  dasha: string;
}

export interface ChartResponse {
  chart: VedicChart;
  teaser: ReadingTeaser | null;
}

export type ReadingFocus = "personality" | "career" | "dasha";

export interface InterpretRequest {
  chart: VedicChart;
  locale: Locale;
  readingType: "brief" | "detailed";
  focus?: ReadingFocus;
  stream?: boolean;
}

export type QaMessage = {
  role: "user" | "assistant";
  content: string;
};

export interface QaRequest {
  chart: VedicChart;
  locale: Locale;
  messages: QaMessage[];
}

export interface MatchRequest {
  person1: BirthInput;
  person2: BirthInput;
  locale: Locale;
}

export interface MatchReportRequest {
  person1Chart: VedicChart;
  person2Chart: VedicChart;
  locale: Locale;
}

export interface MatchQaRequest {
  person1Chart: VedicChart;
  person2Chart: VedicChart;
  locale: Locale;
  messages: QaMessage[];
}
