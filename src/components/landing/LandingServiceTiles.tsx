"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

/** Add future services here — tiles appear in the hero grid automatically. */
const SERVICE_ITEMS = [
  { id: "chart", href: "#chart", anchor: true, primary: true },
  { id: "match", href: "/match", anchor: false, primary: false },
  { id: "weekly", href: "/weekly", anchor: false, primary: false },
] as const;

export function LandingServiceTiles() {
  const t = useTranslations("landing.services");

  return (
    <div className="taara-service-tiles" role="navigation" aria-label={t("ariaLabel")}>
      {SERVICE_ITEMS.map((item) => {
        const content = (
          <>
            <span className="taara-service-icon" aria-hidden>
              {t(`${item.id}.icon`)}
            </span>
            <span className="taara-service-label">{t(`${item.id}.label`)}</span>
            <span className="taara-service-hint">{t(`${item.id}.hint`)}</span>
          </>
        );

        const className = [
          "taara-service-tile",
          item.primary ? "taara-service-tile-primary" : "",
        ]
          .filter(Boolean)
          .join(" ");

        if (item.anchor) {
          return (
            <a key={item.id} href={item.href} className={className}>
              {content}
            </a>
          );
        }

        return (
          <Link key={item.id} href={item.href} className={className}>
            {content}
          </Link>
        );
      })}
    </div>
  );
}
