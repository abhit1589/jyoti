"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  getDayOptions,
  getMonthLabels,
  getYearOptions,
  HOUR_OPTIONS,
  MINUTE_OPTIONS,
  to24HourTime,
  toIsoDate,
} from "@/lib/form/date-options";
import type { Locale } from "@/lib/types";

interface DateTimePickerProps {
  onChange: (value: { date: string; time: string }) => void;
}

export function DateTimePicker({ onChange }: DateTimePickerProps) {
  const t = useTranslations("form");
  const locale = useLocale() as Locale;

  const years = useMemo(() => getYearOptions(1940, 1, new Date()), []);
  const maxYear = years[0]!;

  const [day, setDay] = useState(15);
  const [month, setMonth] = useState(1);
  const [year, setYear] = useState(() => Math.min(1990, maxYear));
  const [hour, setHour] = useState(10);
  const [minute, setMinute] = useState(30);
  const [period, setPeriod] = useState<"AM" | "PM">("AM");

  const months = useMemo(() => getMonthLabels(locale), [locale]);
  const days = useMemo(() => getDayOptions(year, month), [year, month]);

  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const clampDay = (y: number, m: number, d: number) => {
    const max = getDayOptions(y, m).length;
    return Math.min(d, max);
  };

  useEffect(() => {
    onChangeRef.current({
      date: toIsoDate(year, month, day),
      time: to24HourTime(hour, minute, period),
    });
  }, [day, month, year, hour, minute, period]);

  return (
    <div className="space-y-4">
      <div>
        <p className="mb-2 text-sm font-medium text-slate-600">{t("date")}</p>
        <div className="grid grid-cols-3 gap-2">
          <label className="flex flex-col gap-1">
            <span className="text-xs text-muted">{t("day")}</span>
            <select
              value={day}
              onChange={(e) => setDay(Number(e.target.value))}
              className="input-field"
            >
              {days.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-xs text-muted">{t("month")}</span>
            <select
              value={month}
              onChange={(e) => {
                const nextMonth = Number(e.target.value);
                setMonth(nextMonth);
                setDay((d) => clampDay(year, nextMonth, d));
              }}
              className="input-field"
            >
              {months.map((label, idx) => (
                <option key={label} value={idx + 1}>
                  {label}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-xs text-muted">{t("year")}</span>
            <select
              value={year}
              onChange={(e) => {
                const nextYear = Math.min(Number(e.target.value), maxYear);
                setYear(nextYear);
                setDay((d) => clampDay(nextYear, month, d));
              }}
              className="input-field"
            >
              {years.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <div>
        <p className="mb-2 text-sm font-medium text-slate-600">{t("time")}</p>
        <div className="grid grid-cols-3 gap-2">
          <label className="flex flex-col gap-1">
            <span className="text-xs text-muted">{t("hour")}</span>
            <select
              value={hour}
              onChange={(e) => setHour(Number(e.target.value))}
              className="input-field"
            >
              {HOUR_OPTIONS.map((h) => (
                <option key={h} value={h}>
                  {h}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-xs text-muted">{t("minute")}</span>
            <select
              value={minute}
              onChange={(e) => setMinute(Number(e.target.value))}
              className="input-field"
            >
              {MINUTE_OPTIONS.map((m) => (
                <option key={m} value={m}>
                  {String(m).padStart(2, "0")}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-xs text-muted">{t("period")}</span>
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value as "AM" | "PM")}
              className="input-field"
            >
              <option value="AM">{t("am")}</option>
              <option value="PM">{t("pm")}</option>
            </select>
          </label>
        </div>
      </div>
    </div>
  );
}
