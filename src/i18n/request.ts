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
import dailyEn from "../messages/daily-en.json";
import dailyHi from "../messages/daily-hi.json";
import dailyKn from "../messages/daily-kn.json";
import dailyMr from "../messages/daily-mr.json";
import dailyTe from "../messages/daily-te.json";
import dailyTa from "../messages/daily-ta.json";
import monthlyEn from "../messages/monthly-en.json";
import monthlyHi from "../messages/monthly-hi.json";
import monthlyKn from "../messages/monthly-kn.json";
import monthlyMr from "../messages/monthly-mr.json";
import monthlyTe from "../messages/monthly-te.json";
import monthlyTa from "../messages/monthly-ta.json";
import { isLocale } from "@/lib/i18n/locales";

const messages = {
  en: { ...en, landing: landingEn, weekly: weeklyEn, daily: dailyEn, monthly: monthlyEn },
  hi: { ...hi, landing: landingHi, weekly: weeklyHi, daily: dailyHi, monthly: monthlyHi },
  mr: { ...mr, landing: landingMr, weekly: weeklyMr, daily: dailyMr, monthly: monthlyMr },
  kn: { ...kn, landing: landingKn, weekly: weeklyKn, daily: dailyKn, monthly: monthlyKn },
  te: { ...te, landing: landingTe, weekly: weeklyTe, daily: dailyTe, monthly: monthlyTe },
  ta: { ...ta, landing: landingTa, weekly: weeklyTa, daily: dailyTa, monthly: monthlyTa },
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
