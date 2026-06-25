import { DateTime } from "luxon";
import type SwissEph from "swisseph-wasm";
import { getSwe } from "@/lib/ephemeris/swe";
import { getCityById } from "@/lib/vedic/cities";
import { NAKSHATRAS } from "@/lib/vedic/constants";
import {
  getKaranaName,
  getMoonRashiName,
  getPakshaLabel,
  getTithiName,
  getVaraName,
  getYogaName,
  GULIKA_SEGMENT,
  RAHU_SEGMENT,
  YAMA_SEGMENT,
} from "@/lib/panchang/labels";
import { addDaySegment, getSunriseSunset } from "@/lib/panchang/solar";
import { JD_UNIX_EPOCH } from "@/lib/panchang/date";
import type { PanchangAnga, PanchangResult } from "@/lib/panchang/types";
import type { Locale } from "@/lib/types";

const NAKSHATRA_SPAN = 360 / 27;
const TITHI_SPAN = 12;
const KARANA_SPAN = 6;
const YOGA_SPAN = 360 / 27;
const BOUNDARY_ITERATIONS = 28;

function normalizeDegrees(deg: number): number {
  const n = deg % 360;
  return n < 0 ? n + 360 : n;
}

function jdFromUtc(dt: DateTime, swe: SwissEph): number {
  const utc = dt.toUTC();
  return swe.julday(
    utc.year,
    utc.month,
    utc.day,
    utc.hour + utc.minute / 60 + utc.second / 3600,
  );
}

function formatTime(dt: DateTime): string {
  if (!dt.isValid) return "";
  return dt.toFormat("HH:mm");
}

function endTimeFromJd(jd: number | null, timezone: string): string | null {
  if (jd == null || !Number.isFinite(jd)) return null;
  const dt = DateTime.fromMillis((jd - JD_UNIX_EPOCH) * 86_400_000, { zone: "utc" });
  if (!dt.isValid) return null;
  const formatted = formatTime(dt.setZone(timezone));
  return formatted || null;
}

type LongitudeReader = {
  elongation: (jd: number) => number;
  moon: (jd: number) => number;
  yoga: (jd: number) => number;
};

function createLongitudeReader(swe: SwissEph): LongitudeReader {
  const flags = swe.SEFLG_SWIEPH | swe.SEFLG_SIDEREAL;

  function at(jd: number) {
    const sun = normalizeDegrees(swe.calc_ut(jd, swe.SE_SUN, flags)[0]);
    const moon = normalizeDegrees(swe.calc_ut(jd, swe.SE_MOON, flags)[0]);
    return { sun, moon };
  }

  return {
    elongation(jd) {
      const { sun, moon } = at(jd);
      return normalizeDegrees(moon - sun);
    },
    moon(jd) {
      return at(jd).moon;
    },
    yoga(jd) {
      const { sun, moon } = at(jd);
      return normalizeDegrees(sun + moon);
    },
  };
}

function findBoundaryJd(
  startJd: number,
  targetValue: number,
  measure: (jd: number) => number,
  maxHours = 30,
): number | null {
  let low = startJd;
  let high = startJd + maxHours / 24;
  const startVal = measure(startJd);
  let wrappedTarget = targetValue;
  if (wrappedTarget <= startVal) wrappedTarget += 360;

  for (let i = 0; i < BOUNDARY_ITERATIONS; i++) {
    const mid = (low + high) / 2;
    let val = measure(mid);
    if (val < startVal) val += 360;
    if (val < wrappedTarget) low = mid;
    else high = mid;
  }

  const boundaryJd = (low + high) / 2;
  if (!Number.isFinite(boundaryJd) || boundaryJd <= startJd) return null;
  return boundaryJd;
}

function findElongationBoundary(reader: LongitudeReader, startJd: number, elongation: number): number | null {
  const currentTithi = Math.floor(elongation / TITHI_SPAN);
  const target = (currentTithi + 1) * TITHI_SPAN;
  return findBoundaryJd(startJd, target >= 360 ? 360 : target, reader.elongation);
}

function findMoonBoundary(reader: LongitudeReader, startJd: number, moon: number): number | null {
  const current = Math.floor(moon / NAKSHATRA_SPAN);
  const target = (current + 1) * NAKSHATRA_SPAN;
  return findBoundaryJd(startJd, target >= 360 ? 360 : target, reader.moon);
}

function findYogaBoundary(reader: LongitudeReader, startJd: number, sun: number, moon: number): number | null {
  const yogaLon = normalizeDegrees(sun + moon);
  const current = Math.floor(yogaLon / YOGA_SPAN);
  const target = (current + 1) * YOGA_SPAN;
  return findBoundaryJd(startJd, target >= 360 ? 360 : target, reader.yoga);
}

function findKaranaBoundary(reader: LongitudeReader, startJd: number, elongation: number): number | null {
  const current = Math.floor(elongation / KARANA_SPAN);
  const target = (current + 1) * KARANA_SPAN;
  return findBoundaryJd(startJd, target >= 360 ? 360 : target, reader.elongation);
}

