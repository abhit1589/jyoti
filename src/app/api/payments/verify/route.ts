import { NextResponse } from "next/server";
import { getAmountPaise, isPaymentsEnabled } from "@/lib/payments/config";
import {
  getReadingOrderAmount,
  normalizeReadingSelection,
} from "@/lib/payments/reading-order";
import {
  addEntitlement,
  entitlementCookieOptions,
  ENTITLEMENTS_COOKIE,
  readEntitlementStore,
  serializeEntitlementStore,
  type Entitlement,
} from "@/lib/payments/entitlements";
import {
  createRazorpayOrder,
  validatePaidOrder,
  verifyPaymentSignature,
} from "@/lib/payments/razorpay-server";

export const runtime = "nodejs";

type VerifyBody = {
  razorpay_order_id?: string;
  razorpay_payment_id?: string;
  razorpay_signature?: string;
};

export async function POST(request: Request) {
  if (!isPaymentsEnabled()) {
    return NextResponse.json({ error: "Payments are not enabled" }, { status: 503 });
  }

  try {
    const body = (await request.json()) as VerifyBody;
    const orderId = body.razorpay_order_id?.trim();
    const paymentId = body.razorpay_payment_id?.trim();
    const signature = body.razorpay_signature?.trim();

    if (!orderId || !paymentId || !signature) {
      return NextResponse.json({ error: "Missing payment details" }, { status: 400 });
    }

    if (!verifyPaymentSignature(orderId, paymentId, signature)) {
      return NextResponse.json({ error: "Invalid payment signature" }, { status: 400 });
    }

    const order = await validatePaidOrder(orderId, paymentId);
    const expectedAmount =
      order.focuses?.length
        ? getReadingOrderAmount(normalizeReadingSelection(order.focuses))
        : getAmountPaise(order.sku);
    if (order.amount !== expectedAmount || order.currency !== "INR") {
      return NextResponse.json({ error: "Payment amount mismatch" }, { status: 400 });
    }

    const entitlement: Entitlement = {
      orderId,
      paymentId,
      chartId: order.chartId,
      sku: order.sku,
      focus: order.focus,
      focuses: order.focuses,
      consumed: [],
      createdAt: new Date().toISOString(),
    };

    const store = await readEntitlementStore();
    const updated = addEntitlement(store, entitlement);
    const response = NextResponse.json({
      ok: true,
      chartId: order.chartId,
      sku: order.sku,
      focus: order.focus ?? null,
      focuses: order.focuses ?? null,
    });

    response.cookies.set(
      ENTITLEMENTS_COOKIE,
      serializeEntitlementStore(updated),
      entitlementCookieOptions(),
    );

    return response;
  } catch (error) {
    console.error("Verify payment error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Payment verification failed" },
      { status: 500 },
    );
  }
}
