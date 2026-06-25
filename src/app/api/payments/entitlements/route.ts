import { NextResponse } from "next/server";
import { getChartId } from "@/lib/payments/chart-id";
import { isPaymentsEnabled } from "@/lib/payments/config";
import {
  getChartEntitlementStatus,
  readEntitlementStore,
} from "@/lib/payments/entitlements";
import type { VedicChart } from "@/lib/types";

export const runtime = "nodejs";

type EntitlementsBody = {
  chart?: VedicChart;
};

export async function POST(request: Request) {
  const paymentsEnabled = isPaymentsEnabled();

  try {
    const body = (await request.json()) as EntitlementsBody;
    if (!body.chart?.birth?.date) {
      return NextResponse.json({ error: "Chart required" }, { status: 400 });
    }

    const chartId = getChartId(body.chart);
    const store = await readEntitlementStore();
    const status = getChartEntitlementStatus(store, chartId, paymentsEnabled);

    return NextResponse.json({
      chartId,
      ...status,
    });
  } catch (error) {
    console.error("Entitlements error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not load entitlements" },
      { status: 500 },
    );
  }
}
