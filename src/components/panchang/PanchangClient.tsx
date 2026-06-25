"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { PanchangDisplay } from "@/components/panchang/PanchangDisplay";
import { parseJsonResponse } from "@/lib/api/client";
import { todayInTimezone } from "@/lib/panchang/date";
import type { PanchangResult } from "@/lib/panchang/types";
import type { Locale } from "@/lib/types";
import { getCitiesForLocale, getCityById } from "@/lib/vedic/cities";

interface PanchangClientProps {
  initialData: PanchangResult;
  initialCityId?: string;
  initialDate?: string;
  compact?: boolean;
}

export function PanchangClient({
  initialData,
  initialCityId = "hyderabad",
  initialDate,
  compact = false,
}: PanchangClientProps) {
  const t = useTranslations("panchang");
  const locale = useLocale() as Locale;
  const cities = useMemo(() => getCitiesForLocale(locale), [locale]);
  const defaultCity = getCityById(initialCityId) ?? getCityById("hyderabad") ?? cities[0];
  const [cityId, setCityId] = useState(defaultCity.id);
  const [date, setDate] = useState(
    initialDate ?? todayInTimezone(defaultCity.timezone),
  );
  const [data, setData] = useState<PanchangResult>(initialData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);
  const skipFetchRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const fetchPanchang = useCallback(
    async (nextCityId: string, nextDate: string) => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({
          city: nextCityId,
          date: nextDate,
          locale,
        });
        const res = await fetch(`/api/panchang?${params.toString()}`);
        const payload = await parseJsonResponse<PanchangResult & { error?: string }>(res);
        if (!res.ok) throw new Error(payload.error ?? t("error"));
        if (mountedRef.current) setData(payload);
      } catch (err) {
        if (mountedRef.current) {
          setError(err instanceof Error ? err.message : t("error"));
        }
      } finally {
        if (mountedRef.current) setLoading(false);
      }
    },
    [locale, t],
  );

  useEffect(() => {
    if (skipFetchRef.current) {
      skipFetchRef.current = false;
      return;
    }
    void fetchPanchang(cityId, date);
  }, [cityId, date, fetchPanchang]);

  function handleCityChange(nextCityId: string) {
    setCityId(nextCityId);
    const city = getCityById(nextCityId);
    if (city && !initialDate) {
      setDate(todayInTimezone(city.timezone));
    }
  }

  return (
    <div className="taara-panchang-panel">
      <div className="taara-panchang-controls">
        <label className="taara-panchang-control">
          <span>{t("cityLabel")}</span>
          <select
            value={cityId}
            onChange={(e) => handleCityChange(e.target.value)}
            className="input-field"
            disabled={loading}
          >
            {cities.map((city) => (
              <option key={city.id} value={city.id}>
                {city.name[locale]}
              </option>
            ))}
          </select>
        </label>

        {!compact ? (
          <label className="taara-panchang-control">
            <span>{t("dateLabel")}</span>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="input-field"
              disabled={loading}
            />
          </label>
        ) : null}
      </div>

      {loading ? <p className="taara-panchang-loading">{t("loading")}</p> : null}
      {error ? <p className="taara-panchang-error">{error}</p> : null}

      {!error ? <PanchangDisplay data={data} compact={compact} /> : null}
    </div>
  );
}
