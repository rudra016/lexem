"use client";

import { useState, useTransition } from "react";
import { Pencil, Check, X } from "lucide-react";
import { renameTeamAction } from "@/app/(app)/team-actions";
import { Spinner } from "@/components/spinner";

export function TeamNameEdit({
  teamId,
  name,
  canEdit,
}: {
  teamId: string;
  name: string;
  canEdit: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(name);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function save() {
    const trimmed = value.trim();
    if (!trimmed) {
      setError("Name can't be empty.");
      return;
    }
    if (trimmed === name) {
      setEditing(false);
      return;
    }
    setError(null);
    start(async () => {
      try {
        await renameTeamAction({ teamId, name: trimmed });
        setEditing(false);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed");
      }
    });
  }

  function cancel() {
    setValue(name);
    setError(null);
    setEditing(false);
  }

  if (!editing) {
    return (
      <span className="inline-flex items-center gap-1.5">
        {name}
        {canEdit && (
          <button
            onClick={() => setEditing(true)}
            title="Rename team"
            className="p-0.5 text-neutral-400 hover:text-neutral-900"
          >
            <Pencil size={12} />
          </button>
        )}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1">
      <input
        autoFocus
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") save();
          if (e.key === "Escape") cancel();
        }}
        disabled={pending}
        maxLength={60}
        className="px-2 py-0.5 border border-neutral-300 text-sm w-48"
      />
      <button
        onClick={save}
        disabled={pending}
        title="Save"
        className="p-1 text-neutral-700 hover:text-black disabled:opacity-50"
      >
        {pending ? <Spinner size={12} /> : <Check size={14} />}
      </button>
      <button
        onClick={cancel}
        disabled={pending}
        title="Cancel"
        className="p-1 text-neutral-500 hover:text-neutral-900 disabled:opacity-50"
      >
        <X size={14} />
      </button>
      {error && <span className="text-xs text-red-600 ml-1">{error}</span>}
    </span>
  );
}
