import { DateTime } from "luxon";
import { getSwe } from "@/lib/ephemeris/swe";
import { getChartReadingLabels } from "@/lib/vedic/chart-reading-labels";
import { buildPersonalityCareerContext, houseRashi, rashiLord } from "@/lib/vedic/analysis";
import { getCurrentDashaPeriods } from "@/lib/vedic/dasha";
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
  const L = getChartReadingLabels(locale);
  const ascSign = rashis[chart.lagna.rashi - 1];
  const ascDegree = formatDegree(chart.lagna.rashiDegree);

  const planetLines = READING_PLANET_ORDER.map((id) => {
    const planet = chart.planets.find((p) => p.id === id);
    if (!planet) return "";
    const sign = rashis[planet.rashi - 1];
    const degree = formatDegree(planet.rashiDegree);
    const retro = planet.retrograde ? L.retrograde : "";
    return `${labels[id]}: ${sign} ${degree}, ${L.house(planet.house)}${retro}`;
  }).filter(Boolean);

  return [L.intro, "", `${L.ascendant}: ${ascSign} ${ascDegree}`, ...planetLines].join("\n");
}

export function formatChartForCareerReadingPrompt(chart: VedicChart, locale: Locale): string {
  const rashis = RASHIS[locale];
  const labels = PLANET_LABELS[locale];
  const L = getChartReadingLabels(locale);
  const ascSign = rashis[chart.lagna.rashi - 1];
  const ascDegree = formatDegree(chart.lagna.rashiDegree);

  const planetLines = READING_PLANET_ORDER.map((id) => {
    const planet = chart.planets.find((p) => p.id === id);
    if (!planet) return "";
    const sign = rashis[planet.rashi - 1];
    const degree = formatDegree(planet.rashiDegree);
    const retro = planet.retrograde ? L.retrograde : "";
    return `${labels[id]}: ${sign} ${degree}, ${L.house(planet.house)}${retro}`;
  }).filter(Boolean);

  const tenthRashi = houseRashi(chart.lagna.rashi, 10);
  const tenthLord = rashiLord(tenthRashi);
  const tenthLordPlanet = chart.planets.find((p) => p.id === tenthLord);
  const tenthLordSign = tenthLordPlanet ? rashis[tenthLordPlanet.rashi - 1] : "?";
  const tenthLordHouse = tenthLordPlanet?.house ?? "?";

  return [
    L.intro,
    "",
    `${L.ascendant}: ${ascSign} ${ascDegree}`,
    ...planetLines,
    `${L.tenthLord}: ${labels[tenthLord]} ${L.inSign} ${tenthLordSign}, ${typeof tenthLordHouse === "number" ? L.house(tenthLordHouse) : tenthLordHouse}`,
  ].join("\n");
}

export function formatChartForDashaReadingPrompt(chart: VedicChart, locale: Locale): string {
  const rashis = RASHIS[locale];
  const labels = PLANET_LABELS[locale];
  const L = getChartReadingLabels(locale);
  const ascSign = rashis[chart.lagna.rashi - 1];
  const ascDegree = formatDegree(chart.lagna.rashiDegree);

  const planetLines = READING_PLANET_ORDER.map((id) => {
    const planet = chart.planets.find((p) => p.id === id);
    if (!planet) return "";
    const sign = rashis[planet.rashi - 1];
    const degree = formatDegree(planet.rashiDegree);
    const retro = planet.retrograde ? L.retrograde : "";
    return `${labels[id]}: ${sign} ${degree}, ${L.house(planet.house)}${retro}`;
  }).filter(Boolean);

  const dasha = getCurrentDashaPeriods(chart);
  const dashaLines = dasha
    ? [
        "",
        `${L.mahadasha}: ${labels[dasha.mahadasha.lord]}`,
        `${L.mahadashaStart}: ${dasha.mahadasha.startDate}`,
        `${L.mahadashaEnd}: ${dasha.mahadasha.endDate}`,
        `${L.antardasha}: ${labels[dasha.antardasha.lord]}`,
        `${L.antardashaStart}: ${dasha.antardasha.startDate}`,
        `${L.antardashaEnd}: ${dasha.antardasha.endDate}`,
      ]
    : [
        "",
        `${L.mahadasha}: ${L.dashaUnknown}`,
        `${L.antardasha}: ${L.dashaUnknown}`,
      ];

  return [
    L.intro,
    "",
    `${L.ascendant}: ${ascSign} ${ascDegree}`,
    ...planetLines,
    ...dashaLines,
  ].join("\n");
}

