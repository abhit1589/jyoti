"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { AppNav } from "@/components/AppNav";
import { SiteFooter } from "@/components/legal/SiteFooter";
import {
  getReadingOrderAmount,
  isFullReadingBundle,
  parseReadingsQuery,
  serializeReadingFocusList,
} from "@/lib/payments/reading-order";
import type { PaymentSku } from "@/lib/payments/config";
import type { ReadingFocus } from "@/lib/types";

interface PaymentConfig {
  enabled: boolean;
  amounts: { single: number; bundle: number; matchReport: number };
  currency: string;
  brandName: string;
}

interface BusinessPublic {
  legalName: string;
  proprietorName: string;
  aadhaarAddress: string;
  email: string;
  phone: string;
  website: string;
}

function formatInr(paise: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(paise / 100);
}

const PENDING_READINGS_KEY = "astro_pending_readings";

interface CheckoutViewProps {
  skuParam: string | null;
  readingsParam: string | null;
}

export function CheckoutView({ skuParam, readingsParam }: CheckoutViewProps) {
  const t = useTranslations("legal.checkout");
  const tAbout = useTranslations("legal.about");
  const tReading = useTranslations("reading");
  const [config, setConfig] = useState<PaymentConfig | null>(null);
  const [business, setBusiness] = useState<BusinessPublic | null>(null);
  const [accepted, setAccepted] = useState(false);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedReadings = useMemo(() => {
    if (skuParam === "bundle") {
      return parseReadingsQuery(
        "personality,career,dasha,financial,marriage",
      );
    }
    return parseReadingsQuery(readingsParam);
  }, [readingsParam, skuParam]);

  const isMatch = skuParam === "match-report";
  const isReadingsCheckout = selectedReadings.length > 0;
  const isValid = isMatch || isReadingsCheckout;

  const amountPaise = useMemo(() => {
    if (isMatch) {
      return config?.amounts.matchReport ?? 25000;
    }
    if (isReadingsCheckout) {
      return getReadingOrderAmount(selectedReadings);
    }
    return 0;
  }, [config, isMatch, isReadingsCheckout, selectedReadings]);

  useEffect(() => {
    Promise.all([
      fetch("/api/payments/config").then((r) => r.json()),
      fetch("/api/business").then((r) => r.json()),
    ])
      .then(([paymentConfig, businessDetails]) => {
        setConfig(paymentConfig as PaymentConfig);
        setBusiness(businessDetails as BusinessPublic);
      })
      .catch(() => setError("Could not load checkout details."));
  }, []);

  if (!isValid) {
    return (
      <div className="taara-page min-h-screen">
        <AppNav />
        <main className="taara-legal-main text-center">
          <h1 className="taara-heading">{t("title")}</h1>
          <p className="taara-intro mx-auto max-w-md">{t("invalidSku")}</p>
          <Link href="/pricing#chart-readings" className="taara-btn-primary mt-6 inline-block">
            {t("backToPricing")}
          </Link>
        </main>
        <SiteFooter />
      </div>
    );
  }

  function storePendingReadings() {
    if (isReadingsCheckout) {
      sessionStorage.setItem(PENDING_READINGS_KEY, serializeReadingFocusList(selectedReadings));
    }
  }

  async function handlePay() {
    if (!accepted) return;
    setPaying(true);
    setError(null);

    try {
      storePendingReadings();

      if (config?.enabled) {
        const readingsQuery = isReadingsCheckout
          ? `readings=${serializeReadingFocusList(selectedReadings)}`
          : "";
        window.location.href = isMatch
          ? `/match?checkout=match-report`
          : `/#chart?${readingsQuery}`;
        return;
      }

      const payuSku: PaymentSku = isMatch
        ? "match-report"
        : isFullReadingBundle(selectedReadings)
          ? "bundle"
          : "single";

      const res = await fetch("/api/payments/payu/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sku: payuSku,
          focuses: isReadingsCheckout ? selectedReadings : undefined,
          amountPaise,
        }),
      });

      const data = (await res.json()) as { redirectUrl?: string; error?: string };

      if (data.redirectUrl) {
        window.location.href = data.redirectUrl;
        return;
      }

      if (!res.ok) {
        setError(data.error ?? "Payment could not be started. Complete your birth chart first, then try again.");
        return;
      }

      const readingsQuery = isReadingsCheckout
        ? `readings=${serializeReadingFocusList(selectedReadings)}`
        : "";
      window.location.href = isMatch
        ? `/match?checkout=match-report`
        : `/#chart?${readingsQuery}`;
    } catch {
      setError("Payment could not be started. Please try again.");
    } finally {
      setPaying(false);
    }
  }

  return (
    <div className="taara-page min-h-screen">
      <AppNav />
      <main className="taara-legal-main">
        <h1 className="taara-heading">{t("title")}</h1>

        <div className="taara-checkout-grid">
          <section className="taara-legal-card">
            <h2 className="taara-legal-card-title">{t("orderSummary")}</h2>

            {isMatch ? (
              <>
                <p className="taara-checkout-product-name">{t("products.match-report.name")}</p>
                <p className="taara-checkout-product-desc">{t("products.match-report.description")}</p>
              </>
            ) : (
              <>
                <p className="taara-checkout-product-name">{t("readingsOrderTitle")}</p>
                <ul className="taara-checkout-line-items">
                  {selectedReadings.map((focus: ReadingFocus) => (
                    <li key={focus}>
                      <span>{tReading(`focus.${focus}`)}</span>
                      <span>{formatInr(config?.amounts.single ?? 10000)}</span>
                    </li>
                  ))}
                </ul>
                {isFullReadingBundle(selectedReadings) ? (
                  <p className="taara-checkout-product-desc">{t("products.bundle.description")}</p>
                ) : (
                  <p className="taara-checkout-product-desc">{t("readingsOrderHint")}</p>
                )}
              </>
            )}

            <dl className="taara-checkout-totals">
              <div>
                <dt>{t("subtotal")}</dt>
                <dd>{formatInr(amountPaise)}</dd>
              </div>
              <div className="taara-checkout-total-row">
                <dt>{t("total")}</dt>
                <dd>
                  {formatInr(amountPaise)} {t("currency")}
                </dd>
              </div>
            </dl>
            <p className="taara-legal-muted text-sm mt-4">
              {isMatch ? t("instructionsMatch") : t("instructions")}
            </p>
          </section>

          <section className="taara-legal-card">
            <h2 className="taara-legal-card-title">{t("merchantDetails")}</h2>
            {business ? (
              <dl className="taara-legal-dl">
                <div>
                  <dt>{tAbout("legalNameLabel")}</dt>
                  <dd>{business.legalName}</dd>
                </div>
                <div>
                  <dt>{tAbout("proprietorNameLabel")}</dt>
                  <dd>{business.proprietorName}</dd>
                </div>
                <div>
                  <dt>{tAbout("addressLabel")}</dt>
                  <dd>{business.aadhaarAddress || "—"}</dd>
                </div>
                <div>
                  <dt>Email</dt>
                  <dd>
                    <a href={`mailto:${business.email}`}>{business.email}</a>
                  </dd>
                </div>
                {business.phone ? (
                  <div>
                    <dt>Phone</dt>
                    <dd>{business.phone}</dd>
                  </div>
                ) : null}
              </dl>
            ) : (
              <p className="taara-legal-muted">Loading…</p>
            )}
          </section>
        </div>

        <label className="taara-checkout-terms">
          <input
            type="checkbox"
            checked={accepted}
            onChange={(e) => setAccepted(e.target.checked)}
          />
          <span>
            {t("acceptTerms")}{" "}
            <Link href="/terms">Terms</Link> · <Link href="/privacy">Privacy</Link> ·{" "}
            <Link href="/refund">Refund</Link> · <Link href="/cancellation">Cancellation</Link>
          </span>
        </label>

        <p className="taara-legal-muted text-sm">{t("gatewayNote")}</p>

        {error ? <p className="taara-checkout-error">{error}</p> : null}

        <div className="taara-checkout-actions">
          <button
            type="button"
            className="taara-btn-primary"
            disabled={!accepted || paying}
            onClick={() => void handlePay()}
          >
            {paying ? "…" : t("payNow")}
          </button>
          <Link href={isMatch ? "/match" : "/#chart"} className="taara-btn-ghost">
            {isMatch ? t("continueToMatch") : t("continueToChart")}
          </Link>
          <Link href="/pricing#chart-readings" className="taara-btn-ghost">
            {t("backToPricing")}
          </Link>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

export { PENDING_READINGS_KEY };
