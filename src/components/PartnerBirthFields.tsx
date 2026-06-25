"use client";

import { useLocale, useTranslations } from "next-intl";
import { DateTimePicker } from "@/components/DateTimePicker";
import { getCitiesForLocale, getCityById } from "@/lib/vedic/cities";
import type { Locale } from "@/lib/types";

export type PartnerBirth = {
  name: string;
  birthDateTime: { date: string; time: string };
  cityId: string;
};

interface PartnerBirthFieldsProps {
  label: string;
  value: PartnerBirth;
  onChange: (value: PartnerBirth) => void;
  idPrefix: string;
}

export function PartnerBirthFields({
  label,
  value,
  onChange,
  idPrefix,
}: PartnerBirthFieldsProps) {
  const t = useTranslations("form");
  const locale = useLocale() as Locale;
  const cities = getCitiesForLocale(locale);

  return (
    <div className="card p-5">
      <h3 className="mb-4 text-base font-semibold text-slate-800">{label}</h3>
      <div className="space-y-4">
        <label className="flex flex-col gap-1.5 text-sm" htmlFor={`${idPrefix}-name`}>
          <span className="font-medium text-slate-600">{t("name")}</span>
          <input
            id={`${idPrefix}-name`}
            value={value.name}
            onChange={(e) => onChange({ ...value, name: e.target.value })}
            placeholder={t("namePlaceholder")}
            className="input-field"
          />
        </label>

        <DateTimePicker
          onChange={(birthDateTime) => onChange({ ...value, birthDateTime })}
        />

        <label className="flex flex-col gap-1.5 text-sm" htmlFor={`${idPrefix}-city`}>
          <span className="font-medium text-slate-600">{t("city")}</span>
          <select
            id={`${idPrefix}-city`}
            value={value.cityId}
            onChange={(e) => onChange({ ...value, cityId: e.target.value })}
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
    </div>
  );
}

export function partnerBirthToInput(
  partner: PartnerBirth,
  locale: Locale,
): {
  name?: string;
  date: string;
  time: string;
  timezone: string;
  latitude: number;
  longitude: number;
  placeName?: string;
  locale: Locale;
} {
  const city = getCityById(partner.cityId) ?? getCityById("hyderabad")!;
  return {
    name: partner.name || undefined,
    date: partner.birthDateTime.date,
    time: partner.birthDateTime.time,
    timezone: city.timezone,
    latitude: city.latitude,
    longitude: city.longitude,
    placeName: city.name[locale],
    locale,
  };
}

export const defaultPartnerBirth = (): PartnerBirth => ({
  name: "",
  birthDateTime: { date: "1992-06-15", time: "09:00" },
  cityId: "mumbai",
});
