import { NextResponse } from "next/server";
import { calculatePanchang } from "@/lib/panchang/calculate";
import { todayInTimezone } from "@/lib/panchang/date";
import { getCityById } from "@/lib/vedic/cities";
import { isLocale } from "@/lib/i18n/locales";
import { routing } from "@/i18n/routing";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const cityId = searchParams.get("city") ?? "hyderabad";
  const localeParam = searchParams.get("locale") ?? routing.defaultLocale;

  if (!isLocale(localeParam)) {
    return NextResponse.json({ error: "Invalid locale" }, { status: 400 });
  }

  const city = getCityById(cityId);
  if (!city) {
    return NextResponse.json({ error: "Unknown city" }, { status: 400 });
  }

  const dateParam = searchParams.get("date");
  const date = dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam)
    ? dateParam
    : todayInTimezone(city.timezone);

  try {
    const payload = await calculatePanchang(date, city.id, localeParam);
    return NextResponse.json(payload, {
      headers: {
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
      },
    });
  } catch (error) {
    console.error("Panchang error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to calculate Panchang" },
      { status: 500 },
    );
  }
}
