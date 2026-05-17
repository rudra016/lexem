"use client";

import { useState, useTransition } from "react";
import { Copy, Trash2, Plus, Check } from "lucide-react";
import {
  createApiKeyAction,
  revokeApiKeyAction,
} from "@/app/(app)/api-key-actions";
import { Spinner } from "@/components/spinner";

type ApiKeyRow = {
  id: string;
  name: string;
  prefix: string;
  createdAt: string;
  lastUsedAt: string | null;
  revokedAt: string | null;
};

export function ApiKeysPanel({
  projectSlug,
  keys,
  canManage,
}: {
  projectSlug: string;
  keys: ApiKeyRow[];
  canManage: boolean;
}) {
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [justCreated, setJustCreated] = useState<{
    raw: string;
    prefix: string;
  } | null>(null);

  function submit() {
    if (!name.trim()) return;
    setError(null);
    start(async () => {
      try {
        const res = await createApiKeyAction({
          projectSlug,
          name: name.trim(),
        });
        setJustCreated(res);
        setName("");
        setCreating(false);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed");
      }
    });
  }

  return (
    <div className="space-y-6">
      {justCreated && (
        <RevealOnce
          raw={justCreated.raw}
          onDismiss={() => setJustCreated(null)}
        />
      )}

      <div className="bg-white border border-black/10 shadow-[6px_6px_0px_#000]">
        {keys.length === 0 ? (
          <div className="px-5 py-8 text-center">
            <div className="text-sm font-medium">No API keys yet</div>
            <p className="text-xs text-neutral-500 mt-1">
              Generate one to call this project from the Lexem SDK.
            </p>
          </div>
        ) : (
          keys.map((k, i) => (
            <KeyRow
              key={k.id}
              row={k}
              projectSlug={projectSlug}
              canManage={canManage}
              divider={i > 0}
            />
          ))
        )}
      </div>

      {canManage &&
        (creating ? (
          <div className="bg-white border border-black/10 shadow-[6px_6px_0px_#000] p-4">
            <label className="text-xs text-neutral-600">Key name</label>
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") submit();
                if (e.key === "Escape") setCreating(false);
              }}
              placeholder="Production backend"
              maxLength={60}
              className="w-full mt-1 px-3 py-2 border border-neutral-300 text-sm"
            />
            {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
            <div className="flex justify-end gap-2 mt-3">
              <button
                onClick={() => setCreating(false)}
                disabled={pending}
                className="h-9 px-4 text-sm text-neutral-700 hover:bg-neutral-100"
              >
                Cancel
              </button>
              <button
                onClick={submit}
                disabled={pending || !name.trim()}
                className="h-9 px-4 bg-black text-white text-sm font-medium disabled:opacity-50 inline-flex items-center gap-2"
              >
                {pending && <Spinner size={14} />}
                Generate
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setCreating(true)}
            className="h-10 px-4 bg-black text-white text-sm font-medium inline-flex items-center gap-2 transition-all hover:translate-x-[2px] hover:translate-y-[2px]"
          >
            <Plus size={14} />
            New API key
          </button>
        ))}
    </div>
  );
}

function KeyRow({
  row,
  projectSlug,
  canManage,
  divider,
}: {
  row: ApiKeyRow;
  projectSlug: string;
  canManage: boolean;
  divider: boolean;
}) {
  const [pending, start] = useTransition();

  function revoke() {
    if (
      !confirm(
        `Revoke "${row.name}"? Any service using this key will start getting 401s.`,
      )
    )
      return;
    start(async () => {
      await revokeApiKeyAction({ projectSlug, keyId: row.id });
    });
  }

  return (
    <div
      className={`px-5 py-4 flex items-center justify-between gap-4 ${divider ? "border-t border-black/10" : ""}`}
    >
      <div className="min-w-0">
        <div className="text-sm font-medium flex items-center gap-2">
          {row.name}
          {row.revokedAt && (
            <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 bg-neutral-200 text-neutral-600">
              revoked
            </span>
          )}
        </div>
        <div className="text-[11px] text-neutral-500 mt-0.5 font-mono">
          {row.prefix}…
          <span className="mx-2 text-neutral-300">·</span>
          created {new Date(row.createdAt).toLocaleDateString()}
          {row.lastUsedAt && (
            <>
              <span className="mx-2 text-neutral-300">·</span>
              last used {new Date(row.lastUsedAt).toLocaleDateString()}
            </>
          )}
        </div>
      </div>
      {canManage && !row.revokedAt && (
        <button
          onClick={revoke}
          disabled={pending}
          title="Revoke key"
          className="p-1.5 text-neutral-500 hover:text-red-700 hover:bg-neutral-100 disabled:opacity-50"
        >
          <Trash2 size={14} />
        </button>
      )}
    </div>
  );
}

function RevealOnce({ raw, onDismiss }: { raw: string; onDismiss: () => void }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(raw);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="bg-amber-50 border border-amber-300 shadow-[6px_6px_0px_#000] p-5">
      <div className="text-sm font-semibold">Save this key now</div>
      <p className="text-xs text-neutral-700 mt-1">
        This is the only time we&apos;ll show the raw key. Store it in your
        secret manager or .env immediately.
      </p>
      <div className="mt-3 flex items-center gap-2 bg-white border border-black/10 px-3 py-2 text-xs font-mono">
        <span className="truncate flex-1">{raw}</span>
        <button
          onClick={copy}
          className="shrink-0 h-7 px-2 border border-black/20 bg-white inline-flex items-center gap-1 hover:bg-neutral-50"
        >
          {copied ? <Check size={12} /> : <Copy size={12} />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <div className="mt-4 flex justify-end">
        <button
          onClick={onDismiss}
          className="h-8 px-3 text-xs text-neutral-700 hover:bg-amber-100"
        >
          I&apos;ve saved it — dismiss
        </button>
      </div>
    </div>
  );
}
