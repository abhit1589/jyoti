import type { ReadingFocus } from "@/lib/types";

export type PaymentSku = "single" | "bundle" | "match-report";

export const ALL_READING_FOCUSES: ReadingFocus[] = ["personality", "career", "dasha"];

export function isPaymentsEnabled(): boolean {
  if (process.env.PAYMENTS_ENABLED === "false") return false;
  return Boolean(
    process.env.RAZORPAY_KEY_ID?.trim() && process.env.RAZORPAY_KEY_SECRET?.trim(),
  );
}

export function getRazorpayKeyId(): string {
  const keyId = process.env.RAZORPAY_KEY_ID?.trim();
  if (!keyId) {
    throw new Error("Razorpay is not configured");
  }
  return keyId;
}

export function getRazorpayKeySecret(): string {
  const secret = process.env.RAZORPAY_KEY_SECRET?.trim();
  if (!secret) {
    throw new Error("Razorpay is not configured");
  }
  return secret;
}

export function getAmountPaise(sku: PaymentSku): number {
  if (sku === "bundle") {
    return Number(process.env.PAYMENT_AMOUNT_BUNDLE_PAISE ?? "25000");
  }
  if (sku === "match-report") {
    return Number(process.env.PAYMENT_AMOUNT_MATCH_REPORT_PAISE ?? "25000");
  }
  return Number(process.env.PAYMENT_AMOUNT_SINGLE_PAISE ?? "10000");
}

export function getSkuDescription(sku: PaymentSku, focus?: ReadingFocus): string {
  if (sku === "bundle") {
    return "Complete Jyotish reading (Personality + Career + Dasha)";
  }
  if (sku === "match-report") {
    return "Kundali matching — detailed compatibility analysis";
  }
  const label =
    focus === "career" ? "Career & Dharma" : focus === "dasha" ? "Current Dasha" : "Personality";
  return `Jyotish reading — ${label}`;
}

export function getPublicPaymentConfig() {
  return {
    enabled: isPaymentsEnabled(),
    keyId: isPaymentsEnabled() ? getRazorpayKeyId() : null,
    amounts: {
      single: getAmountPaise("single"),
      bundle: getAmountPaise("bundle"),
      matchReport: getAmountPaise("match-report"),
    },
    currency: "INR" as const,
    brandName: process.env.PAYMENT_BRAND_NAME?.trim() || "Taara Jyotishyam",
  };
}
