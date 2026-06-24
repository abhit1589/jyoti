"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { getCitiesForLocale, getCityById } from "@/lib/vedic/cities";
import { DateTimePicker } from "@/components/DateTimePicker";
import { parseJsonResponse } from "@/lib/api/client";
import type { BirthInput, Locale, VedicChart } from "@/lib/types";

interface BirthFormProps {
  onChart: (chart: VedicChart) => void;
}

export function BirthForm({ onChart }: BirthFormProps) {
  const t = useTranslations("form");
  const te = useTranslations("errors");
  const locale = useLocale() as Locale;
  const [name, setName] = useState("");
  const [birthDateTime, setBirthDateTime] = useState({ date: "1990-01-15", time: "10:30" });
  const cities = useMemo(() => getCitiesForLocale(locale), [locale]);
  const [cityId, setCityId] = useState("hyderabad");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const city = getCityById(cityId) ?? getCityById("hyderabad") ?? cities[0];

  const handleDateTimeChange = useCallback(
    (value: { date: string; time: string }) => setBirthDateTime(value),
    [],
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const payload: BirthInput = {
      name: name || undefined,
      date: birthDateTime.date,
      time: birthDateTime.time,
      timezone: city.timezone,
      latitude: city.latitude,
      longitude: city.longitude,
      placeName: city.name[locale],
    };

    try {
      const res = await fetch("/api/chart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await parseJsonResponse<{ chart?: VedicChart; error?: string }>(res);
      if (!res.ok) throw new Error(data.error ?? te("generic"));
      if (!data.chart) throw new Error(te("generic"));
      if (mountedRef.current) onChart(data.chart);
    } catch (err) {
      if (mountedRef.current) {
        setError(err instanceof Error ? err.message : te("generic"));
      }
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="card p-6">
      <h2 className="mb-1 text-lg font-semibold text-slate-800">{t("title")}</h2>
      <p className="mb-5 text-sm text-muted">{t("hint")}</p>

      <div className="space-y-5">
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium text-slate-600">{t("name")}</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t("namePlaceholder")}
            className="input-field"
          />
        </label>

        <DateTimePicker onChange={handleDateTimeChange} />

        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium text-slate-600">{t("city")}</span>
          <select
            value={cityId}
            onChange={(e) => setCityId(e.target.value)}
            className="input-field"
          >
            {cities.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name[locale]}
              </option>
            ))}
          </select>
        </label>
      </div>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      <button type="submit" disabled={loading} className="btn-primary mt-6 w-full">
        {loading ? t("loading") : t("submit")}
      </button>
    </form>
  );
}
