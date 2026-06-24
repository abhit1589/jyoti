import type { Locale } from "@/lib/types";

export interface ChartReadingLabels {
  intro: string;
  ascendant: string;
  house: (n: number) => string;
  inSign: string;
  tenthLord: string;
  mahadasha: string;
  mahadashaStart: string;
  mahadashaEnd: string;
  antardasha: string;
  antardashaStart: string;
  antardashaEnd: string;
  dashaUnknown: string;
  retrograde: string;
}

const LABELS: Record<Locale, ChartReadingLabels> = {
  en: {
    intro: "The person's Vedic birth chart data is:",
    ascendant: "Ascendant (Lagna)",
    house: (n) => `House ${n}`,
    inSign: "in",
    tenthLord: "10th House Lord",
    mahadasha: "Current Mahadasha",
    mahadashaStart: "Mahadasha start",
    mahadashaEnd: "Mahadasha end",
    antardasha: "Current Antardasha",
    antardashaStart: "Antardasha start",
    antardashaEnd: "Antardasha end",
    dashaUnknown: "unknown",
    retrograde: " (R)",
  },
  hi: {
    intro: "व्यक्ति की वैदिक जन्म कुंडली का डेटा:",
    ascendant: "लग्न",
    house: (n) => `${n}वां भाव`,
    inSign: "में",
    tenthLord: "दसवें भाव का स्वामी",
    mahadasha: "वर्तमान महादशा",
    mahadashaStart: "महादशा आरंभ",
    mahadashaEnd: "महादशा समाप्ति",
    antardasha: "वर्तमान अंतर्दशा",
    antardashaStart: "अंतर्दशा आरंभ",
    antardashaEnd: "अंतर्दशा समाप्ति",
    dashaUnknown: "अज्ञात",
    retrograde: " (वक्री)",
  },
  mr: {
    intro: "व्यक्तीच्या वैदिक जन्मकुंडलीचा डेटा:",
    ascendant: "लग्न",
    house: (n) => `${n}वा भाव`,
    inSign: "मध्ये",
    tenthLord: "दहाव्या भावाचा स्वामी",
    mahadasha: "सध्याची महादशा",
    mahadashaStart: "महादशा सुरुवात",
    mahadashaEnd: "महादशा समाप्ती",
    antardasha: "सध्याची अंतर्दशा",
    antardashaStart: "अंतर्दशा सुरुवात",
    antardashaEnd: "अंतर्दशा समाप्ती",
    dashaUnknown: "अज्ञात",
    retrograde: " (वक्री)",
  },
  kn: {
    intro: "ವ್ಯಕ್ತಿಯ ವೈದಿಕ ಜನ್ಮ ಕುಂಡಲಿ ಡೇಟಾ:",
    ascendant: "ಲಗ್ನ",
    house: (n) => `${n}ನೇ ಭಾವ`,
    inSign: "ದಲ್ಲಿ",
    tenthLord: "ಹತ್ತನೇ ಭಾವದ ಅಧಿಪತಿ",
    mahadasha: "ಪ್ರಸ್ತುತ ಮಹಾದಶ",
    mahadashaStart: "ಮಹಾದಶ ಆರಂಭ",
    mahadashaEnd: "ಮಹಾದಶ ಅಂತ್ಯ",
    antardasha: "ಪ್ರಸ್ತುತ ಅಂತರ್ದಶ",
    antardashaStart: "ಅಂತರ್ದಶ ಆರಂಭ",
    antardashaEnd: "ಅಂತರ್ದಶ ಅಂತ್ಯ",
    dashaUnknown: "ಅಜ್ಞಾತ",
    retrograde: " (ವಕ್ರಿ)",
  },
  te: {
    intro: "వ్యక్తి వైదిక జన్మ కుండలి వివరాలు:",
    ascendant: "లగ్నం",
    house: (n) => `${n}వ భావం`,
    inSign: "లో",
    tenthLord: "పదవ భావ అధిపతి",
    mahadasha: "ప్రస్తుత మహాదశ",
    mahadashaStart: "మహాదశ ప్రారంభం",
    mahadashaEnd: "మహాదశ ముగింపు",
    antardasha: "ప్రస్తుత అంతర్దశ",
    antardashaStart: "అంతర్దశ ప్రారంభం",
    antardashaEnd: "అంతర్దశ ముగింపు",
    dashaUnknown: "తెలియదు",
    retrograde: " (వక్రి)",
  },
  ta: {
    intro: "நபரின் வேத ஜாதகத் தரவு:",
    ascendant: "லக்னம்",
    house: (n) => `${n}வது பாவம்`,
    inSign: "இல்",
    tenthLord: "பத்தாவது பாவ அதிபதி",
    mahadasha: "தற்போதைய மகாதசை",
    mahadashaStart: "மகாதசை தொடக்கம்",
    mahadashaEnd: "மகாதசை முடிவு",
    antardasha: "தற்போதைய அந்தர்தசை",
    antardashaStart: "அந்தர்தசை தொடக்கம்",
    antardashaEnd: "அந்தர்தசை முடிவு",
    dashaUnknown: "தெரியவில்லை",
    retrograde: " (வக்கிரம்)",
  },
};

export function getChartReadingLabels(locale: Locale): ChartReadingLabels {
  return LABELS[locale];
}
