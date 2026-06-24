"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import type { VedicChart } from "@/lib/types";
import { BirthForm } from "@/components/BirthForm";
import { ChartDisplay } from "@/components/ChartDisplay";
import { ReadingPanel } from "@/components/ReadingPanel";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

export function HomePage() {
  const t = useTranslations();
  const [chart, setChart] = useState<VedicChart | null>(null);

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,_#fffbf7_0%,_#faf8f5_50%,_#f5f3ef_100%)]">
      <header className="mx-auto flex max-w-5xl items-center justify-between px-4 py-6">
        <div className="flex items-center gap-2.5 text-xl font-semibold tracking-tight text-slate-800">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-100 text-lg text-orange-600">
            ✦
          </span>
          Jyoti
        </div>
        <LanguageSwitcher />
      </header>

      <main className="mx-auto max-w-5xl px-4 pb-16">
        <section className="mb-10 text-center">
          <span className="mb-3 inline-block rounded-full bg-orange-50 px-3 py-1 text-xs font-medium text-orange-700 ring-1 ring-orange-200/60">
            {t("hero.badge")}
          </span>
          <h1 className="text-3xl font-bold tracking-tight text-slate-800 sm:text-4xl">
            {t("hero.title")}
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-slate-600">{t("hero.subtitle")}</p>
        </section>

        <div className="grid gap-8 lg:grid-cols-2">
          <BirthForm onChart={setChart} />
          {chart ? (
            <ChartDisplay chart={chart} />
          ) : (
            <div className="card flex min-h-64 items-center justify-center p-8 text-center text-muted">
              {t("form.submit")}
            </div>
          )}
        </div>

        {chart && (
          <div className="mt-8">
            <ReadingPanel chart={chart} />
          </div>
        )}
      </main>

      <footer className="border-t border-slate-200/80 px-4 py-6 text-center text-xs text-slate-400">
        <p>{t("footer.license")}</p>
        <p className="mt-1">{t("footer.payments")}</p>
      </footer>
    </div>
  );
}
