import { NAKSHATRAS, RASHIS } from "@/lib/vedic/constants";
import type { Locale, VedicChart } from "@/lib/types";

export interface BirthIdentity {
  janmaNakshatra: string;
  janmaNakshatraPada: number;
  janmaRashi: string;
  lagnaRashi: string;
}

export function getBirthIdentity(chart: VedicChart, locale: Locale): BirthIdentity {
  const moon = chart.planets.find((p) => p.id === "moon");
  if (!moon) {
    throw new Error("Moon position missing");
  }

  const rashis = RASHIS[locale];
  const nakshatras = NAKSHATRAS[locale];

  return {
    janmaNakshatra: nakshatras[moon.nakshatra - 1],
    janmaNakshatraPada: moon.pada,
    janmaRashi: rashis[moon.rashi - 1],
    lagnaRashi: rashis[chart.lagna.rashi - 1],
  };
}

const IDENTITY_SUMMARY: Record<
  Locale,
  (id: BirthIdentity) => string
> = {
  en: (id) =>
    `Janma Nakshatra (birth star): ${id.janmaNakshatra}, Pada ${id.janmaNakshatraPada}
Janma Rashi (Moon sign): ${id.janmaRashi}
Lagna Rashi: ${id.lagnaRashi}`,
  hi: (id) =>
    `जन्म नक्षत्र: ${id.janmaNakshatra}, पाद ${id.janmaNakshatraPada}
जन्म राशि (चंद्र): ${id.janmaRashi}
लग्न राशि: ${id.lagnaRashi}`,
  te: (id) =>
    `జన్మ నక్షత్రం (జన్మ తార): ${id.janmaNakshatra}, పాదం ${id.janmaNakshatraPada}
జన్మ రాశి (చంద్ర రాశి): ${id.janmaRashi}
లగ్న రాశి: ${id.lagnaRashi}`,
  ta: (id) =>
    `ஜன்ம நட்சத்திரம்: ${id.janmaNakshatra}, பாதம் ${id.janmaNakshatraPada}
ஜன்ம ராசி (சந்திரன்): ${id.janmaRashi}
லக்ன ராசி: ${id.lagnaRashi}`,
  mr: (id) =>
    `जन्म नक्षत्र: ${id.janmaNakshatra}, पाद ${id.janmaNakshatraPada}
जन्म राशी (चंद्र): ${id.janmaRashi}
लग्न राशी: ${id.lagnaRashi}`,
  kn: (id) =>
    `ಜನ್ಮ ನಕ್ಷತ್ರ: ${id.janmaNakshatra}, ಪಾದ ${id.janmaNakshatraPada}
ಜನ್ಮ ರಾಶಿ (ಚಂದ್ರ): ${id.janmaRashi}
ಲಗ್ನ ರಾಶಿ: ${id.lagnaRashi}`,
};

export function formatBirthIdentitySummary(chart: VedicChart, locale: Locale): string {
  return IDENTITY_SUMMARY[locale](getBirthIdentity(chart, locale));
}
