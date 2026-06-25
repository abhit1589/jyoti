"use client";

import { useTranslations } from "next-intl";
import type { PanchangResult } from "@/lib/panchang/types";

interface PanchangDisplayProps {
  data: PanchangResult;
  compact?: boolean;
}

function AngaRow({
  label,
  name,
  endsAt,
}: {
  label: string;
  name: string;
  endsAt: string | null;
}) {
  const t = useTranslations("panchang");

  return (
    <div className="taara-panchang-row">
      <dt className="taara-panchang-label">{label}</dt>
      <dd className="taara-panchang-value">
        <span className="taara-panchang-name">{name}</span>
        {endsAt ? (
          <span className="taara-panchang-ends">
            {t("endsAt", { time: endsAt })}
          </span>
        ) : null}
      </dd>
    </div>
  );
}

function TimingRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="taara-panchang-row">
      <dt className="taara-panchang-label">{label}</dt>
      <dd className="taara-panchang-value">{value}</dd>
    </div>
  );
}

function TimingRangeRow({
  label,
  start,
  end,
}: {
  label: string;
  start: string;
  end: string;
}) {
  const t = useTranslations("panchang");

  return (
    <div className="taara-panchang-row">
      <dt className="taara-panchang-label">{label}</dt>
      <dd className="taara-panchang-value">{t("timeRange", { start, end })}</dd>
    </div>
  );
}

export function PanchangDisplay({ data, compact = false }: PanchangDisplayProps) {
  const t = useTranslations("panchang");

  return (
    <div className={compact ? "taara-panchang-compact" : "taara-panchang-full"}>
      <div className="taara-panchang-meta">
        <p className="taara-panchang-city">{data.cityName}</p>
        <p className="taara-panchang-date">{data.date}</p>
        <p className="taara-panchang-paksha">{data.pakshaLabel}</p>
      </div>

      <dl className="taara-panchang-grid">
        <AngaRow label={t("vara")} name={data.vara.name} endsAt={null} />
        <AngaRow label={t("tithi")} name={data.tithi.name} endsAt={data.tithi.endsAt} />
        <AngaRow label={t("nakshatra")} name={data.nakshatra.name} endsAt={data.nakshatra.endsAt} />
        {!compact ? (
          <>
            <AngaRow label={t("yoga")} name={data.yoga.name} endsAt={data.yoga.endsAt} />
            <AngaRow label={t("karana")} name={data.karana.name} endsAt={data.karana.endsAt} />
            <AngaRow label={t("moonRashi")} name={data.moonRashiName} endsAt={null} />
          </>
        ) : null}
        <TimingRow label={t("sunrise")} value={data.timings.sunrise} />
        <TimingRow label={t("sunset")} value={data.timings.sunset} />
        <TimingRangeRow
          label={t("rahukaal")}
          start={data.timings.rahukaal.start}
          end={data.timings.rahukaal.end}
        />
        {!compact ? (
          <>
            <TimingRangeRow
              label={t("yamagandam")}
              start={data.timings.yamagandam.start}
              end={data.timings.yamagandam.end}
            />
            <TimingRangeRow
              label={t("gulika")}
              start={data.timings.gulika.start}
              end={data.timings.gulika.end}
            />
          </>
        ) : null}
      </dl>

      {!compact ? <p className="taara-panchang-note">{t("note")}</p> : null}
    </div>
  );
}
