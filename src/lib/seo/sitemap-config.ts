import type { MetadataRoute } from "next";
import { LOCALES } from "@/lib/i18n/locales";
import { RASHI_SLUGS } from "@/lib/seo/rashi-slugs";
import { SITE_URL } from "@/lib/seo/metadata";

type ChangeFrequency = NonNullable<MetadataRoute.Sitemap[number]["changeFrequency"]>;

const INDEX_ROUTES: {
  path: "" | "daily" | "weekly" | "monthly" | "match";
  priority: number;
  changeFrequency: ChangeFrequency;
}[] = [
  { path: "", priority: 1, changeFrequency: "monthly" },
  { path: "daily", priority: 0.9, changeFrequency: "daily" },
  { path: "weekly", priority: 0.88, changeFrequency: "weekly" },
  { path: "monthly", priority: 0.88, changeFrequency: "monthly" },
  { path: "match", priority: 0.85, changeFrequency: "monthly" },
];

const RASHI_ROUTES: {
  period: "daily" | "weekly" | "monthly";
  priority: number;
  changeFrequency: ChangeFrequency;
}[] = [
  { period: "daily", priority: 0.78, changeFrequency: "daily" },
  { period: "weekly", priority: 0.76, changeFrequency: "weekly" },
  { period: "monthly", priority: 0.76, changeFrequency: "monthly" },
];

export function buildSitemapEntries(): MetadataRoute.Sitemap {
  const now = new Date();
  const entries: MetadataRoute.Sitemap = [];

  for (const locale of LOCALES) {
    for (const route of INDEX_ROUTES) {
      entries.push({
        url: route.path ? `${SITE_URL}/${locale}/${route.path}` : `${SITE_URL}/${locale}`,
        lastModified: now,
        changeFrequency: route.changeFrequency,
        priority: route.priority,
      });
    }

    for (const route of RASHI_ROUTES) {
      for (const slug of RASHI_SLUGS) {
        entries.push({
          url: `${SITE_URL}/${locale}/${route.period}/${slug}`,
          lastModified: now,
          changeFrequency: route.changeFrequency,
          priority: route.priority,
        });
      }
    }
  }

  return entries;
}
