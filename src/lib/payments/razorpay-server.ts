import Razorpay from "razorpay";
import { createHmac } from "crypto";
import {
  getAmountPaise,
  getRazorpayKeyId,
  getRazorpayKeySecret,
  getSkuDescription,
  type PaymentSku,
} from "@/lib/payments/config";
import type { ReadingFocus } from "@/lib/types";

let client: Razorpay | null = null;

function getClient(): Razorpay {
  if (!client) {
    client = new Razorpay({
      key_id: getRazorpayKeyId(),
      key_secret: getRazorpayKeySecret(),
    });
  }
  return client;
}

export function verifyPaymentSignature(
  orderId: string,
  paymentId: string,
  signature: string,
): boolean {
  const expected = createHmac("sha256", getRazorpayKeySecret())
    .update(`${orderId}|${paymentId}`)
    .digest("hex");

  return expected === signature;
}

export async function createRazorpayOrder(input: {
  sku: PaymentSku;
  chartId: string;
  focus?: ReadingFocus;
}): Promise<{
  id: string;
  amount: number;
  currency: string;
  description: string;
}> {
  const amount = getAmountPaise(input.sku);
  const description = getSkuDescription(input.sku, input.focus);

  const order = await getClient().orders.create({
    amount,
    currency: "INR",
    receipt: `tj_${Date.now().toString(36)}`,
    notes: {
      chartId: input.chartId,
      sku: input.sku,
      ...(input.focus ? { focus: input.focus } : {}),
    },
  });

  return {
    id: order.id,
    amount: Number(order.amount),
    currency: order.currency,
    description,
  };
}

export async function validatePaidOrder(
  orderId: string,
  paymentId: string,
): Promise<{
  amount: number;
  currency: string;
  chartId: string;
  sku: PaymentSku;
  focus?: ReadingFocus;
}> {
  const payment = await getClient().payments.fetch(paymentId);

  if (payment.order_id !== orderId) {
    throw new Error("Payment does not match order");
  }

  if (payment.status !== "captured") {
    throw new Error("Payment not completed");
  }

  const order = await getClient().orders.fetch(orderId);
  const notes = order.notes ?? {};

  const chartId = typeof notes.chartId === "string" ? notes.chartId : "";
  const sku = notes.sku === "bundle" ? "bundle" : "single";
  const focus =
    notes.focus === "career" || notes.focus === "dasha" || notes.focus === "personality"
      ? notes.focus
      : undefined;

  if (!chartId) {
    throw new Error("Order is missing chart reference");
  }

  if (Number(payment.amount) !== Number(order.amount)) {
    throw new Error("Payment amount mismatch");
  }

  return {
    amount: Number(order.amount),
    currency: order.currency,
    chartId,
    sku,
    focus: sku === "single" ? focus ?? "personality" : undefined,
  };
}
