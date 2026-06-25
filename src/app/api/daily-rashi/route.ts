import { NextResponse } from "next/server";
import { getDailyRashiHoroscopes } from "@/lib/daily-rashi/service";
import { isLocale } from "@/lib/i18n/locales";
import { routing } from "@/i18n/routing";

export const runtime = "nodejs";
export const maxDuration = 120;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const localeParam = searchParams.get("locale") ?? routing.defaultLocale;

  if (!isLocale(localeParam)) {
    return NextResponse.json({ error: "Invalid locale" }, { status: 400 });
  }

  try {
    const payload = await getDailyRashiHoroscopes(localeParam);
    return NextResponse.json(payload);
  } catch (error) {
    console.error("Daily rashi error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load daily horoscopes" },
      { status: 503 },
    );
  }
}
