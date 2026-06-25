/** Canonical URL slugs — same across all locales (index 0 = Aries / Mesha). */
export const RASHI_SLUGS = [
  "aries",
  "taurus",
  "gemini",
  "cancer",
  "leo",
  "virgo",
  "libra",
  "scorpio",
  "sagittarius",
  "capricorn",
  "aquarius",
  "pisces",
] as const;

export type RashiSlug = (typeof RASHI_SLUGS)[number];

export function isRashiSlug(value: string): value is RashiSlug {
  return (RASHI_SLUGS as readonly string[]).includes(value);
}

export function rashiSlugToIndex(slug: string): number | null {
  const index = RASHI_SLUGS.indexOf(slug as RashiSlug);
  return index >= 0 ? index : null;
}

export function rashiIndexToSlug(index: number): RashiSlug {
  return RASHI_SLUGS[index] ?? RASHI_SLUGS[0];
}
