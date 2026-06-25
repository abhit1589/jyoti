"use client";

import { useTranslations } from "next-intl";
import type { ReadingTeaser } from "@/lib/types";

interface ReadingTeaserPanelProps {
  teaser: ReadingTeaser;
}

const SECTIONS = ["personality", "career", "dasha"] as const;

export function ReadingTeaserPanel({ teaser }: ReadingTeaserPanelProps) {
  const t = useTranslations("reading.teaser");
  const tFocus = useTranslations("reading.focus");

  const content: Record<(typeof SECTIONS)[number], string> = {
    personality: teaser.personality,
    career: teaser.career,
    dasha: teaser.dasha,
  };

  return (
    <div className="card border-orange-100 bg-gradient-to-br from-orange-50/80 to-white p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-orange-700">
            {t("label")}
          </p>
          <h3 className="mt-1 text-lg font-semibold text-slate-800">{t("title")}</h3>
          <p className="mt-1 text-sm text-muted">{t("subtitle")}</p>
        </div>
        <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">
          {t("free")}
        </span>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-3">
        {SECTIONS.map((section) => (
          <article
            key={section}
            className="rounded-xl border border-orange-100/80 bg-white/90 p-4"
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-orange-700/90">
              {tFocus(section)}
            </p>
            <p className="mt-2 text-sm leading-relaxed text-slate-700">{content[section]}</p>
          </article>
        ))}
      </div>

      <p className="mt-4 text-xs text-muted">{t("upgradeHint")}</p>
    </div>
  );
}
