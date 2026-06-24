/**
 * Verify ephemeris works for recent and future birth dates.
 * Run: node scripts/test-ephemeris-dates.mjs
 */
import { calculateVedicChart } from "../src/lib/vedic/chart.ts";

const hyderabad = {
  timezone: "Asia/Kolkata",
  latitude: 17.385,
  longitude: 78.4867,
  placeName: "Hyderabad",
};

const cases = [
  { label: "1990-01-15 (historical)", date: "1990-01-15", time: "10:30" },
  { label: "2024-06-15 (recent)", date: "2024-06-15", time: "14:00" },
  { label: "2026-06-23 (today)", date: "2026-06-23", time: "12:00" },
  { label: "2026-12-01 (future this year)", date: "2026-12-01", time: "06:45" },
  { label: "2030-03-20 (future baby)", date: "2030-03-20", time: "03:15" },
  { label: "2050-01-01 (far future)", date: "2050-01-01", time: "00:00" },
];

console.log("Swiss Ephemeris date-range smoke test\n");

let failed = 0;

for (const c of cases) {
  try {
    const chart = await calculateVedicChart({
      ...hyderabad,
      date: c.date,
      time: c.time,
    });
    const moon = chart.planets.find((p) => p.id === "moon");
    const sun = chart.planets.find((p) => p.id === "sun");
    console.log(`✓ ${c.label}`);
    console.log(
      `  Lagna rashi ${chart.lagna.rashi} | Sun rashi ${sun?.rashi} | Moon rashi ${moon?.rashi} nakshatra ${moon?.nakshatra}`,
    );
    console.log(`  Ayanamsa ${chart.ayanamsa.toFixed(4)}°\n`);
  } catch (err) {
    failed++;
    console.log(`✗ ${c.label}`);
    console.log(`  Error: ${err?.message ?? err}\n`);
  }
}

if (failed) {
  console.log(`${failed} case(s) failed.`);
  process.exit(1);
}

console.log("All cases passed — ephemeris is NOT limited to package install date.");
