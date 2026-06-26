import { NextResponse } from "next/server";
import { isLocale } from "@/lib/i18n/locales";
import { getPlaceById } from "@/lib/vedic/places-server";
import type { Locale } from "@/lib/types";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  const place = getPlaceById(id);
  if (!place) {
    return NextResponse.json({ error: "Unknown place" }, { status: 404 });
  }

  const localeParam = searchParams.get("locale") ?? "en";
  const locale = (isLocale(localeParam) ? localeParam : "en") as Locale;

  return NextResponse.json({
    id: place.id,
    label: place.name[locale] || place.name.en,
    state: place.state,
    latitude: place.latitude,
    longitude: place.longitude,
    timezone: place.timezone,
  });
}
