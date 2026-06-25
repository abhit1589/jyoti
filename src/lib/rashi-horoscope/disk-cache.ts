import { mkdir, readFile, writeFile } from "fs/promises";
import { join } from "path";
import type { Locale } from "@/lib/types";
import type { RashiHoroscopePayload } from "@/lib/rashi-horoscope/types";

export type AllLocalesHoroscopePayload = Record<Locale, RashiHoroscopePayload>;

function cachePath(period: string, periodId: string): string {
  return join(process.cwd(), ".cache", period, `${periodId}.json`);
}

export async function readHoroscopeDiskCache(
  period: string,
  periodId: string,
): Promise<AllLocalesHoroscopePayload | null> {
  try {
    const raw = await readFile(cachePath(period, periodId), "utf8");
    return JSON.parse(raw) as AllLocalesHoroscopePayload;
  } catch {
    return null;
  }
}

export async function writeHoroscopeDiskCache(
  period: string,
  periodId: string,
  data: AllLocalesHoroscopePayload,
): Promise<void> {
  const file = cachePath(period, periodId);
  await mkdir(join(process.cwd(), ".cache", period), { recursive: true });
  await writeFile(file, JSON.stringify(data), "utf8");
}
