"use client";

import { useState, useTransition } from "react";
import { createProjectAction } from "@/app/(app)/actions";

export function CreateProjectDialog({ teamId }: { teamId?: string }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  if (!teamId) return null;

  function onNameChange(v: string) {
    setName(v);
    if (!slug || slug === slugify(name)) setSlug(slugify(v));
  }

  function submit() {
    setError(null);
    start(async () => {
      try {
        await createProjectAction({ teamId: teamId!, name, slug });
        setOpen(false);
        setName("");
        setSlug("");
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed");
      }
    });
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="px-4 py-2 bg-black text-white rounded-lg text-sm font-medium"
      >
        New project
      </button>

      {open && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
          onClick={() => !pending && setOpen(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-semibold mb-4">New project</h2>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-neutral-600">Name</label>
                <input
                  value={name}
                  onChange={(e) => onNameChange(e.target.value)}
                  placeholder="Customer support bot"
                  className="w-full mt-1 px-3 py-2 border border-neutral-300 rounded-lg text-sm"
                  autoFocus
                />
              </div>
              <div>
                <label className="text-xs text-neutral-600">Slug</label>
                <input
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="customer-support-bot"
                  className="w-full mt-1 px-3 py-2 border border-neutral-300 rounded-lg text-sm font-mono"
                />
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setOpen(false)}
                disabled={pending}
                className="px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={submit}
                disabled={pending || !name || !slug}
                className="px-4 py-2 bg-black text-white rounded-lg text-sm font-medium disabled:opacity-50"
              >
                {pending ? "Creating…" : "Create"}
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
    .slice(0, 40);
}
