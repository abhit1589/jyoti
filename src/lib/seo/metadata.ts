import type { Metadata } from "next";
import type { Locale } from "@/lib/types";
import { LOCALES } from "@/lib/i18n/locales";

export const SITE_URL = "https://jyotishyam.in";
export const SITE_NAME = "Taara Jyotishyam";
export const OG_IMAGE = `${SITE_URL}/icon/512`;

/** Build a locale-prefixed path, e.g. `/en/weekly/aries`. */
export function localePath(locale: Locale, path = ""): string {
  const normalized = path.replace(/^\//, "");
  return normalized ? `/${locale}/${normalized}` : `/${locale}`;
}

export function absoluteUrl(locale: Locale, path = ""): string {
  return `${SITE_URL}${localePath(locale, path)}`;
}

export function buildAlternates(locale: Locale, path = ""): Metadata["alternates"] {
  const languages: Record<string, string> = {
    "x-default": absoluteUrl("en", path),
  };
  for (const loc of LOCALES) {
    languages[loc] = absoluteUrl(loc, path);
  }
  return {
    canonical: absoluteUrl(locale, path),
    languages,
  };
}

export function buildPageMetadata({
  locale,
  path = "",
  title,
  description,
}: {
  locale: Locale;
  path?: string;
  title: string;
  description: string;
}): Metadata {
  const url = absoluteUrl(locale, path);
  return {
    title,
    description,
    alternates: buildAlternates(locale, path),
    openGraph: {
      title,
      description,
      url,
      siteName: SITE_NAME,
      locale,
      type: "website",
      images: [
        {
          url: OG_IMAGE,
          width: 512,
          height: 512,
          alt: SITE_NAME,
        },
      ],
    },
    twitter: {
      card: "summary",
      title,
      description,
      images: [OG_IMAGE],
    },
  };
}
