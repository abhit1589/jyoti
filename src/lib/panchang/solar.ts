import { DateTime } from "luxon";

const RAD = Math.PI / 180;
const J1970 = 2440588;
const J2000 = 2451545;
const J0 = 0.0009;
const OBLIQUITY = RAD * 23.4397;

function toJulian(date: Date): number {
  return date.getTime() / 86_400_000 - 0.5 + J1970;
}

function fromJulian(j: number): Date {
  return new Date((j + 0.5 - J1970) * 86_400_000);
}

function toDays(date: Date): number {
  return toJulian(date) - J2000;
}

/** Ecliptic longitude `l` (rad), ecliptic latitude `b` (rad) → declination. */
function declination(l: number, b: number): number {
  return Math.asin(Math.sin(b) * Math.cos(OBLIQUITY) + Math.cos(b) * Math.sin(OBLIQUITY) * Math.sin(l));
}

function solarMeanAnomaly(d: number): number {
  return RAD * (357.5291 + 0.98560028 * d);
}

function eclipticLongitude(m: number): number {
  const c = RAD * (1.9148 * Math.sin(m) + 0.02 * Math.sin(2 * m) + 0.0003 * Math.sin(3 * m));
  const p = RAD * 102.9372;
  return m + c + p + Math.PI;
}

function julianCycle(d: number, lw: number): number {
  return Math.round(d - J0 - lw / (2 * Math.PI));
}

function approxTransit(ht: number, lw: number, n: number): number {
  return J0 + (ht + lw) / (2 * Math.PI) + n;
}

function solarTransitJ(ds: number, m: number, l: number): number {
  return J2000 + ds + 0.0053 * Math.sin(m) - 0.0069 * Math.sin(2 * l);
}

function hourAngle(h: number, phi: number, dec: number): number {
  return Math.acos((Math.sin(h) - Math.sin(phi) * Math.sin(dec)) / (Math.cos(phi) * Math.cos(dec)));
}

function getSetJ(h: number, lw: number, phi: number, dec: number, n: number, m: number, l: number): number {
  const w = hourAngle(h, phi, dec);
  const a = approxTransit(w, lw, n);
  return solarTransitJ(a, m, l);
}

/** Upper-limb sunrise/sunset with standard atmospheric refraction (~−0.833°). */
export function getSunriseSunset(
  year: number,
  month: number,
  day: number,
  latitude: number,
  longitude: number,
  timezone: string,
): { sunrise: DateTime; sunset: DateTime } {
  const noon = DateTime.fromObject({ year, month, day, hour: 12 }, { zone: timezone })
    .toUTC()
    .toJSDate();
  const lw = RAD * -longitude;
  const phi = RAD * latitude;
  const d = toDays(noon);
  const n = julianCycle(d, lw);
  const ds = approxTransit(0, lw, n);
  const m = solarMeanAnomaly(ds);
  const l = eclipticLongitude(m);
  const dec = declination(l, 0);
  const jNoon = solarTransitJ(ds, m, l);
  const h = -0.833 * RAD;
  const jSet = getSetJ(h, lw, phi, dec, n, m, l);
  const jRise = jNoon - (jSet - jNoon);

  return {
    sunrise: DateTime.fromJSDate(fromJulian(jRise), { zone: "utc" }).setZone(timezone),
    sunset: DateTime.fromJSDate(fromJulian(jSet), { zone: "utc" }).setZone(timezone),
  };
}

export function addDaySegment(
  sunrise: DateTime,
  sunset: DateTime,
  segmentIndex: number,
): { start: DateTime; end: DateTime } {
  const dayMs = sunset.toMillis() - sunrise.toMillis();
  const segmentMs = dayMs / 8;
  const start = sunrise.plus({ milliseconds: segmentMs * segmentIndex });
  const end = start.plus({ milliseconds: segmentMs });
  return { start, end };
}
