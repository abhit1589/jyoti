import type { Locale } from "@/lib/types";
import { RASHIS } from "@/lib/vedic/constants";

const TITHI_EN = [
  "Pratipada",
  "Dwitiya",
  "Tritiya",
  "Chaturthi",
  "Panchami",
  "Shashthi",
  "Saptami",
  "Ashtami",
  "Navami",
  "Dashami",
  "Ekadashi",
  "Dwadashi",
  "Trayodashi",
  "Chaturdashi",
  "Purnima",
  "Pratipada",
  "Dwitiya",
  "Tritiya",
  "Chaturthi",
  "Panchami",
  "Shashthi",
  "Saptami",
  "Ashtami",
  "Navami",
  "Dashami",
  "Ekadashi",
  "Dwadashi",
  "Trayodashi",
  "Chaturdashi",
  "Amavasya",
];

const TITHI_HI = [
  "प्रतिपदा",
  "द्वितीया",
  "तृतीया",
  "चतुर्थी",
  "पंचमी",
  "षष्ठी",
  "सप्तमी",
  "अष्टमी",
  "नवमी",
  "दशमी",
  "एकादशी",
  "द्वादशी",
  "त्रयोदशी",
  "चतुर्दशी",
  "पूर्णिमा",
  "प्रतिपदा",
  "द्वितीया",
  "तृतीया",
  "चतुर्थी",
  "पंचमी",
  "षष्ठी",
  "सप्तमी",
  "अष्टमी",
  "नवमी",
  "दशमी",
  "एकादशी",
  "द्वादशी",
  "त्रयोदशी",
  "चतुर्दशी",
  "अमावस्या",
];

const TITHI_TE = [
  "పాడ్యమి",
  "విదియ",
  "తదియ",
  "చవితి",
  "పంచమి",
  "షష్ఠి",
  "సప్తమి",
  "అష్టమి",
  "నవమి",
  "దశమి",
  "ఏకాదశి",
  "ద్వాదశి",
  "త్రయోదశి",
  "చతుర్దశి",
  "పౌర్ణమి",
  "పాడ్యమి",
  "విదియ",
  "తదియ",
  "చవితి",
  "పంచమి",
  "షష్ఠి",
  "సప్తమి",
  "అష్టమి",
  "నవమి",
  "దశమి",
  "ఏకాదశి",
  "ద్వాదశి",
  "త్రయోదశి",
  "చతుర్దశి",
  "అమావాస్య",
];

const TITHI_TA = [
  "பிரதமை",
  "துவிதியை",
  "திருதியை",
  "சதுர்த்தி",
  "பஞ்சமி",
  "சஷ்டி",
  "சப்தமி",
  "அஷ்டமி",
  "நவமி",
  "தசமி",
  "ஏகாதசி",
  "துவாதசி",
  "திரயோதசி",
  "சதுர்த்தசி",
  "பௌர்ணமி",
  "பிரதமை",
  "துவிதியை",
  "திருதியை",
  "சதுர்த்தி",
  "பஞ்சமி",
  "சஷ்டி",
  "சப்தமி",
  "அஷ்டமி",
  "நவமி",
  "தசமி",
  "ஏகாதசி",
  "துவாதசி",
  "திரயோதசி",
  "சதுர்த்தசி",
  "அமாவாசை",
];

const TITHI_KN = [
  "ಪಾಡ್ಯ",
  "ಬಿಡಿಗೆ",
  "ತದಿಗೆ",
  "ಚೌತಿ",
  "ಪಂಚಮಿ",
  "ಷಷ್ಠಿ",
  "ಸಪ್ತಮಿ",
  "ಅಷ್ಟಮಿ",
  "ನವಮಿ",
  "ದಶಮಿ",
  "ಏಕಾದಶಿ",
  "ದ್ವಾದಶಿ",
  "ತ್ರಯೋದಶಿ",
  "ಚತುರ್ದಶಿ",
  "ಹುಣ್ಣಿಮೆ",
  "ಪಾಡ್ಯ",
  "ಬಿಡಿಗೆ",
  "ತದಿಗೆ",
  "ಚೌತಿ",
  "ಪಂಚಮಿ",
  "ಷಷ್ಠಿ",
  "ಸಪ್ತಮಿ",
  "ಅಷ್ಟಮಿ",
  "ನವಮಿ",
  "ದಶಮಿ",
  "ಏಕಾದಶಿ",
  "ದ್ವಾದಶಿ",
  "ತ್ರಯೋದಶಿ",
  "ಚತುರ್ದಶಿ",
  "ಅಮಾವಾಸ್ಯೆ",
];

