import { NextResponse } from "next/server";
import { canGenerateTeaser, generateReadingTeaser } from "@/lib/anthropic/teaser";
import { parseLocale } from "@/lib/i18n/locales";
import { calculateVedicChart } from "@/lib/vedic/chart";
import type { BirthInput } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 90;

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as BirthInput;

    if (!body.date || !body.time || !body.timezone) {
      return NextResponse.json(
        { error: "Missing birth date, time, or timezone" },
        { status: 400 },
      );
    }

    if (
      typeof body.latitude !== "number" ||
      typeof body.longitude !== "number" ||
      Number.isNaN(body.latitude) ||
      Number.isNaN(body.longitude)
    ) {
      return NextResponse.json({ error: "Invalid coordinates" }, { status: 400 });
    }

    const chart = await calculateVedicChart(body);
    const locale = parseLocale(body.locale);

    let teaser = null;
    if (canGenerateTeaser()) {
      try {
        teaser = await generateReadingTeaser(chart, locale);
      } catch (error) {
        console.error("Teaser generation error:", error);
      }
    }

    return NextResponse.json({ chart, teaser });
  } catch (error) {
    console.error("Chart calculation error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Chart calculation failed" },
      { status: 500 },
    );
  }
}
