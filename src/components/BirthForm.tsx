"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { CityAutocomplete } from "@/components/CityAutocomplete";
import { DateTimePicker } from "@/components/DateTimePicker";
import { parseJsonResponse } from "@/lib/api/client";
import type { PlaceSearchResult } from "@/lib/vedic/place-types";
import type { BirthInput, Locale, ReadingTeaser, VedicChart } from "@/lib/types";

interface BirthFormProps {
  onChart: (chart: VedicChart, teaser: ReadingTeaser | null) => void;
}

export function BirthForm({ onChart }: BirthFormProps) {
  const t = useTranslations("form");
  const te = useTranslations("errors");
  const locale = useLocale() as Locale;
  const [name, setName] = useState("");
  const [birthDateTime, setBirthDateTime] = useState({ date: "1990-01-15", time: "10:30" });
  const [cityId, setCityId] = useState("hyderabad");
  const [place, setPlace] = useState<PlaceSearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const params = new URLSearchParams({ id: cityId, locale });
      const res = await fetch(`/api/places?${params.toString()}`);
      if (!res.ok || cancelled) return;
      const resolved = await parseJsonResponse<PlaceSearchResult>(res);
      if (!cancelled) setPlace(resolved);
    })();
    return () => {
      cancelled = true;
    };
  }, [cityId, locale]);

  const handlePlaceChange = useCallback((next: PlaceSearchResult) => {
    setCityId(next.id);
    setPlace(next);
  }, []);

  const handleDateTimeChange = useCallback(
    (value: { date: string; time: string }) => setBirthDateTime(value),
    [],
  );

  const birthPlace = useMemo(() => {
    if (place && place.id === cityId) return place;
    return null;
  }, [place, cityId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!birthPlace) {
      setError(te("generic"));
      return;
    }

    setLoading(true);
    setError(null);

    const payload: BirthInput = {
      name: name || undefined,
      date: birthDateTime.date,
      time: birthDateTime.time,
      timezone: birthPlace.timezone,
      latitude: birthPlace.latitude,
      longitude: birthPlace.longitude,
      placeName: birthPlace.label,
      locale,
    };

    try {
      const res = await fetch("/api/chart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await parseJsonResponse<{
        chart?: VedicChart;
        teaser?: ReadingTeaser | null;
        error?: string;
      }>(res);
      if (!res.ok) throw new Error(data.error ?? te("generic"));
      if (!data.chart) throw new Error(te("generic"));
      if (mountedRef.current) onChart(data.chart, data.teaser ?? null);
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
          <CityAutocomplete valueId={cityId} onChange={handlePlaceChange} disabled={loading} />
        </label>
      </div>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      <button type="submit" disabled={loading || !birthPlace} className="btn-primary mt-6 w-full">
        {loading ? t("loadingWithTeaser") : t("submit")}
      </button>
    </form>
  );
}
