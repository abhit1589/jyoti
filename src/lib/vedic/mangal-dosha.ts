import type { VedicChart } from "@/lib/types";

const DOSHA_HOUSES = [1, 2, 4, 7, 8, 12];

export type MangalMatchStatus = "none" | "cancelled" | "present";

export interface PersonMangalStatus {
  hasDosha: boolean;
  cancelled: boolean;
  housesFromLagna: number[];
}

export interface MangalDoshaResult {
  person1: PersonMangalStatus;
  person2: PersonMangalStatus;
  matchStatus: MangalMatchStatus;
}

function getHouseFromSign(referenceRashi: number, targetRashi: number): number {
  return ((targetRashi - referenceRashi + 12) % 12) + 1;
}

function checkPersonMangal(chart: VedicChart): PersonMangalStatus {
  const mars = chart.planets.find((p) => p.id === "mars");
  const moon = chart.planets.find((p) => p.id === "moon");
  const venus = chart.planets.find((p) => p.id === "venus");

  if (!mars || !moon || !venus) {
    return { hasDosha: false, cancelled: false, housesFromLagna: [] };
  }

  const housesFromLagna: number[] = [];
  const fromLagna = getHouseFromSign(chart.lagna.rashi, mars.rashi);
  const fromMoon = getHouseFromSign(moon.rashi, mars.rashi);
  const fromVenus = getHouseFromSign(venus.rashi, mars.rashi);

  if (DOSHA_HOUSES.includes(fromLagna)) housesFromLagna.push(fromLagna);
  if (DOSHA_HOUSES.includes(fromMoon) && !housesFromLagna.includes(fromMoon)) {
    housesFromLagna.push(fromMoon);
  }
  if (DOSHA_HOUSES.includes(fromVenus) && !housesFromLagna.includes(fromVenus)) {
    housesFromLagna.push(fromVenus);
  }

  const isOwn = mars.rashi === 1 || mars.rashi === 8;
  const isExalted = mars.rashi === 10;
  const cancelled = housesFromLagna.length > 0 && (isOwn || isExalted);

  return {
    hasDosha: housesFromLagna.length > 0 && !cancelled,
    cancelled,
    housesFromLagna,
  };
}

export function checkMangalDosha(
  person1Chart: VedicChart,
  person2Chart: VedicChart,
): MangalDoshaResult {
  const person1 = checkPersonMangal(person1Chart);
  const person2 = checkPersonMangal(person2Chart);

  let matchStatus: MangalMatchStatus = "none";
  if (person1.hasDosha && person2.hasDosha) matchStatus = "cancelled";
  else if (person1.hasDosha || person2.hasDosha) matchStatus = "present";

  return { person1, person2, matchStatus };
}
