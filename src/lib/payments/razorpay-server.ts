import Razorpay from "razorpay";
import { createHmac } from "crypto";
import {
  getAmountPaise,
  getRazorpayKeyId,
  getRazorpayKeySecret,
  getSkuDescription,
  type PaymentSku,
} from "@/lib/payments/config";
import {
  getReadingOrderAmount,
  isFullReadingBundle,
  normalizeReadingSelection,
} from "@/lib/payments/reading-order";
import { parseReadingFocus, parseReadingFocusList } from "@/lib/readings/parse-focus";
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
  focuses?: ReadingFocus[];
}): Promise<{
  id: string;
  amount: number;
  currency: string;
  description: string;
  sku: PaymentSku;
  focus?: ReadingFocus;
  focuses?: ReadingFocus[];
}> {
  let amount: number;
  let description: string;
  let sku = input.sku;
  let focuses = input.focuses ? normalizeReadingSelection(input.focuses) : undefined;
  let focus = input.focus;

  if (input.sku === "match-report") {
    amount = getAmountPaise("match-report");
    description = getSkuDescription("match-report");
  } else if (focuses?.length) {
    amount = getReadingOrderAmount(focuses);
    sku = isFullReadingBundle(focuses) ? "bundle" : "single";
    description =
      sku === "bundle"
        ? getSkuDescription("bundle")
        : `Jyotish readings (${focuses.length} sections)`;
    focus = undefined;
  } else if (input.sku === "bundle") {
    amount = getAmountPaise("bundle");
    description = getSkuDescription("bundle");
    focuses = undefined;
    focus = undefined;
  } else {
    amount = getAmountPaise("single");
    description = getSkuDescription("single", focus ?? "personality");
    focuses = focus ? [focus] : undefined;
  }

  const order = await getClient().orders.create({
    amount,
    currency: "INR",
    receipt: `tj_${Date.now().toString(36)}`,
    notes: {
      chartId: input.chartId,
      sku,
      ...(focus ? { focus } : {}),
      ...(focuses?.length ? { focuses: focuses.join(",") } : {}),
    },
  });

  return {
    id: order.id,
    amount: Number(order.amount),
    currency: order.currency,
    description,
    sku,
    focus,
    focuses,
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
  focuses?: ReadingFocus[];
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
  if (!chartId) {
    throw new Error("Order is missing chart reference");
  }

  if (Number(payment.amount) !== Number(order.amount)) {
    throw new Error("Payment amount mismatch");
  }

  if (notes.sku === "match-report") {
    return {
      amount: Number(order.amount),
      currency: order.currency,
      chartId,
      sku: "match-report",
    };
  }

  const focusesRaw = typeof notes.focuses === "string" ? notes.focuses : "";
  const focuses = focusesRaw ? normalizeReadingSelection(parseReadingFocusList(focusesRaw)) : undefined;

  if (focuses?.length) {
    const sku = isFullReadingBundle(focuses) ? "bundle" : "single";
    return {
      amount: Number(order.amount),
      currency: order.currency,
      chartId,
      sku,
      focuses,
    };
  }

  const sku: PaymentSku = notes.sku === "bundle" ? "bundle" : "single";
  const focus = sku === "single" ? parseReadingFocus(notes.focus) : undefined;

  return {
    amount: Number(order.amount),
    currency: order.currency,
    chartId,
    sku,
    focus: sku === "single" ? focus : undefined,
  };
}
