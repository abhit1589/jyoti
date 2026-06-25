import { NextResponse } from "next/server";
import { LOCALES } from "@/lib/i18n/locales";
import { warmMonthlyRashiHoroscopes } from "@/lib/monthly-rashi/service";

export const runtime = "nodejs";
export const maxDuration = 300;

/** Warm the monthly cache for all locales (Vercel Cron — 1st of month, ~3:30 AM IST). */
export async function GET(request: Request) {
  const auth = request.headers.get("authorization");
  const secret = process.env.CRON_SECRET;

  if (secret && auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await warmMonthlyRashiHoroscopes(LOCALES);
    return NextResponse.json({ ok: true, locales: LOCALES.length });
  } catch (error) {
    console.error("Monthly rashi cron error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Cron failed" },
      { status: 500 },
    );
  }
}
