import { ALL_READING_FOCUSES, getAmountPaise } from "@/lib/payments/config";
import { parseReadingFocusList } from "@/lib/readings/parse-focus";
import type { ReadingFocus } from "@/lib/types";

export function serializeReadingFocusList(focuses: ReadingFocus[]): string {
  return focuses.join(",");
}

export function isFullReadingBundle(focuses: ReadingFocus[]): boolean {
  if (focuses.length !== ALL_READING_FOCUSES.length) return false;
  return ALL_READING_FOCUSES.every((focus) => focuses.includes(focus));
}

export function getReadingOrderAmount(focuses: ReadingFocus[]): number {
  if (focuses.length === 0) return 0;
  if (isFullReadingBundle(focuses)) {
    return getAmountPaise("bundle");
  }
  return getAmountPaise("single") * focuses.length;
}

export function normalizeReadingSelection(focuses: ReadingFocus[]): ReadingFocus[] {
  const unique = [...new Set(focuses)].filter((f) => ALL_READING_FOCUSES.includes(f));
  return ALL_READING_FOCUSES.filter((f) => unique.includes(f));
}

export function parseReadingsQuery(value: string | null | undefined): ReadingFocus[] {
  if (!value?.trim()) return [];
  return normalizeReadingSelection(parseReadingFocusList(value));
}
