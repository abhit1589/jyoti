import {
  GANA_NAMES,
  GANA_TABLE,
  GRAHA_MAITRI,
  NADI_NAMES,
  NADI_TABLE,
  SIGN_LORDS,
  VARNA_NAMES,
  VASHYA_PAIRS,
  YONI_MATRIX,
  YONI_NAMES,
  YONI_TABLE,
} from "@/lib/vedic/ashtakoot-data";
import type { VedicChart } from "@/lib/types";

export type KootaId =
  | "varna"
  | "vashya"
  | "tara"
  | "yoni"
  | "grahaMaitri"
  | "gana"
  | "bhakoot"
  | "nadi";

export interface KootaScore {
  id: KootaId;
  score: number;
  maxScore: number;
  person1Value: string;
  person2Value: string;
  isCompatible: boolean;
}

export interface AshtakootResult {
  totalScore: number;
  maxScore: number;
  percentage: number;
  isCompatible: boolean;
  kootas: KootaScore[];
  person1: { moonRashi: number; moonNakshatra: number };
  person2: { moonRashi: number; moonNakshatra: number };
}

function getMoon(chart: VedicChart) {
  const moon = chart.planets.find((p) => p.id === "moon");
  if (!moon) throw new Error("Moon position missing");
  return moon;
}

function getVarna(sign: number): number {
  if ([4, 8, 12].includes(sign)) return 0;
  if ([1, 5, 9].includes(sign)) return 1;
  if ([2, 6, 10].includes(sign)) return 2;
  return 3;
}

function scoreVarna(groomSign: number, brideSign: number): KootaScore {
  const groomV = getVarna(groomSign);
  const brideV = getVarna(brideSign);
  const score = groomV <= brideV ? 1 : 0;
  return {
    id: "varna",
    score,
    maxScore: 1,
    person1Value: VARNA_NAMES[brideV],
    person2Value: VARNA_NAMES[groomV],
    isCompatible: score > 0,
  };
}

function scoreVashya(groomSign: number, brideSign: number): KootaScore {
  const groomList = VASHYA_PAIRS[groomSign] ?? [];
  const brideList = VASHYA_PAIRS[brideSign] ?? [];
  let score = 0;
  if (groomList.includes(brideSign) && brideList.includes(groomSign)) score = 2;
  else if (groomList.includes(brideSign) || brideList.includes(groomSign)) score = 1;
  else if (groomSign === brideSign) score = 2;
  return {
    id: "vashya",
    score,
    maxScore: 2,
    person1Value: String(brideSign),
    person2Value: String(groomSign),
    isCompatible: score > 0,
  };
}

function scoreTara(groomStar: number, brideStar: number): KootaScore {
  let count = groomStar - brideStar + 1;
  if (count <= 0) count += 27;
  const rem = count % 9;
  const score = rem === 3 || rem === 5 || rem === 7 ? 0 : 3;
  return {
    id: "tara",
    score,
    maxScore: 3,
    person1Value: String(brideStar + 1),
    person2Value: String(groomStar + 1),
    isCompatible: score > 0,
  };
}

function scoreYoni(groomStar: number, brideStar: number): KootaScore {
  const groomY = YONI_TABLE[groomStar];
  const brideY = YONI_TABLE[brideStar];
  const score = YONI_MATRIX[groomY][brideY];
  return {
    id: "yoni",
    score,
    maxScore: 4,
    person1Value: YONI_NAMES[brideY],
    person2Value: YONI_NAMES[groomY],
    isCompatible: score >= 2,
  };
}

