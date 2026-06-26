import { NextResponse } from "next/server";
import { getAmountPaise } from "@/lib/payments/config";
import { getReadingOrderAmount, normalizeReadingSelection } from "@/lib/payments/reading-order";
import { parseReadingFocusList } from "@/lib/readings/parse-focus";
import type { PaymentSku } from "@/lib/payments/config";

export const runtime = "nodejs";

interface PayUInitiateBody {
  sku?: PaymentSku;
  focuses?: string[] | string;
  amountPaise?: number;
}

/** PayU checkout initiation — configure PAYU_* env vars to enable redirect. */
export async function POST(request: Request) {
  const merchantKey = process.env.PAYU_MERCHANT_KEY?.trim();
  const merchantSalt = process.env.PAYU_MERCHANT_SALT?.trim();

  let body: PayUInitiateBody = {};
  try {
    body = (await request.json()) as PayUInitiateBody;
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const sku = body.sku;
  if (sku !== "single" && sku !== "bundle" && sku !== "match-report") {
    return NextResponse.json({ error: "Invalid product" }, { status: 400 });
  }

  const focuses = normalizeReadingSelection(parseReadingFocusList(body.focuses));
  const amountPaise =
    typeof body.amountPaise === "number" && body.amountPaise > 0
      ? body.amountPaise
      : focuses.length > 0
        ? getReadingOrderAmount(focuses)
        : getAmountPaise(sku);

  if (!merchantKey || !merchantSalt) {
    return NextResponse.json(
      {
        error:
          "PayU is not configured yet. Enter your birth chart on the home page to purchase when payments go live.",
      },
      { status: 503 },
    );
  }

  const amountInr = (amountPaise / 100).toFixed(2);
  const baseUrl = process.env.PAYU_BASE_URL?.trim() || "https://test.payu.in";
  const successUrl =
    process.env.PAYU_SUCCESS_URL?.trim() || "https://jyotishyam.in/en/checkout?status=success";
  const failureUrl =
    process.env.PAYU_FAILURE_URL?.trim() || "https://jyotishyam.in/en/checkout?status=failed";

  return NextResponse.json({
    message: "PayU credentials are set. Complete SDK/hash integration in a follow-up deploy.",
    preview: {
      key: merchantKey,
      amount: amountInr,
      productinfo: focuses.length ? `readings:${focuses.join(",")}` : sku,
      surl: successUrl,
      furl: failureUrl,
      baseUrl,
    },
  });
}