function getTithiIndex(elongation: number): number {
  return Math.floor(elongation / TITHI_SPAN) + 1;
}

function getNakshatraIndex(moon: number): number {
  return Math.floor(moon / NAKSHATRA_SPAN) + 1;
}

function getYogaIndex(sun: number, moon: number): number {
  return Math.floor(normalizeDegrees(sun + moon) / YOGA_SPAN) + 1;
}

function getKaranaIndex(elongation: number): number {
  const halfTithi = Math.floor(elongation / KARANA_SPAN);
  if (halfTithi === 0) return 1;
  if (halfTithi >= 57) return halfTithi - 57 + 9;
  return ((halfTithi - 1) % 7) + 2;
}

function getPaksha(tithi: number): "shukla" | "krishna" {
  return tithi <= 15 ? "shukla" : "krishna";
}

function buildAnga(index: number, name: string, endsAt: string | null): PanchangAnga {
  return { index, name, endsAt };
}

export async function calculatePanchang(
  date: string,
  cityId: string,
  locale: Locale,
): Promise<PanchangResult> {
  const city = getCityById(cityId) ?? getCityById("hyderabad");
  if (!city) {
    throw new Error("Unknown city");
  }

  const [year, month, day] = date.split("-").map(Number);
  if (!year || !month || !day) {
    throw new Error("Invalid date");
  }

  const { sunrise, sunset } = getSunriseSunset(
    year,
    month,
    day,
    city.latitude,
    city.longitude,
    city.timezone,
  );

  if (!sunrise.isValid || !sunset.isValid) {
    throw new Error("Could not compute sunrise for this location");
  }

  const swe = await getSwe();
  swe.set_sid_mode(swe.SE_SIDM_LAHIRI, 0, 0);
  const reader = createLongitudeReader(swe);

  const sunriseJd = jdFromUtc(sunrise, swe);
  const flags = swe.SEFLG_SWIEPH | swe.SEFLG_SIDEREAL;
  const sun = normalizeDegrees(swe.calc_ut(sunriseJd, swe.SE_SUN, flags)[0]);
  const moon = normalizeDegrees(swe.calc_ut(sunriseJd, swe.SE_MOON, flags)[0]);
  const elongation = normalizeDegrees(moon - sun);

  const tithiIndex = getTithiIndex(elongation);
  const nakshatraIndex = getNakshatraIndex(moon);
  const yogaIndex = getYogaIndex(sun, moon);
  const karanaIndex = getKaranaIndex(elongation);
  const paksha = getPaksha(tithiIndex);
  const moonRashi = Math.floor(moon / 30) + 1;
  const weekday = sunrise.weekday % 7;

  const tithiEndJd = findElongationBoundary(reader, sunriseJd, elongation);
  const nakshatraEndJd = findMoonBoundary(reader, sunriseJd, moon);
  const yogaEndJd = findYogaBoundary(reader, sunriseJd, sun, moon);
  const karanaEndJd = findKaranaBoundary(reader, sunriseJd, elongation);

  const rahu = addDaySegment(sunrise, sunset, RAHU_SEGMENT[weekday]);
  const yama = addDaySegment(sunrise, sunset, YAMA_SEGMENT[weekday]);
  const gulika = addDaySegment(sunrise, sunset, GULIKA_SEGMENT[weekday]);

  return {
    date,
    cityId: city.id,
    cityName: city.name[locale],
    timezone: city.timezone,
    computedAt: new Date().toISOString(),
    paksha,
    pakshaLabel: getPakshaLabel(locale, paksha),
    moonRashi,
    moonRashiName: getMoonRashiName(locale, moonRashi),
    vara: buildAnga(weekday + 1, getVaraName(locale, weekday), null),
    tithi: buildAnga(tithiIndex, getTithiName(locale, tithiIndex), endTimeFromJd(tithiEndJd, city.timezone)),
    nakshatra: buildAnga(
      nakshatraIndex,
      NAKSHATRAS[locale][nakshatraIndex - 1],
      endTimeFromJd(nakshatraEndJd, city.timezone),
    ),
    yoga: buildAnga(yogaIndex, getYogaName(locale, yogaIndex), endTimeFromJd(yogaEndJd, city.timezone)),
    karana: buildAnga(karanaIndex, getKaranaName(locale, karanaIndex), endTimeFromJd(karanaEndJd, city.timezone)),
    timings: {
      sunrise: formatTime(sunrise),
      sunset: formatTime(sunset),
      rahukaal: { start: formatTime(rahu.start), end: formatTime(rahu.end) },
      yamagandam: { start: formatTime(yama.start), end: formatTime(yama.end) },
      gulika: { start: formatTime(gulika.start), end: formatTime(gulika.end) },
    },
  };
}

export { todayInTimezone } from "@/lib/panchang/date";
