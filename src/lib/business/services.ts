import { getAmountPaise, type PaymentSku } from "@/lib/payments/config";

export type ServiceId =
  | "birth-chart"
  | "horoscope-forecasts"
  | "kundali-match"
  | "kundali-match-detailed"
  | "reading-single"
  | "reading-bundle";

export interface ServiceOffering {
  id: ServiceId;
  sku?: PaymentSku;
  pricePaise: number;
  free: boolean;
  checkoutPath?: string;
}

export function formatInr(paise: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(paise / 100);
}

export function getServiceCatalog(): ServiceOffering[] {
  const single = getAmountPaise("single");
  const bundle = getAmountPaise("bundle");
  const matchReport = getAmountPaise("match-report");

  return [
    { id: "birth-chart", pricePaise: 0, free: true },
    { id: "horoscope-forecasts", pricePaise: 0, free: true },
    { id: "kundali-match", pricePaise: 0, free: true },
    {
      id: "kundali-match-detailed",
      sku: "match-report",
      pricePaise: matchReport,
      free: false,
      checkoutPath: "/checkout?sku=match-report",
    },
    {
      id: "reading-single",
      sku: "single",
      pricePaise: single,
      free: false,
      checkoutPath: "/checkout?sku=single",
    },
    {
      id: "reading-bundle",
      sku: "bundle",
      pricePaise: bundle,
      free: false,
      checkoutPath: "/checkout?sku=bundle",
    },
  ];
}