function planetsInHouse(chart: VedicChart, locale: Locale, house: number): string {
  const labels = PLANET_LABELS[locale];
  const ids = chart.houses[house];
  if (!ids?.length) return "—";
  return ids.map((id) => labels[id]).join(", ");
}

function formatLordLine(
  chart: VedicChart,
  locale: Locale,
  house: number,
  lordLabel: string,
): string {
  const rashis = RASHIS[locale];
  const labels = PLANET_LABELS[locale];
  const L = getChartReadingLabels(locale);
  const rashi = houseRashi(chart.lagna.rashi, house);
  const lord = rashiLord(rashi);
  const lordPlanet = chart.planets.find((p) => p.id === lord);
  const lordSign = lordPlanet ? rashis[lordPlanet.rashi - 1] : "?";
  const lordHouse = lordPlanet?.house ?? "?";
  return `${lordLabel}: ${labels[lord]} ${L.inSign} ${lordSign}, ${typeof lordHouse === "number" ? L.house(lordHouse) : lordHouse}`;
}

function formatChartBaseLines(chart: VedicChart, locale: Locale): string[] {
  const rashis = RASHIS[locale];
  const labels = PLANET_LABELS[locale];
  const L = getChartReadingLabels(locale);
  const ascSign = rashis[chart.lagna.rashi - 1];
  const ascDegree = formatDegree(chart.lagna.rashiDegree);

  const planetLines = READING_PLANET_ORDER.map((id) => {
    const planet = chart.planets.find((p) => p.id === id);
    if (!planet) return "";
    const sign = rashis[planet.rashi - 1];
    const degree = formatDegree(planet.rashiDegree);
    const retro = planet.retrograde ? L.retrograde : "";
    return `${labels[id]}: ${sign} ${degree}, ${L.house(planet.house)}${retro}`;
  }).filter(Boolean);

  return [
    L.intro,
    "",
    `${L.ascendant}: ${ascSign} ${ascDegree}`,
    ...planetLines,
  ];
}

export function formatChartForFinancialReadingPrompt(chart: VedicChart, locale: Locale): string {
  const L = getChartReadingLabels(locale);
  const base = formatChartBaseLines(chart, locale);
  const venus = chart.planets.find((p) => p.id === "venus");
  const jupiter = chart.planets.find((p) => p.id === "jupiter");
  const labels = PLANET_LABELS[locale];
  const rashis = RASHIS[locale];

  const venusLine = venus
    ? `${labels.venus}: ${rashis[venus.rashi - 1]} ${formatDegree(venus.rashiDegree)}, ${L.house(venus.house)}${venus.retrograde ? L.retrograde : ""}`
    : "";
  const jupiterLine = jupiter
    ? `${labels.jupiter}: ${rashis[jupiter.rashi - 1]} ${formatDegree(jupiter.rashiDegree)}, ${L.house(jupiter.house)}${jupiter.retrograde ? L.retrograde : ""}`
    : "";

  return [
    ...base,
    formatLordLine(chart, locale, 2, L.secondLord),
    formatLordLine(chart, locale, 11, L.eleventhLord),
    `${L.planetsIn(2)}: ${planetsInHouse(chart, locale, 2)}`,
    `${L.planetsIn(11)}: ${planetsInHouse(chart, locale, 11)}`,
    venusLine,
    jupiterLine,
  ]
    .filter(Boolean)
    .join("\n");
}

