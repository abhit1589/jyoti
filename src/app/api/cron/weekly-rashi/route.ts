import { NextResponse } from "next/server";
import { LOCALES } from "@/lib/i18n/locales";
import { warmWeeklyRashiHoroscopes } from "@/lib/weekly-rashi/service";

export const runtime = "nodejs";
export const maxDuration = 300;

/** Warm the weekly cache for all locales (call from Vercel Cron once per week). */
export async function GET(request: Request) {
  const auth = request.headers.get("authorization");
  const secret = process.env.CRON_SECRET;

  if (secret && auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await warmWeeklyRashiHoroscopes(LOCALES);
    return NextResponse.json({ ok: true, locales: LOCALES.length });
  } catch (error) {
    console.error("Weekly rashi cron error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Cron failed" },
      { status: 500 },
    );
  }
}
