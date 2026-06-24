import { NAKSHATRAS } from "@/lib/vedic/constants";
import type { Locale } from "@/lib/types";

export type RashiNakshatraPada = {
  nakshatra: number;
  padas: readonly number[];
};

/** Nakshatras (and which padas) that fall in each rashi — Mesha (0) through Meena (11). */
export const RASHI_NAKSHATRA_PADAS: readonly RashiNakshatraPada[][] = [
  [
    { nakshatra: 1, padas: [1, 2, 3, 4] },
    { nakshatra: 2, padas: [1, 2, 3, 4] },
    { nakshatra: 3, padas: [1] },
  ],
  [
    { nakshatra: 3, padas: [2, 3, 4] },
    { nakshatra: 4, padas: [1, 2, 3, 4] },
    { nakshatra: 5, padas: [1, 2] },
  ],
  [
    { nakshatra: 5, padas: [2, 3, 4] },
    { nakshatra: 6, padas: [1, 2, 3, 4] },
    { nakshatra: 7, padas: [1, 2, 3] },
  ],
  [
    { nakshatra: 7, padas: [4] },
    { nakshatra: 8, padas: [1, 2, 3, 4] },
    { nakshatra: 9, padas: [1, 2, 3, 4] },
  ],
  [
    { nakshatra: 10, padas: [1, 2, 3, 4] },
    { nakshatra: 11, padas: [1, 2, 3, 4] },
    { nakshatra: 12, padas: [1] },
  ],
  [
    { nakshatra: 12, padas: [2, 3, 4] },
    { nakshatra: 13, padas: [1, 2, 3, 4] },
    { nakshatra: 14, padas: [1, 2] },
  ],
  [
    { nakshatra: 14, padas: [2, 3, 4] },
    { nakshatra: 15, padas: [1, 2, 3, 4] },
    { nakshatra: 16, padas: [1, 2, 3] },
  ],
  [
    { nakshatra: 16, padas: [4] },
    { nakshatra: 17, padas: [1, 2, 3, 4] },
    { nakshatra: 18, padas: [1, 2, 3, 4] },
  ],
  [
    { nakshatra: 18, padas: [4] },
    { nakshatra: 19, padas: [1, 2, 3, 4] },
    { nakshatra: 20, padas: [1, 2, 3, 4] },
    { nakshatra: 21, padas: [1] },
  ],
  [
    { nakshatra: 21, padas: [2, 3, 4] },
    { nakshatra: 22, padas: [1, 2, 3, 4] },
    { nakshatra: 23, padas: [1, 2] },
  ],
  [
    { nakshatra: 23, padas: [3, 4] },
    { nakshatra: 24, padas: [1, 2, 3, 4] },
    { nakshatra: 25, padas: [1, 2, 3] },
  ],
  [
    { nakshatra: 25, padas: [4] },
    { nakshatra: 26, padas: [1, 2, 3, 4] },
    { nakshatra: 27, padas: [1, 2, 3, 4] },
  ],
] as const;

export function formatPadas(padas: readonly number[]): string {
  return padas.join(",");
}

export function formatRashiNakshatraPadas(locale: Locale, rashiIndex: number): string {
  const names = NAKSHATRAS[locale];
  const spans = RASHI_NAKSHATRA_PADAS[rashiIndex] ?? [];

  return spans
    .map(({ nakshatra, padas }) => {
      const name = names[nakshatra - 1];
      return `${name} ${formatPadas(padas)}`;
    })
    .join(" · ");
}