const YOGA_EN = [
  "Vishkambha",
  "Priti",
  "Ayushman",
  "Saubhagya",
  "Shobhana",
  "Atiganda",
  "Sukarma",
  "Dhriti",
  "Shula",
  "Ganda",
  "Vriddhi",
  "Dhruva",
  "Vyaghata",
  "Harshana",
  "Vajra",
  "Siddhi",
  "Vyatipata",
  "Variyan",
  "Parigha",
  "Shiva",
  "Siddha",
  "Sadhya",
  "Shubha",
  "Shukla",
  "Brahma",
  "Indra",
  "Vaidhriti",
];

const YOGA_HI = [
  "विष्कम्भ",
  "प्रीति",
  "आयुष्मान",
  "सौभाग्य",
  "शोभन",
  "अतिगण्ड",
  "सुकर्मा",
  "धृति",
  "शूल",
  "गण्ड",
  "वृद्धि",
  "ध्रुव",
  "व्याघात",
  "हर्षण",
  "वज्र",
  "सिद्धि",
  "व्यतीपात",
  "वरीयान",
  "परिघ",
  "शिव",
  "सिद्ध",
  "साध्य",
  "शुभ",
  "शुक्ल",
  "ब्रह्म",
  "इन्द्र",
  "वैधृति",
];

const YOGA_TE = [
  "విష్కంభ",
  "ప్రీతి",
  "ఆయుష్మాన్",
  "సౌభాగ్య",
  "శోభన",
  "అతిగండ",
  "సుకర్మ",
  "ధృతి",
  "శూల",
  "గండ",
  "వృద్ధి",
  "ధ్రువ",
  "వ్యాఘాత",
  "హర్షణ",
  "వజ్ర",
  "సిద్ధి",
  "వ్యతీపాత",
  "వరీయాన్",
  "పరిఘ",
  "శివ",
  "సిద్ధ",
  "సాధ్య",
  "శుభ",
  "శుక్ల",
  "బ్రహ్మ",
  "ఇంద్ర",
  "వైధృతి",
];

const YOGA_TA = [
  "விஷ்கம்பம்",
  "பிரீதி",
  "ஆயுஷ்மான்",
  "சௌபாக்யம்",
  "சோபனம்",
  "அதிகண்டம்",
  "சுகர்மா",
  "திருதி",
  "சூலம்",
  "கண்டம்",
  "விருத்தி",
  "த்ருவம்",
  "வ்யாகாதம்",
  "ஹர்ஷணம்",
  "வஜ்ரம்",
  "சித்தி",
  "வ்யதீபாதம்",
  "வரீயான்",
  "பரிகம்",
  "சிவம்",
  "சித்தம்",
  "சாத்யம்",
  "சுபம்",
  "சுக்லம்",
  "பிரம்மா",
  "இந்திரன்",
  "வைத்ருதி",
];

const YOGA_KN = [
  "ವಿಷ್ಕಂಭ",
  "ಪ್ರೀತಿ",
  "ಆಯುಷ್ಮಾನ್",
  "ಸೌಭಾಗ್ಯ",
  "ಶೋಭನ",
  "ಅತಿಗಂಡ",
  "ಸುಕರ್ಮ",
  "ಧೃತಿ",
  "ಶೂಲ",
  "ಗಂಡ",
  "ವೃದ್ಧಿ",
  "ಧ್ರುವ",
  "ವ್ಯಾಘಾತ",
  "ಹರ್ಷಣ",
  "ವಜ್ರ",
  "ಸಿದ್ಧಿ",
  "ವ್ಯತೀಪಾತ",
  "ವರೀಯಾನ್",
  "ಪರಿಘ",
  "ಶಿವ",
  "ಸಿದ್ಧ",
  "ಸಾಧ್ಯ",
  "ಶುಭ",
  "ಶುಕ್ಲ",
  "ಬ್ರಹ್ಮ",
  "ಇಂದ್ರ",
  "ವೈಧೃತಿ",
];

const KARANA_EN = [
  "Kimstughna",
  "Bava",
  "Balava",
  "Kaulava",
  "Taitila",
  "Gara",
  "Vanija",
  "Vishti",
  "Shakuni",
  "Chatushpada",
  "Naga",
];

const KARANA_HI = [
  "किंस्तुघ्न",
  "बव",
  "बालव",
  "कौलव",
  "तैतिल",
  "गर",
  "वणिज",
  "विष्टि",
  "शकुनि",
  "चतुष्पाद",
  "नाग",
];

