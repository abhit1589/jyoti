import { DateTime } from "luxon";
import { getSwe } from "@/lib/ephemeris/swe";
import { buildPersonalityCareerContext, houseRashi, rashiLord } from "@/lib/vedic/analysis";
import { getCurrentDashaPeriods } from "@/lib/vedic/dasha";
import { READING_LANGUAGE } from "@/lib/i18n/locales";
import type { BirthInput, Locale, PlanetId, PlanetPosition, VedicChart } from "@/lib/types";
import { DASHA_SEQUENCE, DASHA_YEARS, PLANET_LABELS, RASHIS } from "@/lib/vedic/constants";

const NAKSHATRA_SPAN = 360 / 27;

const BODY_MAP: Record<PlanetId, number> = {
  sun: 0,
  moon: 1,
  mercury: 2,
  venus: 3,
  mars: 4,
  jupiter: 5,
  saturn: 6,
  rahu: 10,
  ketu: -1,
};

function normalizeDegrees(deg: number): number {
  const n = deg % 360;
  return n < 0 ? n + 360 : n;
}

function getRashi(longitude: number): { rashi: number; rashiDegree: number } {
  const lon = normalizeDegrees(longitude);
  const rashi = Math.floor(lon / 30) + 1;
  const rashiDegree = lon % 30;
  return { rashi, rashiDegree };
}

function getNakshatra(longitude: number): { nakshatra: number; pada: number } {
  const lon = normalizeDegrees(longitude);
  const nakshatra = Math.floor(lon / NAKSHATRA_SPAN) + 1;
  const posInNak = lon % NAKSHATRA_SPAN;
  const pada = Math.floor(posInNak / (NAKSHATRA_SPAN / 4)) + 1;
  return { nakshatra, pada };
}

function getHouse(planetRashi: number, lagnaRashi: number): number {
  return ((planetRashi - lagnaRashi + 12) % 12) + 1;
}

function formatDegree(deg: number): string {
  const d = Math.floor(deg);
  const m = Math.floor((deg - d) * 60);
  const s = Math.floor(((deg - d) * 60 - m) * 60);
  return `${d}°${m.toString().padStart(2, "0")}'${s.toString().padStart(2, "0")}"`;
}

function addYears(date: DateTime, years: number): DateTime {
  const wholeYears = Math.floor(years);
  const fractionalDays = (years - wholeYears) * 365.25;
  return date.plus({ years: wholeYears, days: Math.round(fractionalDays) });
}

function buildVimshottari(moonLongitude: number, birthUtc: DateTime) {
  const { nakshatra } = getNakshatra(moonLongitude);
  const lordIndex = (nakshatra - 1) % 9;
  const birthLord = DASHA_SEQUENCE[lordIndex];
  const traveled = normalizeDegrees(moonLongitude) % NAKSHATRA_SPAN;
  const remaining = NAKSHATRA_SPAN - traveled;
  const balanceYears = (remaining / NAKSHATRA_SPAN) * DASHA_YEARS[birthLord];

  const periods: VedicChart["vimshottari"]["periods"] = [];
  let cursor = birthUtc;
  let idx = lordIndex;
  const now = DateTime.utc();

  for (let i = 0; i < 9; i++) {
    const lord = DASHA_SEQUENCE[idx];
    const years = i === 0 ? balanceYears : DASHA_YEARS[lord];
    const end = addYears(cursor, years);
    const isCurrent = now >= cursor && now < end;

    periods.push({
      lord,
      startDate: cursor.toISODate() ?? "",
      endDate: end.toISODate() ?? "",
      isCurrent,
    });

    cursor = end;
    idx = (idx + 1) % 9;
  }

  return { birthLord, balanceYears, periods };
}