function scoreGrahaMaitri(groomSign: number, brideSign: number): KootaScore {
  const groomLord = SIGN_LORDS[groomSign - 1];
  const brideLord = SIGN_LORDS[brideSign - 1];

  const rel = (from: number, to: number) => (from === to ? 1 : GRAHA_MAITRI[from][to]);
  const gToB = rel(groomLord, brideLord);
  const bToG = rel(brideLord, groomLord);

  let score = 0;
  if (gToB === 1 && bToG === 1) score = 5;
  else if ((gToB === 1 && bToG === 0) || (gToB === 0 && bToG === 1)) score = 4;
  else if (gToB === 0 && bToG === 0) score = 3;
  else if ((gToB === 1 && bToG === -1) || (gToB === -1 && bToG === 1)) score = 1;
  else if ((gToB === 0 && bToG === -1) || (gToB === -1 && bToG === 0)) score = 0.5;
  else score = 0;

  return {
    id: "grahaMaitri",
    score,
    maxScore: 5,
    person1Value: String(brideSign),
    person2Value: String(groomSign),
    isCompatible: score >= 3,
  };
}

function scoreGana(groomStar: number, brideStar: number): KootaScore {
  const groomG = GANA_TABLE[groomStar];
  const brideG = GANA_TABLE[brideStar];
  let score = 0;

  if (groomG === brideG) score = 6;
  else if (
    (groomG === 0 && brideG === 1) ||
    (groomG === 1 && brideG === 0)
  ) {
    score = 6;
  } else if (brideG === 2) {
    score = 0;
  } else if (groomG === 2) {
    score = brideG === 0 ? 1 : 0;
  }

  return {
    id: "gana",
    score,
    maxScore: 6,
    person1Value: GANA_NAMES[brideG],
    person2Value: GANA_NAMES[groomG],
    isCompatible: score >= 5,
  };
}

function scoreBhakoot(groomSign: number, brideSign: number): KootaScore {
  let dist = brideSign - groomSign;
  if (dist < 0) dist += 12;
  const bad = [1, 5, 7, 11];
  const score = bad.includes(dist) ? 0 : 7;
  return {
    id: "bhakoot",
    score,
    maxScore: 7,
    person1Value: String(brideSign),
    person2Value: String(groomSign),
    isCompatible: score > 0,
  };
}

function scoreNadi(groomStar: number, brideStar: number): KootaScore {
  const groomN = NADI_TABLE[groomStar];
  const brideN = NADI_TABLE[brideStar];
  const score = groomN !== brideN ? 8 : 0;
  return {
    id: "nadi",
    score,
    maxScore: 8,
    person1Value: NADI_NAMES[brideN],
    person2Value: NADI_NAMES[groomN],
    isCompatible: score > 0,
  };
}

/**
 * North Indian Ashtakoot guna milan.
 * Person 1 = bride (traditionally), Person 2 = groom (traditionally).
 */
export function calculateAshtakoot(
  brideChart: VedicChart,
  groomChart: VedicChart,
): AshtakootResult {
  const brideMoon = getMoon(brideChart);
  const groomMoon = getMoon(groomChart);

  const brideStar = brideMoon.nakshatra - 1;
  const groomStar = groomMoon.nakshatra - 1;
  const brideSign = brideMoon.rashi;
  const groomSign = groomMoon.rashi;

  const kootas = [
    scoreVarna(groomSign, brideSign),
    scoreVashya(groomSign, brideSign),
    scoreTara(groomStar, brideStar),
    scoreYoni(groomStar, brideStar),
    scoreGrahaMaitri(groomSign, brideSign),
    scoreGana(groomStar, brideStar),
    scoreBhakoot(groomSign, brideSign),
    scoreNadi(groomStar, brideStar),
  ];

  const totalScore = kootas.reduce((sum, k) => sum + k.score, 0);
  const maxScore = 36;

  return {
    totalScore,
    maxScore,
    percentage: Math.round((totalScore / maxScore) * 1000) / 10,
    isCompatible: totalScore >= 18,
    kootas,
    person1: { moonRashi: brideSign, moonNakshatra: brideMoon.nakshatra },
    person2: { moonRashi: groomSign, moonNakshatra: groomMoon.nakshatra },
  };
}
