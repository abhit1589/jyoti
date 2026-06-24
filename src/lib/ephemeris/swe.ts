import SwissEph from "swisseph-wasm";

type SweGlobal = {
  swe?: SwissEph;
  initPromise?: Promise<SwissEph>;
};

const globalForSwe = globalThis as typeof globalThis & SweGlobal;

export async function getSwe(): Promise<SwissEph> {
  if (globalForSwe.swe) {
    return globalForSwe.swe;
  }

  if (!globalForSwe.initPromise) {
    globalForSwe.initPromise = (async () => {
      const swe = new SwissEph();
      await swe.initSwissEph();
      globalForSwe.swe = swe;
      return swe;
    })();
  }

  return globalForSwe.initPromise;
}
