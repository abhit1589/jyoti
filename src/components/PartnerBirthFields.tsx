"use client";

import { useLocale, useTranslations } from "next-intl";
import { CityAutocomplete } from "@/components/CityAutocomplete";
import { DateTimePicker } from "@/components/DateTimePicker";
import type { PlaceSearchResult } from "@/lib/vedic/place-types";
import type { Locale } from "@/lib/types";

export type PartnerBirth = {
  name: string;
  birthDateTime: { date: string; time: string };
  cityId: string;
  placeName: string;
  latitude: number;
  longitude: number;
  timezone: string;
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

  function handlePlaceChange(place: PlaceSearchResult) {
    onChange({
      ...value,
      cityId: place.id,
      placeName: place.label,
      latitude: place.latitude,
      longitude: place.longitude,
      timezone: place.timezone,
    });
  }

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
          <CityAutocomplete
            id={`${idPrefix}-city`}
            valueId={value.cityId}
            onChange={handlePlaceChange}
          />
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
  return {
    name: partner.name || undefined,
    date: partner.birthDateTime.date,
    time: partner.birthDateTime.time,
    timezone: partner.timezone,
    latitude: partner.latitude,
    longitude: partner.longitude,
    placeName: partner.placeName,
    locale,
  };
}

export const defaultPartnerBirth = (): PartnerBirth => ({
  name: "",
  birthDateTime: { date: "1992-06-15", time: "09:00" },
  cityId: "mumbai",
  placeName: "Mumbai",
  latitude: 19.076,
  longitude: 72.8777,
  timezone: "Asia/Kolkata",
});
