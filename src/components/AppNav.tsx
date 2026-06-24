"use client";

import { useTranslations } from "next-intl";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { Link, usePathname } from "@/i18n/navigation";

export function AppNav() {
  const tLanding = useTranslations("landing");
  const tWeekly = useTranslations("weekly");
  const pathname = usePathname();
  const onWeekly = pathname === "/weekly";
  const brandNative = tLanding("brand.native");

  return (
    <nav className="taara-nav">
      <Link href="/" className="taara-logo">
        {brandNative ? (
          <span className="taara-logo-stack">
            <span className="taara-logo-primary">{brandNative}</span>
            <span className="taara-logo-sub">{tLanding("brand.name")}</span>
          </span>
        ) : (
          tLanding("brand.name")
        )}
      </Link>
      <div className="taara-nav-actions">
        <Link
          href="/weekly"
          className={`taara-nav-link taara-nav-weekly${onWeekly ? " taara-nav-link-active" : ""}`}
        >
          {tWeekly("nav.weekly")}
        </Link>
        <LanguageSwitcher />
        <Link href="/#chart" className="taara-nav-cta">
          {tWeekly("nav.reading")} ↗
        </Link>
      </div>
    </nav>
  );
}
