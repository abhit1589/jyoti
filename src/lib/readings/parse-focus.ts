import type { ReadingFocus } from "@/lib/types";

const VALID_FOCUSES: ReadingFocus[] = [
  "personality",
  "career",
  "dasha",
  "financial",
  "marriage",
];

export function parseReadingFocus(value: unknown): ReadingFocus {
  if (typeof value === "string" && VALID_FOCUSES.includes(value as ReadingFocus)) {
    return value as ReadingFocus;
  }
  return "personality";
}

export function parseReadingFocusList(value: unknown): ReadingFocus[] {
  if (Array.isArray(value)) {
    return value.filter(
      (item): item is ReadingFocus =>
        typeof item === "string" && VALID_FOCUSES.includes(item as ReadingFocus),
    );
  }
  if (typeof value === "string") {
    return value
      .split(",")
      .map((part) => part.trim())
      .filter((part): part is ReadingFocus =>
        VALID_FOCUSES.includes(part as ReadingFocus),
      );
  }
  return [];
}
