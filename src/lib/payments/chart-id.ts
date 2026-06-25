import { createHash } from "crypto";
import type { VedicChart } from "@/lib/types";

/** Stable id tying a payment to one birth chart. */
export function getChartId(chart: VedicChart): string {
  const { birth } = chart;
  const payload = [
    birth.date,
    birth.time,
    birth.timezone,
    birth.latitude.toFixed(5),
    birth.longitude.toFixed(5),
  ].join("|");

  return createHash("sha256").update(payload).digest("hex").slice(0, 24);
}
