import type { MetadataRoute } from "next";
import { buildSitemapEntries } from "@/lib/seo/sitemap-config";

export default function sitemap(): MetadataRoute.Sitemap {
  return buildSitemapEntries();
}