export async function calculateVedicChart(input: BirthInput): Promise<VedicChart> {
  const swe = await getSwe();
  const [year, month, day] = input.date.split("-").map(Number);
  const [hour, minute] = input.time.split(":").map(Number);

  const local = DateTime.fromObject(
    { year, month, day, hour, minute },
    { zone: input.timezone },
  );

  if (!local.isValid) {
    throw new Error("Invalid birth date or time");
  }

  const utc = local.toUTC();
  const jd = swe.julday(
    utc.year,
    utc.month,
    utc.day,
    utc.hour + utc.minute / 60 + utc.second / 3600,
  );

  swe.set_sid_mode(swe.SE_SIDM_LAHIRI, 0, 0);
  const flags = swe.SEFLG_SWIEPH | swe.SEFLG_SIDEREAL | swe.SEFLG_SPEED;
  const ayanamsa = swe.get_ayanamsa(jd);

  const houseResult = (
    swe as unknown as {
      houses_ex: (
        jd: number,
        iflag: number,
        lat: number,
        lon: number,
        hsys: string,
      ) => { cusps: Float64Array; ascmc: Float64Array };
    }
  ).houses_ex(jd, flags, input.latitude, input.longitude, "W");

  const lagnaLongitude = normalizeDegrees(houseResult.ascmc[0]);
  const lagnaRashi = getRashi(lagnaLongitude);
  const lagnaNak = getNakshatra(lagnaLongitude);

  const planets: PlanetPosition[] = [];
  const houseMap: Record<number, PlanetId[]> = {
    1: [],
    2: [],
    3: [],
    4: [],
    5: [],
    6: [],
    7: [],
    8: [],
    9: [],
    10: [],
    11: [],
    12: [],
  };

  for (const planetId of Object.keys(BODY_MAP) as PlanetId[]) {
    let longitude: number;
    let retrograde = false;

    if (planetId === "ketu") {
      const rahu = swe.calc_ut(jd, swe.SE_MEAN_NODE, flags);
      longitude = normalizeDegrees(rahu[0] + 180);
      retrograde = rahu[3] < 0;
    } else {
      const result = swe.calc_ut(jd, BODY_MAP[planetId], flags);
      longitude = normalizeDegrees(result[0]);
      retrograde = result[3] < 0;
    }

    const rashi = getRashi(longitude);
    const nak = getNakshatra(longitude);
    const house = getHouse(rashi.rashi, lagnaRashi.rashi);

    const position: PlanetPosition = {
      id: planetId,
      longitude,
      rashi: rashi.rashi,
      rashiDegree: rashi.rashiDegree,
      nakshatra: nak.nakshatra,
      pada: nak.pada,
      house,
      retrograde,
    };

    planets.push(position);
    houseMap[house].push(planetId);
  }

  const moon = planets.find((p) => p.id === "moon");
  if (!moon) {
    throw new Error("Moon position missing");
  }

  const vimshottari = buildVimshottari(moon.longitude, utc);

  return {
    birth: {
      date: input.date,
      time: input.time,
      timezone: input.timezone,
      latitude: input.latitude,
      longitude: input.longitude,
      placeName: input.placeName,
    },
    ayanamsa,
    lagna: {
      longitude: lagnaLongitude,
      rashi: lagnaRashi.rashi,
      rashiDegree: lagnaRashi.rashiDegree,
      nakshatra: lagnaNak.nakshatra,
      pada: lagnaNak.pada,
    },
    planets,
    houses: houseMap,
    vimshottari,
    calculatedAt: new Date().toISOString(),
  };
}

const READING_PLANET_ORDER: PlanetId[] = [
  "sun",
  "moon",
  "mars",
  "mercury",
  "jupiter",
  "venus",
  "saturn",
  "rahu",
  "ketu",
];

export function formatChartForReadingPrompt(chart: VedicChart, locale: Locale): string {
  const rashis = RASHIS[locale];
  const labels = PLANET_LABELS[locale];
  const language = READING_LANGUAGE[locale];
  const ascSign = rashis[chart.lagna.rashi - 1];
  const ascDegree = formatDegree(chart.lagna.rashiDegree);

  const planetLines = READING_PLANET_ORDER.map((id) => {
    const planet = chart.planets.find((p) => p.id === id);
    if (!planet) return "";
    const sign = rashis[planet.rashi - 1];
    const degree = formatDegree(planet.rashiDegree);
    const retro = planet.retrograde ? " (R)" : "";
    return `${labels[id]}: ${sign} ${degree}, House ${planet.house}${retro}`;
  }).filter(Boolean);

  return [
    "The person's Vedic birth chart data is:",
    "",
    `Ascendant (Lagna): ${ascSign} ${ascDegree}`,
    ...planetLines,
    "",
    `Language: ${language}`,
  ].join("\n");
}