export function formatChartForMarriageReadingPrompt(chart: VedicChart, locale: Locale): string {
  const L = getChartReadingLabels(locale);
  const base = formatChartBaseLines(chart, locale);
  const venus = chart.planets.find((p) => p.id === "venus");
  const moon = chart.planets.find((p) => p.id === "moon");
  const labels = PLANET_LABELS[locale];
  const rashis = RASHIS[locale];

  const venusLine = venus
    ? `${labels.venus}: ${rashis[venus.rashi - 1]} ${formatDegree(venus.rashiDegree)}, ${L.house(venus.house)}${venus.retrograde ? L.retrograde : ""}`
    : "";
  const moonLine = moon
    ? `${labels.moon}: ${rashis[moon.rashi - 1]} ${formatDegree(moon.rashiDegree)}, ${L.house(moon.house)}${moon.retrograde ? L.retrograde : ""}`
    : "";

  return [
    ...base,
    formatLordLine(chart, locale, 7, L.seventhLord),
    `${L.planetsIn(7)}: ${planetsInHouse(chart, locale, 7)}`,
    venusLine,
    moonLine,
  ]
    .filter(Boolean)
    .join("\n");
}

export function formatChartForQaPrompt(chart: VedicChart, locale: Locale): string {
  const rashis = RASHIS[locale];
  const labels = PLANET_LABELS[locale];
  const L = getChartReadingLabels(locale);
  const base = formatChartForTeaserPrompt(chart, locale);

  const inHouse = (h: number) => {
    const ids = chart.houses[h];
    if (!ids?.length) return "none";
    return ids.map((id) => labels[id]).join(", ");
  };

  const fifthRashi = houseRashi(chart.lagna.rashi, 5);
  const fifthLord = rashiLord(fifthRashi);
  const fifthLordPlanet = chart.planets.find((p) => p.id === fifthLord);
  const fifthLordSign = fifthLordPlanet ? rashis[fifthLordPlanet.rashi - 1] : "?";
  const fifthLordHouse = fifthLordPlanet?.house;

  const seventhRashi = houseRashi(chart.lagna.rashi, 7);
  const seventhLord = rashiLord(seventhRashi);
  const seventhLordPlanet = chart.planets.find((p) => p.id === seventhLord);
  const seventhLordSign = seventhLordPlanet ? rashis[seventhLordPlanet.rashi - 1] : "?";
  const seventhLordHouse = seventhLordPlanet?.house;

  const jupiter = chart.planets.find((p) => p.id === "jupiter");

  return [
    base,
    "",
    "Progeny & family indicators:",
    `- 5th house (children, creativity) sign: ${rashis[fifthRashi - 1]}, planets in 5th: ${inHouse(5)}`,
    `- 5th lord ${labels[fifthLord]} in ${fifthLordSign}, ${typeof fifthLordHouse === "number" ? L.house(fifthLordHouse) : "?"}`,
    `- Jupiter (putrakaraka) in ${jupiter ? rashis[jupiter.rashi - 1] : "?"}, ${typeof jupiter?.house === "number" ? L.house(jupiter.house) : "?"}`,
    `- 7th house (partnership) sign: ${rashis[seventhRashi - 1]}, planets in 7th: ${inHouse(7)}`,
    `- 7th lord ${labels[seventhLord]} in ${seventhLordSign}, ${typeof seventhLordHouse === "number" ? L.house(seventhLordHouse) : "?"}`,
  ].join("\n");
}

export function formatChartForTeaserPrompt(chart: VedicChart, locale: Locale): string {
  const rashis = RASHIS[locale];
  const labels = PLANET_LABELS[locale];
  const L = getChartReadingLabels(locale);
  const base = formatChartForReadingPrompt(chart, locale);

  const tenthRashi = houseRashi(chart.lagna.rashi, 10);
  const tenthLord = rashiLord(tenthRashi);
  const tenthLordPlanet = chart.planets.find((p) => p.id === tenthLord);
  const tenthLordSign = tenthLordPlanet ? rashis[tenthLordPlanet.rashi - 1] : "?";
  const tenthLordHouse = tenthLordPlanet?.house ?? "?";

  const dasha = getCurrentDashaPeriods(chart);
  const dashaLines = dasha
    ? [
        `${L.mahadasha}: ${labels[dasha.mahadasha.lord]}`,
        `${L.antardasha}: ${labels[dasha.antardasha.lord]}`,
      ]
    : [`${L.mahadasha}: ${L.dashaUnknown}`];

  return [
    base,
    `${L.tenthLord}: ${labels[tenthLord]} ${L.inSign} ${tenthLordSign}, ${typeof tenthLordHouse === "number" ? L.house(tenthLordHouse) : tenthLordHouse}`,
    ...dashaLines,
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
