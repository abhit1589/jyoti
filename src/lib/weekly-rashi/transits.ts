import { getSwe } from "@/lib/ephemeris/swe";
import { RASHIS } from "@/lib/vedic/constants";
import type { Locale } from "@/lib/types";

const RASHI_NAMES_EN = RASHIS.en;

export async function getWeeklyTransitContext(locale: Locale): Promise<string> {
  const swe = await getSwe();
  const now = new Date();
  const jd = swe.julday(
    now.getUTCFullYear(),
    now.getUTCMonth() + 1,
    now.getUTCDate(),
    12,
  );

  swe.set_sid_mode(swe.SE_SIDM_LAHIRI, 0, 0);
  const flags = swe.SEFLG_SWIEPH | swe.SEFLG_SIDEREAL;

  const bodies = [
    { key: "jupiter", id: swe.SE_JUPITER },
    { key: "saturn", id: swe.SE_SATURN },
    { key: "rahu", id: swe.SE_MEAN_NODE },
  ] as const;

  const rashis = RASHIS[locale];
  const lines: string[] = [
    `Reference date (UTC noon): ${now.toISOString().slice(0, 10)}`,
    `Ayanamsa (Lahiri): ${swe.get_ayanamsa(jd).toFixed(4)}°`,
  ];

  for (const body of bodies) {
    const lon = swe.calc_ut(jd, body.id, flags)[0];
    const rashi = Math.floor(lon / 30) + 1;
    lines.push(`${body.key}: ${RASHI_NAMES_EN[rashi - 1]} (${rashis[rashi - 1]})`);
  }

  const moonLon = swe.calc_ut(jd, swe.SE_MOON, flags)[0];
  const moonRashi = Math.floor(moonLon / 30) + 1;
  lines.push(`Moon today: ${RASHI_NAMES_EN[moonRashi - 1]} (${rashis[moonRashi - 1]})`);

  return lines.join("\n");
}
