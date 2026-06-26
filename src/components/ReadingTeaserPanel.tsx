"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import type { ReadingTeaser } from "@/lib/types";
import { ALL_READING_FOCUSES } from "@/lib/payments/config";
import { formatInr } from "@/lib/business/services";
import { getReadingPricing } from "@/lib/business/services";

interface ReadingTeaserPanelProps {
  teaser: ReadingTeaser;
}

const pricing = getReadingPricing();

export function ReadingTeaserPanel({ teaser }: ReadingTeaserPanelProps) {
  const t = useTranslations("reading.teaser");
  const tFocus = useTranslations("reading.focus");
  const tPricing = useTranslations("legal.pricing");

  return (
    <div className="taara-teaser-wrap">
      <div className="taara-teaser-header">
        <div>
          <p className="taara-teaser-eyebrow">{t("label")}</p>
          <h3 className="taara-teaser-title">{t("title")}</h3>
        </div>
        <span className="taara-badge-free">{t("free")}</span>
      </div>

      <p className="taara-teaser-body">{teaser.teaser}</p>

      <div className="taara-teaser-upsell">
        <h4 className="taara-teaser-upsell-title">{t("upsellTitle")}</h4>
        <p className="taara-teaser-upsell-body">{t("upsellBody")}</p>

        <ul className="taara-teaser-focus-list">
          {ALL_READING_FOCUSES.map((focus) => (
            <li key={focus} className="taara-teaser-focus-item">
              <Link
                href={`/checkout?readings=${focus}`}
                className="taara-teaser-focus-link"
              >
                <span className="taara-teaser-focus-name">{tFocus(focus)}</span>
                <span className="taara-teaser-focus-price">{formatInr(pricing.singlePaise)}</span>
              </Link>
            </li>
          ))}
          <li className="taara-teaser-focus-item taara-teaser-focus-bundle">
            <Link
              href="/pricing#chart-readings"
              className="taara-teaser-focus-link taara-teaser-focus-link-bundle"
            >
              <span className="taara-teaser-focus-name">{t("upsellBundle")}</span>
              <span className="taara-teaser-focus-price">{t("upsellBundlePrice")}</span>
            </Link>
          </li>
        </ul>

        <Link href="/pricing#chart-readings" className="taara-teaser-cta">
          {tPricing("checkoutSelected")} →
        </Link>
      </div>
    </div>
  );
}
