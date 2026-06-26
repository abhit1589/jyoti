"use client";

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import { useLocale, useTranslations } from "next-intl";
import { parseJsonResponse } from "@/lib/api/client";
import type { PlaceSearchResult } from "@/lib/vedic/place-types";
import type { Locale } from "@/lib/types";

interface CityAutocompleteProps {
  valueId: string;
  onChange: (place: PlaceSearchResult) => void;
  disabled?: boolean;
  id?: string;
  inputClassName?: string;
}

export function CityAutocomplete({
  valueId,
  onChange,
  disabled = false,
  id: idProp,
  inputClassName = "input-field",
}: CityAutocompleteProps) {
  const t = useTranslations("form");
  const locale = useLocale() as Locale;
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [query, setQuery] = useState("");
  const [label, setLabel] = useState("");
  const [results, setResults] = useState<PlaceSearchResult[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const resolvePlace = useCallback(
    async (placeId: string) => {
      const params = new URLSearchParams({ id: placeId, locale });
      const res = await fetch(`/api/places?${params.toString()}`);
      if (!res.ok) return null;
      return parseJsonResponse<PlaceSearchResult>(res);
    },
    [locale],
  );

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const place = await resolvePlace(valueId);
      if (cancelled || !place) return;
      setLabel(place.label);
      setQuery(place.label);
    })();
    return () => {
      cancelled = true;
    };
  }, [valueId, resolvePlace]);

  useEffect(() => {
    if (!open) return;
    const timer = window.setTimeout(() => {
      void (async () => {
        setLoading(true);
        try {
          const params = new URLSearchParams({
            q: query,
            locale,
            limit: "12",
          });
          const res = await fetch(`/api/places/search?${params.toString()}`);
          const payload = await parseJsonResponse<{ results: PlaceSearchResult[] }>(res);
          if (!res.ok) throw new Error("search failed");
          setResults(payload.results);
          setActiveIndex(payload.results.length > 0 ? 0 : -1);
        } catch {
          setResults([]);
          setActiveIndex(-1);
        } finally {
          setLoading(false);
        }
      })();
    }, 180);

    return () => window.clearTimeout(timer);
  }, [query, locale, open]);

  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
        setQuery(label);
      }
    }
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [label]);

  function selectPlace(place: PlaceSearchResult) {
    setLabel(place.label);
    setQuery(place.label);
    setOpen(false);
    onChange(place);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (!open && (event.key === "ArrowDown" || event.key === "ArrowUp")) {
      setOpen(true);
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (event.key === "Enter" && activeIndex >= 0 && results[activeIndex]) {
      event.preventDefault();
      selectPlace(results[activeIndex]);
    } else if (event.key === "Escape") {
      setOpen(false);
      setQuery(label);
    }
  }

  return (
    <div ref={rootRef} className="taara-city-autocomplete">
      <input
        ref={inputRef}
        id={idProp}
        type="text"
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        autoComplete="off"
        value={query}
        disabled={disabled}
        placeholder={t("cityPlaceholder")}
        className={inputClassName}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={handleKeyDown}
      />

      {open ? (
        <ul id={listId} role="listbox" className="taara-city-suggestions">
          {loading ? (
            <li className="taara-city-suggestion taara-city-suggestion-muted">{t("citySearching")}</li>
          ) : results.length === 0 ? (
            <li className="taara-city-suggestion taara-city-suggestion-muted">{t("noPlacesFound")}</li>
          ) : (
            results.map((place, index) => (
              <li
                key={place.id}
                role="option"
                aria-selected={index === activeIndex}
                className={`taara-city-suggestion${index === activeIndex ? " is-active" : ""}`}
                onMouseDown={(e) => e.preventDefault()}
                onMouseEnter={() => setActiveIndex(index)}
                onClick={() => selectPlace(place)}
              >
                <span className="taara-city-suggestion-name">{place.label}</span>
                {place.state ? (
                  <span className="taara-city-suggestion-state">{place.state}</span>
                ) : null}
              </li>
            ))
          )}
        </ul>
      ) : null}
    </div>
  );
}
