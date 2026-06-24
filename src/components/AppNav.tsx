"use client";

import { useTranslations } from "next-intl";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { Link, usePathname } from "@/i18n/navigation";

export function AppNav() {
  const tLanding = useTranslations("landing");
  const tWeekly = useTranslations("weekly");
  const pathname = usePathname();
  const onWeekly = pathname === "/weekly";

  return (
    <nav className="taara-nav">
      <Link href="/" className="taara-logo">
        {tLanding("brand.name")}
        <span className="taara-logo-native">{tLanding("brand.native")}</span>
      </Link>
      <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-3">
        <Link
          href="/weekly"
          className={`taara-nav-link${onWeekly ? " taara-nav-link-active" : ""}`}
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
