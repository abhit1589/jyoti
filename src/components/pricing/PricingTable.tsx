"use client";

import { Fragment, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import type { ServiceOffering } from "@/lib/business/services";
import { formatInr } from "@/lib/business/services";
import { ALL_READING_FOCUSES } from "@/lib/payments/config";
import {
  getReadingOrderAmount,
  serializeReadingFocusList,
} from "@/lib/payments/reading-order";
import type { ReadingFocus } from "@/lib/types";

interface PricingTableProps {
  catalog: ServiceOffering[];
  singlePricePaise: number;
  bundlePricePaise: number;
}

const BUNDLE_CHECKOUT_HREF = `/checkout?readings=${serializeReadingFocusList([...ALL_READING_FOCUSES])}`;

export function PricingTable({
  catalog,
  singlePricePaise,
  bundlePricePaise,
}: PricingTableProps) {
  const t = useTranslations("legal.pricing");
  const tServices = useTranslations("legal.services");
  const tReading = useTranslations("reading");
  const [selected, setSelected] = useState<ReadingFocus[]>([]);

  const totalPaise = getReadingOrderAmount(selected);

  const checkoutHref = useMemo(() => {
    if (selected.length === 0) return null;
    return `/checkout?readings=${serializeReadingFocusList(selected)}`;
  }, [selected]);

  function toggleFocus(focus: ReadingFocus) {
    setSelected((current) => {
      if (current.includes(focus)) {
        return current.filter((item) => item !== focus);
      }
      return [...current, focus];
    });
  }

  return (
    <div className="taara-pricing-table-wrap" id="chart-readings">
      <table className="taara-pricing-table">
        <thead>
          <tr>
            <th>{t("columnService")}</th>
            <th>{t("columnPrice")}</th>
            <th>{t("columnAction")}</th>
          </tr>
        </thead>
        <tbody>
          {catalog.map((service) => (
            <Fragment key={service.id}>
              <tr>
                <td>
                  <strong className="taara-pricing-name">{tServices(`items.${service.id}.name`)}</strong>
                  <p className="taara-pricing-desc">
                    {tServices(`items.${service.id}.description`)}
                  </p>
                </td>
                <td className="taara-pricing-price">
                  {service.free ? tServices("freeBadge") : formatInr(service.pricePaise)}
                </td>
                <td className="taara-pricing-action">
                  {service.free ? (
                    <Link
                      href={
                        service.id === "kundali-match"
                          ? "/match"
                          : service.id === "horoscope-forecasts"
                            ? "/daily"
                            : "/#chart"
                      }
                      className="taara-btn-ghost taara-pricing-btn"
                    >
                      {t("getStarted")}
                    </Link>
                  ) : (
                    <Link href={service.checkoutPath!} className="taara-btn-primary taara-pricing-btn">
                      {t("buyNow")}
                    </Link>
                  )}
                </td>
              </tr>
              {service.id === "kundali-match" ? (
                <tr key="reading-bundle">
                  <td>
                    <strong className="taara-pricing-name">
                      {tServices("items.reading-bundle.name")}
                    </strong>
                    <p className="taara-pricing-desc">
                      {tServices("items.reading-bundle.description")}
                    </p>
                  </td>
                  <td className="taara-pricing-price">{formatInr(bundlePricePaise)}</td>
                  <td className="taara-pricing-action">
                    <Link href={BUNDLE_CHECKOUT_HREF} className="taara-btn-primary taara-pricing-btn">
                      {t("buyNow")}
                    </Link>
                  </td>
                </tr>
              ) : null}
            </Fragment>
          ))}

          <tr className="taara-pricing-section-row">
            <td colSpan={3}>
              <strong className="taara-pricing-name">{tServices("items.reading-single.name")}</strong>
              <p className="taara-pricing-desc">{tServices("items.reading-single.description")}</p>
            </td>
          </tr>

          {ALL_READING_FOCUSES.map((focus) => (
            <tr key={focus} className="taara-pricing-pick-row">
              <td>
                <label className="taara-pricing-table-check">
                  <input
                    type="checkbox"
                    checked={selected.includes(focus)}
                    onChange={() => toggleFocus(focus)}
                  />
                  <span className="taara-pricing-pick-label">{tReading(`focus.${focus}`)}</span>
                </label>
              </td>
              <td className="taara-pricing-price taara-pricing-pick-price">
                {formatInr(singlePricePaise)}
              </td>
              <td className="taara-pricing-action" />
            </tr>
          ))}

          <tr className="taara-pricing-checkout-row">
            <td>
              <span className="taara-pricing-pick-label">{t("selectedTotal")}</span>
            </td>
            <td className="taara-pricing-price taara-pricing-pick-price taara-pricing-selected-amount">
              {selected.length === 0 ? "—" : formatInr(totalPaise)}
            </td>
            <td className="taara-pricing-action">
              {checkoutHref ? (
                <Link href={checkoutHref} className="taara-btn-primary taara-pricing-btn">
                  {t("checkoutSelected")}
                </Link>
              ) : (
                <button type="button" className="taara-btn-primary taara-pricing-btn" disabled>
                  {t("checkoutSelected")}
                </button>
              )}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
