"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

const FOOTER_GROUPS = [
  {
    labelKey: "groupCompany" as const,
    links: [{ href: "/about", key: "about" as const }],
  },
  {
    labelKey: "groupServices" as const,
    links: [
      { href: "/services", key: "services" as const },
      { href: "/pricing", key: "pricing" as const },
    ],
  },
  {
    labelKey: "groupLegal" as const,
    links: [
      { href: "/terms", key: "terms" as const },
      { href: "/privacy", key: "privacy" as const },
      { href: "/refund", key: "refund" as const },
      { href: "/cancellation", key: "cancellation" as const },
    ],
  },
];

interface SiteFooterProps {
  disclaimer?: string;
}

export function SiteFooter({ disclaimer }: SiteFooterProps) {
  const tLanding = useTranslations("landing");
  const tLegal = useTranslations("legal.footer");
  const brandNative = tLanding("brand.native");

  return (
    <footer className="taara-footer">
      <span className="taara-footer-logo">
        {brandNative ? (
          <span className="taara-logo-stack taara-logo-stack-center">
            <span className="taara-logo-primary">{brandNative}</span>
            <span className="taara-logo-sub">{tLanding("brand.name")}</span>
          </span>
        ) : (
          tLanding("brand.name")
        )}
      </span>
      <p className="taara-footer-domain">{tLanding("brand.domain")}</p>
      <p className="taara-footer-tagline">{tLanding("footer.tagline")}</p>

      <div className="taara-footer-links">
        {FOOTER_GROUPS.map((group) => (
          <nav
            key={group.labelKey}
            className="taara-footer-group"
            aria-label={tLegal(group.labelKey)}
          >
            <p className="taara-footer-group-label">{tLegal(group.labelKey)}</p>
            <ul>
              {group.links.map((link) => (
                <li key={link.href}>
                  <Link href={link.href}>{tLegal(link.key)}</Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>

      <p className="taara-footer-disclaimer">
        {disclaimer ?? tLanding("footer.disclaimer")}
      </p>
    </footer>
  );
}
