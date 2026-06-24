import { getRequestConfig } from "next-intl/server";
import { routing } from "./routing";
import en from "../messages/en.json";
import hi from "../messages/hi.json";
import kn from "../messages/kn.json";
import mr from "../messages/mr.json";
import te from "../messages/te.json";
import ta from "../messages/ta.json";
import { isLocale } from "@/lib/i18n/locales";

const messages = { en, hi, mr, kn, te, ta } as const;

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
