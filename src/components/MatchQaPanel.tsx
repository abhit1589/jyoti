"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { parseJsonResponse } from "@/lib/api/client";
import { stripMarkdown } from "@/lib/text/strip-markdown";
import type { Locale, QaMessage, VedicChart } from "@/lib/types";

interface MatchQaPanelProps {
  person1Chart: VedicChart;
  person2Chart: VedicChart;
}

type MatchQaUsage = {
  used: number;
  limit: number;
  hasApiKey: boolean;
  loaded: boolean;
};

const SUGGESTIONS = ["koota", "mangal", "nadi", "overall", "children"] as const;

async function fetchMatchQaUsage(): Promise<MatchQaUsage> {
  const res = await fetch("/api/match/qa", { credentials: "include" });
  const data = await parseJsonResponse<{
    used?: number;
    limit?: number;
    hasApiKey?: boolean;
    error?: string;
  }>(res);

  if (!res.ok) {
    throw new Error(data.error ?? "Status check failed");
  }

  return {
    used: data.used ?? 0,
    limit: data.limit ?? 8,
    hasApiKey: Boolean(data.hasApiKey),
    loaded: true,
  };
}

async function consumeMatchQaSse(
  response: Response,
  onDelta: (text: string) => void,
): Promise<{ remaining?: number; limit?: number }> {
  const reader = response.body?.getReader();
  if (!reader) throw new Error("No response stream");

  const decoder = new TextDecoder();
  let buffer = "";
  let remaining: number | undefined;
  let limit: number | undefined;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const parts = buffer.split("\n\n");
    buffer = parts.pop() ?? "";

    for (const part of parts) {
      const line = part.trim();
      if (!line.startsWith("data: ")) continue;

      const payload = JSON.parse(line.slice(6)) as {
        type: string;
        text?: string;
        message?: string;
        remaining?: number;
        limit?: number;
      };

      if (payload.type === "meta") {
        remaining = payload.remaining;
        limit = payload.limit;
      } else if (payload.type === "delta" && payload.text) {
        onDelta(payload.text);
      } else if (payload.type === "error") {
        throw new Error(payload.message ?? "Match Q&A failed");
      }
    }
  }

  return { remaining, limit };
}

export function MatchQaPanel({ person1Chart, person2Chart }: MatchQaPanelProps) {
  const t = useTranslations("landing.match.qa");
  const locale = useLocale() as Locale;
  const [messages, setMessages] = useState<QaMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [usage, setUsage] = useState<MatchQaUsage>({
    used: 0,
    limit: 8,
    hasApiKey: false,
    loaded: false,
  });
  const scrollRef = useRef<HTMLDivElement>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const data = await fetchMatchQaUsage();
        if (active) setUsage(data);
      } catch {
        if (active) setUsage((u) => ({ ...u, loaded: true, hasApiKey: false }));
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  const limitReached = usage.loaded && usage.used >= usage.limit;
  const canAsk = usage.hasApiKey && usage.loaded && !limitReached && !loading;

  async function sendQuestion(question: string) {
    const trimmed = question.trim();
    if (!trimmed || !canAsk) return;

    const nextMessages: QaMessage[] = [...messages, { role: "user", content: trimmed }];
    setMessages(nextMessages);
    setInput("");
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/match/qa", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Accept: "text/event-stream",
        },
        body: JSON.stringify({
          person1Chart,
          person2Chart,
          locale,
          messages: nextMessages,
        }),
      });

      if (res.status === 429) {
        setError(t("limitReached"));
        setUsage((u) => ({ ...u, used: u.limit }));
        return;
      }

      if (!res.ok) {
        const data = await parseJsonResponse<{ error?: string }>(res);
        throw new Error(data.error ?? t("genericError"));
      }

      let reply = "";
      setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

      const meta = await consumeMatchQaSse(res, (chunk) => {
        if (!mountedRef.current) return;
        reply += chunk;
        setMessages((prev) => {
          const copy = [...prev];
          copy[copy.length - 1] = { role: "assistant", content: reply };
          return copy;
        });
      });

      if (!reply.trim()) {
        throw new Error(t("emptyReply"));
      }

      if (meta.limit !== undefined && meta.remaining !== undefined) {
        setUsage((u) => ({
          ...u,
          used: meta.limit! - meta.remaining!,
          limit: meta.limit!,
        }));
      } else {
        setUsage((u) => ({ ...u, used: u.used + 1 }));
      }
    } catch (err) {
      if (!mountedRef.current) return;
      setMessages((prev) => {
        if (prev[prev.length - 1]?.role === "assistant" && !prev[prev.length - 1]?.content) {
          return prev.slice(0, -1);
        }
        return prev;
      });
      setError(err instanceof Error ? err.message : t("genericError"));
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    void sendQuestion(input);
  }

  return (
    <div className="card p-6">
      <h2 className="text-lg font-semibold text-slate-800">{t("title")}</h2>
      <p className="mt-1 text-sm text-muted">{t("subtitle")}</p>

      {!usage.loaded ? (
        <p className="mt-4 text-sm text-muted">{t("checking")}</p>
      ) : !usage.hasApiKey ? (
        <p className="mt-4 text-sm text-orange-700">{t("unavailable")}</p>
      ) : (
        <>
          <p className="mt-3 text-xs text-muted">
            {t("limit", { used: usage.used, limit: usage.limit })}
          </p>

          {messages.length === 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {SUGGESTIONS.map((key) => (
                <button
                  key={key}
                  type="button"
                  disabled={!canAsk}
                  onClick={() => void sendQuestion(t(`suggestions.${key}`))}
                  className="chip"
                >
                  {t(`suggestions.${key}`)}
                </button>
              ))}
            </div>
          )}

          <div
            ref={scrollRef}
            className="mt-4 max-h-80 space-y-3 overflow-y-auto rounded-xl border border-slate-200 bg-slate-50/70 p-4"
          >
            {messages.length === 0 && (
              <p className="text-sm text-muted">{t("empty")}</p>
            )}
            {messages.map((message, index) => (
              <div
                key={`${message.role}-${index}`}
                className={
                  message.role === "user"
                    ? "ml-6 rounded-xl bg-orange-100/80 px-3 py-2 text-sm text-slate-800"
                    : "mr-6 rounded-xl bg-white px-3 py-2 text-sm leading-relaxed text-slate-700 shadow-sm"
                }
              >
                <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                  {message.role === "user" ? t("you") : t("guide")}
                </p>
                <p className="whitespace-pre-wrap">
                  {message.role === "assistant"
                    ? stripMarkdown(message.content)
                    : message.content}
                </p>
              </div>
            ))}
            {loading && messages[messages.length - 1]?.role !== "assistant" && (
              <p className="text-sm text-muted">{t("thinking")}</p>
            )}
          </div>

          <form onSubmit={handleSubmit} className="mt-4 flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={t("placeholder")}
              disabled={!canAsk}
              maxLength={2000}
              className="input-field min-w-0 flex-1"
            />
            <button type="submit" disabled={!canAsk || !input.trim()} className="btn-primary shrink-0">
              {loading ? t("sending") : t("ask")}
            </button>
          </form>

          {limitReached && (
            <p className="mt-2 text-sm text-orange-700">{t("limitReached")}</p>
          )}
        </>
      )}

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      <p className="mt-4 text-xs text-slate-400">{t("disclaimer")}</p>
    </div>
  );
}
