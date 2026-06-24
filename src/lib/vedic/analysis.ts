import type { Locale, PlanetId, VedicChart } from "@/lib/types";

const RASHI_LORDS: PlanetId[] = [
  "mars",
  "venus",
  "mercury",
  "moon",
  "sun",
  "mercury",
  "venus",
  "mars",
  "jupiter",
  "saturn",
  "saturn",
  "jupiter",
];

export function houseRashi(lagnaRashi: number, house: number): number {
  return ((lagnaRashi - 1 + house - 1) % 12) + 1;
}

export function rashiLord(rashi: number): PlanetId {
  return RASHI_LORDS[rashi - 1];
}

function lordPlacement(chart: VedicChart, house: number) {
  const rashi = houseRashi(chart.lagna.rashi, house);
  const lord = rashiLord(rashi);
  const planet = chart.planets.find((p) => p.id === lord);
  return { rashi, lord, house: planet?.house ?? null, retrograde: planet?.retrograde ?? false };
}

export function buildPersonalityCareerContext(chart: VedicChart, locale: Locale): string {
  const isTe = locale === "te";
  const moon = chart.planets.find((p) => p.id === "moon");
  const lagnaLord = rashiLord(chart.lagna.rashi);
  const lagnaLordPos = chart.planets.find((p) => p.id === lagnaLord);
  const tenth = lordPlacement(chart, 10);
  const tenthLordPos = chart.planets.find((p) => p.id === tenth.lord);
  const sixth = lordPlacement(chart, 6);
  const second = lordPlacement(chart, 2);

  const inHouse = (h: number) => chart.houses[h]?.join(", ") || (isTe ? "ఏదీ లేదు" : "none");
  const saturn = chart.planets.find((p) => p.id === "saturn");
  const mercury = chart.planets.find((p) => p.id === "mercury");
  const jupiter = chart.planets.find((p) => p.id === "jupiter");

  if (isTe) {
    return `వ్యక్తిత్వ సూచికలు:
- లగ్న రాశి: ${chart.lagna.rashi}, లగ్న అధిపతి ${lagnaLord} భావం ${lagnaLordPos?.house ?? "?"}
- చంద్రుడు: రాశి ${moon?.rashi}, నక్షత్రం ${moon?.nakshatra}-${moon?.pada}, భావం ${moon?.house}
- 1వ భావ గ్రహాలు: ${inHouse(1)}
- 5వ భావ గ్రహాలు (బుద్ధి): ${inHouse(5)}

వృత్తి సూచికలు:
- 10వ భావ రాశి: ${tenth.rashi}, 10వ అధిపతి ${tenth.lord} భావం ${tenthLordPos?.house ?? "?"}
- 10వ భావ గ్రహాలు: ${inHouse(10)}
- 6వ భావ (సేవ/పని): రాశి ${sixth.rashi}, గ్రహాలు ${inHouse(6)}
- 2వ భావ (ఆదాయం): రాశి ${second.rashi}, గ్రహాలు ${inHouse(2)}
- శని (కర్మ/వృత్తి): భావం ${saturn?.house}, రాశి ${saturn?.rashi}${saturn?.retrograde ? " (వక్రి)" : ""}
- బుధుడు (వ్యాపార/కౌశలం): భావం ${mercury?.house}
- గురువు (జ్ఞాన/మార్గదర్శకత్వం): భావం ${jupiter?.house}`;
  }

  return `Personality indicators:
- Lagna rashi: ${chart.lagna.rashi}, lagna lord ${lagnaLord} in house ${lagnaLordPos?.house ?? "?"}
- Moon: rashi ${moon?.rashi}, nakshatra ${moon?.nakshatra}-${moon?.pada}, house ${moon?.house}
- Planets in 1st house: ${inHouse(1)}
- Planets in 5th house (intellect): ${inHouse(5)}

Career indicators:
- 10th house rashi: ${tenth.rashi}, 10th lord ${tenth.lord} in house ${tenthLordPos?.house ?? "?"}
- Planets in 10th house: ${inHouse(10)}
- 6th house (service/work): rashi ${sixth.rashi}, planets ${inHouse(6)}
- 2nd house (income): rashi ${second.rashi}, planets ${inHouse(2)}
- Saturn (karma/career): house ${saturn?.house}, rashi ${saturn?.rashi}${saturn?.retrograde ? " (R)" : ""}
- Mercury (skills/business): house ${mercury?.house}
- Jupiter (wisdom/guidance roles): house ${jupiter?.house}`;
}
