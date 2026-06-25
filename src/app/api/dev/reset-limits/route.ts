import { NextResponse } from "next/server";
import { isUsageLimitsDisabled, resetUsageStore } from "@/lib/usage/limits";

export const runtime = "nodejs";

/** Dev-only: clear in-memory daily usage counters. */
export async function POST() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not available in production" }, { status: 404 });
  }

  resetUsageStore();

  return NextResponse.json({
    ok: true,
    cleared: "all",
    limitsDisabled: isUsageLimitsDisabled(),
  });
}
