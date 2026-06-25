"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

const FOOTER_LINKS = [
  { href: "/about", key: "about" },
  { href: "/services", key: "services" },
  { href: "/pricing", key: "pricing" },
  { href: "/terms", key: "terms" },
  { href: "/privacy", key: "privacy" },
  { href: "/refund", key: "refund" },
  { href: "/cancellation", key: "cancellation" },
] as const;

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
      <p>{tLanding("footer.tagline")}</p>

      <nav className="taara-footer-nav" aria-label="Legal and company">
        {FOOTER_LINKS.map((link) => (
          <Link key={link.href} href={link.href}>
            {tLegal(link.key)}
          </Link>
        ))}
      </nav>

      <p className="taara-footer-disclaimer">
        {disclaimer ?? tLanding("footer.disclaimer")}
      </p>
    </footer>
  );
}
