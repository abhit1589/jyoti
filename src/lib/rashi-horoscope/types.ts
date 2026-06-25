export interface RashiHoroscopePayload {
  periodId: string;
  periodLabel: string;
  generatedAt: string;
  horoscopes: Record<string, string>;
}

export type HoroscopePeriod = "daily" | "weekly" | "monthly";
