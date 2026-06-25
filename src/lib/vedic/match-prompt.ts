import type { AshtakootResult } from "@/lib/vedic/ashtakoot";
import { formatChartForQaPrompt } from "@/lib/vedic/chart";
import type { MangalDoshaResult } from "@/lib/vedic/mangal-dosha";
import { getBirthIdentity } from "@/lib/vedic/birth-identity";
import { RASHIS } from "@/lib/vedic/constants";
import type { Locale, VedicChart } from "@/lib/types";

export function formatMilanSummary(
  milan: AshtakootResult,
  mangal: MangalDoshaResult,
  brideChart: VedicChart,
  groomChart: VedicChart,
  locale: Locale,
): string {
  const rashis = RASHIS[locale];
  const bride = getBirthIdentity(brideChart, locale);
  const groom = getBirthIdentity(groomChart, locale);

  const kootaLines = milan.kootas
    .map((k) => `${k.id}: ${k.score}/${k.maxScore} (${k.person1Value} / ${k.person2Value})`)
    .join("\n");

  return `Bride: ${bride.janmaNakshatra} pada ${bride.janmaNakshatraPada}, Moon ${rashis[milan.person1.moonRashi - 1]}
Groom: ${groom.janmaNakshatra} pada ${groom.janmaNakshatraPada}, Moon ${rashis[milan.person2.moonRashi - 1]}

Guna milan total: ${milan.totalScore}/${milan.maxScore} (${milan.percentage}%)
Classical threshold: 18+ generally considered acceptable

Koota breakdown:
${kootaLines}

Mangal dosha:
- Bride: ${mangal.person1.hasDosha ? "present" : mangal.person1.cancelled ? "cancelled by exception" : "none"}
- Groom: ${mangal.person2.hasDosha ? "present" : mangal.person2.cancelled ? "cancelled by exception" : "none"}
- Match status: ${mangal.matchStatus}`;
}

export function formatMatchForQaPrompt(
  brideChart: VedicChart,
  groomChart: VedicChart,
  milan: AshtakootResult,
  mangal: MangalDoshaResult,
  locale: Locale,
): string {
  const summary = formatMilanSummary(milan, mangal, brideChart, groomChart, locale);
  const brideBlock = formatChartForQaPrompt(brideChart, locale);
  const groomBlock = formatChartForQaPrompt(groomChart, locale);

  return [
    summary,
    "",
    "Bride chart (person 1):",
    brideBlock,
    "",
    "Groom chart (person 2):",
    groomBlock,
  ].join("\n");
}
