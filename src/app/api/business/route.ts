import { NextResponse } from "next/server";
import { getBusinessDetails } from "@/lib/business/config";

export const runtime = "nodejs";

/** Public merchant details for checkout and PayU verification. */
export async function GET() {
  const business = getBusinessDetails();
  return NextResponse.json({
    legalName: business.legalName,
    proprietorName: business.proprietorName,
    aadhaarAddress: business.aadhaarAddress,
    email: business.email,
    phone: business.phone,
    website: business.website,
  });
}