export function formatChartForCareerReadingPrompt(chart: VedicChart, locale: Locale): string {
  const rashis = RASHIS[locale];
  const labels = PLANET_LABELS[locale];
  const language = READING_LANGUAGE[locale];
  const ascSign = rashis[chart.lagna.rashi - 1];
  const ascDegree = formatDegree(chart.lagna.rashiDegree);

  const planetLines = READING_PLANET_ORDER.map((id) => {
    const planet = chart.planets.find((p) => p.id === id);
    if (!planet) return "";
    const sign = rashis[planet.rashi - 1];
    const degree = formatDegree(planet.rashiDegree);
    const retro = planet.retrograde ? " (R)" : "";
    return `${labels[id]}: ${sign} ${degree}, House ${planet.house}${retro}`;
  }).filter(Boolean);

  const tenthRashi = houseRashi(chart.lagna.rashi, 10);
  const tenthLord = rashiLord(tenthRashi);
  const tenthLordPlanet = chart.planets.find((p) => p.id === tenthLord);
  const tenthLordSign = tenthLordPlanet ? rashis[tenthLordPlanet.rashi - 1] : "?";
  const tenthLordHouse = tenthLordPlanet?.house ?? "?";

  return [
    "The person's Vedic birth chart data is:",
    "",
    `Ascendant (Lagna): ${ascSign} ${ascDegree}`,
    ...planetLines,
    `10th House Lord: ${labels[tenthLord]} in ${tenthLordSign}, House ${tenthLordHouse}`,
    "",
    `Language: ${language}`,
  ].join("\n");
}

export function formatChartForDashaReadingPrompt(chart: VedicChart, locale: Locale): string {
  const rashis = RASHIS[locale];
  const labels = PLANET_LABELS[locale];
  const language = READING_LANGUAGE[locale];
  const ascSign = rashis[chart.lagna.rashi - 1];
  const ascDegree = formatDegree(chart.lagna.rashiDegree);

  const planetLines = READING_PLANET_ORDER.map((id) => {
    const planet = chart.planets.find((p) => p.id === id);
    if (!planet) return "";
    const sign = rashis[planet.rashi - 1];
    const degree = formatDegree(planet.rashiDegree);
    const retro = planet.retrograde ? " (R)" : "";
    return `${labels[id]}: ${sign} ${degree}, House ${planet.house}${retro}`;
  }).filter(Boolean);

  const dasha = getCurrentDashaPeriods(chart);
  const dashaLines = dasha
    ? [
        "",
        `Current Mahadasha: ${labels[dasha.mahadasha.lord]}`,
        `Mahadasha start: ${dasha.mahadasha.startDate}`,
        `Mahadasha end: ${dasha.mahadasha.endDate}`,
        `Current Antardasha: ${labels[dasha.antardasha.lord]}`,
        `Antardasha start: ${dasha.antardasha.startDate}`,
        `Antardasha end: ${dasha.antardasha.endDate}`,
      ]
    : [
        "",
        "Current Mahadasha: unknown",
        "Current Antardasha: unknown",
      ];

  return [
    "The person's Vedic birth chart data is:",
    "",
    `Ascendant (Lagna): ${ascSign} ${ascDegree}`,
    ...planetLines,
    ...dashaLines,
    "",
    `Language: ${language}`,
  ].join("\n");
}

export function chartToSummary(chart: VedicChart, locale: Locale): string {
  const isTe = locale === "te";
  const lines: string[] = [];

  lines.push(
    isTe
      ? `పుట్టిన తేదీ: ${chart.birth.date} ${chart.birth.time} (${chart.birth.timezone})`
      : `Birth: ${chart.birth.date} ${chart.birth.time} (${chart.birth.timezone})`,
  );

  if (chart.birth.placeName) {
    lines.push(isTe ? `స్థలం: ${chart.birth.placeName}` : `Place: ${chart.birth.placeName}`);
  }

  lines.push(
    isTe
      ? `లగ్నం: రాశి ${chart.lagna.rashi}, నక్షత్రం ${chart.lagna.nakshatra}, పాదం ${chart.lagna.pada}`
      : `Lagna: Rashi ${chart.lagna.rashi}, Nakshatra ${chart.lagna.nakshatra}, Pada ${chart.lagna.pada}`,
  );

  for (const planet of chart.planets) {
    lines.push(
      `${planet.id}: rashi ${planet.rashi} (${formatDegree(planet.rashiDegree)}), nakshatra ${planet.nakshatra}-${planet.pada}, house ${planet.house}${planet.retrograde ? " (R)" : ""}`,
    );
  }

  const currentDasha = chart.vimshottari.periods.find((p) => p.isCurrent);
  if (currentDasha) {
    lines.push(
      isTe
        ? `ప్రస్తుత దశ: ${currentDasha.lord} (${currentDasha.startDate} – ${currentDasha.endDate})`
        : `Current dasha: ${currentDasha.lord} (${currentDasha.startDate} – ${currentDasha.endDate})`,
    );
  }

  lines.push("");
  lines.push(buildPersonalityCareerContext(chart, locale));

  return lines.join("\n");
}
