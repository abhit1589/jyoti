import { LOCALES } from "@/lib/i18n/locales";
import type { Locale } from "@/lib/types";

export const LANGUAGE_RULE: Record<Locale, string> = {
  en: "Write in warm, simple English. No astrological jargon in the output.",
  hi: "पूरा उत्तर सरल हिंदी में। ज्योतिष शब्द नहीं।",
  mr: "संपूर्ण मराठीत, साधी भाषा. ज्योतिष शब्द नाहीत.",
  kn: "ಸಂಪೂರ್ಣ ಸರಳ ಕನ್ನಡದಲ್ಲಿ. ಜ್ಯೋತಿಷ್ಯ ಪದಗಳಿಲ್ಲ.",
  te: "పూర్తిగా సాధారణ తెలుగులో. జ్యోತిష పదాలు వద్దు.",
  ta: "முழுவதும் எளிய தமிழில். ஜோதிடச் சொற்கள் வேண்டாம்.",
};

export function parseHoroscopes(text: string): Record<string, string> {
  const trimmed = text.trim();
  const jsonMatch = trimmed.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("Horoscope response was not valid JSON");
  }
  const parsed = JSON.parse(jsonMatch[0]) as Record<string, string>;
  const result: Record<string, string> = {};
  for (let i = 1; i <= 12; i++) {
    const key = String(i);
    const value = parsed[key] ?? parsed[key as unknown as number];
    if (!value?.trim()) {
      throw new Error(`Missing horoscope for rashi ${i}`);
    }
    result[key] = value.trim();
  }
  return result;
}

export function parseHoroscopesForLocales(
  text: string,
  locales: readonly Locale[],
): Partial<Record<Locale, Record<string, string>>> {
  const trimmed = text.trim();
  const jsonMatch = trimmed.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("Horoscope response was not valid JSON");
  }

  const parsed = JSON.parse(jsonMatch[0]) as Record<string, Record<string, string>>;
  const result: Partial<Record<Locale, Record<string, string>>> = {};

  for (const locale of locales) {
    const block = parsed[locale];
    if (!block || typeof block !== "object") {
      throw new Error(`Missing horoscope block for locale ${locale}`);
    }
    result[locale] = parseHoroscopes(JSON.stringify(block));
  }

  return result;
}

export function parseHoroscopesAllLocales(text: string): Record<Locale, Record<string, string>> {
  return parseHoroscopesForLocales(text, LOCALES) as Record<Locale, Record<string, string>>;
}
