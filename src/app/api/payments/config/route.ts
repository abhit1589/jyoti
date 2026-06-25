import { NextResponse } from "next/server";
import { getPublicPaymentConfig } from "@/lib/payments/config";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json(getPublicPaymentConfig());
}
