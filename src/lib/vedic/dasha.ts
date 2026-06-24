import { DateTime } from "luxon";
import type { PlanetId, VedicChart } from "@/lib/types";
import { DASHA_SEQUENCE, DASHA_YEARS } from "@/lib/vedic/constants";

function addYears(date: DateTime, years: number): DateTime {
  const wholeYears = Math.floor(years);
  const fractionalDays = (years - wholeYears) * 365.25;
  return date.plus({ years: wholeYears, days: Math.round(fractionalDays) });
}

function subtractYears(date: DateTime, years: number): DateTime {
  const wholeYears = Math.floor(years);
  const fractionalDays = (years - wholeYears) * 365.25;
  return date.minus({ years: wholeYears, days: Math.round(fractionalDays) });
}

export interface CurrentDashaInfo {
  mahadasha: {
    lord: PlanetId;
    startDate: string;
    endDate: string;
  };
  antardasha: {
    lord: PlanetId;
    startDate: string;
    endDate: string;
  };
}

export function getCurrentDashaPeriods(chart: VedicChart): CurrentDashaInfo | null {
  const maha = chart.vimshottari.periods.find((p) => p.isCurrent);
  if (!maha) return null;

  const mahaEnd = DateTime.fromISO(maha.endDate, { zone: "utc" });
  const trueMahaStart = subtractYears(mahaEnd, DASHA_YEARS[maha.lord]);
  const now = DateTime.utc();
  const startIdx = DASHA_SEQUENCE.indexOf(maha.lord);

  let cursor = trueMahaStart;
  let currentAntardasha: CurrentDashaInfo["antardasha"] | null = null;

  for (let i = 0; i < 9; i++) {
    const lord = DASHA_SEQUENCE[(startIdx + i) % 9];
    const years = (DASHA_YEARS[maha.lord] * DASHA_YEARS[lord]) / 120;
    const end = addYears(cursor, years);

    if (now >= cursor && now < end) {
      currentAntardasha = {
        lord,
        startDate: cursor.toISODate() ?? "",
        endDate: end.toISODate() ?? "",
      };
      break;
    }

    cursor = end;
  }

  if (!currentAntardasha) {
    const lastLord = DASHA_SEQUENCE[(startIdx + 8) % 9];
    const lastYears = (DASHA_YEARS[maha.lord] * DASHA_YEARS[lastLord]) / 120;
    const lastStart = subtractYears(mahaEnd, lastYears);
    currentAntardasha = {
      lord: lastLord,
      startDate: lastStart.toISODate() ?? "",
      endDate: maha.endDate,
    };
  }

  return {
    mahadasha: {
      lord: maha.lord,
      startDate: maha.startDate,
      endDate: maha.endDate,
    },
    antardasha: currentAntardasha,
  };
}
