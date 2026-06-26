import SwissEph from "swisseph-wasm";
import { DateTime } from "luxon";
import { getSunriseSunset, JD_UNIX_EPOCH } from "../src/lib/panchang/solar.ts";

const swe = new SwissEph();
await swe.initSwissEph();

const { sunrise } = getSunriseSunset(2026, 6, 25, 17.385, 78.4867, "Asia/Kolkata");
console.log("sunrise", sunrise.toFormat("HH:mm"), "valid", sunrise.isValid);

const utc = sunrise.toUTC();
const sunriseJd = swe.julday(utc.year, utc.month, utc.day, utc.hour + utc.minute / 60);

swe.set_sid_mode(swe.SE_SIDM_LAHIRI, 0, 0);
const flags = swe.SEFLG_SWIEPH | swe.SEFLG_SIDEREAL;

function measure(jd) {
  const sun = swe.calc_ut(jd, swe.SE_SUN, flags)[0];
  const moon = swe.calc_ut(jd, swe.SE_MOON, flags)[0];
  return ((moon - sun) % 360 + 360) % 360;
}

const elong = measure(sunriseJd);
const tithi = Math.floor(elong / 12) + 1;
console.log("elong", elong.toFixed(2), "tithi", tithi, getTithiName(tithi));

function getTithiName(i) {
  return ["", "Pratipada", "Dwitiya", "Tritiya", "Chaturthi", "Panchami", "Shashthi", "Saptami", "Ashtami", "Navami", "Dashami", "Ekadashi", "Dwadashi"][i] || i;
}

const target = (Math.floor(elong / 12) + 1) * 12;
let low = sunriseJd;
let high = sunriseJd + 30 / 24;
const startVal = elong;
let wrappedTarget = target;
if (wrappedTarget <= startVal) wrappedTarget += 360;

for (let i = 0; i < 40; i++) {
  const mid = (low + high) / 2;
  let val = measure(mid);
  if (val < startVal) val += 360;
  if (val < wrappedTarget) low = mid;
  else high = mid;
}

const boundaryJd = (low + high) / 2;
const end = DateTime.fromMillis((boundaryJd - JD_UNIX_EPOCH) * 86_400_000, { zone: "utc" }).setZone(
  "Asia/Kolkata",
);
console.log("tithi ends", end.toFormat("HH:mm"), "valid", end.isValid);
