import type { Locale } from "@/lib/types";

export const LOCALES: Locale[] = ["en", "hi", "mr", "kn", "te", "ta"];

export const LOCALE_LABELS: Record<Locale, string> = {
  en: "English",
  hi: "हिन्दी",
  mr: "मराठी",
  kn: "ಕನ್ನಡ",
  te: "తెలుగు",
  ta: "தமிழ்",
};

export const LOCALE_FONT_CLASS: Record<Locale, string> = {
  en: "",
  hi: "font-[family-name:var(--font-devanagari)]",
  mr: "font-[family-name:var(--font-devanagari)]",
  kn: "font-[family-name:var(--font-kannada)]",
  te: "font-[family-name:var(--font-telugu)]",
  ta: "font-[family-name:var(--font-tamil)]",
};

export const READING_LANGUAGE: Record<Locale, string> = {
  en: "English",
  hi: "Hindi",
  mr: "Marathi",
  kn: "Kannada",
  te: "Telugu",
  ta: "Tamil",
};

export function isLocale(value: string): value is Locale {
  return LOCALES.includes(value as Locale);
}

export function parseLocale(value: string | undefined): Locale {
  if (value && isLocale(value)) return value;
  return "en";
}
