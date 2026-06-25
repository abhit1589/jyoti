"use client";

import { useTranslations } from "next-intl";
import { AppNav } from "@/components/AppNav";
import { ChartSection } from "@/components/ChartSection";
import { LandingServiceTiles } from "@/components/landing/LandingServiceTiles";
import { SiteFooter } from "@/components/legal/SiteFooter";

export function LandingPage() {
  const t = useTranslations("landing");

  const scienceCards = ["planets", "snapshot", "framework", "dasha"] as const;
  const steps = ["birth", "calculate", "read"] as const;
  const readings = ["personality", "career", "dasha"] as const;
  const comparisonRows = [
    "availability",
    "neutrality",
    "upselling",
    "accuracy",
    "language",
    "cost",
  ] as const;
  const testimonials = ["one", "two", "three"] as const;

  return (
    <div className="taara-page min-h-screen">
      <AppNav />

      <header className="taara-hero">
        <div className="taara-mandala" aria-hidden>
          <div className="taara-ring" style={{ width: 320, height: 320 }} />
          <div className="taara-ring" style={{ width: 560, height: 560 }} />
          <div className="taara-ring" style={{ width: 800, height: 800 }} />
        </div>

        <p className="taara-eyebrow">{t("hero.eyebrow")}</p>
        <h1 className="taara-hero-title">
          {t.rich("hero.title", { em: (c) => <em>{c}</em>, br: () => <br /> })}
        </h1>
        <blockquote className="taara-hero-quote">{t("hero.quote")}</blockquote>
        <p className="taara-hero-sub">{t("hero.subtitle")}</p>
        <p className="taara-hero-native">{t("hero.tagline")}</p>
        <LandingServiceTiles />
        <p className="taara-hero-note">{t("hero.note")}</p>
      </header>

      <p className="taara-ornament" aria-hidden>
        ✦ &nbsp; ✦ &nbsp; ✦
      </p>
      <hr className="taara-hr" />

      <section id="science" className="taara-section scroll-mt-24">
        <p className="taara-label">{t("science.label")}</p>
        <h2 className="taara-heading">
          {t.rich("science.title", { em: (c) => <em>{c}</em>, br: () => <br /> })}
        </h2>
        <p className="taara-intro">{t("science.intro")}</p>
        <div className="taara-science-grid">
          {scienceCards.map((key) => (
            <article key={key} className="taara-science-card">
              <div className="text-3xl">{t(`science.cards.${key}.icon`)}</div>
              <h3>{t(`science.cards.${key}.title`)}</h3>
              <p>{t(`science.cards.${key}.body`)}</p>
            </article>
          ))}
        </div>
      </section>

      <hr className="taara-hr" />

      <div className="taara-band">
        <div className="taara-section !py-0 !max-w-[1100px]">
          <p className="taara-label">{t("comparison.label")}</p>
          <h2 className="taara-heading">
            {t.rich("comparison.title", { em: (c) => <em>{c}</em>, br: () => <br /> })}
          </h2>
          <p className="taara-intro">{t("comparison.intro")}</p>

          <div className="taara-comparison-cards" aria-label={t("comparison.label")}>
            {comparisonRows.map((key) => (
              <article key={key} className="taara-comparison-card">
                <h3 className="taara-comparison-card-factor">
                  {t(`comparison.rows.${key}.factor`)}
                </h3>
                <div className="taara-comparison-card-row">
                  <p className="taara-comparison-card-label">{t("comparison.colTraditional")}</p>
                  <span className="taara-badge-bad">
                    {t(`comparison.rows.${key}.traditional`)}
                  </span>
                </div>
                <div className="taara-comparison-card-row">
                  <p className="taara-comparison-card-label">{t("comparison.colTaaraa")}</p>
                  <span className="taara-badge-good">
                    {t(`comparison.rows.${key}.taaraa`)}
                  </span>
                </div>
              </article>
            ))}
          </div>

          <div className="taara-table-wrap">
            <table className="taara-table">
              <thead>
                <tr>
                  <th className="taara-th-factor">{t("comparison.colFactor")}</th>
                  <th className="taara-th-traditional">{t("comparison.colTraditional")}</th>
                  <th className="taara-th-taaraa">{t("comparison.colTaaraa")}</th>
                </tr>
              </thead>
              <tbody>
                {comparisonRows.map((key) => (
                  <tr key={key}>
                    <td className="taara-td-factor">{t(`comparison.rows.${key}.factor`)}</td>
                    <td className="taara-td-traditional">
                      <span className="taara-badge-bad">
                        {t(`comparison.rows.${key}.traditional`)}
                      </span>
                    </td>
                    <td className="taara-td-taaraa">
                      <span className="taara-badge-good">
                        {t(`comparison.rows.${key}.taaraa`)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <hr className="taara-hr" />

      <section id="process" className="taara-section scroll-mt-24">
        <p className="taara-label">{t("process.label")}</p>
        <h2 className="taara-heading">
          {t.rich("process.title", { em: (c) => <em>{c}</em>, br: () => <br /> })}
        </h2>
        <p className="taara-intro">{t("process.intro")}</p>
        <div className="taara-steps">
          {steps.map((key, i) => (
            <div key={key} className="taara-step">
              <div className="taara-step-num">{String(i + 1).padStart(2, "0")}</div>
              <h3>{t(`process.steps.${key}.title`)}</h3>
              <p>{t(`process.steps.${key}.body`)}</p>
            </div>
          ))}
        </div>
      </section>

      <hr className="taara-hr" />

      <section className="taara-section">
        <p className="taara-label">{t("readings.label")}</p>
        <h2 className="taara-heading">
          {t.rich("readings.title", { em: (c) => <em>{c}</em>, br: () => <br /> })}
        </h2>
        <p className="taara-intro">{t("readings.intro")}</p>
        <div className="taara-readings-grid">
          {readings.map((key) => (
            <article
              key={key}
              className={`taara-reading-card ${key === "personality" ? "taara-reading-featured" : ""}`}
            >
              {key === "personality" && (
                <span className="taara-reading-badge-free">{t("readings.included")}</span>
              )}
              <div className="text-3xl">{t(`readings.cards.${key}.icon`)}</div>
              <h3>{t(`readings.cards.${key}.title`)}</h3>
              <p className="taara-reading-native">{t(`readings.cards.${key}.native`)}</p>
              <p>{t(`readings.cards.${key}.body`)}</p>
            </article>
          ))}
        </div>
      </section>

      <hr className="taara-hr" />

      <div className="taara-band taara-band-alt">
        <div className="taara-section !py-0 !max-w-[1100px]">
          <p className="taara-label">{t("testimonials.label")}</p>
          <h2 className="taara-heading">
            {t.rich("testimonials.title", { em: (c) => <em>{c}</em>, br: () => <br /> })}
          </h2>
          <div className="taara-testimonial-grid">
            {testimonials.map((key) => (
              <article key={key} className="taara-testimonial-card">
                <div className="taara-stars">{t(`testimonials.items.${key}.stars`)}</div>
                <blockquote>{t(`testimonials.items.${key}.quote`)}</blockquote>
                <div className="taara-testimonial-name">
                  {t(`testimonials.items.${key}.name`)}
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>

      <hr className="taara-hr" />

      <ChartSection />

      <div className="taara-cta-block">
        <p className="taara-label">{t("cta.label")}</p>
        <h2 className="taara-heading">
          {t.rich("cta.title", { em: (c) => <em>{c}</em>, br: () => <br /> })}
        </h2>
        <p className="mx-auto mb-10 max-w-xl text-[1.05rem] leading-relaxed text-[var(--brown-light)]">
          {t("cta.body")}
        </p>
        <a href="#chart" className="taara-btn-primary text-[1.05rem] !px-10 !py-4">
          {t("cta.button")}
        </a>
        <p className="taara-cta-native">{t("cta.note")}</p>
      </div>

      <SiteFooter />
    </div>
  );
}
