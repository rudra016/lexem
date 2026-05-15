"use client";

import { useState, useTransition } from "react";
import { createPromptAction } from "@/app/(app)/actions";
import { Spinner } from "@/components/spinner";

export function CreatePromptDialog({ projectSlug }: { projectSlug: string }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function onNameChange(v: string) {
    setName(v);
    if (!slug || slug === slugify(name)) setSlug(slugify(v));
  }

  function submit() {
    setError(null);
    start(async () => {
      try {
        await createPromptAction({ projectSlug, name, slug });
      } catch (e) {
        if (e instanceof Error && e.message.includes("NEXT_REDIRECT")) return;
        setError(e instanceof Error ? e.message : "Failed");
      }
    });
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="h-10 px-4 bg-black text-white text-sm font-medium inline-flex items-center justify-center gap-2 cursor-pointer transition-all hover:translate-x-[2px] hover:translate-y-[2px]"
      >
        New prompt
      </button>

      {open && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
          onClick={() => !pending && setOpen(false)}
        >
          <div
            className="bg-white border border-black/10 shadow-[6px_6px_0px_#000] w-full max-w-md p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-semibold mb-4">New prompt</h2>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-neutral-600">Name</label>
                <input
                  value={name}
                  onChange={(e) => onNameChange(e.target.value)}
                  placeholder="System prompt"
                  className="w-full mt-1 px-3 py-2 border border-neutral-300 text-sm"
                  autoFocus
                />
              </div>
              <div>
                <label className="text-xs text-neutral-600">Slug</label>
                <input
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="system-prompt"
                  className="w-full mt-1 px-3 py-2 border border-neutral-300 text-sm font-mono"
                />
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setOpen(false)}
                disabled={pending}
                className="h-9 px-4 text-sm text-neutral-700 hover:bg-neutral-100"
              >
                Cancel
              </button>
              <button
                onClick={submit}
                disabled={pending || !name || !slug}
                className="h-9 px-4 bg-black text-white text-sm font-medium disabled:opacity-50 inline-flex items-center justify-center gap-2"
              >
                {pending && <Spinner size={14} />}
                {pending ? "Creating" : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function slugify(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
}
