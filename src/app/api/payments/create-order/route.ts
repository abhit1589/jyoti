import { NextResponse } from "next/server";
import { getChartId } from "@/lib/payments/chart-id";
import {
  getAmountPaise,
  getPublicPaymentConfig,
  isPaymentsEnabled,
  type PaymentSku,
} from "@/lib/payments/config";
import { createRazorpayOrder } from "@/lib/payments/razorpay-server";
import type { ReadingFocus, VedicChart } from "@/lib/types";

export const runtime = "nodejs";

type CreateOrderBody = {
  sku?: PaymentSku;
  focus?: ReadingFocus;
  chart?: VedicChart;
};

function parseFocus(value: unknown): ReadingFocus {
  if (value === "career" || value === "dasha") return value;
  return "personality";
}

export async function POST(request: Request) {
  if (!isPaymentsEnabled()) {
    return NextResponse.json({ error: "Payments are not enabled" }, { status: 503 });
  }

  try {
    const body = (await request.json()) as CreateOrderBody;
    const sku: PaymentSku = body.sku === "bundle" ? "bundle" : "single";
    const focus = parseFocus(body.focus);

    if (!body.chart?.birth?.date || !body.chart.planets?.length) {
      return NextResponse.json({ error: "Generate a chart first" }, { status: 400 });
    }

    const chartId = getChartId(body.chart);
    const order = await createRazorpayOrder({
      sku,
      chartId,
      focus: sku === "single" ? focus : undefined,
    });

    const expectedAmount = getAmountPaise(sku);
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
      sku,
      focus: sku === "single" ? focus : null,
    });
  } catch (error) {
    console.error("Create order error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not create order" },
      { status: 500 },
    );
  }
}
