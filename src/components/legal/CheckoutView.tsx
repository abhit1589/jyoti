"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { AppNav } from "@/components/AppNav";
import { SiteFooter } from "@/components/legal/SiteFooter";
import type { PaymentSku } from "@/lib/payments/config";

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

function isValidSku(sku: string | null): sku is PaymentSku {
  return sku === "single" || sku === "bundle" || sku === "match-report";
}

const DEFAULT_AMOUNTS: Record<PaymentSku, number> = {
  single: 10000,
  bundle: 25000,
  "match-report": 25000,
};

interface CheckoutViewProps {
  skuParam: string | null;
}

export function CheckoutView({ skuParam }: CheckoutViewProps) {
  const t = useTranslations("legal.checkout");
  const tAbout = useTranslations("legal.about");
  const [config, setConfig] = useState<PaymentConfig | null>(null);
  const [business, setBusiness] = useState<BusinessPublic | null>(null);
  const [accepted, setAccepted] = useState(false);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sku = isValidSku(skuParam) ? skuParam : null;

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

  if (!sku) {
    return (
      <div className="taara-page min-h-screen">
        <AppNav />
        <main className="taara-legal-main text-center">
          <h1 className="taara-heading">{t("title")}</h1>
          <p className="taara-intro mx-auto max-w-md">{t("invalidSku")}</p>
          <Link href="/pricing" className="taara-btn-primary mt-6 inline-block">
            {t("backToPricing")}
          </Link>
        </main>
        <SiteFooter />
      </div>
    );
  }

  const amountPaise =
    config?.amounts[sku === "match-report" ? "matchReport" : sku] ?? DEFAULT_AMOUNTS[sku];
  const isMatch = sku === "match-report";

  async function handlePay() {
    if (!accepted) return;
    setPaying(true);
    setError(null);

    try {
      if (config?.enabled) {
        window.location.href = isMatch ? `/match?checkout=${sku}` : `/#chart?checkout=${sku}`;
        return;
      }

      const res = await fetch("/api/payments/payu/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sku }),
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

      window.location.href = isMatch ? `/match?checkout=${sku}` : `/#chart?checkout=${sku}`;
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
            <p className="taara-checkout-product-name">{t(`products.${sku}.name`)}</p>
            <p className="taara-checkout-product-desc">{t(`products.${sku}.description`)}</p>
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
          <Link href="/pricing" className="taara-btn-ghost">
            {t("backToPricing")}
          </Link>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
