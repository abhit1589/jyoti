import { NextResponse } from "next/server";
import { getChartId } from "@/lib/payments/chart-id";
import {
  ALL_READING_FOCUSES,
  getPublicPaymentConfig,
  isPaymentsEnabled,
  type PaymentSku,
} from "@/lib/payments/config";
import {
  getReadingOrderAmount,
  isFullReadingBundle,
  normalizeReadingSelection,
} from "@/lib/payments/reading-order";
import { createRazorpayOrder } from "@/lib/payments/razorpay-server";
import { parseReadingFocusList } from "@/lib/readings/parse-focus";
import type { ReadingFocus, VedicChart } from "@/lib/types";

export const runtime = "nodejs";

type CreateOrderBody = {
  sku?: PaymentSku;
  focus?: ReadingFocus;
  focuses?: ReadingFocus[] | string;
  chart?: VedicChart;
};

export async function POST(request: Request) {
  if (!isPaymentsEnabled()) {
    return NextResponse.json({ error: "Payments are not enabled" }, { status: 503 });
  }

  try {
    const body = (await request.json()) as CreateOrderBody;
    let focuses = normalizeReadingSelection(parseReadingFocusList(body.focuses ?? body.focus));
    const sku: PaymentSku =
      body.sku === "match-report"
        ? "match-report"
        : body.sku === "bundle"
          ? "bundle"
          : focuses.length && isFullReadingBundle(focuses)
            ? "bundle"
            : "single";

    if (sku === "bundle" && focuses.length === 0) {
      focuses = [...ALL_READING_FOCUSES];
    }

    if (!body.chart?.birth?.date || !body.chart.planets?.length) {
      return NextResponse.json({ error: "Generate a chart first" }, { status: 400 });
    }

    if (sku !== "match-report" && sku === "single" && focuses.length === 0) {
      return NextResponse.json({ error: "Select at least one reading section" }, { status: 400 });
    }

    const chartId = getChartId(body.chart);
    const order = await createRazorpayOrder({
      sku,
      chartId,
      focus: sku === "single" && focuses.length === 1 && !body.focuses ? focuses[0] : undefined,
      focuses:
        sku === "match-report"
          ? undefined
          : sku === "bundle"
            ? focuses
            : focuses.length > 0
              ? focuses
              : undefined,
    });

    const expectedAmount =
      sku === "match-report"
        ? order.amount
        : focuses.length
          ? getReadingOrderAmount(focuses)
          : order.amount;

    if (order.amount !== expectedAmount) {
      throw new Error("Order amount mismatch");
    }

    const config = getPublicPaymentConfig();

    return NextResponse.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      description: order.description,
      keyId: config.keyId,
      chartId,
      sku: order.sku,
      focus: order.focus ?? null,
      focuses: order.focuses ?? null,
    });
  } catch (error) {
    console.error("Create order error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not create order" },
      { status: 500 },
    );
  }
}
