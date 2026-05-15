"use client";

import { diffLines, diffWordsWithSpace } from "diff";
import { useMemo, useState, useTransition } from "react";
import { Sparkles } from "lucide-react";
import { generateChangelogAction } from "@/app/(app)/changelog-actions";
import { Spinner } from "@/components/spinner";

type Mode = "inline" | "split";

export function DiffView({
  from,
  to,
  fromLabel,
  toLabel,
}: {
  from: string;
  to: string;
  fromLabel: string;
  toLabel: string;
}) {
  const [mode, setMode] = useState<Mode>("split");
  const [summary, setSummary] = useState<string | null>(null);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function summarize() {
    setSummaryError(null);
    start(async () => {
      try {
        const result = await generateChangelogAction({
          fromContent: from,
          toContent: to,
          fromLabel,
          toLabel,
        });
        setSummary(result);
      } catch (e) {
        setSummaryError(e instanceof Error ? e.message : "Failed");
      }
    });
  }

  const lineParts = useMemo(() => diffLines(from, to), [from, to]);
  const wordParts = useMemo(() => diffWordsWithSpace(from, to), [from, to]);

  const stats = useMemo(() => {
    let added = 0;
    let removed = 0;
    for (const p of lineParts) {
      const lines = p.value.split("\n").length - (p.value.endsWith("\n") ? 1 : 0);
      if (p.added) added += lines;
      if (p.removed) removed += lines;
    }
    return { added, removed };
  }, [lineParts]);

  return (
    <div className="border border-neutral-200 bg-white">
      <div className="flex items-center justify-between border-b border-neutral-200 px-4 py-2.5 bg-neutral-50">
        <div className="text-xs text-neutral-600 flex items-center gap-3">
          <span>
            <span className="font-mono">{fromLabel}</span>
            <span className="mx-2 text-neutral-400">→</span>
            <span className="font-mono">{toLabel}</span>
          </span>
          <span className="text-green-700">+{stats.added}</span>
          <span className="text-red-700">−{stats.removed}</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={summarize}
            disabled={pending || from === to}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs border border-neutral-300 bg-white hover:bg-neutral-100 disabled:opacity-50"
          >
            {pending ? <Spinner size={12} /> : <Sparkles size={12} />}
            {pending ? "Summarizing" : summary ? "Regenerate" : "Summarize"}
          </button>
          <div className="flex border border-neutral-300">
            {(["inline", "split"] as Mode[]).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`px-3 py-1 text-xs ${
                  mode === m ? "bg-neutral-900 text-white" : "bg-white text-neutral-700"
                }`}
              >
                {m === "inline" ? "Inline" : "Side-by-side"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {(summary || summaryError) && (
        <div className="border-b border-neutral-200 px-4 py-3 bg-amber-50">
          <div className="flex items-start gap-2">
            <Sparkles size={14} className="text-amber-700 mt-1 shrink-0" />
            <div className="text-sm text-neutral-800 leading-relaxed">
              {summaryError ? (
                <span className="text-red-700">{summaryError}</span>
              ) : (
                summary
              )}
            </div>
          </div>
        </div>
      )}

      {from === to ? (
        <div className="p-5 text-sm text-neutral-500">No changes.</div>
      ) : mode === "inline" ? (
        <InlineDiff parts={wordParts} />
      ) : (
        <SplitDiff parts={lineParts} />
      )}
    </div>
  );
}

function InlineDiff({ parts }: { parts: { value: string; added?: boolean; removed?: boolean }[] }) {
  return (
    <pre className="p-4 font-mono text-xs whitespace-pre-wrap break-words leading-6">
      {parts.map((p, i) => (
        <span
          key={i}
          className={
            p.added
              ? "bg-green-100 text-green-900"
              : p.removed
                ? "bg-red-100 text-red-900 line-through"
                : ""
          }
        >
          {p.value}
        </span>
      ))}
    </pre>
  );
}

function SplitDiff({ parts }: { parts: { value: string; added?: boolean; removed?: boolean }[] }) {
  const left: { value: string; removed?: boolean }[] = [];
  const right: { value: string; added?: boolean }[] = [];

  for (const p of parts) {
    if (p.added) {
      right.push({ value: p.value, added: true });
      left.push({ value: "" });
    } else if (p.removed) {
      left.push({ value: p.value, removed: true });
      right.push({ value: "" });
    } else {
      left.push({ value: p.value });
      right.push({ value: p.value });
    }
  }

  return (
    <div className="grid grid-cols-2 divide-x divide-neutral-200">
      <pre className="p-4 font-mono text-xs whitespace-pre-wrap break-words leading-6 bg-white">
        {left.map((p, i) => (
          <span key={i} className={p.removed ? "bg-red-100 text-red-900" : ""}>
            {p.value}
          </span>
        ))}
      </pre>
      <pre className="p-4 font-mono text-xs whitespace-pre-wrap break-words leading-6 bg-white">
        {right.map((p, i) => (
          <span key={i} className={p.added ? "bg-green-100 text-green-900" : ""}>
            {p.value}
          </span>
        ))}
      </pre>
    </div>
  );
}
