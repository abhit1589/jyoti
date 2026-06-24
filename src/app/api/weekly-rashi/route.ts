import { NextResponse } from "next/server";
import { getWeeklyRashiHoroscopes } from "@/lib/weekly-rashi/service";
import { isLocale } from "@/lib/i18n/locales";
import { routing } from "@/i18n/routing";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const localeParam = searchParams.get("locale") ?? routing.defaultLocale;

  if (!isLocale(localeParam)) {
    return NextResponse.json({ error: "Invalid locale" }, { status: 400 });
  }

  try {
    const payload = await getWeeklyRashiHoroscopes(localeParam);
    return NextResponse.json(payload);
  } catch (error) {
    console.error("Weekly rashi error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load weekly horoscopes" },
      { status: 503 },
    );
  }
}
