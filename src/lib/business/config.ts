/** Merchant details for PayU / payment-gateway verification. Set in Vercel env. */
export interface BusinessDetails {
  legalName: string;
  aadhaarAddress: string;
  email: string;
  phone: string;
  website: string;
}

const DEFAULT_AADHAAR_ADDRESS =
  "D401, Lansum Etania, Gachibowli, Ranga Reddy Dt. Hyderabad, Telangana 500089";

export function getBusinessDetails(): BusinessDetails {
  return {
    legalName:
      process.env.BUSINESS_LEGAL_NAME?.trim() ||
      process.env.NEXT_PUBLIC_BUSINESS_LEGAL_NAME?.trim() ||
      "Taara Jyotishyam",
    aadhaarAddress:
      process.env.BUSINESS_AADHAAR_ADDRESS?.trim() ||
      process.env.NEXT_PUBLIC_BUSINESS_AADHAAR_ADDRESS?.trim() ||
      DEFAULT_AADHAAR_ADDRESS,
    email: process.env.BUSINESS_EMAIL?.trim() || "support@jyotishyam.in",
    phone: process.env.BUSINESS_PHONE?.trim() || "",
    website: "https://jyotishyam.in",
  };
}