const KARANA_TE = [
  "కింస్తుఘ్న",
  "బవ",
  "బాలవ",
  "కౌలవ",
  "తైతిల",
  "గర",
  "వణిజ",
  "విష్టి",
  "శకుని",
  "చతుష్పాద",
  "నాగ",
];

const KARANA_TA = [
  "கிம்ஸ்துக்ன",
  "பவ",
  "பாலவ",
  "கௌலவ",
  "தைதில",
  "கர",
  "வணிஜ",
  "விஷ்டி",
  "சகுனி",
  "சதுஷ்பாத",
  "நாக",
];

const KARANA_KN = [
  "ಕಿಂಸ್ತುಘ್ನ",
  "ಬವ",
  "ಬಾಲವ",
  "ಕೌಲವ",
  "ತೈತಿಲ",
  "ಗರ",
  "ವಣಿಜ",
  "ವಿಷ್ಟಿ",
  "ಶಕುನಿ",
  "ಚತುಷ್ಪಾದ",
  "ನಾಗ",
];

const VARA_EN = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const VARA_HI = ["रविवार", "सोमवार", "मंगलवार", "बुधवार", "गुरुवार", "शुक्रवार", "शनिवार"];
const VARA_TE = ["ఆదివారం", "సోమవారం", "మంగళవారం", "బుధవారం", "గురువారం", "శుక్రవారం", "శనివారం"];
const VARA_TA = ["ஞாயிறு", "திங்கள்", "செவ்வாய்", "புதன்", "வியாழன்", "வெள்ளி", "சனி"];
const VARA_KN = ["ಭಾನುವಾರ", "ಸೋಮವಾರ", "ಮಂಗಳವಾರ", "ಬುಧವಾರ", "ಗುರುವಾರ", "ಶುಕ್ರವಾರ", "ಶನಿವಾರ"];

const PAKSHA = {
  en: { shukla: "Shukla Paksha", krishna: "Krishna Paksha" },
  hi: { shukla: "शुक्ल पक्ष", krishna: "कृष्ण पक्ष" },
  mr: { shukla: "शुक्ल पक्ष", krishna: "कृष्ण पक्ष" },
  kn: { shukla: "ಶುಕ್ಲ ಪಕ್ಷ", krishna: "ಕೃಷ್ಣ ಪಕ್ಷ" },
  te: { shukla: "శుక్ల పక్షం", krishna: "కృష్ణ పక్షం" },
  ta: { shukla: "சுக்கில பக்ஷம்", krishna: "கிருஷ்ண பக்ஷம்" },
} as const;

const LOCALE_TABLE: Record<
  Locale,
  { tithis: string[]; yogas: string[]; karanas: string[]; varas: string[] }
> = {
  en: { tithis: TITHI_EN, yogas: YOGA_EN, karanas: KARANA_EN, varas: VARA_EN },
  hi: { tithis: TITHI_HI, yogas: YOGA_HI, karanas: KARANA_HI, varas: VARA_HI },
  mr: { tithis: TITHI_HI, yogas: YOGA_HI, karanas: KARANA_HI, varas: VARA_HI },
  kn: { tithis: TITHI_KN, yogas: YOGA_KN, karanas: KARANA_KN, varas: VARA_KN },
  te: { tithis: TITHI_TE, yogas: YOGA_TE, karanas: KARANA_TE, varas: VARA_TE },
  ta: { tithis: TITHI_TA, yogas: YOGA_TA, karanas: KARANA_TA, varas: VARA_TA },
};

export function getTithiName(locale: Locale, index: number): string {
  return LOCALE_TABLE[locale].tithis[index - 1] ?? String(index);
}

export function getYogaName(locale: Locale, index: number): string {
  return LOCALE_TABLE[locale].yogas[index - 1] ?? String(index);
}

export function getKaranaName(locale: Locale, index: number): string {
  return LOCALE_TABLE[locale].karanas[index - 1] ?? String(index);
}

export function getVaraName(locale: Locale, weekday: number): string {
  return LOCALE_TABLE[locale].varas[weekday] ?? String(weekday);
}

export function getPakshaLabel(locale: Locale, paksha: "shukla" | "krishna"): string {
  return PAKSHA[locale][paksha];
}

export function getMoonRashiName(locale: Locale, rashi: number): string {
  return RASHIS[locale][rashi - 1] ?? String(rashi);
}

/** Rahukaal segment index (0–7) by weekday (0 = Sunday). */
export const RAHU_SEGMENT = [7, 1, 2, 3, 4, 5, 6] as const;
export const YAMA_SEGMENT = [4, 3, 2, 1, 0, 6, 5] as const;
export const GULIKA_SEGMENT = [6, 5, 4, 3, 2, 1, 0] as const;
