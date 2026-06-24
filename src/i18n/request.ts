import { getRequestConfig } from "next-intl/server";
import { routing } from "./routing";
import en from "../messages/en.json";
import hi from "../messages/hi.json";
import kn from "../messages/kn.json";
import mr from "../messages/mr.json";
import te from "../messages/te.json";
import ta from "../messages/ta.json";
import landingEn from "../messages/landing-en.json";
import landingHi from "../messages/landing-hi.json";
import landingKn from "../messages/landing-kn.json";
import landingMr from "../messages/landing-mr.json";
import landingTe from "../messages/landing-te.json";
import landingTa from "../messages/landing-ta.json";
import weeklyEn from "../messages/weekly-en.json";
import weeklyHi from "../messages/weekly-hi.json";
import weeklyKn from "../messages/weekly-kn.json";
import weeklyMr from "../messages/weekly-mr.json";
import weeklyTe from "../messages/weekly-te.json";
import weeklyTa from "../messages/weekly-ta.json";
import { isLocale } from "@/lib/i18n/locales";

const messages = {
  en: { ...en, landing: landingEn, weekly: weeklyEn },
  hi: { ...hi, landing: landingHi, weekly: weeklyHi },
  mr: { ...mr, landing: landingMr, weekly: weeklyMr },
  kn: { ...kn, landing: landingKn, weekly: weeklyKn },
  te: { ...te, landing: landingTe, weekly: weeklyTe },
  ta: { ...ta, landing: landingTa, weekly: weeklyTa },
} as const;

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;

  if (!locale || !isLocale(locale)) {
    locale = routing.defaultLocale;
  }

  return {
    locale,
    messages: messages[locale as keyof typeof messages],
  };
});
