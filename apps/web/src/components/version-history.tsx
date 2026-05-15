"use client";

import { useMemo, useState, useTransition } from "react";
import { DiffView } from "@/components/diff-view";
import { rollbackToVersionAction, addTagAction, removeTagAction } from "@/app/(app)/actions";
import { X } from "lucide-react";

type Tag = { id: string; name: string };

type Version = {
  id: string;
  commitMessage: string;
  content: string;
  createdAt: string;
  author: { name: string | null; email: string } | null;
  tags: Tag[];
};

function shortId(id: string) {
  return id.slice(-7);
}

export function VersionHistory({
  versions,
  currentVersionId,
  projectSlug,
  promptSlug,
}: {
  versions: Version[];
  currentVersionId: string | null;
  projectSlug: string;
  promptSlug: string;
}) {
  const [openId, setOpenId] = useState<string | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [rollbackId, setRollbackId] = useState<string | null>(null);
  const [rollbackError, setRollbackError] = useState<string | null>(null);
  const [tagInputs, setTagInputs] = useState<Record<string, string>>({});
  const [tagErrors, setTagErrors] = useState<Record<string, string>>({});
  const [pending, start] = useTransition();

  function rollback(versionId: string) {
    setRollbackError(null);
    start(async () => {
      try {
        await rollbackToVersionAction({ projectSlug, promptSlug, versionId });
        setRollbackId(null);
      } catch (e) {
        setRollbackError(e instanceof Error ? e.message : "Failed");
      }
    });
  }

  function addTag(versionId: string) {
    const tag = (tagInputs[versionId] ?? "").trim();
    if (!tag) return;
    setTagErrors((p) => ({ ...p, [versionId]: "" }));
    start(async () => {
      try {
        await addTagAction({ projectSlug, promptSlug, versionId, tag });
        setTagInputs((p) => ({ ...p, [versionId]: "" }));
      } catch (e) {
        setTagErrors((p) => ({
          ...p,
          [versionId]: e instanceof Error ? e.message : "Failed",
        }));
      }
    });
  }

  function removeTag(tagId: string) {
    start(async () => {
      try {
        await removeTagAction({ projectSlug, promptSlug, tagId });
      } catch {
        /* swallow */
      }
    });
  }

  const selectedVersions = useMemo(
    () => selected.map((id) => versions.find((v) => v.id === id)!).filter(Boolean),
    [selected, versions]
  );

  function toggleSelect(id: string) {
    setSelected((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length === 2) return [prev[1], id];
      return [...prev, id];
    });
  }

  function clearSelection() {
    setSelected([]);
  }

  if (versions.length === 0) {
    return (
      <p className="text-sm text-neutral-500">No versions yet. Commit your first one above.</p>
    );
  }

  const showDiff = selectedVersions.length === 2;
  const [a, b] = selectedVersions;
  const [from, to] = showDiff
    ? new Date(a.createdAt) < new Date(b.createdAt)
      ? [a, b]
      : [b, a]
    : [null, null];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-xs text-neutral-500">
        <div>
          {selected.length === 0 && "Select two versions to compare."}
          {selected.length === 1 && "Select one more version to compare."}
          {selected.length === 2 && (
            <span className="text-neutral-900">
              Comparing <span className="font-mono">{shortId(from!.id)}</span>{" "}
              → <span className="font-mono">{shortId(to!.id)}</span>
            </span>
          )}
        </div>
        {selected.length > 0 && (
          <button onClick={clearSelection} className="hover:underline">
            Clear
          </button>
        )}
      </div>

      {showDiff && (
        <DiffView
          from={from!.content}
          to={to!.content}
          fromLabel={shortId(from!.id)}
          toLabel={shortId(to!.id)}
        />
      )}

      <div className="border border-neutral-200 bg-white">
        {versions.map((v, i) => {
          const isOpen = openId === v.id;
          const isCurrent = v.id === currentVersionId;
          const checked = selected.includes(v.id);
          return (
            <div key={v.id} className={i > 0 ? "border-t border-neutral-200" : ""}>
              <div className="flex items-stretch hover:bg-neutral-50">
                <label className="flex items-center pl-4 pr-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleSelect(v.id)}
                    aria-label="Select for diff"
                    className="cursor-pointer"
                  />
                </label>
                <button
                  onClick={() => setOpenId(isOpen ? null : v.id)}
                  className="flex-1 text-left py-3 pr-5 flex items-center justify-between gap-4"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium truncate">{v.commitMessage}</span>
                      {isCurrent && (
                        <span className="text-xs bg-neutral-900 text-white px-1.5 py-0.5">
                          current
                        </span>
                      )}
                      {v.tags.map((t) => (
                        <span
                          key={t.id}
                          className="text-xs bg-blue-50 text-blue-800 border border-blue-200 px-1.5 py-0.5 font-mono"
                        >
                          {t.name}
                        </span>
                      ))}
                    </div>
                    <div className="text-xs text-neutral-500 mt-0.5">
                      <span className="font-mono mr-2">{shortId(v.id)}</span>
                      {v.author?.name ?? v.author?.email ?? "unknown"} ·{" "}
                      {new Date(v.createdAt).toLocaleString()}
                    </div>
                  </div>
                  <span className="text-xs text-neutral-400">{isOpen ? "Hide" : "Show"}</span>
                </button>
              </div>
              {isOpen && (
                <div className="border-t border-neutral-200 bg-neutral-50">
                  <pre className="px-5 pt-3 pb-3 font-mono text-xs text-neutral-800 whitespace-pre-wrap break-words">
                    {v.content}
                  </pre>
                  <div className="px-5 pb-4 space-y-3">
                    <div>
                      <div className="text-xs text-neutral-600 mb-1.5">Tags</div>
                      <div className="flex items-center gap-2 flex-wrap">
                        {v.tags.length === 0 && (
                          <span className="text-xs text-neutral-400 italic">No tags</span>
                        )}
                        {v.tags.map((t) => (
                          <span
                            key={t.id}
                            className="inline-flex items-center gap-1 text-xs bg-blue-50 text-blue-800 border border-blue-200 pl-2 pr-1 py-0.5 font-mono"
                          >
                            {t.name}
                            <button
                              onClick={() => removeTag(t.id)}
                              disabled={pending}
                              aria-label={`Remove tag ${t.name}`}
                              className="hover:bg-blue-100 p-0.5"
                            >
                              <X size={11} />
                            </button>
                          </span>
                        ))}
                        <input
                          value={tagInputs[v.id] ?? ""}
                          onChange={(e) =>
                            setTagInputs((p) => ({ ...p, [v.id]: e.target.value }))
                          }
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              addTag(v.id);
                            }
                          }}
                          placeholder="add tag…"
                          className="text-xs px-2 py-0.5 border border-neutral-300 font-mono w-32 bg-white"
                        />
                        <button
                          onClick={() => addTag(v.id)}
                          disabled={pending || !tagInputs[v.id]?.trim()}
                          className="text-xs px-2 py-0.5 border border-neutral-300 bg-white hover:bg-neutral-100 disabled:opacity-40"
                        >
                          Add
                        </button>
                      </div>
                      {tagErrors[v.id] && (
                        <p className="text-xs text-red-600 mt-1">{tagErrors[v.id]}</p>
                      )}
                    </div>
                    {!isCurrent && (
                      <div className="flex items-center gap-3 pt-1 border-t border-neutral-200">
                        <button
                          onClick={() => setRollbackId(v.id)}
                          className="px-3 py-1.5 text-xs border border-neutral-300 bg-white hover:bg-neutral-100 mt-3"
                        >
                          Rollback to this version
                        </button>
                        <span className="text-xs text-neutral-500 mt-3">
                          Creates a new commit with this content.
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {rollbackId && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
          onClick={() => !pending && setRollbackId(null)}
        >
          <div
            className="bg-white shadow-xl w-full max-w-md p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-semibold mb-1">Rollback?</h2>
            <p className="text-sm text-neutral-500 mb-4">
              A new commit will be created with the content of version{" "}
              <span className="font-mono">{shortId(rollbackId)}</span>. Your current version stays
              in history.
            </p>
            {rollbackError && <p className="text-sm text-red-600 mb-3">{rollbackError}</p>}
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setRollbackId(null)}
                disabled={pending}
                className="px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-100"
              >
                Cancel
              </button>
              <button
                onClick={() => rollback(rollbackId)}
                disabled={pending}
                className="px-4 py-2 bg-black text-white text-sm font-medium disabled:opacity-50"
              >
                {pending ? "Rolling back…" : "Rollback"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
