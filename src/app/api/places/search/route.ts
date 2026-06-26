import { NextResponse } from "next/server";
import { isLocale } from "@/lib/i18n/locales";
import { searchPlaces } from "@/lib/vedic/places-server";
import type { Locale } from "@/lib/types";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") ?? "";
  const localeParam = searchParams.get("locale") ?? "en";
  const locale = (isLocale(localeParam) ? localeParam : "en") as Locale;
  const limit = Math.min(20, Math.max(1, Number(searchParams.get("limit") ?? 12)));

  const results = searchPlaces(q, locale, limit);
  return NextResponse.json({ results });
}
